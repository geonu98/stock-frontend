import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { logout as logoutApi } from "../../api/auth";

/*
  공통 네비게이션 링크 컴포넌트
  - 현재 pathname과 to가 같으면 active 스타일 적용
  - 모바일 메뉴에서도 동일하게 재사용
*/
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
        "px-2 py-1 rounded-md text-sm",
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

  /*
    UI 상태
    - darkMode: 다크모드 on/off
    - mobileOpen: 모바일 메뉴 열림/닫힘
  */
  const [darkMode, setDarkMode] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  /*
    인증 상태
    - accessToken 존재 여부로 로그인 상태 판단
    - user, fetchMe는 /api/user/me 기반으로 유저 정보(닉네임 등) 확보
  */
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const isMeLoading = useAuthStore((s) => s.isMeLoading);
  const fetchMe = useAuthStore((s) => s.fetchMe);

  const isLoggedIn = !!accessToken;

  /*
    다크모드 적용
    - Tailwind dark 모드 class 방식 사용
    - documentElement에 "dark" 클래스를 토글
  */
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [darkMode]);

  /*
    새로고침 대응
    - 로컬스토리지에 토큰은 남아있지만 user 상태는 메모리에 없을 수 있음
    - 토큰이 있고 user가 없으면 fetchMe() 호출해서 닉네임 등을 로드
  */
  useEffect(() => {
    if (isLoggedIn && !user && !isMeLoading) fetchMe();
  }, [isLoggedIn, user, isMeLoading, fetchMe]);

  /*
    표시용 닉네임
    - 로그인 상태에서만 의미 있음
    - me 로딩 중이면 "로딩..."
  */
  const nickname = useMemo(() => {
    if (!isLoggedIn) return "";
    if (isMeLoading) return "로딩...";
    return user?.nickname ?? "사용자";
  }, [isLoggedIn, isMeLoading, user]);

  /*
    initial은 현재 데스크탑 아바타에 사용 중
    - 닉네임/이메일의 첫 글자를 쓰는 방식
    - 만약 "로" 같은 첫 글자 표시가 싫으면 아래 UI에서 {initial} 대신 👤로 바꾸면 됨
  */
  const initial = useMemo(() => {
    const s = (user?.nickname ?? user?.email ?? "U").trim();
    return s ? s[0].toUpperCase() : "U";
  }, [user]);

  /*
    로그아웃 처리
    - 백엔드 logout 호출
    - 이후 홈으로 이동
    - 모바일 메뉴는 닫아줌
  */
  const handleLogout = async () => {
    try {
      await logoutApi();
    } finally {
      setMobileOpen(false);
      navigate("/");
    }
  };

  return (
    <header className="sticky top-0 z-[999] border-b bg-white/90 backdrop-blur dark:bg-gray-950/80 dark:border-gray-800">
      <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between">
        {/* 로고 영역 */}
        <Link
          to="/"
          onClick={() => setMobileOpen(false)}
          className="font-semibold tracking-tight text-gray-900 dark:text-white"
        >
          Stock Dashboard
        </Link>

        {/* 데스크탑 네비게이션 */}
        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/" label="Home" />
          <NavLink to="/market" label="Market" />
          <NavLink to="/portfolio" label="Portfolio" />
        </nav>

        {/* 데스크탑 우측 영역: 테마 토글 + 인증 영역 */}
        <div className="hidden md:flex items-center gap-2">
          {/* 테마 토글 버튼 */}
          <button
            type="button"
            onClick={() => setDarkMode((v) => !v)}
            className="h-9 w-9 grid place-items-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
            aria-label="Toggle theme"
            title={darkMode ? "Dark" : "Light"}
          >
            <span className="text-sm">{darkMode ? "🌙" : "☀️"}</span>
          </button>

          {/* 비로그인 상태 */}
          {!isLoggedIn ? (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-sm px-3 py-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="text-sm px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Sign up
              </Link>
            </div>
          ) : (
            /* 로그인 상태 */
            <div className="flex items-center gap-2">
              {/* 닉네임 표시: 너무 길면 ... 처리 */}
              <span
                className="max-w-[180px] truncate text-sm text-gray-700 dark:text-gray-200"
                title={nickname}
              >
                {nickname}
              </span>

              {/* 아바타 영역: initial(첫 글자) 표시 */}
              <span className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800
                 grid place-items-center text-xs font-medium
                 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
  {initial}
</span>

              {/* 로그아웃 버튼 */}
              <button
                type="button"
                onClick={handleLogout}
                className="text-sm px-3 py-2 rounded-full border border-gray-200 hover:bg-gray-50 text-gray-800
                           dark:border-gray-800 dark:hover:bg-gray-900 dark:text-gray-100"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        {/* 모바일 햄버거 버튼 */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="md:hidden h-9 w-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 grid place-items-center"
          aria-label="Open menu"
        >
          <span className="text-lg">{mobileOpen ? "✖" : "☰"}</span>
        </button>
      </div>

      {/* 모바일 메뉴 영역 */}
      {mobileOpen && (
        <div className="md:hidden border-t dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-3">
          <div className="flex items-center justify-between">
            {/* 모바일 네비게이션 */}
            <div className="flex gap-1">
              <NavLink to="/" label="Home" onClick={() => setMobileOpen(false)} />
              <NavLink to="/market" label="Market" onClick={() => setMobileOpen(false)} />
              <NavLink to="/portfolio" label="Portfolio" onClick={() => setMobileOpen(false)} />
            </div>

            {/* 모바일 테마 토글 */}
            <button
              type="button"
              onClick={() => setDarkMode((v) => !v)}
              className="h-9 w-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 grid place-items-center"
              aria-label="Toggle theme"
            >
              <span className="text-sm">{darkMode ? "🌙" : "☀️"}</span>
            </button>
          </div>

          <div className="mt-3">
            {/* 비로그인 상태 */}
            {!isLoggedIn ? (
              <div className="flex gap-2 w-full">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center text-sm px-3 py-2 rounded-full border dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center text-sm px-3 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Sign up
                </Link>
              </div>
            ) : (
              /* 로그인 상태 */
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  {/* 모바일 아바타는 아이콘 방식 */}
                  <span className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 grid place-items-center text-sm font-semibold">
                    👤
                  </span>

                  {/* 닉네임 표시 */}
                  <span className="min-w-0 truncate text-sm text-gray-700 dark:text-gray-200">
                    {nickname}
                  </span>
                </div>

                {/* 모바일 로그아웃 */}
                <button
                  onClick={handleLogout}
                  className="text-sm px-3 py-2 rounded-full border dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 text-red-600 dark:text-red-400"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
