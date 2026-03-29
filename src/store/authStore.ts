import { create } from "zustand";
import { getMe, type UserProfileResponse } from "../api/user";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;

  user: UserProfileResponse | null;
  isMeLoading: boolean;

  loginModalOpen: boolean;
  loginRedirectTo: string | null;

  setTokens: (accessToken: string | null, refreshToken: string | null) => void;
  setAccessToken: (token: string | null) => void;
  setRefreshToken: (token: string | null) => void;

  fetchMe: () => Promise<void>;
  clearUser: () => void;

  openLoginModal: (redirectTo?: string | null) => void;
  closeLoginModal: () => void;

  logout: () => void;
}

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
  refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),

  user: null,
  isMeLoading: false,

  loginModalOpen: false,
  loginRedirectTo: null,

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
      get().logout();
      return;
    }

    set({ isMeLoading: true });

    try {
      const me = await getMe();
      set({ user: me });
    } catch {
      // 프로덕션에서 401 / refresh 꼬임 / 인증 불일치가 나면
      // 토큰을 남겨두지 말고 auth 전체를 정리
      get().logout();
    } finally {
      set({ isMeLoading: false });
    }
  },

  clearUser: () => set({ user: null }),

  openLoginModal: (redirectTo) => {
    set({
      loginModalOpen: true,
      loginRedirectTo: redirectTo ?? null,
    });
  },

  closeLoginModal: () =>
    set({
      loginModalOpen: false,
      loginRedirectTo: null,
    }),

  logout: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);

    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      isMeLoading: false,
      loginModalOpen: false,
      loginRedirectTo: null,
    });
  },
}));