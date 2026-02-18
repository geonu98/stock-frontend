// src/pages/Market.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore"; 

import PriceLineChart from "../components/market/PriceLineChart";
import OrderPanel from "../components/market/OrderPanel";
import OrderConfirmOverlay from "../components/order/OrderConfirmOverlay";

import type { DailyCandle, Quote } from "../api/market";
import { getMockMarket } from "../mocks/market";
import type { OrderDraft } from "../types/order";
import { useOrderStore } from "../store/orderStore";

// axios 인스턴스 사용 (토큰/refresh 인터셉터 적용)
import api from "../api/axios";

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
  const location = useLocation();
const openLoginModal = useAuthStore((s) => s.openLoginModal);
const user = useAuthStore((s) => s.user);
  const setLastOrder = useOrderStore((s) => s.setLastOrder);



  // 심볼 검색/선택
  const [inputSymbol, setInputSymbol] = useState("AAPL");
  const [symbol, setSymbol] = useState("AAPL");

  // 기간 선택
  const [days, setDays] = useState<Days>(30);

  // 데이터(차트/요약)
  const [candlesAll, setCandlesAll] = useState<DailyCandle[]>([]);
  const [quote, setQuote] = useState<Quote | null>(null);

  // 로딩/에러
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
  //성공 토스트 메세지임
  const showToast2 = (title: string, desc: string) => {
    setToast({ title, desc });

    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);

    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 1500);
  };

  // 환율
  const [usdKrw, setUsdKrw] = useState<number | null>(null);

  //  로그인 여부 확인 함수
// (기존: localStorage accessToken 체크 / (추가로) /api/user/me 호출로 확인
//  → 이제: App에서 fetchMe로 user 상태를 관리하고, 401/만료는 axios 인터셉터에서 전역 처리)

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  // 쿼리스트링 symbol 자동 반영
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const qs = params.get("symbol");
    const next = qs?.trim().toUpperCase();

    if (!next) return;
    if (next === symbol) return;

    setInputSymbol(next);
    setSymbol(next);
  }, [location.search, symbol]);

  // 환율 로드
  useEffect(() => {
    let ignore = false;

    (async () => {
      try {
        const res = await api.get(FX_ENDPOINT);
        const rate = Number(res.data?.rate);
        if (!ignore) setUsdKrw(Number.isFinite(rate) ? rate : null);
      } catch {
        if (!ignore) setUsdKrw(null);
      }
    })();

    return () => {
      ignore = true;
    };
  }, []);

  const candles = useMemo(() => {
    return candlesAll.slice(-days);
  }, [candlesAll, days]);

  const currentPrice = useMemo(() => {
    if (quote?.price && quote.price > 0) return quote.price;
    const last = candles[candles.length - 1];
    return last?.close ?? null;
  }, [quote, candles]);

  const summary = useMemo(() => {
    const last = candles[candles.length - 1];
    return {
      open: quote?.open ?? last?.open,
      high: quote?.high ?? last?.high,
      low: quote?.low ?? last?.low,
      previousClose: quote?.previousClose,
    };
  }, [quote, candles]);

  async function createTrade(body: {
    symbol: string;
    side: "BUY" | "SELL";
    kind: "MARKET" | "LIMIT";
    quantity: number;
    priceUsd: number;
    usdKrwRate?: number;
  }) {
    const res = await api.post<number>("/api/trades", body);
    return res.data;
  }

  async function fetchMarketSummary(params: {
    symbol: string;
    days: number;
    signal?: AbortSignal;
  }): Promise<MarketSummaryResponse> {
    const res = await api.get(SUMMARY_ENDPOINT, {
      params: { symbol: params.symbol, days: params.days },
      signal: params.signal,
    });
    return res.data;
  }

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

        const msg =
          e?.response?.data?.message ??
          e?.message ??
          "데이터를 불러오지 못했습니다.";
        setErrorMsg(msg);
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

  const submitSymbol = () => {
    const s = inputSymbol.trim().toUpperCase();
    if (!s) return;
    setSymbol(s);
  };

  // ✅ 로그인 체크 후 주문 처리
 const onSubmitDraft = async (d: OrderDraft) => {
  //  서버 기준 로그인 확인
  // (기존: ensureLoggedIn으로 /api/user/me 호출 → 이제 user 상태로 판단 + 401은 인터셉터가 전역 처리)
  if (!user) {
    const redirectTo = location.pathname + location.search;
    openLoginModal(redirectTo);
    return;
  }

  setDraft(d);
  setConfirmOpen(true);
};

  const onConfirm = async () => {
    if (!draft) return;

    try {
      setConfirmLoading(true);

      const fallback = draft.expectedFillPrice ?? draft.currentPrice;
      const priceUsd =
        draft.kind === "LIMIT" ? draft.price ?? fallback : fallback;

      if (!priceUsd || !Number.isFinite(priceUsd) || priceUsd <= 0) {
        throw new Error("가격 정보를 확인할 수 없습니다.");
      }

      await createTrade({
        symbol: draft.symbol,
        side: draft.side,
        kind: draft.kind,
        quantity: draft.quantity,
        priceUsd,
        usdKrwRate: draft.usdKrw,
      });

      showToast2(
        "주문이 완료되었습니다",
        `${draft.symbol} ${
          draft.side === "BUY" ? "매수" : "매도"
        } ${draft.quantity.toLocaleString()}주`
      );

      setLastOrder(draft);
      setConfirmOpen(false);
      setDraft(null);
      setSelectedPrice(null);

   } catch (e: any) {
  //  토큰 만료/불일치 처리
  // (기존: 여기서 localStorage 토큰 제거 + 로컬 모달 오픈
  //  → 이제: axios 인터셉터가 refresh 시도 후 실패하면 logout + 전역 모달 오픈까지 처리)
  if (e?.response?.status === 401) {
    setConfirmOpen(false);
    setDraft(null);

    showToast2("로그인이 만료되었습니다", "다시 로그인해주세요");
    // 전역 모달은 인터셉터가 이미 열어줌(중복 방지 로직 포함)
    return;
  }

  showToast2(
    "주문 실패",
    e?.response?.data?.message ?? e?.message ?? "잠시 후 다시 시도해주세요"
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
        {/* 왼쪽 */}
        <div className="space-y-6">
          {/* 종목 검색 */}
          <div className="rounded-3xl border border-gray-200 bg-white p-5">
            <div className="text-sm font-semibold text-gray-900 mb-2">종목 검색</div>

            <div className="flex gap-2">
              <input
                value={inputSymbol}
                onChange={(e) => setInputSymbol(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitSymbol();
                }}
                className="h-12 flex-1 rounded-2xl border border-gray-200 px-4 outline-none"
                placeholder="종목을 검색해보세요 (예: AAPL)"
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

          {/* 차트 */}
          <div className="rounded-3xl border border-gray-200 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="text-lg font-bold text-gray-900">{symbol} · 일별</div>

              <div className="flex items-center gap-2 rounded-2xl border border-gray-200 p-1">
                <button
                  type="button"
                  className={`h-9 px-3 rounded-xl text-sm font-semibold ${
                    days === 7 ? "bg-gray-900 text-white" : "bg-white text-gray-700"
                  }`}
                  onClick={() => setDays(7)}
                >
                  7일
                </button>
                <button
                  type="button"
                  className={`h-9 px-3 rounded-xl text-sm font-semibold ${
                    days === 30 ? "bg-gray-900 text-white" : "bg-white text-gray-700"
                  }`}
                  onClick={() => setDays(30)}
                >
                  30일
                </button>
                <button
                  type="button"
                  className={`h-9 px-3 rounded-xl text-sm font-semibold ${
                    days === 90 ? "bg-gray-900 text-white" : "bg-white text-gray-700"
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
                  title=""
                  onPriceSelect={(price) => setSelectedPrice(price)}
                />
              )}
            </div>

            <div className="mt-3 text-sm text-gray-500">점을 클릭하면 지정가로 선택돼요.</div>
          </div>

          {/* 요약 */}
          <div className="rounded-3xl border border-gray-200 bg-white p-5">
            <div className="text-sm font-semibold text-gray-900 mb-3">요약</div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <SummaryItem label="시가" value={fmt(summary.open)} />
              <SummaryItem label="고가" value={fmt(summary.high)} />
              <SummaryItem label="저가" value={fmt(summary.low)} />
              <SummaryItem label="전일 종가" value={fmt(summary.previousClose)} />
            </div>
          </div>
        </div>

        {/* 오른쪽 */}
        <div>
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

  {/* (기존: Market 로컬 LoginRequiredModal → 이제 App.tsx 전역 LoginRequiredModal로 통합) */}
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