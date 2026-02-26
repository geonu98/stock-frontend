// src/api/trades.ts
import api from "./axios";

export type TradeSide = "BUY" | "SELL";
export type OrderKind = "MARKET" | "LIMIT";

export type TradeResponse = {
  id: number;
  symbol: string;
  side: TradeSide;
  kind: OrderKind;
  quantity: number;
  priceUsd: string;     // BigDecimal -> string
  usdKrwRate?: string | null;
  tradedAt: string;     // LocalDateTime -> string
};

export async function getTradesBySymbol(symbol: string) {
  const res = await api.get<TradeResponse[]>("/api/trades", { params: { symbol } });
  return res.data;
}