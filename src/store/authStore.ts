import { create } from "zustand";

interface AuthState {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  logout: () => void;
}

const ACCESS_TOKEN_KEY = "accessToken";

export const useAuthStore = create<AuthState>((set) => ({
  // 새로고침해도 토큰 유지
  accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),

  // Access Token 저장
  setAccessToken: (token) => {
    if (token) {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    }
    set({ accessToken: token });
  },

  // 로그아웃 처리
  logout: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    set({ accessToken: null });
    // 필요 시: window.location.href = "/login";
  },
}));
