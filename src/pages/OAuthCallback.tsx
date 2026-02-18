import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { useAuthStore } from "../store/authStore";
import { getDeviceInfo } from "../utils/device";

/**
 * OAuthCallback
 * - redirect_uri: /oauth/callback (쿼리 없음)
 * - provider는 state로 전달받음 (ex: state=kakao)
 */
export default function OAuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      const code = params.get("code");
      const provider = params.get("state"); 
      
    console.log("🔥 CALLBACK START", { code, provider });

      if (!provider || !code) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        console.log(" calling backend");
        // ✅ 백엔드 매핑은 /api/auth/oauth/{provider}/callback
        const res = await api.post(`/api/auth/oauth/${provider}/callback`, {
          code,
          deviceInfo: getDeviceInfo(),
          
        });
     console.log("✅ backend success", res.data);
        const { accessToken, refreshToken } = res.data as any;
        useAuthStore.getState().setTokens(accessToken, refreshToken);

        navigate("/", { replace: true });
      } catch (err: any) {
        if (
          err?.response?.status === 409 &&
          err?.response?.data?.error === "EMAIL_REQUIRED"
        ) {
          const { provider, providerId } = err.response.data;
          navigate(
            `/email-required?provider=${encodeURIComponent(
              provider
            )}&providerId=${encodeURIComponent(providerId)}`,
            { replace: true }
          );
          return;
        }

        useAuthStore.getState().logout();
        navigate("/login", { replace: true });
      }
    };

    run();
  }, [params, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div>소셜 로그인 처리 중...</div>
    </div>
  );
}
