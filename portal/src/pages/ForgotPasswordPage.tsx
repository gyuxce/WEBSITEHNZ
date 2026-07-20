import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { AuthLayout } from "../components/PortalLayout";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (!isSupabaseConfigured) {
      setError("Supabase belum dikonfigurasi.");
      setLoading(false);
      return;
    }

    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (authError) setError(authError.message);
    else setMessage("Link reset password sudah dikirim ke email kamu.");
    setLoading(false);
  };

  return (
    <AuthLayout>
      <div className="rounded-2xl border border-brand-navy/8 bg-white p-8 shadow-sm">
        <h1 className="font-display font-extrabold text-2xl text-brand-navy">Lupa Password</h1>
        <p className="mt-1 text-sm text-brand-navy/55">Kami akan kirim link reset ke email kamu</p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
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

          {error && <p className="text-sm text-brand-red bg-brand-red-soft rounded-lg px-3 py-2">{error}</p>}
          {message && (
            <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">{message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-brand-red text-white font-bold py-3.5 text-sm hover:bg-brand-red-hover transition-colors disabled:opacity-60"
          >
            {loading ? "Mengirim..." : "Kirim link reset"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm">
          <Link to="/login" className="font-semibold text-brand-red hover:underline">
            Kembali ke masuk
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
