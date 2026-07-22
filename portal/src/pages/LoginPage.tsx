import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authClient } from "../lib/auth-client";
import { isApiConfigured } from "../lib/api";
import { AuthLayout } from "../components/PortalLayout";
import { useAuth } from "../contexts/AuthContext";

export function LoginPage() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!isApiConfigured) {
      setError("API belum dikonfigurasi. Isi portal/.env terlebih dahulu.");
      setLoading(false);
      return;
    }

    const { error: authError } = await authClient.signIn.email({ email, password });
    if (authError) {
      setError(authError.message || "Gagal masuk");
      setLoading(false);
      return;
    }

    await refreshProfile();
    setLoading(false);
    navigate("/dashboard", { replace: true });
  };

  return (
    <AuthLayout>
      <div className="rounded-2xl border border-brand-navy/8 bg-white p-8 shadow-sm">
        <h1 className="font-display text-2xl font-extrabold text-brand-navy">Masuk</h1>
        <p className="mt-1 text-sm text-brand-navy/55">Portal pemetaan potensi Harunokaze</p>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-brand-navy/50">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border border-brand-navy/12 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-brand-navy/50">
              Password
            </span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border border-brand-navy/12 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30"
            />
          </label>

          {error ? (
            <p className="rounded-lg bg-brand-red-soft px-3 py-2 text-sm text-brand-red">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-brand-red py-3.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {loading ? "Masuk…" : "Masuk"}
          </button>
        </form>

        <div className="mt-4 flex justify-between text-sm">
          <Link to="/forgot-password" className="text-brand-navy/50 hover:text-brand-red">
            Lupa password?
          </Link>
          <Link to="/register" className="font-semibold text-brand-red">
            Daftar
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
