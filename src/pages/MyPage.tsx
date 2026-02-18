// src/pages/MyPage.tsx
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

function getFirstDefined(...vals: Array<any>) {
  return vals.find((v) => v != null && v !== "");
}

export default function MyPage() {
  const navigate = useNavigate();

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const displayName = useMemo(() => {
    if (!user) return "-";
    const u: any = user;
    return getFirstDefined(u.nickname, u.name, u.username, u.email, u.id, "-");
  }, [user]);

  const email = useMemo(() => {
    const u: any = user;
    return getFirstDefined(u?.email, "-");
  }, [user]);

  const provider = useMemo(() => {
    const u: any = user;
    return getFirstDefined(u?.provider, u?.oauthProvider, u?.socialType, "-");
  }, [user]);

  const emailVerified = useMemo(() => {
    const u: any = user;
    const v = getFirstDefined(u?.emailVerified, u?.isEmailVerified);
    if (typeof v === "boolean") return v;
    return null;
  }, [user]);

  const onLogout = () => {
    logout();
    navigate("/logout-complete", { replace: true });
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">마이페이지</h1>
          <p className="text-sm text-gray-500">
            계정 정보 및 기본 설정을 확인할 수 있어요.
          </p>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="rounded-md border px-3 py-2 text-sm font-semibold hover:bg-gray-50"
        >
          뒤로
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm text-gray-500">내 계정</div>
            <div className="mt-1 text-lg font-bold text-gray-900">
              {displayName}
            </div>
            <div className="mt-1 text-sm text-gray-600">{email}</div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span className="rounded-full border px-3 py-1 text-xs font-semibold text-gray-600">
              provider: {provider}
            </span>

            {emailVerified !== null && (
              <span
                className={[
                  "rounded-full border px-3 py-1 text-xs font-semibold",
                  emailVerified
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-yellow-200 bg-yellow-50 text-yellow-700",
                ].join(" ")}
              >
                {emailVerified ? "이메일 인증 완료" : "이메일 인증 필요"}
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => navigate("/portfolio")}
            className="h-12 rounded-2xl border border-gray-200 bg-white font-semibold hover:bg-gray-50"
          >
            내 포트폴리오 보기
          </button>

          <button
            type="button"
            onClick={() => navigate("/market")}
            className="h-12 rounded-2xl border border-gray-200 bg-white font-semibold hover:bg-gray-50"
          >
            마켓으로 가기
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-gray-200 p-4">
          <div className="text-sm font-semibold text-gray-900 mb-2">
            계정 관리
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate("/verify-email-required")}
              className="h-10 rounded-2xl border border-gray-200 px-4 text-sm font-semibold hover:bg-gray-50"
            >
              이메일 인증 안내
            </button>

            <button
              type="button"
              onClick={() => navigate("/email-verified")}
              className="h-10 rounded-2xl border border-gray-200 px-4 text-sm font-semibold hover:bg-gray-50"
            >
              이메일 인증 완료 페이지
            </button>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={onLogout}
              className="h-12 w-full rounded-2xl bg-gray-900 text-white font-semibold hover:bg-black"
            >
              로그아웃
            </button>
            <div className="mt-2 text-center text-xs text-gray-500">
              로그아웃 후에는 다시 로그인해야 주문 기능을 사용할 수 있어요.
            </div>
          </div>
        </div>
      </div>

      {/* 디버깅용(원하면 삭제 가능) */}
      <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
        <div className="text-sm font-semibold text-gray-900 mb-2">
          사용자 원본 데이터
        </div>
        <pre className="text-xs text-gray-600 overflow-auto">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>
    </div>
  );
}
