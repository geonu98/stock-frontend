// src/pages/Market.tsx
import { useEffect, useMemo, useState } from "react";
import PriceLineChart from "../components/market/PriceLineChart";
import { useSearchParams } from "react-router-dom";

// 🔹 실 API용 함수/타입
import {
  fetchDailyCandles,
  fetchQuote,
  type DailyCandle,
  type Quote,
} from "../api/market";



// 🔹 Mock 데이터 생성기
import { getMockMarket } from "../mocks/market";

/**
 * 🔧 개발용 스위치
 * true  → Mock 데이터 사용 (외부 API 호출 ❌, 제한 신경 X)
 * false → 실제 백엔드 API 호출
 */
const USE_MOCK = true;

const QUICK_SYMBOLS = ["MSFT", "TSLA", "SPY"] as const;
const PERIODS = [7, 30, 90] as const;

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

  // 심볼 정규화
  const normalizedSymbol = useMemo(() => symbol.trim().toUpperCase(), [symbol]);

  // 표시용 candles (기간 slice)
  const visibleCandles = useMemo(() => {
    if (!candles?.length) return [];
    return candles.slice(-period);
  }, [candles, period]);

  const isUp = useMemo(() => {
    const cp = Number(quote?.changePercent ?? 0);
    return cp >= 0;
  }, [quote]);

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
        return;
      }

      const [c, q] = await Promise.all([
        fetchDailyCandles(target),
        fetchQuote(target),
      ]);

      setSymbol(target);
      setCandles(c);
      setQuote(q);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? "불러오기 실패");
      setCandles([]);
      setQuote(null);
    } finally {
      setLoading(false);
    }
  };

 useEffect(() => {
  const s = (searchParams.get("symbol") ?? "").trim().toUpperCase();

  // URL에 symbol이 있으면 그걸 우선 조회
  if (s) {
    setSymbol(s);
    load(s);
    return;
  }

  // URL에 없으면 기본 심볼로 1회 조회
  load("AAPL");
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [searchParams]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto w-full max-w-5xl px-5 py-8 space-y-6">
        {/* =======================
            상단: 검색바 + 추천칩
        ======================= */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
            마켓
          </div>

          <div className="flex flex-col gap-3">
            {/* 검색바 */}
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

            {/* 추천 심볼 칩 */}
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
                {quote ? quote.price : loading ? "—" : "—"}
              </div>

              {/* 부가 */}
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {quote ? `전일 종가 ${quote.previousClose}` : " "}
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
                  ? `${quote.change} (${quote.changePercent}%)`
                  : loading
                  ? "불러오는 중"
                  : " "}
              </div>

              {/* 아주 얇은 정보 한 줄만 */}
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {quote ? `거래량 ${Number(quote.volume).toLocaleString()}` : " "}
              </div>
            </div>
          </div>
        </div>

        {/* =======================
            차트 + 기간 세그먼트
        ======================= */}
        <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {normalizedSymbol} · 일별 종가
            </div>

            {/* 기간 세그먼트 */}
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

          {/* 차트 */}
          <PriceLineChart data={visibleCandles} title={""} />

          <div className="text-xs text-gray-500 dark:text-gray-400">
            최근 {period}일 종가 기준
          </div>
        </div>

        {/* =======================
            (옵션) 상세는 아래로 작게
        ======================= */}
        {quote && (
          <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              요약
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="text-gray-500 dark:text-gray-400">
                시가{" "}
                <span className="text-gray-900 dark:text-gray-100 font-semibold">
                  {quote.open}
                </span>
              </div>
              <div className="text-gray-500 dark:text-gray-400">
                고가{" "}
                <span className="text-gray-900 dark:text-gray-100 font-semibold">
                  {quote.high}
                </span>
              </div>
              <div className="text-gray-500 dark:text-gray-400">
                저가{" "}
                <span className="text-gray-900 dark:text-gray-100 font-semibold">
                  {quote.low}
                </span>
              </div>
              <div className="text-gray-500 dark:text-gray-400">
                전일 종가{" "}
                <span className="text-gray-900 dark:text-gray-100 font-semibold">
                  {quote.previousClose}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
