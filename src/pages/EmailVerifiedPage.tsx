import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuthStore } from "../store/authStore"; 

type DeviceInfo = {
  deviceId: string;
  deviceType: "WEB";
};

function getOrCreateDeviceInfo(): DeviceInfo {
  const KEY = "deviceInfo";
  const raw = localStorage.getItem(KEY);

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.deviceId && parsed?.deviceType) return parsed as DeviceInfo;
    } catch {}
  }

  const deviceInfo: DeviceInfo = {
    deviceId: crypto.randomUUID(),
    deviceType: "WEB",
  };
  localStorage.setItem(KEY, JSON.stringify(deviceInfo));
  return deviceInfo;
}

export default function EmailVerifiedPage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = useMemo(() => new URLSearchParams(search), [search]);

  const code = params.get("code");

  const setTokens = useAuthStore((s) => s.setTokens);
  const logout = useAuthStore((s) => s.logout);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string>("이메일 인증을 확인하고 있습니다...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!code) {
        setLoading(false);
        setError("인증 코드가 없습니다. 이메일 링크가 올바른지 확인해주세요.");
        setMessage("");
        return;
      }

      try {
        const deviceInfo = getOrCreateDeviceInfo();

        const res = await api.post("/auth/email/exchange", {
          code,
          deviceInfo,
        });

        const { accessToken, refreshToken } = res.data as {
          accessToken: string;
          refreshToken: string;
        };

        if (!accessToken || !refreshToken) {
          throw new Error("Invalid token response");
        }

        setTokens(accessToken, refreshToken);
        setMessage("로그인 완료! 이동 중입니다...");
        navigate("/", { replace: true });
      } catch (e: any) {
        // 여기서 굳이 refresh/인터셉터 개입 없음 (/auth/** 공용)
        logout?.();

        const status = e?.response?.status;
        if (status === 410) {
          setError("인증 코드가 만료되었습니다. 다시 이메일 인증을 진행해주세요.");
        } else if (status === 400) {
          setError("유효하지 않은 인증 코드입니다. 이메일 링크가 올바른지 확인해주세요.");
        } else if (status === 409) {
          setError("이미 사용된 코드이거나 중복 요청입니다. 다시 시도해주세요.");
        } else {
          setError("로그인 처리에 실패했습니다. 잠시 후 다시 시도해주세요.");
        }
        setMessage("");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [code, navigate, setTokens, logout]);

  return (
    <main style={{ padding: "2rem" }}>
      <h1>이메일 인증 완료</h1>

      {message && <p style={{ marginTop: "0.75rem" }}>{message}</p>}

      {error && (
        <>
          <p style={{ marginTop: "0.75rem", color: "red" }}>{error}</p>

          <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
            <button onClick={() => navigate("/login", { replace: true })}>
              로그인으로 이동
            </button>
            <button onClick={() => navigate("/", { replace: true })}>
              홈으로 이동
            </button>
          </div>
        </>
      )}

      {loading && <p style={{ marginTop: "0.75rem" }}>처리 중...</p>}
    </main>
  );
}
