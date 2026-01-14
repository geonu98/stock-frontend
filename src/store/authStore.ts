import { create } from "zustand";
import { getMe, type UserProfileResponse } from "../api/user";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;

  // ✅ 추가: 로그인 유저 정보
  user: UserProfileResponse | null;
  isMeLoading: boolean;

  setTokens: (accessToken: string | null, refreshToken: string | null) => void;
  setAccessToken: (token: string | null) => void;
  setRefreshToken: (token: string | null) => void;

  // ✅ 추가: /api/user/me 호출해서 user 세팅
  fetchMe: () => Promise<void>;
  clearUser: () => void;

  logout: () => void;
}

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
  refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),

  user: null,
  isMeLoading: false,

  setTokens: (accessToken, refreshToken) => {
    if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    else localStorage.removeItem(ACCESS_TOKEN_KEY);

    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    else localStorage.removeItem(REFRESH_TOKEN_KEY);

    set({ accessToken, refreshToken });
  },

  setAccessToken: (token) => {
    if (token) localStorage.setItem(ACCESS_TOKEN_KEY, token);
    else localStorage.removeItem(ACCESS_TOKEN_KEY);

    set({ accessToken: token });
  },

  setRefreshToken: (token) => {
    if (token) localStorage.setItem(REFRESH_TOKEN_KEY, token);
    else localStorage.removeItem(REFRESH_TOKEN_KEY);

    set({ refreshToken: token });
  },

  fetchMe: async () => {
    const accessToken = get().accessToken;
    if (!accessToken) {
      set({ user: null, isMeLoading: false });
      return;
    }

    set({ isMeLoading: true });
    try {
      const me = await getMe();
      set({ user: me });
    } catch (e) {
      // 토큰이 만료/무효면 user는 비우기 (토큰까지 지울지는 정책)
      set({ user: null });
    } finally {
      set({ isMeLoading: false });
    }
  },

  clearUser: () => set({ user: null }),

  logout: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    set({ accessToken: null, refreshToken: null, user: null, isMeLoading: false });
  },
}));
