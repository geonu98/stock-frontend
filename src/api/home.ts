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

export async function fetchRecommendations(offset = 0) {
  const res = await api.get<RecommendationsResponse>("/home/recommendations", {
    params: { offset },
  });

  const data = res.data;

  return {
    ...data,
    items: (data.items ?? []).map((it) => {
      const closes =
        (it.sparkline ?? []).length > 0
          ? it.sparkline.map((p) => p.close).filter((v) => Number.isFinite(v))
          : [];

      // ✅ 추천 종목 폴백: sparkline이 비면 가짜 생성
      const values =
        closes.length > 0
          ? closes
          : makeFakeSparkline(it.price ?? 100, 24);

      return {
        ...it,
        // sparkline 원본은 유지해도 되고(디버깅용)
        // 프론트에서 바로 쓰기 편하게 values를 추가
        values,
      };
    }),
  };
}


