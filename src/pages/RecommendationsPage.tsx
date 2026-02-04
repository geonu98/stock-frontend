import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import MiniSparkline from "../components/market/MiniSparkline";
import { fetchRecommendations, type RecommendedItem } from "../api/home";
import { safeSparkline } from "../utils/sparklineFallback";

type RecommendationsResponse = {
  items: RecommendedItem[];
  nextOffset: number | null;
};

function fmtPrice(v: number | null) {
  if (v == null || !Number.isFinite(v)) return "-";
  return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function fmtPct(v: number | null) {
  if (v == null || !Number.isFinite(v)) return "-";
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}%`;
}

export default function RecommendationsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const v = params.get("v"); // 홈에서 내려준 version

  const [items, setItems] = useState<RecommendedItem[]>([]);
  const [nextOffset, setNextOffset] = useState<number | null>(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canLoadMore = useMemo(
    () => nextOffset !== null && !loading,
    [nextOffset, loading]
  );

  async function load(offset: number, mode: "replace" | "append") {
    setLoading(true);
    setError(null);

    try {
      const data = (await fetchRecommendations(offset, v)) as RecommendationsResponse;

      const normalized = (data.items ?? []).map((it) => ({
        ...it,
        values:
          it.values && it.values.length > 0
            ? it.values
            : (it.sparkline ?? []).map((p) => p.close),
      }));

      setItems((prev) =>
        mode === "replace" ? normalized : [...prev, ...normalized]
      );
      setNextOffset(data.nextOffset ?? null);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "추천 조회 중 오류가 발생했습니다.";
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(0, "replace");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">추천 종목 더보기</h1>
          <p className="text-sm text-gray-500">
            홈과 같은 추천 버전(v={v ?? "auto"}) 기준으로 페이지를 조회합니다.
          </p>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="rounded-md border px-3 py-2 text-sm font-semibold hover:bg-gray-50"
        >
          뒤로
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
          <div className="mt-2">
            <button
              onClick={() => load(0, "replace")}
              className="rounded-md border px-2 py-1 text-xs font-semibold hover:bg-white"
            >
              다시 시도
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {items.map((it) => {
          const pct = it.changeRate ?? 0;
          const pctClass =
            it.changeRate == null
              ? "text-gray-500"
              : pct > 0
              ? "text-red-600"
              : pct < 0
              ? "text-blue-600"
              : "text-gray-600";

          const spark = safeSparkline(it.values ?? [], 24);

          return (
            <div key={it.symbol} className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-base font-bold">{it.symbol}</div>
                  <div className="mt-1 flex items-center gap-2 text-sm">
                    <span className="font-semibold">{fmtPrice(it.price)}</span>
                    <span className={pctClass}>{fmtPct(it.changeRate)}</span>
                  </div>
                </div>

                <div className="w-[120px]">
                  <MiniSparkline values={spark} height={28} width={120} />
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="rounded-xl border bg-white p-4 text-sm text-gray-500">
            불러오는 중...
          </div>
        )}

        {!loading && items.length === 0 && !error && (
          <div className="rounded-xl border bg-white p-4 text-sm text-gray-500">
            추천 결과가 없습니다.
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-center">
        <button
          disabled={!canLoadMore}
          onClick={() => {
            if (nextOffset != null) load(nextOffset, "append");
          }}
          className={[
            "rounded-md px-4 py-2 text-sm font-semibold",
            canLoadMore
              ? "border hover:bg-gray-50"
              : "cursor-not-allowed border bg-gray-100 text-gray-400",
          ].join(" ")}
        >
          {nextOffset == null ? "마지막 페이지" : "더보기"}
        </button>
      </div>
    </div>
  );
}
