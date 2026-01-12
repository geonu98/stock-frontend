import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { useAuthStore } from "../store/authStore";
import { getDeviceInfo } from "../utils/device";

export default function EmailRequiredPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const provider = searchParams.get("provider") ?? "kakao";
  const providerId = searchParams.get("providerId");

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const setTokens = useAuthStore((s) => s.setTokens);

const submit = async (e: React.FormEvent) => {
  e.preventDefault();
  setMsg(null);

  if (!providerId) {
    setMsg("providerId가 없습니다. 소셜 로그인을 다시 시도해주세요.");
    return;
  }

  const body = {
    connectEmailRequest: {
      provider,
      providerId,
      email,
    },
    deviceInfo: getDeviceInfo(),
  };

  console.log("email =", email);
  console.log("connect-email body =", body);

  setLoading(true);
  try {
    await api.post("/auth/oauth/connect-email", body);

    // ✅ connect-email은 토큰 발급 단계가 아님 → setTokens / navigate 하면 안됨
    setMsg("인증 메일을 보냈습니다. 메일함에서 인증 링크를 클릭해주세요.");

    // (선택) 입력 잠ह: 성공 후 입력/버튼 비활성화하고 싶으면 아래 주석 해제
    // setEmail("");
  } catch (err: any) {
    setMsg(
      err?.response?.data?.message ??
        "이메일 연결에 실패했습니다. 다시 시도해주세요."
    );
  } finally {
    setLoading(false);
  }
};
  return (
    <main style={{ padding: "2rem" }}>
      <h1>이메일이 필요합니다</h1>
      <p style={{ marginTop: "0.5rem" }}>
        소셜 계정에서 이메일 정보를 제공하지 않았습니다.
        <br />
        사용할 이메일을 입력해주세요.
      </p>
       
      <form onSubmit={submit} style={{ marginTop: "1rem" }}>
        <input
          type="email"
          placeholder="example@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: "8px", minWidth: "280px" }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{ marginLeft: "8px", padding: "8px 12px" }}
        >
          {loading ? "처리 중..." : "이메일 연결"}
        </button>
      </form>

    {msg && (
  <p style={{ marginTop: "0.5rem", color: msg.includes("보냈") ? "green" : "red" }}>
    {msg}
  </p>
)}
    </main>
  );
}
