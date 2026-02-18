import { useState } from "react";
import { login } from "../api/auth";
import { Link, useNavigate, useLocation } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /**
   * ✅ 일반 로그인
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setErrorMsg(null);

    try {
      await login(email, password);
   // ✅ 로그인 성공 후 원래 페이지로 복귀
const from = location.state?.from || "/";
navigate(from, { replace: true });
    } catch (err: any) {
      console.error("login failed:", err);
      // 백엔드가 message를 주면 그걸 표시, 아니면 기본값
      const msg =
        err?.response?.data?.message ??
        (typeof err?.response?.data === "string" ? err.response.data : null) ??
        "로그인 실패";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * ✅ 카카오 로그인
   */
  const handleKakaoLogin = () => {
    const clientId = import.meta.env.VITE_KAKAO_REST_API_KEY;
    const frontendBase = import.meta.env.VITE_FRONTEND_BASE_URL;

    const redirectUri = `${frontendBase}/oauth/callback`;
    const state = "kakao";

    window.location.href =
      `https://kauth.kakao.com/oauth/authorize` +
      `?response_type=code` +
      `&client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${encodeURIComponent(state)}`;
  };

  /**
   * ✅ 구글 로그인
   */
  const handleGoogleLogin = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const frontendBase = import.meta.env.VITE_FRONTEND_BASE_URL;

    const redirectUri = `${frontendBase}/oauth/callback`;
    const state = "google";
    const scope = encodeURIComponent("openid email profile");

    window.location.href =
      `https://accounts.google.com/o/oauth2/v2/auth` +
      `?response_type=code` +
      `&client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${scope}` +
      `&state=${encodeURIComponent(state)}` +
      `&access_type=offline` +
      `&prompt=consent`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">로그인</h2>

        {/* 에러 메시지 */}
        {errorMsg && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
            {errorMsg}
          </div>
        )}

        {/* 일반 로그인 */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block mb-1 text-sm">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-md px-3 py-2 focus:ring focus:ring-blue-200 outline-none"
              placeholder="example@gmail.com"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block mb-1 text-sm">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-md px-3 py-2 focus:ring focus:ring-blue-200 outline-none"
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        {/* 소셜 로그인 */}
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={handleKakaoLogin}
            className="w-full py-2 rounded-md bg-yellow-400 text-black font-semibold hover:bg-yellow-500"
          >
            카카오로 로그인
          </button>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full py-2 rounded-md bg-white border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100"
          >
            Google로 로그인
          </button>
        </div>

        <div className="mt-4 text-center text-sm">
          아직 계정이 없으신가요?{" "}
          <Link to="/signup" className="text-blue-600 hover:underline font-medium">
            회원가입
          </Link>
        </div>

        <div className="mt-4 text-center text-sm">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-gray-500 hover:underline"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
