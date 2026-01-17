import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function LogoutComplete() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/");
    }, 1500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-lg font-semibold">로그아웃 완료</h1>
        <p className="text-sm text-gray-500 mt-2">
          안전하게 로그아웃되었습니다.
        </p>
      </div>
    </div>
  );
}
