import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { logout as logoutApi } from "../../api/auth";

function NavLink({
  to,
  label,
  onClick,
}: {
  to: string;
  label: string;
  onClick?: () => void;
}) {
  const { pathname } = useLocation();
  const active = pathname === to;

  return (
    <Link
      to={to}
      onClick={onClick}
      className={[
        "px-2 py-1.5 rounded-md text-sm font-semibold",
        active
          ? "text-gray-900 dark:text-white"
          : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white",
        "hover:bg-gray-100 dark:hover:bg-gray-800",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

export default function Header() {
  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");

  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const isMeLoading = useAuthStore((s) => s.isMeLoading);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const logoutStore = useAuthStore((s) => s.logout);

  // 로그인 여부는 토큰 존재가 아니라 user 검증 기준
  const isLoggedIn = !!user;

  const isKakaoUser = useMemo(() => {
    const p = (user?.provider ?? "").toLowerCase();
    return isLoggedIn && p === "kakao";
  }, [isLoggedIn, user]);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [darkMode]);

  const triedMeRef = useRef(false);

  useEffect(() => {
    // accessToken 자체가 없으면 시도 플래그 초기화
    if (!accessToken) {
      triedMeRef.current = false;
      return;
    }

    // 이미 시도했으면 중복 호출 방지
    if (triedMeRef.current) return;

    if (!user && !isMeLoading) {
      triedMeRef.current = true;
      fetchMe().catch(() => {
        // authStore.fetchMe 안에서 정리
      });
    }
  }, [accessToken, user, isMeLoading, fetchMe]);

  const handleLogout = async () => {
    try {
      await logoutApi();
    } finally {
      // 백엔드 logout 실패해도 프론트 상태는 무조건 정리
      logoutStore();
      setMobileOpen(false);
      navigate("/");
    }
  };

  const handleKakaoLogout = async () => {
    try {
      await logoutApi();
    } finally {
      logoutStore();
      setMobileOpen(false);
      window.location.href = "/api/auth/oauth/kakao/logout";
    }
  };

  const submitSearch = () => {
    const s = query.trim().toUpperCase();

    if (!s) {
      navigate("/market");
      setQuery("");
      setMobileOpen(false);
      return;
    }

    navigate(`/market?symbol=${encodeURIComponent(s)}`);
    setQuery("");
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-[999] border-b bg-white/90 backdrop-blur dark:bg-gray-950/80 dark:border-gray-800">
      <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className="font-semibold tracking-tight text-gray-900 dark:text-white"
          >
            Stock Dashboard
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/" label="홈" />
            <NavLink to="/market" label="마켓" />
            <NavLink to="/portfolio" label="포트폴리오" />
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <div className="h-9 w-[260px] rounded-full border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 flex items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitSearch();
              }}
              className="w-full bg-transparent outline-none text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
              placeholder="종목을 검색해보세요"
              inputMode="text"
              autoCapitalize="characters"
            />
          </div>

          {!isLoggedIn ? (
            <Link
              to="/login"
              className="h-9 px-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold grid place-items-center"
            >
              로그인
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLogout}
                className="h-9 px-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
              >
                로그아웃
              </button>

              {isKakaoUser && (
                <button
                  type="button"
                  onClick={handleKakaoLogout}
                  className="h-9 px-4 rounded-full border border-gray-200 hover:bg-gray-50 text-sm font-semibold
                             text-gray-700 dark:text-gray-200 dark:border-gray-800 dark:hover:bg-gray-900"
                  title="공용 PC라면 권장"
                >
                  카카오 로그아웃
                </button>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="md:hidden h-9 w-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 grid place-items-center"
          aria-label="메뉴 열기"
        >
          <span className="text-lg">{mobileOpen ? "✖" : "☰"}</span>
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-3 space-y-3">
          <div className="h-10 rounded-full border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 flex items-center gap-2">
            <span className="text-gray-400 select-none">🔍</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitSearch();
              }}
              className="w-full bg-transparent outline-none text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
              placeholder="종목을 검색해보세요"
              inputMode="text"
              autoCapitalize="characters"
            />
          </div>

          <div className="flex gap-1">
            <NavLink to="/" label="홈" onClick={() => setMobileOpen(false)} />
            <NavLink to="/market" label="마켓" onClick={() => setMobileOpen(false)} />
            <NavLink
              to="/portfolio"
              label="포트폴리오"
              onClick={() => setMobileOpen(false)}
            />
          </div>

          {!isLoggedIn ? (
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="w-full h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold grid place-items-center"
            >
              로그인
            </Link>
          ) : (
            <div className="space-y-2">
              <button
                onClick={handleLogout}
                className="w-full h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
              >
                로그아웃
              </button>

              {isKakaoUser && (
                <button
                  onClick={handleKakaoLogout}
                  className="w-full h-10 rounded-full border border-gray-200 hover:bg-gray-50 text-sm font-semibold
                             text-gray-700 dark:text-gray-200 dark:border-gray-800 dark:hover:bg-gray-900"
                >
                  카카오 로그아웃
                </button>
              )}
            </div>
          )}

          <button
            onClick={submitSearch}
            className="w-full h-10 rounded-full border border-gray-200 hover:bg-gray-50 text-sm font-semibold
                       dark:border-gray-800 dark:hover:bg-gray-900"
          >
            검색
          </button>
        </div>
      )}
    </header>
  );
}