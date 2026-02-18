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
  sparkline?: number[];
};

export type SparklinePoint = {
  index: number;
  close: number;
};

export type RecommendedItem = {
  symbol: string;
  price: number | null;
  changeRate: number | null;
  sparkline: SparklinePoint[];
  values?: number[];
};

export type RecommendationsResponse = {
  items: RecommendedItem[];
  nextOffset: number | null;
};

export type HomeResponse = {
  news: HomeNewsItem[];
  tickers: HomeTicker[];

  // 홈 추천 5개
  recommendations: RecommendationsResponse;

  // 홈/더보기 일치용
  recommendationVersion?: string | null;
  recommendationStatus?: "BUILDING" | "READY" | string;
  recommendationUpdatedAt?: number | null;
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
  const res = await api.get<HomeResponse>("/api/home");
  const data = res.data;

  return {
    ...data,
    tickers: (data.tickers ?? []).map((t) => ({
      ...t,
      sparkline: t.sparkline ?? makeFakeSparkline(t.price, 24),
    })),
  };
}

export async function fetchRecommendations(offset = 0, v?: string | null) {
  const res = await api.get<RecommendationsResponse>("/api/home/recommendations", {
    params: { offset, v: v ?? undefined },
  });

  const data = res.data;

  return {
    ...data,
    items: (data.items ?? []).map((it) => {
      const closes =
        (it.sparkline ?? []).length > 0
          ? it.sparkline.map((p) => p.close).filter((x) => Number.isFinite(x))
          : [];

      const values =
        closes.length > 0 ? closes : makeFakeSparkline(it.price ?? 100, 24);

      return {
        ...it,
        values,
      };
    }),
  };
}
