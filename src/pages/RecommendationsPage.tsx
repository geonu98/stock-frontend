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

  // 홈에서 내려준 version (같은 추천 세트 보장)
  const params = new URLSearchParams(location.search);
  const v = params.get("v");

  const [items, setItems] = useState<RecommendedItem[]>([]);
  const [nextOffset, setNextOffset] = useState<number | null>(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canLoadMore = useMemo(
    () => nextOffset !== null && !loading,
    [nextOffset, loading]
  );

  // ✅ 로드 함수 (replace / append 공용)
  async function load(offset: number, mode: "replace" | "append") {
    if (loading) return; // 중복 클릭 방지

    setLoading(true);
    setError(null);

    try {
      const data = (await fetchRecommendations(
        offset,
        v
      )) as RecommendationsResponse;

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
      const status = e?.response?.status;

      // ✅ 429 전용 메시지
      if (status === 429) {
        setError("요청이 많습니다. 잠시 후 다시 시도해 주세요.");
      } else {
        setError(
          e?.response?.data?.message ||
            e?.message ||
            "추천 조회 중 오류가 발생했습니다."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  // 첫 페이지 로드
  useEffect(() => {
    load(0, "replace");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      {/* 헤더 */}
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

      {/* 에러 박스 */}
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
          <div className="mt-2">
            <button
              onClick={() => load(items.length === 0 ? 0 : items.length, items.length === 0 ? "replace" : "append")}
              className="rounded-md border px-2 py-1 text-xs font-semibold hover:bg-white"
            >
              다시 시도
            </button>
          </div>
        </div>
      )}

      {/* 리스트 */}
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
          <div
  key={it.symbol} // 마켓페이지가 쿼리스트링으로 조회함 
  className="rounded-xl border bg-white p-4 shadow-sm cursor-pointer hover:shadow-md transition"
  onClick={() =>
    navigate(`/market?symbol=${it.symbol}`)
  }
>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-base font-bold">{it.symbol}</div>
                  <div className="mt-1 flex items-center gap-2 text-sm">
                    <span className="font-semibold">
                      {fmtPrice(it.price)}
                    </span>
                    <span className={pctClass}>
                      {fmtPct(it.changeRate)}
                    </span>
                  </div>
                </div>

                <div className="w-[120px]">
                  <MiniSparkline values={spark} height={28} width={120} />
                </div>
              </div>
            </div>
          );
        })}

        {/* 로딩 카드 */}
        {loading && (
          <div className="rounded-xl border bg-white p-4 text-sm text-gray-500">
            불러오는 중...
          </div>
        )}

        {/* 빈 결과 */}
        {!loading && items.length === 0 && !error && (
          <div className="rounded-xl border bg-white p-4 text-sm text-gray-500">
            추천 결과가 없습니다.
          </div>
        )}
      </div>

      {/* 더보기 버튼 */}
      <div className="mt-6 flex flex-col items-center gap-2">
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
          {loading
            ? "불러오는 중..."
            : nextOffset == null
            ? "마지막 페이지"
            : "더보기"}
        </button>

        {/* 안내 문구 */}
        {nextOffset != null && !loading && (
          <div className="text-xs text-gray-500">
            일부 종목은 준비 중일 수 있습니다. 더보기를 누르면 추가로 표시됩니다.
          </div>
        )}
      </div>
    </div>
  );
}
