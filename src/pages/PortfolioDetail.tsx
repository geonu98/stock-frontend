// src/pages/PortfolioDetail.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { getPortfolio, type PortfolioResponse } from "../api/portfolio";
import { getTradesBySymbol, type TradeResponse } from "../api/trades";
import { n, usd, signedUsd, signedPct, signColor, pct } from "../utils/format";

/**
 * ✅ Portfolio -> Detail로 이동할 때 state로 넘겨주는 값 타입
 * - 새로고침/직접진입이면 state가 없을 수 있음
 */
type NavState = {
  symbol: string;
  position: any;
  summary: any;
};

/** 매수/매도 합계 계산용 */
type DayTotals = {
  buyAmount: number;  // 매수 총액 (USD)
  sellAmount: number; // 매도 총액 (USD)
  count: number;      // 거래건수
};

/**
 * ✅ tradedAt 문자열을 "YYYY-MM-DD"로 뽑기
 * - 백엔드 LocalDateTime이 마이크로초(6자리)로 내려오면 브라우저 Date 파싱이 실패할 수 있어서
 *   "T" 앞부분만 안전하게 사용
 */
function getDayKey(isoLike: string) {
  // 예: "2026-02-18T00:42:46.807589" -> "2026-02-18"
  const tIdx = isoLike.indexOf("T");
  return tIdx >= 0 ? isoLike.slice(0, tIdx) : isoLike.slice(0, 10);
}

/**
 * ✅ 화면 표시용 날짜/시간 포맷
 * - Date 파싱 실패 가능성 대비해서 fallback도 둠
 */
function fmtDateTime(isoLike: string) {
  // 1) ISO가 정상 파싱되면 locale 출력
  const d = new Date(isoLike);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // 2) 파싱 실패하면 문자열 기반 fallback
  // "2026-02-18T00:42:46.807589" -> "2026-02-18 00:42"
  const day = getDayKey(isoLike);
  const time = isoLike.includes("T") ? isoLike.split("T")[1]?.slice(0, 5) : "";
  return time ? `${day} ${time}` : isoLike;
}

/** ✅ 날짜 헤더 포맷: "2026-02-18 (화)" 같이 보이게 */
function fmtDayHeader(dayKey: string) {
  const d = new Date(dayKey); // "YYYY-MM-DD"는 대부분 브라우저에서 파싱됨
  if (!Number.isNaN(d.getTime())) {
    const weekday = d.toLocaleDateString("ko-KR", { weekday: "short" });
    return `${dayKey} (${weekday})`;
  }
  return dayKey;
}

/**
 * ✅ 거래 1건의 "금액" 계산 (USD)
 * - MARKET도 결국 priceUsd * quantity로 합계 잡으면 됨
 */
function tradeAmountUsd(t: TradeResponse) {
  const price = Number(t.priceUsd);
  const qty = Number(t.quantity);
  if (Number.isNaN(price) || Number.isNaN(qty)) return 0;
  return price * qty;
}

/**
 * ✅ 날짜별로 거래를 묶고, 날짜별 합계/건수까지 계산
 */
function groupTradesByDay(trades: TradeResponse[]) {
  // 최신순 정렬(대부분 tradedAt 문자열이 ISO 형태라 localeCompare로 정렬 가능)
  const sorted = [...trades].sort((a, b) => b.tradedAt.localeCompare(a.tradedAt));

  const map = new Map<
    string,
    { dayKey: string; items: TradeResponse[]; totals: DayTotals }
  >();

  for (const t of sorted) {
    const dayKey = getDayKey(t.tradedAt);
    if (!map.has(dayKey)) {
      map.set(dayKey, {
        dayKey,
        items: [],
        totals: { buyAmount: 0, sellAmount: 0, count: 0 },
      });
    }
    const group = map.get(dayKey)!;

    group.items.push(t);
    group.totals.count += 1;

    const amt = tradeAmountUsd(t);
    if (t.side === "BUY") group.totals.buyAmount += amt;
    if (t.side === "SELL") group.totals.sellAmount += amt;
  }

  // Map을 배열로 변환 (이미 최신 날짜부터 들어가긴 하지만 안전하게 정렬)
  const groups = Array.from(map.values()).sort((a, b) =>
    b.dayKey.localeCompare(a.dayKey)
  );

  return groups;
}

/**
 * ✅ 토스 느낌 공통 카드 스타일(간단)
 */
const cardStyle: React.CSSProperties = {
  borderRadius: 18,
  border: "1px solid #e5e7eb",
  padding: 18,
  background: "#fff",
};

export default function PortfolioDetail() {
  const nav = useNavigate();
  const { symbol } = useParams();
  const loc = useLocation();
  const state = (loc.state ?? null) as NavState | null;

  // ✅ state 없으면 포트폴리오를 한 번 받아서 symbol에 해당하는 포지션 찾아서 보여줌
  const [data, setData] = useState<PortfolioResponse | null>(null);
  const [loading, setLoading] = useState(!state);
  const [err, setErr] = useState<string | null>(null);

  // ✅ 거래내역 상태
  const [trades, setTrades] = useState<TradeResponse[]>([]);
  const [tradesLoading, setTradesLoading] = useState(true);
  const [tradesErr, setTradesErr] = useState<string | null>(null);

  // ✅ 새로고침/직접진입 대비: state 없을 때만 getPortfolio 1번 호출
  useEffect(() => {
    if (state) return;

    (async () => {
      try {
        const res = await getPortfolio();
        setData(res);
      } catch {
        setErr("상세 조회 실패");
      } finally {
        setLoading(false);
      }
    })();
  }, [state]);

  /**
   * ✅ payload 결정
   * - state가 있으면 바로 사용 (API 추가 호출 방지)
   * - 없으면 getPortfolio 결과에서 symbol 포지션 찾아서 구성
   */
  const payload = useMemo(() => {
    if (state) return { symbol: state.symbol, position: state.position, summary: state.summary };

    if (!data || !symbol) return null;
    const pos = data.positions.find((p) => p.symbol === symbol);
    return pos ? { symbol, position: pos, summary: data.summary } : null;
  }, [state, data, symbol]);

  /**
   * ✅ 거래내역 조회: payload.symbol이 생겼을 때만 호출
   * - 상세페이지에서만 1회 호출(부담 적음)
   */
  useEffect(() => {
    if (!payload?.symbol) return;

    (async () => {
      try {
        setTradesLoading(true);
        setTradesErr(null);
        const list = await getTradesBySymbol(payload.symbol);
        setTrades(list);
      } catch {
        setTradesErr("거래내역 조회 실패");
      } finally {
        setTradesLoading(false);
      }
    })();
  }, [payload?.symbol]);

  // ✅ trades를 날짜별로 그룹핑(정렬/합계 포함)
  const tradeGroups = useMemo(() => groupTradesByDay(trades), [trades]);

  // ---- 로딩/에러 처리
  if (loading) return <div style={{ padding: 24 }}>로딩중...</div>;
  if (err) return <div style={{ padding: 24 }}>{err}</div>;
  if (!payload) return <div style={{ padding: 24 }}>종목을 찾을 수 없음</div>;

  // ---- 포지션 요약
  const p = payload.position;
  const unPnl = n(p.unrealizedPnlUsd);
  const ret = n(p.unrealizedReturnPct);
  const color = signColor(unPnl);

  return (
    <div style={{ padding: 20, maxWidth: 860, margin: "0 auto" }}>
      {/* ✅ 헤더 */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          onClick={() => nav(-1)}
          style={{
            border: "1px solid #e5e7eb",
            background: "#fff",
            borderRadius: 12,
            padding: "8px 10px",
            cursor: "pointer",
            fontWeight: 900,
          }}
        >
          ←
        </button>

        <div>
          <div style={{ fontSize: 20, fontWeight: 900 }}>{payload.symbol}</div>
          <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
            보유 수량 {p.quantity}주 · 평균단가 ${usd(p.avgBuyPriceUsd)}
          </div>
        </div>
      </div>

      {/* ✅ 요약 카드 */}
      <div style={{ ...cardStyle, marginTop: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <Stat label="현재가" value={`$${usd(p.currentPriceUsd)}`} />
          <Stat label="평가금액" value={`$${usd(p.marketValueUsd)}`} />
          <Stat
            label="미실현 손익"
            value={signedUsd(unPnl)}
            sub={signedPct(ret)}
            valueColor={color}
          />
        </div>

        <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Chip label={`실현손익 $${usd(p.realizedPnlUsd)}`} />
          <Chip label={`수익률 ${pct(p.unrealizedReturnPct)}%`} />
        </div>
      </div>

      {/* ✅ 거래 내역(토스 느낌: 날짜 헤더 + 날짜별 합계 + 카드 리스트) */}
      <div style={{ ...cardStyle, marginTop: 14 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontWeight: 900 }}>거래 내역</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            {tradesLoading ? "불러오는 중..." : `총 ${trades.length}건`}
          </div>
        </div>

        {/* 로딩/에러/빈상태 */}
        {tradesLoading ? (
          <div style={{ marginTop: 10, fontSize: 13, color: "#6b7280" }}>불러오는 중...</div>
        ) : tradesErr ? (
          <div style={{ marginTop: 10, fontSize: 13, color: "red" }}>{tradesErr}</div>
        ) : trades.length === 0 ? (
          <div style={{ marginTop: 10, fontSize: 13, color: "#6b7280" }}>거래 내역 없음</div>
        ) : (
          <div style={{ marginTop: 12, display: "grid", gap: 14 }}>
            {tradeGroups.map((g) => {
              const buy = g.totals.buyAmount;
              const sell = g.totals.sellAmount;

              return (
                <div key={g.dayKey}>
                  {/* ✅ 날짜 헤더 + 날짜 합계 */}
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: "#111827" }}>
                      {fmtDayHeader(g.dayKey)}
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      {buy > 0 && (
                        <MiniPill label={`매수 $${usd(buy)}`} color="#16a34a" bg="#ecfdf5" />
                      )}
                      {sell > 0 && (
                        <MiniPill label={`매도 $${usd(sell)}`} color="#dc2626" bg="#fef2f2" />
                      )}
                      <MiniPill label={`${g.totals.count}건`} color="#374151" bg="#f3f4f6" />
                    </div>
                  </div>

                  {/* ✅ 거래 리스트 */}
                  <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                    {g.items.map((t) => {
                      const isBuy = t.side === "BUY";
                      const sideColor = isBuy ? "#16a34a" : "#dc2626";
                      const amount = tradeAmountUsd(t);

                      return (
                        <div
                          key={t.id}
                          style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: 16,
                            padding: 12,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          {/* 좌측: 매수/매도, 타입, 시간 */}
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                              <span style={{ fontWeight: 900, color: sideColor }}>
                                {isBuy ? "매수" : "매도"}
                              </span>
                              <span style={{ fontSize: 12, color: "#6b7280" }}>
                                {t.kind}
                              </span>
                              <span style={{ fontSize: 12, color: "#9ca3af" }}>
                                · {fmtDateTime(t.tradedAt)}
                              </span>
                            </div>

                            <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>
                              {t.quantity}주 · 단가 ${usd(t.priceUsd)}
                            </div>
                          </div>

                          {/* 우측: 총액 */}
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 900, color: "#111827" }}>
                              ${usd(amount)}
                            </div>
                            <div style={{ marginTop: 6, fontSize: 12, color: "#9ca3af" }}>
                              {isBuy ? "지출" : "수입"}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 구분선(마지막 제외) */}
                  <div style={{ marginTop: 14, height: 1, background: "#f3f4f6" }} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/** ✅ 요약 카드 안의 한 칸(Stat) */
function Stat({
  label,
  value,
  sub,
  valueColor,
}: {
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
}) {
  return (
    <div style={{ flex: "1 1 220px" }}>
      <div style={{ fontSize: 13, color: "#6b7280" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 900, marginTop: 6, color: valueColor ?? "#111827" }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 13, marginTop: 6, color: valueColor ?? "#6b7280" }}>{sub}</div>}
    </div>
  );
}

/** ✅ 토스 느낌 작은 칩 */
function Chip({ label }: { label: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 10px",
        borderRadius: 999,
        background: "#f3f4f6",
        color: "#374151",
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {label}
    </span>
  );
}

/** ✅ 날짜 헤더 우측에 붙는 작은 Pill(매수합/매도합/건수) */
function MiniPill({
  label,
  color,
  bg,
}: {
  label: string;
  color: string;
  bg: string;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 10px",
        borderRadius: 999,
        background: bg,
        color,
        fontSize: 12,
        fontWeight: 800,
        border: "1px solid #e5e7eb",
      }}
    >
      {label}
    </span>
  );
}