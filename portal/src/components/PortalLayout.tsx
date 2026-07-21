import { Link, Outlet } from "react-router-dom";
import { LogOut, LayoutDashboard, Shield } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Logo } from "./Logo";
import { useAuth } from "../contexts/AuthContext";

export function PortalLayout() {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const onDashboard = location.pathname === "/dashboard";
  const isAdmin = profile?.role === "admin";
  const onAdmin = location.pathname.startsWith("/admin");

  return (
    <div className="min-h-screen bg-brand-bg">
      <header className="sticky top-0 z-40 border-b border-brand-navy/8 bg-white/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Logo homeHref="/dashboard" />
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden sm:flex items-center gap-2 text-sm text-brand-navy/60 font-medium">
              {profile?.full_name}
              {isAdmin ? (
                <span className="rounded-full bg-brand-navy px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  Admin
                </span>
              ) : null}
            </span>
            <Link
              to="/dashboard"
              className={`inline-flex items-center gap-1.5 text-sm font-semibold transition-colors rounded-full px-3 py-1.5 ${
                onDashboard
                  ? "bg-brand-red-soft text-brand-red"
                  : "text-brand-navy/70 hover:text-brand-red"
              }`}
            >
              <LayoutDashboard size={16} />
              <span className="hidden sm:inline">{isAdmin ? "Panel" : "Beranda"}</span>
            </Link>
            {isAdmin ? (
              <Link
                to="/admin/pimsleur"
                className={`inline-flex items-center gap-1.5 text-sm font-semibold transition-colors rounded-full px-3 py-1.5 ${
                  onAdmin
                    ? "bg-brand-navy text-white"
                    : "text-brand-navy/70 hover:text-brand-red"
                }`}
              >
                <Shield size={16} />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => signOut()}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-navy/50 hover:text-brand-red transition-colors"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center px-4 py-12">
      <div className="mb-8">
        <Logo />
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
