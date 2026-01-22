// src/pages/Market.tsx
import { useEffect, useMemo, useRef, useState } from "react";

import PriceLineChart from "../components/market/PriceLineChart";
import OrderPanel from "../components/market/OrderPanel";
import OrderConfirmOverlay from "../components/order/OrderConfirmOverlay";

import type { DailyCandle, Quote } from "../api/market";
import { getMockMarket } from "../mocks/market";
import type { OrderDraft } from "../types/order";
import { useOrderStore } from "../store/orderStore";

type Days = 7 | 30 | 90;

const 추천심볼 = ["AAPL", "MSFT", "TSLA", "SPY"] as const;

// 실 API로 바꿀 때 여기만 건드리기 위한 스위치
const USE_MOCK = false;

// 백엔드 summary 엔드포인트 (프록시가 설정되어 있으면 상대경로로 OK)
const SUMMARY_ENDPOINT = "/api/market/summary";

// 환율 엔드포인트
const FX_ENDPOINT = "/api/market/fx/usd-krw";

type MarketSummaryResponse = {
  quote: Quote;
  candles: DailyCandle[];
};

export default function Market() {
  const setLastOrder = useOrderStore((s) => s.setLastOrder);

  // 심볼 검색/선택
  const [inputSymbol, setInputSymbol] = useState("AAPL");
  const [symbol, setSymbol] = useState("AAPL");

  // 기간 선택
  const [days, setDays] = useState<Days>(30);

  // 데이터(차트/요약)
  const [candlesAll, setCandlesAll] = useState<DailyCandle[]>([]);
  const [quote, setQuote] = useState<Quote | null>(null);

  // 로딩/에러(실 API 붙일 때도 그대로 활용 가능)
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 차트 클릭 → 지정가 선택
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);

  // confirm 오버레이 상태
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [draft, setDraft] = useState<OrderDraft | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // 중앙 안내 메시지(2줄 토스트)
  const [toast, setToast] = useState<{ title: string; desc: string } | null>(
    null
  );
  const toastTimerRef = useRef<number | null>(null);

  // 환율(USD->KRW). 로딩 전/실패 시 null
  const [usdKrw, setUsdKrw] = useState<number | null>(null);

  // 토스트 타이머 정리(언마운트 시)
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  // 환율 로드: 페이지 진입 시 1회만 호출
  useEffect(() => {
    let ignore = false;

    (async () => {
      try {
        const res = await fetch(FX_ENDPOINT, {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`환율 응답 실패 (${res.status}) ${text}`);
        }

        const json = (await res.json()) as { base: string; quote: string; rate: number };

        if (!ignore) {
          const rate = Number(json?.rate);
          setUsdKrw(Number.isFinite(rate) ? rate : null);
        }
      } catch {
        if (!ignore) setUsdKrw(null);
      }
    })();

    return () => {
      ignore = true;
    };
  }, []);

  // 1) candles 기간 필터링(목/실 데이터 모두 공통)
  const candles = useMemo(() => {
    return candlesAll.slice(-days);
  }, [candlesAll, days]);

  // 2) 현재가(quote 우선)
  const currentPrice = useMemo(() => {
    if (quote?.price && quote.price > 0) return quote.price;
    const last = candles[candles.length - 1];
    return last?.close ?? null;
  }, [quote, candles]);

  // 3) 요약
  const summary = useMemo(() => {
    const last = candles[candles.length - 1];
    return {
      open: quote?.open ?? last?.open,
      high: quote?.high ?? last?.high,
      low: quote?.low ?? last?.low,
      previousClose: quote?.previousClose,
    };
  }, [quote, candles]);

  /**
   * 실 API 호출 함수
   * - 백엔드: GET /api/market/summary?symbol=...&days=...
   * - 응답: { quote: {...}, candles: [...] }
   */
  async function fetchMarketSummary(params: {
    symbol: string;
    days: number;
    signal?: AbortSignal;
  }): Promise<MarketSummaryResponse> {
    const { symbol, days, signal } = params;

    const url = `${SUMMARY_ENDPOINT}?symbol=${encodeURIComponent(
      symbol
    )}&days=${days}`;

    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal,
      credentials: "include", // 쿠키 기반 인증 쓰는 경우 안전(불필요하면 제거 가능)
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `시세 데이터를 불러오지 못했습니다. (${res.status}) ${text}`
      );
    }

    const data = (await res.json()) as MarketSummaryResponse;
    return data;
  }

  // 데이터 로드 (mock 또는 실 API)
  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    async function load() {
      setLoading(true);
      setErrorMsg(null);

      try {
        if (USE_MOCK) {
          const r = getMockMarket(symbol);

          if (ignore) return;
          setCandlesAll(r.candles);
          setQuote(r.quote);
          setSelectedPrice(null);
          return;
        }

        const r = await fetchMarketSummary({
          symbol,
          days,
          signal: controller.signal,
        });

        if (ignore) return;
        setCandlesAll(r.candles);
        setQuote(r.quote);

        setSelectedPrice(null);
      } catch (e: any) {
        if (ignore) return;
        if (e?.name === "AbortError") return;

        setErrorMsg(e?.message ?? "데이터를 불러오지 못했습니다.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
      controller.abort();
    };
  }, [symbol, days]);

  // Enter 조회
  const submitSymbol = () => {
    const s = inputSymbol.trim().toUpperCase();
    if (!s) return;
    setSymbol(s);
  };

  // 주문 draft → confirm 오버레이
  const onSubmitDraft = (d: OrderDraft) => {
    setDraft(d);
    setConfirmOpen(true);
  };

  // 중앙 토스트 표시(2줄)
  const showToast2 = (title: string, desc: string) => {
    setToast({ title, desc });

    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);

    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 1500);
  };

  // 주문 확정
  const onConfirm = async () => {
    if (!draft) return;

    try {
      setConfirmLoading(true);

      setLastOrder(draft);

      setConfirmOpen(false);
      setDraft(null);
      setSelectedPrice(null);

      const sideText = draft.side === "BUY" ? "매수" : "매도";
      const kindText = draft.kind === "LIMIT" ? "지정가" : "시장가";
      const qtyText = `${draft.quantity.toLocaleString("ko-KR")}주`;

      let priceText = "";
      if (draft.kind === "LIMIT") {
        const p = draft.price ?? draft.expectedFillPrice;
        if (typeof p === "number" && Number.isFinite(p)) {
          priceText = ` ${p.toFixed(2)}원`;
        }
      }

      showToast2(
        "주문이 접수되었습니다",
        `${draft.symbol} ${sideText} ${qtyText} · ${kindText}${priceText}`
      );
    } finally {
      setConfirmLoading(false);
    }
  };

  const fmt = (n?: number | null, fractionDigits = 2) => {
    if (typeof n !== "number" || !Number.isFinite(n)) return "-";
    return n.toLocaleString("ko-KR", {
      maximumFractionDigits: fractionDigits,
      minimumFractionDigits: fractionDigits,
    });
  };

  return (
    <div className="mx-auto max-w-[1200px] p-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="text-lg font-bold text-gray-900">
                {symbol} · 일별 증가
              </div>

              <div className="flex items-center gap-2 rounded-2xl border border-gray-200 p-1">
                <button
                  type="button"
                  className={`h-9 px-3 rounded-xl text-sm font-semibold ${
                    days === 7
                      ? "bg-gray-900 text-white"
                      : "bg-white text-gray-700"
                  }`}
                  onClick={() => setDays(7)}
                >
                  7일
                </button>
                <button
                  type="button"
                  className={`h-9 px-3 rounded-xl text-sm font-semibold ${
                    days === 30
                      ? "bg-gray-900 text-white"
                      : "bg-white text-gray-700"
                  }`}
                  onClick={() => setDays(30)}
                >
                  30일
                </button>
                <button
                  type="button"
                  className={`h-9 px-3 rounded-xl text-sm font-semibold ${
                    days === 90
                      ? "bg-gray-900 text-white"
                      : "bg-white text-gray-700"
                  }`}
                  onClick={() => setDays(90)}
                >
                  90일
                </button>
              </div>
            </div>

            <div className="mt-4">
              {loading ? (
                <div className="h-64 w-full rounded-2xl bg-gray-100 animate-pulse" />
              ) : errorMsg ? (
                <div className="h-64 w-full rounded-2xl border border-gray-200 flex items-center justify-center text-sm text-gray-500">
                  {errorMsg}
                </div>
              ) : (
                <PriceLineChart
                  data={candles}
                  title={""}
                  onPriceSelect={(price) => setSelectedPrice(price)}
                />
              )}
            </div>

            <div className="mt-3 text-sm text-gray-500">
              점 포인트를 클릭하면 지정가로 선택돼요.
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5">
            <div className="text-sm font-semibold text-gray-900 mb-3">
              요약
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <SummaryItem label="시가" value={fmt(summary.open)} />
              <SummaryItem label="고가" value={fmt(summary.high)} />
              <SummaryItem label="저가" value={fmt(summary.low)} />
              <SummaryItem label="전일 종가" value={fmt(summary.previousClose)} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-gray-200 bg-white p-5">
            <div className="text-sm font-semibold text-gray-900 mb-2">
              종목 검색
            </div>

            <div className="flex gap-2">
              <input
                value={inputSymbol}
                onChange={(e) => setInputSymbol(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitSymbol();
                }}
                className="h-12 flex-1 rounded-2xl border border-gray-200 px-4 outline-none"
                placeholder="종목을 검색해보세요"
              />
              <button
                type="button"
                onClick={submitSymbol}
                className="h-12 px-4 rounded-2xl bg-gray-900 text-white font-semibold"
              >
                조회
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {추천심볼.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="h-9 px-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-700"
                  onClick={() => {
                    setInputSymbol(s);
                    setSymbol(s);
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <OrderPanel
            symbol={symbol}
            currentPrice={currentPrice}
            selectedPrice={selectedPrice}
            usdKrw={usdKrw}
            onSubmitDraft={onSubmitDraft}
          />
        </div>
      </div>

      <OrderConfirmOverlay
        open={confirmOpen}
        order={draft}
        onClose={() => setConfirmOpen(false)}
        onConfirm={onConfirm}
        confirmLoading={confirmLoading}
      />

      {toast && (
        <div className="fixed inset-0 z-[60] pointer-events-none flex items-center justify-center">
          <div className="rounded-2xl bg-gray-900/90 text-white px-6 py-4 shadow-xl text-center">
            <div className="text-sm font-semibold">{toast.title}</div>
            <div className="mt-1 text-xs text-gray-300">{toast.desc}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-base font-bold text-gray-900">{value}</div>
    </div>
  );
}
