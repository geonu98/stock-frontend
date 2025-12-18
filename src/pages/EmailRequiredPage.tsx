import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuthStore } from "../store/authStore";

export default function EmailRequiredPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const provider = searchParams.get("provider") ?? "kakao";
  const providerId = searchParams.get("providerId");

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const setAccessToken = useAuthStore((s) => s.setAccessToken);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (!providerId) {
      setMsg("providerId가 없습니다. 소셜 로그인을 다시 시도해주세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/oauth/connect-email", {
        provider,
        providerId,
        email,
      });

      // ✅ 백엔드가 token 문자열 그대로 반환하는 구조
      const token = res.data as string;

      setAccessToken(token);
      navigate("/verify-email-required");
    } catch {
      setMsg("이메일 연결에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: "2rem" }}>
      <h1>이메일이 필요합니다</h1>
      <p style={{ marginTop: "0.5rem" }}>
        해당 계정에서 이메일 정보를 제공하지 않았습니다.
        <br />
        이메일을 입력해주세요.
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

      {msg && <p style={{ marginTop: "0.5rem", color: "red" }}>{msg}</p>}
    </main>
  );
}
