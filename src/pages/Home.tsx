import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import {
  fetchHome,
  fetchRecommendations,
  type HomeResponse,
  type RecommendedItem,
} from "../api/home";
import MiniSparkline from "../components/./market/MiniSparkline";
import { safeSparkline } from "../utils/sparklineFallback";
import { SkeletonHScroll } from "../components/skeleton/SkeletonCard";
import { getPortfolio, type PortfolioResponse } from "../api/portfolio";

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

  // 로그인 여부는 user 기준
  const isLoggedIn = !!user;

  const triedMeRef = useRef(false);

  const [pf, setPf] = useState<PortfolioResponse | null>(null);
  const [pfLoading, setPfLoading] = useState(false);
  const [pfError, setPfError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      triedMeRef.current = false;
      return;
    }

    if (triedMeRef.current) return;

    if (!user && !isMeLoading) {
      triedMeRef.current = true;
      fetchMe().catch(() => {
        // authStore.fetchMe 안에서 정리
      });
    }
  }, [accessToken, user, isMeLoading, fetchMe]);

  useEffect(() => {
    if (!isLoggedIn) {
      setPf(null);
      setPfError(null);
      setPfLoading(false);
      return;
    }

    const run = async () => {
      setPfLoading(true);
      setPfError(null);
      try {
        const data = await getPortfolio();
        setPf(data);
      } catch {
        setPfError("포트폴리오 요약을 불러오지 못했습니다.");
        setPf(null);
      } finally {
        setPfLoading(false);
      }
    };

    run();
  }, [isLoggedIn]);

  const num = (v: any) => {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
  };

  const [home, setHome] = useState<HomeResponse | null>(null);
  const [homeLoading, setHomeLoading] = useState(false);
  const [homeError, setHomeError] = useState<string | null>(null);

  const [recoItems, setRecoItems] = useState<RecommendedItem[]>([]);
  const [recoLoading, setRecoLoading] = useState(false);
  const [recoError, setRecoError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!home) return;

    const runReco = async () => {
      setRecoLoading(true);
      setRecoError(null);

      try {
        const res = await fetchRecommendations(
          0,
          home.recommendationVersion ?? null
        );
        setRecoItems(res.items ?? []);
      } catch (e: any) {
        setRecoError(e?.message ?? "추천 종목을 불러오지 못했습니다.");
        setRecoItems([]);
      } finally {
        setRecoLoading(false);
      }
    };

    runReco();
  }, [home?.recommendationVersion, !!home]);

  const tickers = useMemo(() => home?.tickers ?? [], [home]);
  const news = useMemo(() => home?.news ?? [], [home]);

  const recommendations: RecommendedItem[] = useMemo(
    () => recoItems ?? [],
    [recoItems]
  );

  const recoNextOffset = useMemo(
    () => home?.recommendations?.nextOffset ?? null,
    [home]
  );

  const recoStatus = home?.recommendationStatus;
  const recoBuilding = recoStatus === "BUILDING";

  const recoVersion = home?.recommendationVersion ?? null;

  const showRecoBuildingBanner =
    recoBuilding && !homeLoading && !recoLoading && recommendations.length === 0;

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
                  보유 종목, 손익, 자산 요약을 빠르게 확인할 수 있어요.
                </div>
              </div>

              <button
                onClick={() => navigate("/login")}
                className="shrink-0 rounded-2xl px-4 py-3 text-sm font-semibold bg-gray-900 text-white dark:bg-white dark:text-gray-900"
              >
                로그인
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    내 자산
                  </div>
                  <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {isMeLoading ? "불러오는 중..." : `${user?.nickname ?? "사용자"}님`}
                  </div>
                </div>

                <button
                  onClick={() => navigate("/portfolio")}
                  className="rounded-2xl px-4 py-2 text-sm font-semibold bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                >
                  자세히 보기
                </button>
              </div>

              {pfLoading && (
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  포트폴리오 요약 불러오는 중...
                </div>
              )}
              {!pfLoading && pfError && (
                <div className="text-sm text-rose-600 dark:text-rose-300">{pfError}</div>
              )}

              {!pfLoading && !pfError && pf && (
                <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-5">
                  {(() => {
                    const s = pf.summary;

                    const hasKrw = s.totalMarketValueKrw != null && s.totalPnlKrw != null;

                    const totalValue = hasKrw ? num(s.totalMarketValueKrw) : num(s.totalMarketValueUsd);
                    const totalPnl = hasKrw ? num(s.totalPnlKrw) : num(s.totalPnlUsd);
                    const returnPct = num(s.totalReturnPct);
                    const positionsCnt = pf.positions?.length ?? 0;

                    const up = totalPnl >= 0;
                    const pnlColor = up ? "text-rose-600 dark:text-rose-300" : "text-blue-600 dark:text-blue-300";
                    const unit = hasKrw ? "원" : "USD";

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            총 평가금액
                          </div>
                          <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                            {fmtNumber(totalValue, 0)} {unit}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            총 손익 · 수익률
                          </div>
                          <div className={`text-xl font-bold ${pnlColor}`}>
                            {totalPnl > 0 ? "+" : ""}
                            {fmtNumber(totalPnl, 0)} {unit}
                          </div>
                          <div className={`text-xs font-semibold ${pnlColor}`}>
                            {fmtSignedPercent(returnPct, 2)}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            보유 종목
                          </div>
                          <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                            {positionsCnt}개
                          </div>

                          {s.usdKrwRate && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              환율 {fmtNumber(num(s.usdKrwRate), 2)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {pf.warnings?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {pf.warnings.slice(0, 3).map((w, i) => (
                        <span
                          key={`${w.code}-${w.symbol ?? "all"}-${i}`}
                          className="inline-flex items-center rounded-full bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200 px-3 py-1 text-xs font-semibold"
                        >
                          {w.symbol ? `[${w.symbol}] ` : ""}
                          {w.code}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
                        변동: {fmtSigned(t.change)} ({fmtSignedPercent(t.changePercent)})
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

          {showRecoBuildingBanner && (
            <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-4">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                추천 종목을 생성 중입니다. 잠시 후 다시 확인해 주세요.
              </div>
            </div>
          )}

          {!homeLoading && !recoLoading && recoError && (
            <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-4">
              <div className="text-sm text-rose-600 dark:text-rose-300">
                {recoError}
              </div>
            </div>
          )}

          <div className="flex gap-3 overflow-x-auto pb-2">
            {homeLoading || recoLoading ? (
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