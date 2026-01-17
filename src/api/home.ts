// src/api/home.ts
import api from "./axios";

export type HomeNewsItem = {
  headline: string;
  source: string;
  datetime: number;
  url: string;
  summary?: string | null;
  image?: string | null;
};

export type HomeTicker = {
  symbol: string;
  name?: string | null;
  price: number;
  change: number;
  changePercent: number;
  sparkline?: number[]; // 추가
};

export type HomeResponse = {
  indices?: any;
  popularStocks?: any;
  news: HomeNewsItem[];
  tickers: HomeTicker[];
};

function makeFakeSparkline(base: number, n = 24) {
  let v = Number.isFinite(base) ? base : 100;
  const arr: number[] = [];
  for (let i = 0; i < n; i++) {
    v = Math.max(1, v + (Math.random() - 0.5) * (v * 0.012));
    arr.push(Number(v.toFixed(2)));
  }
  return arr;
}

export async function fetchHome(): Promise<HomeResponse> {
  const res = await api.get("/home");
  const data: HomeResponse = res.data;

  return {
    ...data,
    tickers: (data.tickers ?? []).map((t) => ({
      ...t,
      sparkline: t.sparkline ?? makeFakeSparkline(t.price, 24),
    })),
  };
}
