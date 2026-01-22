export type FxRateResponse = {
  base: string;
  quote: string;
  rate: number;
};

export async function fetchUsdKrw(): Promise<FxRateResponse> {
  const res = await fetch("/api/market/fx/usd-krw");
  if (!res.ok) throw new Error("환율을 불러오지 못했습니다.");
  return res.json();
}
