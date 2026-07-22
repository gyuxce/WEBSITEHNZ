import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authClient } from "../lib/auth-client";
import { AuthLayout } from "../components/PortalLayout";

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!token) {
      setError("Token reset tidak ditemukan di URL.");
      setLoading(false);
      return;
    }

    const { error: authError } = await authClient.resetPassword({
      newPassword: password,
      token,
    });

    if (authError) {
      setError(authError.message || "Gagal reset password");
      setLoading(false);
      return;
    }

    setLoading(false);
    navigate("/login", { replace: true });
  };

  return (
    <AuthLayout>
      <div className="rounded-2xl border border-brand-navy/8 bg-white p-8 shadow-sm">
        <h1 className="font-display text-2xl font-extrabold text-brand-navy">Password baru</h1>
        <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-brand-navy/50">
              Password baru
            </span>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border border-brand-navy/12 px-4 py-3 text-sm"
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
            {loading ? "Menyimpan…" : "Simpan password"}
          </button>
        </form>
        <Link to="/login" className="mt-4 inline-block text-sm font-semibold text-brand-red">
          Ke login
        </Link>
      </div>
    </AuthLayout>
  );
}
