import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { AuthLayout } from "../components/PortalLayout";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!isSupabaseConfigured) {
      setError("Supabase belum dikonfigurasi. Isi file portal/.env terlebih dahulu.");
      setLoading(false);
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (authError) {
      setError(authError.message);
    } else if (authData.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .maybeSingle();
      navigate(profile?.role === "admin" ? "/dashboard" : "/payment", { replace: true });
    }
    setLoading(false);
  };

  return (
    <AuthLayout>
      <div className="rounded-2xl border border-brand-navy/8 bg-white p-8 shadow-sm">
        <h1 className="font-display font-extrabold text-2xl text-brand-navy">Masuk</h1>
        <p className="mt-1 text-sm text-brand-navy/55">Lanjutkan pemetaan potensimu</p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-brand-navy/50">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border border-brand-navy/12 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30"
              placeholder="nama@email.com"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-brand-navy/50">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border border-brand-navy/12 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30"
              placeholder="••••••••"
            />
          </label>

          {error && (
            <p className="text-sm text-brand-red bg-brand-red-soft rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-xl bg-brand-red text-white font-bold py-3.5 text-sm hover:bg-brand-red-hover transition-colors disabled:opacity-60"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <div className="mt-5 flex flex-col gap-2 text-center text-sm text-brand-navy/55">
          <Link to="/forgot-password" className="font-semibold text-brand-red hover:underline">
            Lupa password?
          </Link>
          <p>
            Belum punya akun?{" "}
            <Link to="/register" className="font-semibold text-brand-red hover:underline">
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
