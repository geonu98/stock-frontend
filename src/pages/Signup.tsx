// src/pages/Signup.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { signup, checkEmail } from "../api/auth";
import { useNavigate, Link } from "react-router-dom";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Signup() {
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const [serverMessage, setServerMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  // -----------------------------
  //  이메일 중복 체크 상태
  // -----------------------------
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null); // null=미확인
  const [emailCheckMsg, setEmailCheckMsg] = useState<string>("");

  // 디바운스/경쟁상태 방지용 (마지막 요청만 유효)
  const emailCheckSeq = useRef(0);
  const debounceTimer = useRef<number | null>(null);

  // -----------------------------
  //  프론트 1차 검증 (백엔드가 최종 권한)
  // -----------------------------
  const emailOk = useMemo(() => emailRegex.test(email.trim()), [email]);
  const pwMin = 8; // ✅ 백엔드 @Size(min=8) 기준
  const pwOk = useMemo(() => password.length >= pwMin, [password]);
  const pw2Ok = useMemo(() => password === password2, [password, password2]);
  const nameOk = useMemo(() => name.trim().length > 0, [name]);

  //  이메일 중복체크도 통과해야 submit 가능
  const formOk =
    emailOk && pwOk && pw2Ok && nameOk && emailAvailable === true && !loading;

  // -----------------------------
  //  이메일 변경 시: 디바운스로 중복체크
  // -----------------------------
  useEffect(() => {
    const trimmed = email.trim();

    // 초기화
    setEmailAvailable(null);
    setEmailCheckMsg("");

    if (debounceTimer.current) {
      window.clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }

    // 비었으면 체크 안 함
    if (!trimmed) {
      setEmailChecking(false);
      return;
    }

    // 형식 안맞으면 체크 안 함
    if (!emailRegex.test(trimmed)) {
      setEmailChecking(false);
      setEmailCheckMsg("이메일 형식을 확인해주세요.");
      return;
    }

    // 디바운스 시작
    setEmailChecking(true);

    debounceTimer.current = window.setTimeout(async () => {
      const seq = ++emailCheckSeq.current;

      try {
        const res = await checkEmail(trimmed);

        // 최신 요청만 반영
        if (seq !== emailCheckSeq.current) return;

        if (res.available) {
          setEmailAvailable(true);
          setEmailCheckMsg("사용 가능한 이메일입니다.");
        } else {
          setEmailAvailable(false);
          setEmailCheckMsg("이미 사용 중인 이메일입니다.");
        }
      } catch (err: any) {
        if (seq !== emailCheckSeq.current) return;
        setEmailAvailable(null);
        setEmailCheckMsg(
          err?.response?.data?.message ||
            "이메일 확인에 실패했습니다. 잠시 후 다시 시도해주세요."
        );
      } finally {
        if (seq === emailCheckSeq.current) setEmailChecking(false);
      }
    }, 450);

    return () => {
      if (debounceTimer.current) {
        window.clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
    };
  }, [email]);

  // -----------------------------
  //  회원가입 제출
  // -----------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setServerMessage("");

    // 프론트에서 먼저 막기
    if (!emailOk) return setError("이메일 형식을 확인해주세요.");
    if (emailAvailable !== true) return setError("이메일 중복 확인을 완료해주세요.");
    if (!pwOk) return setError(`비밀번호는 최소 ${pwMin}자 이상이어야 합니다.`);
    if (!pw2Ok) return setError("비밀번호 확인이 일치하지 않습니다.");
    if (!nameOk) return setError("이름을 입력해주세요.");

    try {
      setLoading(true);

     const msg = await signup({
        email: email.trim(),
        password,
        name: name.trim(),
        age: age ? Number(age) : null,
        phoneNumber: phoneNumber ? phoneNumber.trim() : null,
      });

   setServerMessage(typeof msg === "string" ? msg : "이메일 인증 메일을 확인해주세요.");
      setDone(true);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        (typeof err?.response?.data === "string" ? err.response.data : null) ||
        err?.message ||
        "회원가입에 실패했습니다.";
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  //  버튼 스타일: 기본 흰색 + 파란 테두리, hover 시 파란 배경
  const submitBtnClass =
    "mt-2 w-full py-3 rounded-xl border border-blue-500 bg-white text-blue-600 font-semibold transition " +
    "hover:bg-blue-600 hover:text-white " +
    "disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-blue-600";

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm w-full max-w-md border border-gray-100 text-center">
          <h2 className="text-2xl font-bold mb-3">이메일을 확인해주세요</h2>
          <p className="text-gray-700 text-sm leading-relaxed mb-6">
            {serverMessage}
            <br />
            메일의 인증 링크를 누르면 인증이 완료됩니다.
          </p>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => nav("/login")}
              className="w-full py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-black"
            >
              로그인으로 이동
            </button>

            <button
              type="button"
              onClick={() => {
                setDone(false);
                setError("");
                setServerMessage("");
                setPassword("");
                setPassword2("");
              }}
              className="w-full py-3 rounded-xl bg-gray-100 text-gray-900 font-semibold hover:bg-gray-200"
            >
              다른 이메일로 다시 가입
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm w-full max-w-md border border-gray-100">
        <h2 className="text-2xl font-bold text-center mb-6">회원가입</h2>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* 이메일 */}
          <div>
            <label className="block mb-1 text-sm text-gray-700">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-xl px-3 py-3 focus:ring focus:ring-blue-200 outline-none"
              placeholder="example@gmail.com"
              autoComplete="email"
              required
            />

            {email.length > 0 && (
              <div className="mt-1 text-xs">
                {emailChecking ? (
                  <span className="text-gray-500">이메일 확인 중...</span>
                ) : emailCheckMsg ? (
                  <span
                    className={
                      emailAvailable === true
                        ? "text-green-600"
                        : emailAvailable === false
                        ? "text-red-600"
                        : "text-gray-500"
                    }
                  >
                    {emailCheckMsg}
                  </span>
                ) : null}
              </div>
            )}
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="block mb-1 text-sm text-gray-700">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-xl px-3 py-3 focus:ring focus:ring-blue-200 outline-none"
              placeholder="비밀번호"
              autoComplete="new-password"
              required
            />
            <p className="mt-1 text-xs text-gray-500">최소 {pwMin}자 이상</p>
            {password.length > 0 && !pwOk && (
              <p className="mt-1 text-xs text-red-600">비밀번호가 너무 짧습니다.</p>
            )}
          </div>

          {/* 비밀번호 확인 */}
          <div>
            <label className="block mb-1 text-sm text-gray-700">비밀번호 확인</label>
            <input
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              className="w-full border rounded-xl px-3 py-3 focus:ring focus:ring-blue-200 outline-none"
              placeholder="비밀번호 확인"
              autoComplete="new-password"
              required
            />
            {password2.length > 0 && !pw2Ok && (
              <p className="mt-1 text-xs text-red-600">비밀번호가 일치하지 않습니다.</p>
            )}
          </div>

          {/* 이름 */}
          <div>
            <label className="block mb-1 text-sm text-gray-700">이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-xl px-3 py-3 focus:ring focus:ring-blue-200 outline-none"
              placeholder="홍길동"
              autoComplete="name"
              required
            />
          </div>

          {/* 나이 */}
          <div>
            <label className="block mb-1 text-sm text-gray-700">나이 (선택)</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full border rounded-xl px-3 py-3 focus:ring focus:ring-blue-200 outline-none"
              placeholder="25"
              min={0}
              inputMode="numeric"
            />
          </div>

          {/* 전화번호 */}
          <div>
            <label className="block mb-1 text-sm text-gray-700">전화번호 (선택)</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full border rounded-xl px-3 py-3 focus:ring focus:ring-blue-200 outline-none"
              placeholder="010-1234-5678"
              autoComplete="tel"
            />
          </div>

          <button type="submit" disabled={!formOk} className={submitBtnClass}>
            {loading ? "가입 요청 중..." : "회원가입"}
          </button>
        </form>

        <div className="mt-5 text-center text-sm text-gray-700">
          이미 계정이 있으신가요?{" "}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">
            로그인
          </Link>
        </div>
      </div>
    </div>
  );
}
