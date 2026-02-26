// src/api/market.ts
import api from "./axios";

export type DailyCandle = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type Quote = {
  symbol: string;
  price: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  change: number;
  changePercent: number;
  volume: number;
};

export async function fetchDailyCandles(symbol: string, days = 90): Promise<DailyCandle[]> {
  const res = await api.get<DailyCandle[]>("/api/market/candles/daily", {
    params: { symbol, days },
  });
  return res.data;
}

export async function fetchQuote(symbol: string): Promise<Quote> {
  const res = await api.get<Quote>("/api/market/price", {
    params: { symbol },
  });
  return res.data;
}
