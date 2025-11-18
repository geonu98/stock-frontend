import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function Header() {
  const [darkMode, setDarkMode] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // 다크모드 적용
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <header className="border-b bg-white dark:bg-gray-900 dark:text-white">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-4 py-4">
        
        {/* Left: Logo */}
        <Link to="/" className="text-xl font-bold">
          Stock Dashboard
        </Link>

        {/* Center: Nav (Desktop) */}
        <nav className="hidden md:flex gap-8 text-gray-600 dark:text-gray-300">
          <Link to="/" className="hover:text-black dark:hover:text-white">
            Home
          </Link>
          <Link to="/market" className="hover:text-black dark:hover:text-white">
            Market
          </Link>
          <Link
            to="/portfolio"
            className="hover:text-black dark:hover:text-white"
          >
            Portfolio
          </Link>
        </nav>

        {/* Right: Dark Mode + Login (Desktop) */}
        <div className="hidden md:flex items-center gap-4">
          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="px-3 py-1 rounded border dark:border-gray-600"
          >
            {darkMode ? "🌙 Dark" : "☀️ Light"}
          </button>

          {/* 로그인 버튼 (미로그인 상태) */}
          <Link
            to="/login"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
          >
            Login
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-2xl"
        >
          {mobileOpen ? "✖" : "☰"}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 px-4 py-4 border-t">
          <nav className="flex flex-col gap-4 text-gray-700 dark:text-gray-300">
            <Link to="/" onClick={() => setMobileOpen(false)}>Home</Link>
            <Link to="/market" onClick={() => setMobileOpen(false)}>Market</Link>
            <Link to="/portfolio" onClick={() => setMobileOpen(false)}>Portfolio</Link>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="text-left"
            >
              {darkMode ? "🌙 Dark Mode" : "☀️ Light Mode"}
            </button>

            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="bg-blue-500 text-center text-white px-4 py-2 rounded-md"
            >
              Login
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
