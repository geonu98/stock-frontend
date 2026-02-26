import api from "./axios";

export type PositionResponse = {
  symbol: string;
  quantity: number;
  avgBuyPriceUsd: string;        // BigDecimal → JSON에서는 string으로 오는 게 안전
  currentPriceUsd: string;
  marketValueUsd: string;
  unrealizedPnlUsd: string;
  realizedPnlUsd: string;
  unrealizedReturnPct: string;
};

export type SummaryResponse = {
  totalMarketValueUsd: string;
  totalUnrealizedPnlUsd: string;
  totalRealizedPnlUsd: string;
  totalPnlUsd: string;
  totalCostUsd: string;
  totalReturnPct: string;
  usdKrwRate: string | null;
  totalMarketValueKrw: string | null;
  totalPnlKrw: string | null;
};

export type WarningResponse = {
  code: string;
  symbol: string | null;
};

export type PortfolioResponse = {
  positions: PositionResponse[];
  summary: SummaryResponse;
  warnings: WarningResponse[];
};

export async function getPortfolio() {
  const res = await api.get<PortfolioResponse>("/api/portfolio");
  return res.data;
}