// src/pages/Market.tsx
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import PriceLineChart from "../components/market/PriceLineChart";

// 실 API
import {
  fetchDailyCandles,
  fetchQuote,
  type DailyCandle,
  type Quote,
} from "../api/market";

// Mock
import { getMockMarket } from "../mocks/market";

/**
 * 개발용 스위치
 * true  → Mock 데이터 사용
 * false → 실제 백엔드 API 호출
 */
const USE_MOCK = true;

const QUICK_SYMBOLS = ["MSFT", "TSLA", "SPY"] as const;
const PERIODS = [7, 30, 90] as const;

// 주문 관련 타입(프론트 UI용)
type Side = "BUY" | "SELL";
type OrderType = "MARKET" | "LIMIT";

// 숫자 포맷(화면용)
function fmtNumber(v: number) {
  return Number.isFinite(v) ? v.toLocaleString() : "-";
}
function fmtSigned(v: number, digits = 2) {
  if (!Number.isFinite(v)) return "-";
  const s = v > 0 ? "+" : "";
  return `${s}${v.toFixed(digits)}`;
}

export default function Market() {
  const [searchParams] = useSearchParams();

  // 입력 심볼
  const [symbol, setSymbol] = useState("AAPL");

  // 데이터
  const [candles, setCandles] = useState<DailyCandle[]>([]);
  const [quote, setQuote] = useState<Quote | null>(null);

  // 로딩/에러
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 기간
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>(30);

  // 주문 패널 상태(프론트 UI용)
  const [side, setSide] = useState<Side>("BUY"); // 매수/매도
  const [orderType, setOrderType] = useState<OrderType>("MARKET"); // 시장가/지정가
  const [qty, setQty] = useState<number>(0); // 수량
  const [limitPrice, setLimitPrice] = useState<number | null>(null); // 지정가(차트 클릭으로도 채움)

  // 가상 예수금(데모용)
  const [cash] = useState<number>(1_000_000);

  // 심볼 정규화
  const normalizedSymbol = useMemo(() => symbol.trim().toUpperCase(), [symbol]);

  // 표시용 candles (기간 slice)
  const visibleCandles = useMemo(() => {
    if (!candles?.length) return [];
    return candles.slice(-period);
  }, [candles, period]);

  // 등락
  const isUp = useMemo(() => {
    const cp = Number(quote?.changePercent ?? 0);
    return cp >= 0;
  }, [quote]);

  // 주문에 사용할 "기준 가격"
  // - 시장가: quote.price
  // - 지정가: limitPrice
  const effectivePrice = useMemo(() => {
    if (orderType === "LIMIT") return limitPrice ?? quote?.price ?? 0;
    return quote?.price ?? 0;
  }, [orderType, limitPrice, quote]);

  // 예상 주문금액
  const estAmount = useMemo(() => {
    const p = Number(effectivePrice ?? 0);
    const q = Number(qty ?? 0);
    if (!Number.isFinite(p) || !Number.isFinite(q)) return 0;
    return Math.max(0, p * q);
  }, [effectivePrice, qty]);

  // 최대 수량(가상)
  const maxQty = useMemo(() => {
    const p = Number(effectivePrice ?? 0);
    if (!Number.isFinite(p) || p <= 0) return 0;
    return Math.floor(cash / p);
  }, [cash, effectivePrice]);

  // 퍼센트 버튼
  const applyPct = (pct: number) => {
    // pct: 0.1 / 0.25 / 0.5 / 1
    const q = Math.floor(maxQty * pct);
    setQty(q);
  };

  // 조회 로직
  const load = async (overrideSymbol?: string) => {
    const target = (overrideSymbol ?? normalizedSymbol).trim().toUpperCase();
    if (!target) return;

    setLoading(true);
    setError(null);

    try {
      if (USE_MOCK) {
        const { candles: c, quote: q } = getMockMarket(target);
        setSymbol(target);
        setCandles(c);
        setQuote(q);

        // 조회할 때 주문 값도 자연스럽게 초기화
        setQty(0);
        setOrderType("MARKET");
        setLimitPrice(null);

        return;
      }

      const [c, q] = await Promise.all([
        fetchDailyCandles(target),
        fetchQuote(target),
      ]);

      setSymbol(target);
      setCandles(c);
      setQuote(q);

      setQty(0);
      setOrderType("MARKET");
      setLimitPrice(null);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? "불러오기 실패");
      setCandles([]);
      setQuote(null);
    } finally {
      setLoading(false);
    }
  };

  // URL 파라미터 반영
  useEffect(() => {
    const s = (searchParams.get("symbol") ?? "").trim().toUpperCase();

    if (s) {
      setSymbol(s);
      load(s);
      return;
    }

    load("AAPL");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // 차트 클릭 → 지정가로 연결
  const handleSelectPriceFromChart = (price: number) => {
    // 지정가를 선택한 UX가 자연스럽게 이어지도록
    setOrderType("LIMIT");
    setLimitPrice(price);
  };

  // “주문하기” 버튼(지금은 데모)
  const submitOrder = () => {
    // 실제 주문 API는 나중에 연결
    // 지금은 UX만: 필수값 검증 정도만
    if (!quote) return alert("먼저 종목을 조회해주세요.");
    if (qty <= 0) return alert("수량을 입력해주세요.");

    if (orderType === "LIMIT" && (!limitPrice || limitPrice <= 0)) {
      return alert("지정가를 입력해주세요.");
    }

    // 로그인/계좌/체결 등은 이후
    alert(
      [
        "가상 주문(데모)",
        `종목: ${normalizedSymbol}`,
        `구분: ${side === "BUY" ? "매수" : "매도"}`,
        `방식: ${orderType === "MARKET" ? "시장가" : "지정가"}`,
        `가격: ${fmtNumber(Number(effectivePrice))}`,
        `수량: ${qty.toLocaleString()}주`,
        `예상금액: ${fmtNumber(estAmount)}원`,
      ].join("\n")
    );
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto w-full max-w-6xl px-5 py-8 space-y-6">
        {/* =======================
            상단: 검색바 + 추천칩
        ======================= */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
            마켓
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 flex items-center gap-3">
                <div className="text-gray-400 select-none">⌕</div>
                <input
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") load();
                  }}
                  className="w-full bg-transparent outline-none text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                  placeholder="심볼 입력 (예: AAPL)"
                  inputMode="text"
                  autoCapitalize="characters"
                />
              </div>

              <button
                onClick={() => load()}
                disabled={loading}
                className="shrink-0 rounded-2xl px-4 py-3 text-sm font-semibold bg-gray-900 text-white dark:bg-white dark:text-gray-900 disabled:opacity-60"
              >
                {loading ? "조회 중" : "조회"}
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                추천 종목
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {QUICK_SYMBOLS.map((s) => (
                  <button
                    key={s}
                    onClick={() => load(s)}
                    disabled={loading}
                    className="px-3 py-1.5 rounded-full text-sm border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-60"
                  >
                    {s}
                  </button>
                ))}

                {error && <div className="text-sm text-red-500 ml-1">{error}</div>}
              </div>
            </div>
          </div>
        </div>

        {/* =======================
            가격 헤더
        ======================= */}
        <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {normalizedSymbol}
              </div>

              {/* 큰 가격 */}
              <div className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                {loading ? "—" : quote ? fmtNumber(quote.price) : "—"}
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400">
                {quote ? `전일 종가 ${fmtNumber(quote.previousClose)}` : " "}
              </div>
            </div>

            {/* 등락 pill */}
            <div className="flex flex-col items-end gap-2">
              <div
                className={[
                  "px-3 py-1.5 rounded-full text-sm font-semibold border",
                  quote
                    ? isUp
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-900"
                      : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-900"
                    : "bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-950 dark:text-gray-400 dark:border-gray-800",
                ].join(" ")}
              >
                {quote
                  ? `${fmtSigned(Number(quote.change))} (${fmtSigned(Number(quote.changePercent))}%)`
                  : loading
                  ? "불러오는 중"
                  : " "}
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400">
                {quote ? `거래량 ${Number(quote.volume).toLocaleString()}` : " "}
              </div>
            </div>
          </div>
        </div>

        {/* =======================
            본문: 차트(좌) + 주문패널(우)
            - 모바일: 세로 스택
            - 데스크탑: 2열 그리드
        ======================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* 좌측(차트/요약) */}
          <div className="lg:col-span-2 space-y-5">
            {/* 차트 + 기간 */}
            <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {normalizedSymbol} · 일별 종가
                </div>

                <div className="inline-flex rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-1">
                  {PERIODS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={[
                        "px-3 py-1.5 rounded-2xl text-sm font-semibold transition",
                        period === p
                          ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm"
                          : "text-gray-500 dark:text-gray-400",
                      ].join(" ")}
                    >
                      {p}일
                    </button>
                  ))}
                </div>
              </div>

              {/* ✅ 로딩 스켈레톤(차트 영역) */}
              {loading ? (
                <div className="h-64 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-4">
                  <div className="h-4 w-40 bg-gray-200 dark:bg-gray-800 rounded" />
                  <div className="mt-4 h-44 bg-gray-200 dark:bg-gray-800 rounded" />
                  <div className="mt-3 flex gap-2">
                    <div className="h-3 w-12 bg-gray-200 dark:bg-gray-800 rounded" />
                    <div className="h-3 w-12 bg-gray-200 dark:bg-gray-800 rounded" />
                    <div className="h-3 w-12 bg-gray-200 dark:bg-gray-800 rounded" />
                  </div>
                </div>
              ) : (
                <PriceLineChart
                  data={visibleCandles}
                  title=""
                  // ✅ 차트 클릭 → 지정가로 연결
                  onPriceSelect={handleSelectPriceFromChart}
                />
              )}

              <div className="text-xs text-gray-500 dark:text-gray-400">
                최근 {period}일 종가 기준 · 차트 클릭 시 지정가로 선택돼요
              </div>
            </div>

            {/* 요약 */}
            {quote && (
              <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  요약
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="text-gray-500 dark:text-gray-400">
                    시가{" "}
                    <span className="text-gray-900 dark:text-gray-100 font-semibold">
                      {fmtNumber(quote.open)}
                    </span>
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">
                    고가{" "}
                    <span className="text-gray-900 dark:text-gray-100 font-semibold">
                      {fmtNumber(quote.high)}
                    </span>
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">
                    저가{" "}
                    <span className="text-gray-900 dark:text-gray-100 font-semibold">
                      {fmtNumber(quote.low)}
                    </span>
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">
                    전일 종가{" "}
                    <span className="text-gray-900 dark:text-gray-100 font-semibold">
                      {fmtNumber(quote.previousClose)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 우측(주문패널) */}
          <aside className="lg:col-span-1">
            <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 sticky top-20">
              {/* 헤더 */}
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  주문하기
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {normalizedSymbol}
                </div>
              </div>

              {/* ✅ 로딩 스켈레톤(주문패널) */}
              {loading ? (
                <div className="space-y-3">
                  <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
                  <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
                  <div className="h-16 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
                  <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
                  <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
                </div>
              ) : (
                <>
                  {/* 매수/매도 토글 */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSide("BUY")}
                      className={[
                        "h-10 rounded-2xl text-sm font-semibold border",
                        side === "BUY"
                          ? "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white"
                          : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-800",
                      ].join(" ")}
                    >
                      매수
                    </button>
                    <button
                      onClick={() => setSide("SELL")}
                      className={[
                        "h-10 rounded-2xl text-sm font-semibold border",
                        side === "SELL"
                          ? "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white"
                          : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-800",
                      ].join(" ")}
                    >
                      매도
                    </button>
                  </div>

                  {/* 주문 방식(시장가/지정가) */}
                  <div className="mt-4 space-y-2">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      주문 방식
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setOrderType("MARKET")}
                        className={[
                          "h-10 rounded-2xl text-sm font-semibold border",
                          orderType === "MARKET"
                            ? "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white"
                            : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-800",
                        ].join(" ")}
                      >
                        시장가
                      </button>

                      <button
                        onClick={() => setOrderType("LIMIT")}
                        className={[
                          "h-10 rounded-2xl text-sm font-semibold border",
                          orderType === "LIMIT"
                            ? "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white"
                            : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-800",
                        ].join(" ")}
                        title="차트를 클릭해도 지정가가 자동으로 선택돼요"
                      >
                        지정가
                      </button>
                    </div>

                    {/* 가격 입력(시장가/지정가) */}
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-4">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {orderType === "MARKET" ? "현재가" : "지정가"}
                      </div>

                      {/* 시장가면 input 비활성, 지정가면 input 활성 */}
                      <div className="mt-1 flex items-center justify-between gap-3">
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {orderType === "MARKET"
                            ? fmtNumber(quote?.price ?? 0)
                            : fmtNumber(limitPrice ?? quote?.price ?? 0)}
                        </div>

                        {orderType === "LIMIT" && (
                          <input
                            value={
                              limitPrice == null ? "" : String(Math.floor(limitPrice))
                            }
                            onChange={(e) => {
                              const n = Number(e.target.value);
                              setLimitPrice(Number.isFinite(n) ? n : null);
                            }}
                            className="w-28 h-10 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 text-sm text-gray-900 dark:text-gray-100 outline-none"
                            placeholder="가격"
                            inputMode="numeric"
                          />
                        )}
                      </div>

                      {orderType === "LIMIT" && (
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          팁: 차트를 클릭하면 지정가가 자동으로 들어가요
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 수량 */}
                  <div className="mt-4 space-y-2">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      수량
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setQty((v) => Math.max(0, v - 1))}
                        className="h-10 w-10 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-lg font-bold text-gray-700 dark:text-gray-200"
                      >
                        −
                      </button>

                      <input
                        value={String(qty)}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          setQty(Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0);
                        }}
                        className="flex-1 h-10 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 text-sm text-gray-900 dark:text-gray-100 outline-none"
                        placeholder="수량 입력"
                        inputMode="numeric"
                      />

                      <button
                        onClick={() => setQty((v) => v + 1)}
                        className="h-10 w-10 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-lg font-bold text-gray-700 dark:text-gray-200"
                      >
                        +
                      </button>
                    </div>

                    {/* 빠른 버튼 */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => applyPct(0.1)}
                        className="px-3 py-1.5 rounded-full text-sm border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        10%
                      </button>
                      <button
                        onClick={() => applyPct(0.25)}
                        className="px-3 py-1.5 rounded-full text-sm border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        25%
                      </button>
                      <button
                        onClick={() => applyPct(0.5)}
                        className="px-3 py-1.5 rounded-full text-sm border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        50%
                      </button>
                      <button
                        onClick={() => applyPct(1)}
                        className="px-3 py-1.5 rounded-full text-sm border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        최대
                      </button>
                    </div>

                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      가상 예수금 {fmtNumber(cash)}원 · 최대 {maxQty.toLocaleString()}주
                    </div>
                  </div>

                  {/* 금액 요약 */}
                  <div className="mt-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        예상 주문 금액
                      </div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {fmtNumber(estAmount)}원
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      v1에서는 수수료/세금 계산은 생략합니다.
                    </div>
                  </div>

                  {/* 주문 버튼 */}
                  <button
                    onClick={submitOrder}
                    disabled={!quote || qty <= 0 || (orderType === "LIMIT" && !limitPrice)}
                    className="mt-4 w-full h-12 rounded-2xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-sm font-semibold disabled:opacity-50"
                  >
                    {side === "BUY" ? "가상 매수 주문하기" : "가상 매도 주문하기"}
                  </button>

                  {/* 안내 */}
                  <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    실제 결제/주문 API는 포트폴리오/주문 도메인 붙일 때 연결할 예정이에요.
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
