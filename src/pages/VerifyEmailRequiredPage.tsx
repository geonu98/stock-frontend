import { useState } from "react";
import api from "../api/axios";

export default function VerifyEmailRequiredPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleResend = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      await api.post("/auth/verify-email/resend");
      setMessage("인증 메일을 다시 전송했습니다. 메일함을 확인해주세요.");
    } catch {
      setError("인증 메일 전송에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: "2rem" }}>
      <h1>이메일 인증이 필요합니다</h1>

      <p style={{ marginTop: "0.5rem" }}>
        아직 이메일 인증이 완료되지 않았습니다.
        <br />
        인증 메일을 확인한 뒤 다시 로그인해주세요.
      </p>

      <button
        onClick={handleResend}
        disabled={loading}
        style={{ marginTop: "1rem" }}
      >
        {loading ? "전송 중..." : "인증 메일 다시 보내기"}
      </button>

      {message && (
        <p style={{ marginTop: "0.5rem", color: "green" }}>{message}</p>
      )}
      {error && (
        <p style={{ marginTop: "0.5rem", color: "red" }}>{error}</p>
      )}
    </main>
  );
}
