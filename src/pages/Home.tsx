import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { fetchHome, type HomeResponse } from "../api/home";
import MiniSparkline from "../components/./market/MiniSparkline";


/**
 * ✅ 숫자 포맷 유틸
 * - 가격: 1,234.56 형태
 * - 퍼센트: +1.23 / -1.23 형태
 */
function fmtNumber(v: number, digits = 2) {
  return Number.isFinite(v) ? v.toLocaleString(undefined, { maximumFractionDigits: digits }) : "-";
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

/**
 * ✅ Finnhub datetime(초/밀리초) 섞여도 안전하게 "몇 시간 전" 표시
 */
function timeAgo(datetime: number) {
  if (!datetime) return "";
  const ms = datetime < 1e12 ? datetime * 1000 : datetime; // sec -> ms
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

  // =======================
  // ✅ 로그인 상태(기존 로직 유지)
  // =======================
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const isMeLoading = useAuthStore((s) => s.isMeLoading);
  const fetchMe = useAuthStore((s) => s.fetchMe);

  const isLoggedIn = !!accessToken;

  useEffect(() => {
    if (isLoggedIn && !user && !isMeLoading) fetchMe();
  }, [isLoggedIn, user, isMeLoading, fetchMe]);

  // =======================
  // ✅ 홈 데이터 상태
  // =======================
  const [home, setHome] = useState<HomeResponse | null>(null);
  const [homeLoading, setHomeLoading] = useState(false);
  const [homeError, setHomeError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setHomeLoading(true);
      setHomeError(null);
      try {
        const data = await fetchHome();
        // console.log("home data:", data); // ✅ 확인 끝났으면 지워도 됨
        setHome(data);
      } catch (e: any) {
        setHomeError(e?.message ?? "홈 데이터를 불러오지 못했습니다.");
      } finally {
        setHomeLoading(false);
      }
    };
    run();
  }, []);

  // =======================
  // ✅ 렌더링용 데이터 가공
  // - "오늘 많이 본 종목" 카드에 tickers 사용
  // - "주요 뉴스" 리스트에 news 사용
  // =======================
  const tickers = useMemo(() => home?.tickers ?? [], [home]);
  const news = useMemo(() => home?.news ?? [], [home]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto w-full max-w-5xl px-5 py-8 space-y-8">
        {/* =======================
            상단 헤더 (토스 느낌)
        ======================= */}
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

        {/* =======================
            ✅ 홈 데이터 로딩/에러 표시(간단 배너)
        ======================= */}
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

        {/* =======================
            로그인/자산 요약 카드
        ======================= */}
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

              {/* ✅ 포트폴리오 요약은 나중에 실제 API 붙일 자리 */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-4">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    총 자산
                  </div>
                  <div className="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100">
                    준비 중
                  </div>
                </div>
                <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-4">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    오늘 수익률
                  </div>
                  <div className="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100">
                    준비 중
                  </div>
                </div>
                <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-4">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    보유 종목
                  </div>
                  <div className="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100">
                    준비 중
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* =======================
            시장 요약 (가로 스크롤)
            - 여기 indices를 나중에 진짜로 채우면 교체
        ======================= */}
        <section className="space-y-3">
          <div className="flex items-end justify-between">
            <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
              시장 요약
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              실시간 반영 예정
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2">
            <div className="min-w-[220px] rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                코스피
              </div>
              <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
                2,650.12
              </div>
              <div className="mt-1 inline-flex rounded-full border px-2.5 py-1 text-sm font-semibold bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-900">
                +12.35 (0.55%)
              </div>
            </div>

            <div className="min-w-[220px] rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                코스닥
              </div>
              <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
                860.45
              </div>
              <div className="mt-1 inline-flex rounded-full border px-2.5 py-1 text-sm font-semibold bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-900">
                -4.21 (-0.32%)
              </div>
            </div>

            <div className="min-w-[220px] rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                달러/원 환율
              </div>
              <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
                1,345.20
              </div>
              <div className="mt-1 inline-flex rounded-full border px-2.5 py-1 text-sm font-semibold bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-900">
                +8.20
              </div>
            </div>
          </div>
        </section>

        {/* =======================
            ✅ 오늘 많이 본 종목 (home.tickers 연동)
        ======================= */}
        <section className="space-y-3">
          <div className="flex items-end justify-between">
            <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
              오늘 많이 본 종목
            </div>
            <button
              className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:underline"
              onClick={() => navigate("/market")}
            >
              더 보기
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {/* ✅ 로딩 중 스켈레톤(간단 버전) */}
            {homeLoading && (
              <>
                <div className="min-w-[260px] rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
                  <div className="mt-2 h-3 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
                  <div className="mt-6 h-3 w-40 bg-gray-200 dark:bg-gray-800 rounded" />
                </div>
                <div className="min-w-[260px] rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
                  <div className="mt-2 h-3 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
                  <div className="mt-6 h-3 w-40 bg-gray-200 dark:bg-gray-800 rounded" />
                </div>
              </>
            )}

            {/* ✅ 실제 데이터 렌더 */}
            {!homeLoading && tickers.length === 0 && (
              <div className="text-sm text-gray-500 dark:text-gray-400 px-1">
                표시할 종목이 없습니다.
              </div>
            )}

            {!homeLoading &&
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
    values={t.sparkline ?? []}
    width={150}
    height={46}
    className="shrink-0"
  />
</div>
                  </button>
                );
              })}
          </div>
        </section>

        {/* =======================
            ✅ 주요 뉴스 (home.news 연동)
        ======================= */}
        <section className="space-y-3 pb-10">
          <div className="flex items-end justify-between">
            <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
              주요 뉴스
            </div>
            <button className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:underline">
              더 보기
            </button>
          </div>

          <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {/* ✅ 로딩 상태 */}
              {homeLoading && (
                <>
                  <div className="px-5 py-4">
                    <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800 rounded" />
                    <div className="mt-2 h-3 w-1/3 bg-gray-200 dark:bg-gray-800 rounded" />
                  </div>
                  <div className="px-5 py-4">
                    <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-800 rounded" />
                    <div className="mt-2 h-3 w-1/4 bg-gray-200 dark:bg-gray-800 rounded" />
                  </div>
                </>
              )}

              {/* ✅ 데이터 없음 */}
              {!homeLoading && news.length === 0 && (
                <div className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                  표시할 뉴스가 없습니다.
                </div>
              )}

              {/* ✅ 실제 데이터 */}
              {!homeLoading &&
                news.map((n, idx) => (
                  <button
                    key={`${n.url}-${idx}`}
                    className="w-full text-left px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => {
                      // ✅ 외부 링크 열기
                      if (n.url) window.open(n.url, "_blank", "noopener,noreferrer");
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

                    {/* ✅ 요약이 있으면 1줄만 보여주기 */}
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
