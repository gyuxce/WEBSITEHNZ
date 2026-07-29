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
import { CfitResultPage } from "./pages/CfitResultPage";
import { CfitTestPage } from "./pages/CfitTestPage";
import { PapikostikTestPage } from "./pages/PapikostikTestPage";
import { PapikostikResultPage } from "./pages/PapikostikResultPage";
import { AdminPimsleurPage } from "./pages/AdminPimsleurPage";
import { AdminPimsleurDetailPage } from "./pages/AdminPimsleurDetailPage";
import { AdminCfitPage } from "./pages/AdminCfitPage";
import { AdminCfitDetailPage } from "./pages/AdminCfitDetailPage";
import { AdminPapikostikPage } from "./pages/AdminPapikostikPage";
import { AdminPapikostikDetailPage } from "./pages/AdminPapikostikDetailPage";

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
              <Route path="/test/cfit" element={<CfitTestPage />} />
              <Route path="/test/papikostik" element={<PapikostikTestPage />} />
              <Route path="/result/pimsleur" element={<PimsleurResultPage />} />
              <Route path="/result/cfit" element={<CfitResultPage />} />
              <Route path="/result/papikostik" element={<PapikostikResultPage />} />
              <Route path="/admin/pimsleur" element={<AdminPimsleurPage />} />
              <Route path="/admin/pimsleur/:userId" element={<AdminPimsleurDetailPage />} />
              <Route path="/admin/cfit" element={<AdminCfitPage />} />
              <Route path="/admin/cfit/:userId" element={<AdminCfitDetailPage />} />
              <Route path="/admin/papikostik" element={<AdminPapikostikPage />} />
              <Route path="/admin/papikostik/:userId" element={<AdminPapikostikDetailPage />} />
              {/* Legacy routes. Flow MVP sekarang memakai Pimsleur dan hasil Pimsleur. */}
              <Route path="/test/language" element={<Navigate to="/test/pimsleur" replace />} />
              <Route path="/test/character" element={<Navigate to="/test/papikostik" replace />} />
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
