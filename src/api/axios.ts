import axios, { AxiosError } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../store/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// ✅ [중요] baseURL을 "서버 도메인(예: http://localhost:8080)"으로 두고,
// 실제 API는 "/api/..."로 호출한다는 전제에 맞춰 PUBLIC_AUTH_PATHS도 "/api/auth" 기준으로 정리
const PUBLIC_AUTH_PATHS = [
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/refresh",
  "/api/auth/oauth",
  "/api/auth/email",
  "/api/auth/resend-verification-email",
  "/auth/check-email",
  "/api/home",
];

const isPublicAuthRequest = (url?: string) =>
  !!url && PUBLIC_AUTH_PATHS.some((p) => url.startsWith(p));

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const url = config.url ?? "";

  if (!isPublicAuthRequest(url)) {
    const token = useAuthStore.getState().accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ refresh 동시성 락
let refreshPromise: Promise<{ accessToken: string; refreshToken?: string }> | null = null;

async function runRefreshOnce() {
  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken) throw new Error("No refreshToken");

  // ✅ [중요] 백엔드 매핑이 /api/auth/refresh 라면 여기 경로도 맞춰야 함
  const refreshRes = await api.post("/api/auth/refresh", { refreshToken });
  const { accessToken, refreshToken: newRT } = refreshRes.data as any;

  useAuthStore.getState().setTokens(accessToken, newRT ?? refreshToken);

  return { accessToken, refreshToken: newRT };
}

// ✅ ✅ ✅ [추가] 전역 로그인 모달을 "한 번만" 열기 위한 헬퍼
function openLoginModalOnce() {
  const st = useAuthStore.getState();

  // 이미 모달이 열려있으면 중복 오픈 방지
  // (401 연쇄로 여러 요청이 터질 수 있음)
  if ((st as any).loginModalOpen) return;

  const redirectTo = window.location.pathname + window.location.search;

  // authStore에 openLoginModal(redirectTo) 추가해둔 버전 기준
  if (typeof (st as any).openLoginModal === "function") {
    (st as any).openLoginModal(redirectTo);
  }
}

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const original: any = err.config;
    const is401 = err.response?.status === 401;

    const url = typeof original?.url === "string" ? (original.url as string) : "";

    // ✅ [중요] refresh 호출 여부도 /api/auth/refresh 로 맞춤
    const isRefreshCall = url.startsWith("/api/auth/refresh");
    const isPublicAuth = isPublicAuthRequest(url);

    // ✅ public/auth/refresh에서 401이면 절대 refresh 시도 X
    if (is401 && (isRefreshCall || isPublicAuth)) {
      return Promise.reject(err);
    }

    if (!is401) return Promise.reject(err);

    // ✅ 같은 요청을 무한 재시도 방지
    if (original?._retry) return Promise.reject(err);
    original._retry = true;

    try {
      // ✅ 이미 refresh 진행중이면 그 Promise를 기다렸다가 재시도
      if (!refreshPromise) {
        refreshPromise = runRefreshOnce().finally(() => {
          refreshPromise = null;
        });
      }

      const { accessToken } = await refreshPromise;

      // ✅ 새 AT로 원래 요청 재시도
      original.headers = original.headers ?? {};
      original.headers.Authorization = `Bearer ${accessToken}`;

      return api(original);
    } catch (e) {
      // ✅ ✅ ✅ [추가] refresh 실패/토큰 불일치/만료 시 UX 처리
      // - 토큰을 정리하고 (logout)
      // - 전역 로그인 모달을 띄워서 사용자가 선택하게 함
      useAuthStore.getState().logout();

      // ✅ 전역 모달 오픈 (중복 방지 포함)
      openLoginModalOnce();

      return Promise.reject(e);
    }
  }
);

export default api;
