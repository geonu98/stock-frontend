import api from "./axios";

export type UserProfileResponse = {
  id: number;
  email: string;
  nickname: string;
  name?: string | null;
  provider?: string;
};

export async function getMe() {
  const res = await api.get("/user/me"); // baseURL이 /api니까 => /api/user/me
  return res.data as UserProfileResponse;
}
