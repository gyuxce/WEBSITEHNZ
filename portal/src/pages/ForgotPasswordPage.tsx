import { useState } from "react";
import { Link } from "react-router-dom";
import { authClient } from "../lib/auth-client";
import { isApiConfigured } from "../lib/api";
import { AuthLayout } from "../components/PortalLayout";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!isApiConfigured) {
      setError("API belum dikonfigurasi.");
      setLoading(false);
      return;
    }

    const { error: authError } = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (authError) setError(authError.message || "Gagal mengirim reset");
    else setSent(true);
    setLoading(false);
  };

  return (
    <AuthLayout>
      <div className="rounded-2xl border border-brand-navy/8 bg-white p-8 shadow-sm">
        <h1 className="font-display text-2xl font-extrabold text-brand-navy">Lupa password</h1>
        {sent ? (
          <p className="mt-3 text-sm text-brand-navy/60">
            Jika email terdaftar, link reset sudah dikirim (atau dicatat di log server bila Resend
            belum diset).
          </p>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-brand-navy/50">
                Email
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              {loading ? "Mengirim…" : "Kirim link reset"}
            </button>
          </form>
        )}
        <Link to="/login" className="mt-4 inline-block text-sm font-semibold text-brand-red">
          Kembali masuk
        </Link>
      </div>
    </AuthLayout>
  );
}
