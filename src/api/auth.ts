import api from "./axios";
import { useAuthStore } from "../store/authStore";
import { getDeviceInfo } from "../utils/device";

/**
 * 일반 로그인 API
 * - deviceInfo를 호출부에서 받지 않고
 * - 이 함수 내부에서 자동으로 생성/주입
 */
export async function login(email: string, password: string) {
  const res = await api.post("/auth/login", {
    email,
    password,
    deviceInfo: getDeviceInfo(), // ✅ 여기서 자동으로 deviceId + deviceType 생성
  });

  const { accessToken, refreshToken } = res.data as any;

  // AccessToken + RefreshToken 저장
  useAuthStore.getState().setTokens(accessToken, refreshToken);

  return res.data;
}

/**
 * 로그아웃 API
 * - 서버 로그아웃 요청 후
 * - 클라이언트 토큰 정리
 */
export async function logout() {
  try {
    await api.post("/auth/logout");
  } finally {
    useAuthStore.getState().logout();
  }
}
