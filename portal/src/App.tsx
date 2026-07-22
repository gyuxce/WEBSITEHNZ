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
import { ResultPage } from "./pages/ResultPage";
import { PimsleurTestPage } from "./pages/PimsleurTestPage";
import { PimsleurResultPage } from "./pages/PimsleurResultPage";
import { CfitTestPage } from "./pages/CfitTestPage";
import { CfitResultPage } from "./pages/CfitResultPage";
import { AdminPimsleurPage } from "./pages/AdminPimsleurPage";
import { AdminPimsleurDetailPage } from "./pages/AdminPimsleurDetailPage";

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
              <Route path="/test/pimsleur" element={<PimsleurTestPage />} />
              <Route path="/result/pimsleur" element={<PimsleurResultPage />} />
              <Route path="/test/cfit" element={<CfitTestPage />} />
              <Route path="/result/cfit" element={<CfitResultPage />} />
              <Route path="/admin/pimsleur" element={<AdminPimsleurPage />} />
              <Route path="/admin/pimsleur/:userId" element={<AdminPimsleurDetailPage />} />
              {/* Legacy routes — digantikan Pimsleur / Papikostik */}
              <Route path="/test/language" element={<Navigate to="/test/pimsleur" replace />} />
              <Route path="/test/character" element={<Navigate to="/dashboard" replace />} />
              <Route path="/result" element={<Navigate to="/result/pimsleur" replace />} />
              <Route path="/result/legacy" element={<ResultPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
