import { BrowserRouter, Routes, Route ,useNavigate  } from "react-router-dom";
import { useEffect } from "react";
import Header from "./components/layout/Header";
import Login from "./pages/Login";
import Home from "./pages/Home";
import OAuthCallback from "./pages/OAuthCallback";
import LogoutComplete from "./pages/LogoutComplete";
import VerifyEmailRequiredPage from "./pages/VerifyEmailRequiredPage";
import EmailRequiredPage from "./pages/EmailRequiredPage";
import EmailVerifiedPage from "./pages/EmailVerifiedPage";
import Signup from "./pages/Signup";
import Market from "./pages/Market";
import RecommendationsPage from "./pages/RecommendationsPage";
import LoginRequiredModal from "./components/common/LoginRequiredModal";
import { useAuthStore } from "./store/authStore";
import ProtectedRoute from "./routes/ProtectedRoute";
import MyPage from "./pages/MyPage";
import Portfolio from "./pages/Portfolio";
import PortfolioDetail from "./pages/PortfolioDetail";

function AppRoutes() {
  const navigate = useNavigate();

  const fetchMe = useAuthStore((s) => s.fetchMe);
  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const loginModalOpen = useAuthStore((s) => s.loginModalOpen);
  const loginRedirectTo = useAuthStore((s) => s.loginRedirectTo);
  const closeLoginModal = useAuthStore((s) => s.closeLoginModal);


  const handleLogin = () => {
    closeLoginModal();

    //  로그인 후 돌아갈 곳은 loginRedirectTo로 넘기고 (state로)
    navigate("/login", {
      state: { from: loginRedirectTo ?? "/" },
      replace: true,
    });
  };

return (
    <>
      <Header />

     <Routes>
  <Route path="/" element={<Home />} />
  <Route path="/login" element={<Login />} />

  <Route path="/verify-email-required" element={<VerifyEmailRequiredPage />} />
  <Route path="/email-required" element={<EmailRequiredPage />} />
  <Route path="/oauth/callback" element={<OAuthCallback />} />
  <Route path="/email-verified" element={<EmailVerifiedPage />} />
  <Route path="/signup" element={<Signup />} />
  <Route path="/logout-complete" element={<LogoutComplete />} />

  {/*  공개 페이지 */}
  <Route path="/market" element={<Market />} />
  <Route path="/recommendations" element={<RecommendationsPage />} />

  {/*  로그인 전용 페이지 */}
  <Route element={<ProtectedRoute />}>
    <Route path="/mypage" element={<MyPage />} />
    <Route path="/portfolio" element={<Portfolio />} />
      <Route path="/portfolio/:symbol" element={<PortfolioDetail />} />
    
  </Route>
</Routes>

      {/*  전역 모달 */}
      <LoginRequiredModal
        open={loginModalOpen}
        onClose={closeLoginModal}
        onLogin={handleLogin}
      />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}


