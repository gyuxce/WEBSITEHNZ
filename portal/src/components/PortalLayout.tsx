import { Link, Outlet } from "react-router-dom";
import { ChevronDown, LayoutDashboard, LogOut } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Logo } from "./Logo";
import { useAuth } from "../contexts/AuthContext";
import { isPsychologistRole } from "../lib/access";

export function PortalLayout() {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const onDashboard = location.pathname === "/dashboard";
  const isAdmin = profile?.role === "admin";
  const isPsychologist = isPsychologistRole(profile?.role);
  const isStaff = isAdmin || isPsychologist;

  return (
    <div className="min-h-screen bg-brand-bg">
      <header className="sticky top-0 z-40 border-b border-brand-navy/8 bg-white/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Logo homeHref="/dashboard" />
          <div className="flex items-center gap-2 sm:gap-3">
            {isStaff ? (
              <>
                <Link
                  to="/dashboard"
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                    onDashboard
                      ? "bg-brand-red-soft text-brand-red"
                      : "text-brand-navy/70 hover:text-brand-red"
                  }`}
                >
                  <LayoutDashboard size={16} />
                  <span>Panel {isAdmin ? "Admin" : "Psikolog"}</span>
                </Link>
                <details className="relative">
                  <summary
                    className="flex cursor-pointer list-none items-center gap-1.5 rounded-full px-2 py-1.5 text-sm font-semibold text-brand-navy/70 transition-colors hover:bg-brand-navy/5 hover:text-brand-red [&::-webkit-details-marker]:hidden"
                    aria-label="Buka menu profil"
                  >
                    <span className="hidden max-w-32 truncate sm:inline">{profile?.full_name}</span>
                    <span className="rounded-full bg-brand-navy px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                      {isAdmin ? "Admin" : "Psikolog"}
                    </span>
                    <ChevronDown size={14} />
                  </summary>
                  <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-2xl border border-brand-navy/10 bg-white p-2 shadow-lg">
                    <div className="border-b border-brand-navy/8 px-3 py-2">
                      <p className="truncate text-sm font-bold text-brand-navy">{profile?.full_name}</p>
                      <p className="mt-0.5 text-xs text-brand-navy/50">
                        {isAdmin ? "Admin" : "Psikolog"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => signOut()}
                      className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-brand-navy/65 transition-colors hover:bg-brand-red-soft hover:text-brand-red"
                    >
                      <LogOut size={16} />
                      Keluar
                    </button>
                  </div>
                </details>
              </>
            ) : null}
            {!isStaff ? (
              <>
                <span className="hidden text-sm font-medium text-brand-navy/60 sm:inline">
                  {profile?.full_name}
                </span>
                <Link
                  to="/dashboard"
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                    onDashboard
                      ? "bg-brand-red-soft text-brand-red"
                      : "text-brand-navy/70 hover:text-brand-red"
                  }`}
                >
                  <LayoutDashboard size={16} />
                  <span className="hidden sm:inline">Beranda</span>
                </Link>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-navy/50 transition-colors hover:text-brand-red"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </>
            ) : null}
          </div>
        </div>
      </header>
      <main
        className={`${isStaff ? "max-w-7xl" : "max-w-5xl"} mx-auto px-4 py-8 sm:px-6`}
      >
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
