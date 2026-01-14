import api from "./axios";

export type UserProfileResponse = {
  id: number;
  email: string;
  nickname: string;
  name?: string | null;
  // 네 백엔드 UserProfileResponse 필드에 맞춰 필요하면 추가
};

export async function getMe() {
  const res = await api.get("/user/me"); // baseURL이 /api니까 => /api/user/me
  return res.data as UserProfileResponse;
}
