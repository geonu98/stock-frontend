import axios, { AxiosError } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../store/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

/**
 * ✅ 로그인/리프레시/소셜콜백/이메일인증 등 "인증 이전" 구간 요청들
 * - Authorization 헤더를 붙이면 안 됨
 * - 401이 나도 refresh 로직을 타면 안 됨
 */
const PUBLIC_AUTH_PATHS = [
  "/auth/login",
  "/auth/signup",
  "/auth/refresh",
  "/auth/oauth",
  "/auth/email", // EmailVerificationController: /api/auth/email/verify, /api/auth/email/exchange (인증 이전 플로우)
  "/auth/resend-verification-email",
  "/home",
];

const isPublicAuthRequest = (url?: string) => {
  if (!url) return false;
  return PUBLIC_AUTH_PATHS.some((p) => url.startsWith(p));
};
// 요청 인터셉터
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const url = config.url ?? "";

  // ✅ /auth/** 요청에는 Authorization을 붙이지 않는다.
  if (!isPublicAuthRequest(url)) {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const original: any = err.config;

    const is401 = err.response?.status === 401;

    const url =
      typeof original?.url === "string" ? (original.url as string) : "";

    const isRefreshCall = url.startsWith("/auth/refresh");
    const isPublicAuth = isPublicAuthRequest(url);

    // ✅ auth 관련(public) 요청에서 401이면 refresh 시도하지 말고 그대로 실패 처리
    if (is401 && (isRefreshCall || isPublicAuth)) {
      return Promise.reject(err);
    }

    if (is401 && !original?._retry) {
      original._retry = true;

      try {
        const { refreshToken } = useAuthStore.getState();
        if (!refreshToken) throw new Error("No refreshToken");

        // ✅ refresh 요청 자체도 /auth/** 이므로 Authorization 없이 나감
        const refreshRes = await api.post("/auth/refresh", { refreshToken });

        const { accessToken, refreshToken: newRT } = refreshRes.data as any;

        useAuthStore
          .getState()
          .setTokens(accessToken, newRT ?? refreshToken);

        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        useAuthStore.getState().logout();
      }
    }

    return Promise.reject(err);
  }
);

export default api;
