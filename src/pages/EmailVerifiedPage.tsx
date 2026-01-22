import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuthStore } from "../store/authStore";

type DeviceInfo = {
  deviceId: string;
  deviceType: "WEB";
};

/**
 * 로컬스토리지에 deviceInfo를 저장/재사용
 * - EmailVerifiedPage는 새 탭/새 창에서 열릴 수 있어서
 *   같은 브라우저 내에서 deviceId를 일관되게 유지하는 게 좋음
 */
function getOrCreateDeviceInfo(): DeviceInfo {
  const KEY = "deviceInfo";
  const raw = localStorage.getItem(KEY);

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.deviceId && parsed?.deviceType) return parsed as DeviceInfo;
    } catch {
      // 무시하고 새로 생성
    }
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

  /**
   * 메일 링크 예시:
   *   http://localhost:5173/email-verified?code=xxxx
   * 여기서 code를 뽑아서 /auth/email/exchange로 교환(AT/RT 발급)함
   */
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const code = params.get("code");

  const setTokens = useAuthStore((s) => s.setTokens);
  const logout = useAuthStore((s) => s.logout);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string>("이메일 인증을 확인하고 있습니다...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      // 1) code가 없으면 즉시 에러 처리
      if (!code) {
        setLoading(false);
        setError("인증 코드가 없습니다. 이메일 링크가 올바른지 확인해주세요.");
        setMessage("");
        return;
      }

      try {
        // 2) deviceInfo 준비
        const deviceInfo = getOrCreateDeviceInfo();

        // 3) 백엔드 교환 API 호출: code -> accessToken/refreshToken
        const res = await api.post("/auth/email/exchange", { code, deviceInfo });

        const { accessToken, refreshToken } = res.data as {
          accessToken: string;
          refreshToken: string;
        };

        if (!accessToken || !refreshToken) {
          throw new Error("Invalid token response");
        }

        // 4) 토큰 저장(이 탭 기준으로도 로그인 상태가 됨)
        setTokens(accessToken, refreshToken);

        /**
         * 5) 베스트 UX: "메일 링크가 새 탭으로 열린 경우"
         * - window.opener가 있으면 원래 탭(이메일 입력하던 탭)을 다음 단계로 보내고
         * - 이 새 탭은 닫기 시도
         *
         * 주의:
         * - 브라우저 정책상 window.close()가 막힐 수 있음
         *   -> 그래서 닫기 실패해도 안내 문구를 보여주는 게 안전
         */
        try {
          if (window.opener && !window.opener.closed) {
            // 원래 탭을 홈(또는 로그인)로 보내기
            // 프로젝트 UX에 맞춰 경로는 바꿔도 됨: "/login?from=email-verified" 같은 식
            window.opener.location.href = "/?from=email-verified";

            // 새 탭 닫기 시도
            window.close();

            // close가 막혀도 아래 화면이 보이도록 메시지는 남겨둠
            setMessage("인증이 완료되었습니다. 원래 창에서 계속 진행해주세요. (이 창은 닫아도 됩니다)");
            setLoading(false);
            return;
          }
        } catch {
          // opener 접근이 막히는 경우도 있음(정책/환경). 이 경우 그냥 현재 탭에서 이동.
        }

        // 6) opener가 없으면(같은 탭으로 열렸거나 opener 접근 불가) 현재 탭에서 홈으로 이동
        setMessage("로그인 완료! 이동 중입니다...");
        navigate("/", { replace: true });
      } catch (e: any) {
        /**
         * 7) 실패 시: 토큰/세션 꼬임 방지 위해 로그아웃 처리
         * - /auth/** 경로는 보통 refresh 인터셉터 개입을 안 하도록 해둔 상태라
         *   여기서 메시지 분기만 깔끔하게 주면 됨
         */
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

      {/* 정상 진행 메시지 */}
      {message && <p style={{ marginTop: "0.75rem" }}>{message}</p>}

      {/* 에러 메시지 + 이동 버튼 */}
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

            {/* 새 탭에서 열린 경우를 대비해 닫기 버튼도 제공 */}
            <button onClick={() => window.close()}>창 닫기</button>
          </div>
        </>
      )}

      {/* 로딩 표시 */}
      {loading && <p style={{ marginTop: "0.75rem" }}>처리 중...</p>}
    </main>
  );
}
