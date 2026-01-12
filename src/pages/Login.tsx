import { useState } from "react";
import { login } from "../api/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  /**
   * ✅ 일반 로그인
   * - deviceInfo는 auth.ts(login 함수) 내부에서 자동으로 생성/주입됨
   * - 그래서 여기서는 email/password만 넘기면 됨
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

 /**
 * ✅ 카카오 로그인 시작 (A 방식)
 * - 프론트에서 카카오 authorize URL로 직접 이동
 * - redirect_uri: /oauth/callback?provider=kakao
 * - code는 프론트 콜백에서 받아 백엔드로 POST
 */
const handleKakaoLogin = () => {
  const clientId = import.meta.env.VITE_KAKAO_REST_API_KEY;
  const frontendBase = import.meta.env.VITE_FRONTEND_BASE_URL;

  // ✅ 카카오 콘솔에 등록한 redirect_uri와 "완전 동일"하게
  const redirectUri = `${frontendBase}/oauth/callback`;

  // ✅ provider는 state로 전달 (OAuth 표준)
  const state = "kakao";

  window.location.href =
    `https://kauth.kakao.com/oauth/authorize` +
    `?response_type=code` +
    `&client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${encodeURIComponent(state)}`;
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">로그인</h2>

        {/* form에 onSubmit 연결 */}
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
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700"
          >
            로그인
          </button>
        </form>

        {/* ✅ 소셜 로그인 */}
        <div className="mt-6">
          <button
            type="button"
            onClick={handleKakaoLogin}
            className="w-full py-2 rounded-md bg-yellow-400 text-black font-semibold hover:bg-yellow-500"
          >
            카카오로 로그인
          </button>
        </div>
      </div>
    </div>
  );
}
