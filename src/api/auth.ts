import api from "./axios";
import { useAuthStore } from "../store/authStore";
import { getDeviceInfo } from "../utils/device";

export type SignUpRequest = {
  email: string;
  password: string;
  name: string;
  age?: number | null;
  phoneNumber?: string | null;
};

/**
 *  회원가입 API
 * - 서버는 "가입 완료"가 아니라 "인증 메일 발송"까지 수행
 * - 응답은 보통 string 메시지 ("이메일 인증 메일을 확인해주세요")
 */
export async function signup(payload: SignUpRequest) {
  const res = await api.post("/auth/signup", payload);
  return res.data;
}

/**
 *  이메일 중복 체크 API
 * - POST /api/auth/check-email
 * - body: { email: string }
 * - res: { available: boolean }
 */
export async function checkEmail(email: string) {
  const res = await api.post("/auth/check-email", { email });
  return res.data as { available: boolean };
}

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
  //닉네임등 유저정보 
  await useAuthStore.getState().fetchMe();

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
