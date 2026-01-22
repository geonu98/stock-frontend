import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { getDeviceInfo } from "../utils/device";

export default function EmailRequiredPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const provider = searchParams.get("provider") ?? "kakao";
  const providerId = searchParams.get("providerId");

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // 메시지 + 타입(성공/에러)
  const [msg, setMsg] = useState<string | null>(null);
  const [msgType, setMsgType] = useState<"success" | "error" | null>(null);

  // 성공 후 입력/버튼 잠금(재전송 UX는 나중에 붙여도 됨)
  const [sent, setSent] = useState(false);

  const disabled = useMemo(() => {
    if (loading) return true;
    if (!providerId) return true;
    if (sent) return true;
    return email.trim().length === 0;
  }, [loading, providerId, sent, email]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setMsgType(null);

    if (!providerId) {
      setMsg("소셜 정보(providerId)가 없습니다. 소셜 로그인을 다시 시도해주세요.");
      setMsgType("error");
      return;
    }

    const body = {
      connectEmailRequest: {
        provider,
        providerId,
        email: email.trim(),
      },
      deviceInfo: getDeviceInfo(),
    };

    setLoading(true);
    try {
      await api.post("/auth/oauth/connect-email", body);

      // connect-email은 토큰 발급 단계가 아님 → navigate/setTokens 하지 않음
      setSent(true);
      setMsg("인증 메일을 보냈습니다. 메일함에서 인증 링크를 클릭해주세요.");
      setMsgType("success");
    } catch (err: any) {
      setMsg(
        err?.response?.data?.message ??
          "이메일 연결에 실패했습니다. 잠시 후 다시 시도해주세요."
      );
      setMsgType("error");
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    page: {
      minHeight: "100vh",
      background: "#F5F6F8",
      display: "flex",
      justifyContent: "center",
      padding: "28px 16px",
      boxSizing: "border-box" as const,
    },
    container: {
      width: "100%",
      maxWidth: 420,
    },
    card: {
      background: "#FFFFFF",
      borderRadius: 18,
      boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
      padding: "22px 20px",
      border: "1px solid rgba(0,0,0,0.04)",
    },
    title: {
      fontSize: 22,
      fontWeight: 800,
      letterSpacing: "-0.3px",
      margin: 0,
    },
    desc: {
      marginTop: 10,
      marginBottom: 0,
      fontSize: 14,
      lineHeight: 1.6,
      color: "rgba(0,0,0,0.65)",
    },
    divider: {
      height: 1,
      background: "rgba(0,0,0,0.06)",
      margin: "18px 0",
    },
    label: {
      fontSize: 13,
      fontWeight: 700,
      color: "rgba(0,0,0,0.72)",
      marginBottom: 8,
      display: "block",
    },
    input: {
      width: "100%",
      height: 48,
      borderRadius: 12,
      border: "1px solid rgba(0,0,0,0.12)",
      padding: "0 14px",
      fontSize: 15,
      outline: "none",
      boxSizing: "border-box" as const,
      background: sent ? "rgba(0,0,0,0.04)" : "#fff",
      color: sent ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.9)",
    },
    hint: {
      marginTop: 10,
      fontSize: 12,
      color: "rgba(0,0,0,0.55)",
      lineHeight: 1.5,
    },
    button: {
      width: "100%",
      height: 48,
      borderRadius: 12,
      border: "none",
      marginTop: 14,
      fontSize: 15,
      fontWeight: 800,
      letterSpacing: "-0.2px",
      cursor: disabled ? "default" : "pointer",
      background: disabled ? "rgba(0,0,0,0.12)" : "#1B64F3",
      color: disabled ? "rgba(0,0,0,0.35)" : "#FFFFFF",
    },
    message: {
      marginTop: 14,
      borderRadius: 12,
      padding: "12px 12px",
      fontSize: 13,
      lineHeight: 1.5,
      border: "1px solid rgba(0,0,0,0.06)",
      background:
        msgType === "success"
          ? "rgba(0, 168, 107, 0.08)"
          : msgType === "error"
          ? "rgba(255, 59, 48, 0.08)"
          : "transparent",
      color:
        msgType === "success"
          ? "#006C46"
          : msgType === "error"
          ? "#B42318"
          : "rgba(0,0,0,0.7)",
    },
    subtleRow: {
      marginTop: 14,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
    },
    subtleBtn: {
      background: "transparent",
      border: "none",
      padding: 0,
      fontSize: 13,
      fontWeight: 700,
      color: "rgba(0,0,0,0.55)",
      cursor: "pointer",
      textDecoration: "underline",
      textUnderlineOffset: 3,
    },
    smallInfo: {
      fontSize: 12,
      color: "rgba(0,0,0,0.5)",
      whiteSpace: "nowrap" as const,
      overflow: "hidden",
      textOverflow: "ellipsis" as const,
      maxWidth: 180,
    },
    badge: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "6px 10px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 700,
      background: "rgba(27, 100, 243, 0.10)",
      color: "#1B64F3",
    },
  };

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.badge}>추가 정보 필요</div>

          <h1 style={styles.title}>이메일이 필요합니다</h1>
          <p style={styles.desc}>
            소셜 계정에서 이메일 정보를 제공하지 않았습니다.
            <br />
            사용할 이메일을 입력하면 인증 메일을 보내드릴게요.
          </p>

          <div style={styles.divider} />

          <form onSubmit={submit}>
            <label style={styles.label}>이메일</label>
            <input
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
              disabled={loading || sent}
              autoFocus
            />

            <div style={styles.hint}>
              인증 링크를 클릭하면 이메일 연결이 완료됩니다.
              <br />
              메일이 안 오면 스팸함도 확인해주세요.
            </div>

            <button type="submit" disabled={disabled} style={styles.button}>
              {loading ? "보내는 중..." : sent ? "전송 완료" : "인증 메일 보내기"}
            </button>
          </form>

          {msg && <div style={styles.message}>{msg}</div>}

          <div style={styles.subtleRow}>
            <button
              type="button"
              style={styles.subtleBtn}
              onClick={() => navigate("/login")}
              disabled={loading}
            >
              로그인 화면으로 돌아가기
            </button>

            <div style={styles.smallInfo} title={`provider=${provider}, providerId=${providerId ?? ""}`}>
              {providerId ? `provider: ${provider}` : "소셜 정보를 확인 중"}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
