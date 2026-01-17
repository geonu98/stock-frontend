import type { DailyCandle, Quote } from "../api/market";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatDate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function clampMin(n: number, min: number) {
  return n < min ? min : n;
}

// 간단한 난수(재현 가능하게 seed 사용)
function seededRandom(seed: number) {
  let x = seed % 2147483647;
  if (x <= 0) x += 2147483646;
  return () => (x = (x * 16807) % 2147483647) / 2147483647;
}

// 최근 N영업일(주말 제외)로 일봉 생성
export function generateMockDailyCandles(params: {
  symbol: string;
  days?: number;          // 기본 60
  startPrice?: number;    // 기본 180
  volatility?: number;    // 기본 0.02 (2%)
  seed?: number;          // 기본 42
}): DailyCandle[] {
  const {
    symbol,
    days = 60,
    startPrice = 180,
    volatility = 0.02,
    seed = 42,
  } = params;

  const rand = seededRandom(
    seed + symbol.toUpperCase().split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
  );

  const candles: DailyCandle[] = [];

  let close = startPrice;
  let d = new Date();
  d.setDate(d.getDate() - (days + 10)); // 여유 버퍼

  while (candles.length < days) {
    d.setDate(d.getDate() + 1);

    const day = d.getDay();
    const isWeekend = day === 0 || day === 6;
    if (isWeekend) continue;

    // 하루 변동률(가우시안 비슷한 형태로)
    const r1 = rand();
    const r2 = rand();
    const drift = (r1 - 0.5) * 0.003; // 아주 약한 드리프트
    const shock = (r2 - 0.5) * 2 * volatility; // 변동성
    const changePct = drift + shock;

    const prevClose = close;
    close = clampMin(prevClose * (1 + changePct), 1);

    const open = prevClose * (1 + (rand() - 0.5) * 0.005);
    const high = Math.max(open, close) * (1 + rand() * 0.01);
    const low = Math.min(open, close) * (1 - rand() * 0.01);

    const volume = Math.floor(800000 + rand() * 3500000);

    candles.push({
      date: formatDate(d),
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
    });
  }

  return candles;
}

export function makeMockQuoteFromCandles(symbol: string, candles: DailyCandle[]): Quote {
  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2] ?? last;

  const price = last.close;
  const previousClose = prev.close;
  const change = Number((price - previousClose).toFixed(2));
  const changePercent = Number((((price - previousClose) / previousClose) * 100).toFixed(2));

  return {
    symbol: symbol.toUpperCase(),
    price,
    open: last.open,
    high: last.high,
    low: last.low,
    previousClose,
    change,
    changePercent,
    volume: last.volume,
  };
}

// 바로 쓰기 편한 기본 mock
export function getMockMarket(symbol: string) {
  const candles = generateMockDailyCandles({ symbol, days: 60 });
  const quote = makeMockQuoteFromCandles(symbol, candles);
  return { candles, quote };
}
