import { create } from "zustand";
import { getMe, type UserProfileResponse } from "../api/user";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;

  //  로그인 유저 정보
  user: UserProfileResponse | null;
  isMeLoading: boolean;

  //   전역 로그인 모달 상태
  loginModalOpen: boolean;

  //  로그인 후 돌아갈 경로 저장용
  //  Market에서 navigate("/login", { state: { from: ... } }) 하던 걸
  //   전역 모달/전역 처리로 옮기기 위해 store에 보관
  loginRedirectTo: string | null;

  setTokens: (accessToken: string | null, refreshToken: string | null) => void;
  setAccessToken: (token: string | null) => void;
  setRefreshToken: (token: string | null) => void;

  // ✅ 추가: /api/user/me 호출해서 user 세팅
  fetchMe: () => Promise<void>;
  clearUser: () => void;

  // ✅ ✅ ✅ [추가] 전역 로그인 모달 제어
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

  // ✅ ✅ ✅ [추가] 기본값
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
      set({ user: null, isMeLoading: false });
      return;
    }

    set({ isMeLoading: true });
    try {
      const me = await getMe();
      set({ user: me });
    } catch (e) {
      // 토큰이 만료/무효면 user는 비우기 (토큰까지 지울지는 정책)
      //   여기서도 만료면 모달을 열지 여부는 "정책"인데,
      // 보통은 인터셉터(401)에서만 모달을 열고, fetchMe 실패는 조용히 처리해도 됨.
      set({ user: null });
    } finally {
      set({ isMeLoading: false });
    }
  },

  clearUser: () => set({ user: null }),

  //   전역 로그인 모달 열기
 openLoginModal: (redirectTo) => {
  set({
    loginModalOpen: true,
    loginRedirectTo: redirectTo ?? null, // 항상 최신 값으로 덮어쓰기
  });
},

  //  전역 로그인 모달 닫기
 closeLoginModal: () =>
  set({
    loginModalOpen: false,
    loginRedirectTo: null, // 닫을 때 초기화
  }),
  logout: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);

    //  로그아웃 시 모달/리다이렉트도 초기화
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
