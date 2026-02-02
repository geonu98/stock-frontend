import { BrowserRouter, Routes, Route } from "react-router-dom";
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


function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        <Route
  path="/verify-email-required"
  element={<VerifyEmailRequiredPage />}
/>


        <Route path="/email-required" element={<EmailRequiredPage />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        <Route path="/email-verified" element={<EmailVerifiedPage />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/logout-complete" element={<LogoutComplete />} />
        <Route path="/market" element={<Market/>} />
        <Route path="/recommendations" element={<RecommendationsPage />} />


      </Routes>
    </BrowserRouter>
  );
}

export default App;
