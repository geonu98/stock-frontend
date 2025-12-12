import axios, { AxiosError } from "axios";
import { useAuthStore } from "../store/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

// 요청 인터셉터: Access Token 자동 추가
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 응답 인터셉터: 401 → Refresh Token으로 Access Token 재발급
api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const original: any = err.config;

    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        const refresh = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = (refresh.data as any).accessToken;
        useAuthStore.getState().setAccessToken(newToken);

        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        useAuthStore.getState().logout();
      }
    }

    return Promise.reject(err);
  }
);

export default api;
