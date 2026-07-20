import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute, GuestRoute } from "./components/ProtectedRoute";
import { PortalLayout } from "./components/PortalLayout";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { DashboardPage } from "./pages/DashboardPage";
import { PaymentPage } from "./pages/PaymentPage";
import { LanguageTestPage } from "./pages/LanguageTestPage";
import { CharacterTestPage } from "./pages/CharacterTestPage";
import { ResultPage } from "./pages/ResultPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>

          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<PortalLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/payment" element={<PaymentPage />} />
              <Route path="/test/language" element={<LanguageTestPage />} />
              <Route path="/test/character" element={<CharacterTestPage />} />
              <Route path="/result" element={<ResultPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
