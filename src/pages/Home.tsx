import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { fetchHome, type HomeResponse, type RecommendedItem } from "../api/home";
import MiniSparkline from "../components/./market/MiniSparkline";
import { safeSparkline } from "../utils/sparklineFallback";
import { SkeletonHScroll } from "../components/skeleton/SkeletonCard";

function fmtNumber(v: number, digits = 2) {
  return Number.isFinite(v)
    ? v.toLocaleString(undefined, { maximumFractionDigits: digits })
    : "-";
}
function fmtSigned(v: number, digits = 2) {
  if (!Number.isFinite(v)) return "-";
  const s = v > 0 ? "+" : "";
  return `${s}${v.toFixed(digits)}`;
}
function fmtSignedPercent(v: number, digits = 2) {
  if (!Number.isFinite(v)) return "-";
  const s = v > 0 ? "+" : "";
  return `${s}${v.toFixed(digits)}%`;
}

function timeAgo(datetime: number) {
  if (!datetime) return "";
  const ms = datetime < 1e12 ? datetime * 1000 : datetime;
  const diff = Date.now() - ms;
  if (diff < 0) return "방금 전";

  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;

  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;

  const day = Math.floor(hour / 24);
  return `${day}일 전`;
}

export default function Home() {
  const navigate = useNavigate();

  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const isMeLoading = useAuthStore((s) => s.isMeLoading);
  const fetchMe = useAuthStore((s) => s.fetchMe);

  const isLoggedIn = !!accessToken;

  useEffect(() => {
    if (isLoggedIn && !user && !isMeLoading) fetchMe();
  }, [isLoggedIn, user, isMeLoading, fetchMe]);

  const [home, setHome] = useState<HomeResponse | null>(null);
  const [homeLoading, setHomeLoading] = useState(false);
  const [homeError, setHomeError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setHomeLoading(true);
      setHomeError(null);
      try {
        const data = await fetchHome();
        setHome(data);
      } catch (e: any) {
        setHomeError(e?.message ?? "홈 데이터를 불러오지 못했습니다.");
      } finally {
        setHomeLoading(false);
      }
    };
    run();
  }, []);

  const tickers = useMemo(() => home?.tickers ?? [], [home]);
  const news = useMemo(() => home?.news ?? [], [home]);

  // 홈 추천(5개)
  const recommendations: RecommendedItem[] = useMemo(
    () => home?.recommendations?.items ?? [],
    [home]
  );

  const recoNextOffset = useMemo(
    () => home?.recommendations?.nextOffset ?? null,
    [home]
  );

  const recoStatus = home?.recommendationStatus;
  const recoBuilding = recoStatus === "BUILDING";

  const recoVersion = home?.recommendationVersion ?? null;

  // 추천 배너 노출 조건 (수정)
  // - BUILDING 상태라도 추천이 "이미 일부라도" 보이면 배너는 굳이 안 띄움
  // - 추천이 0개일 때만 "생성 중" 안내를 노출
  const showRecoBuildingBanner =
    recoBuilding && !homeLoading && recommendations.length === 0;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto w-full max-w-5xl px-5 py-8 space-y-8">
        <header className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
              오늘
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              시장 한눈에 보기
            </div>
          </div>
        </header>

        {(homeLoading || homeError) && (
          <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-4">
            {homeLoading && (
              <div className="text-sm text-gray-600 dark:text-gray-300">
                홈 데이터를 불러오는 중입니다...
              </div>
            )}
            {!homeLoading && homeError && (
              <div className="text-sm text-rose-600 dark:text-rose-300">
                {homeError}
              </div>
            )}
          </div>
        )}

        <section className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          {!isLoggedIn ? (
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  내 자산
                </div>
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  로그인하면 내 포트폴리오를 한 번에 볼 수 있어요.
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  보유 종목, 수익률, 자산 구성을 바로 확인할 수 있어요.
                </div>
              </div>

              <button
                onClick={() => navigate("/login")}
                className="shrink-0 rounded-2xl px-4 py-3 text-sm font-semibold bg-gray-900 text-white dark:bg-white dark:text-gray-900"
              >
                로그인 하고 내 자산 확인하기
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                내 자산
              </div>

              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {isMeLoading
                  ? "불러오는 중..."
                  : `${user?.nickname ?? "사용자"}님, 안녕하세요`}
              </div>

              <div className="text-sm text-gray-500 dark:text-gray-400">
                오늘도 좋은 투자 되세요.
              </div>
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-end justify-between">
            <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
              에디터 픽
            </div>
            <button
              className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:underline"
              onClick={() => navigate("/market")}
            >
              더 보기
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {homeLoading ? (
              <SkeletonHScroll count={4} />
            ) : tickers.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400 px-1">
                표시할 종목이 없습니다.
              </div>
            ) : (
              tickers.map((t) => {
                const up = t.changePercent >= 0;
                const badgeClass = up
                  ? "text-rose-600 dark:text-rose-300"
                  : "text-blue-600 dark:text-blue-300";

                return (
                  <button
                    key={t.symbol}
                    className="min-w-[260px] rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() =>
                      navigate(`/market?symbol=${encodeURIComponent(t.symbol)}`)
                    }
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                          {t.symbol}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {t.name ?? "종목"}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`font-semibold ${badgeClass}`}>
                          {fmtSignedPercent(t.changePercent)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {up ? "상승" : "하락"}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-end justify-between">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        현재가
                      </div>
                      <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {fmtNumber(t.price)}
                      </div>
                    </div>

                    <div className="mt-3 flex items-end justify-between gap-3">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        변동: {fmtSigned(t.change)} (
                        {fmtSignedPercent(t.changePercent)})
                      </div>

                      <MiniSparkline
                        values={safeSparkline(t.sparkline ?? [], 30)}
                        width={150}
                        height={46}
                        className="shrink-0"
                      />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-end justify-between">
            <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
              추천 종목
            </div>

            <button
              className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:underline"
              onClick={() => {
                const qs = recoVersion
                  ? `?v=${encodeURIComponent(recoVersion)}`
                  : "";
                navigate(`/recommendations${qs}`);
              }}
            >
              더 보기
            </button>
          </div>

          {/* 배너 조건 수정: 추천이 0개일 때만 표시 */}
          {showRecoBuildingBanner && (
            <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-4">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                추천 종목을 생성 중입니다. 잠시 후 다시 확인해 주세요.
              </div>
            </div>
          )}

          <div className="flex gap-3 overflow-x-auto pb-2">
            {homeLoading ? (
              <SkeletonHScroll count={4} />
            ) : recommendations.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400 px-1">
                표시할 추천 종목이 없습니다.
              </div>
            ) : (
              recommendations.map((r) => {
                const changeRate = Number(r.changeRate ?? 0);
                const up = changeRate >= 0;
                const badgeClass = up
                  ? "text-rose-600 dark:text-rose-300"
                  : "text-blue-600 dark:text-blue-300";

                const sparkValues = safeSparkline(
                  (r.values ?? (r.sparkline ?? []).map((p) => p.close)) as number[],
                  30
                );

                return (
                  <button
                    key={r.symbol}
                    className="min-w-[260px] rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() =>
                      navigate(`/market?symbol=${encodeURIComponent(r.symbol)}`)
                    }
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                          {r.symbol}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          추천
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`font-semibold ${badgeClass}`}>
                          {fmtSignedPercent(changeRate)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {up ? "상승" : "하락"}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-end justify-between">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        현재가
                      </div>
                      <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {fmtNumber(Number(r.price ?? NaN))}
                      </div>
                    </div>

                    <div className="mt-3 flex items-end justify-between gap-3">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        변동: {fmtSignedPercent(changeRate)}
                      </div>

                      <MiniSparkline
                        values={sparkValues}
                        width={150}
                        height={46}
                        className="shrink-0"
                      />
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {!homeLoading && recoNextOffset == null && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              더 이상 표시할 추천이 없습니다.
            </div>
          )}
        </section>

        <section className="space-y-3 pb-10">
          <div className="flex items-end justify-between">
            <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
              주요 뉴스
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {!homeLoading && news.length === 0 && (
                <div className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                  표시할 뉴스가 없습니다.
                </div>
              )}

              {!homeLoading &&
                news.map((n, idx) => (
                  <button
                    key={`${n.url}-${idx}`}
                    className="w-full text-left px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => {
                      if (n.url)
                        window.open(n.url, "_blank", "noopener,noreferrer");
                    }}
                    title="새 탭에서 열기"
                  >
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      {n.headline}
                    </div>

                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {timeAgo(n.datetime)}
                      {n.source ? ` · ${n.source}` : ""}
                    </div>

                    {n.summary && (
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                        {n.summary}
                      </div>
                    )}
                  </button>
                ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
