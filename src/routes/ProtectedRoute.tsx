// src/routes/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function ProtectedRoute() {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const isMeLoading = useAuthStore((s) => s.isMeLoading);
  const openLoginModal = useAuthStore((s) => s.openLoginModal);

  if (isMeLoading) return null;

  if (!user) {
    openLoginModal(location.pathname + location.search);
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
