import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authClient } from "../lib/auth-client";
import { apiFetch, isApiConfigured } from "../lib/api";
import { AuthLayout } from "../components/PortalLayout";
import { useAuth } from "../contexts/AuthContext";

const PROGRAMS = [
  "Pelatihan Bahasa & Karakter",
  "Program Bidang Konstruksi",
  "Program Perawatan & Jasa (Kaigo)",
  "Belum yakin — butuh konsultasi",
];

export function RegisterPage() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    whatsapp: "",
    city: "",
    programInterest: PROGRAMS[0],
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!isApiConfigured) {
      setError("API belum dikonfigurasi. Isi DATABASE_URL & BETTER_AUTH_SECRET di portal/.env.");
      setLoading(false);
      return;
    }

    const { error: authError } = await authClient.signUp.email({
      email: form.email,
      password: form.password,
      name: form.fullName,
    });

    if (authError) {
      setError(authError.message || "Gagal daftar");
      setLoading(false);
      return;
    }

    try {
      await apiFetch("/me/profile", {
        method: "PATCH",
        body: JSON.stringify({
          fullName: form.fullName,
          whatsapp: form.whatsapp,
          city: form.city,
          programInterest: form.programInterest,
        }),
      });
      await refreshProfile();
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Akun dibuat, tapi profil gagal disimpan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="rounded-2xl border border-brand-navy/8 bg-white p-8 shadow-sm">
        <h1 className="font-display font-extrabold text-2xl text-brand-navy">Daftar</h1>
        <p className="mt-1 text-sm text-brand-navy/55">Buat akun untuk mulai pemetaan potensi</p>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-brand-navy/50">
              Nama lengkap
            </span>
            <input
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="rounded-xl border border-brand-navy/12 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-brand-navy/50">Email</span>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
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
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="rounded-xl border border-brand-navy/12 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-brand-navy/50">
              WhatsApp
            </span>
            <input
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              className="rounded-xl border border-brand-navy/12 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-brand-navy/50">Kota</span>
            <input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="rounded-xl border border-brand-navy/12 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-brand-navy/50">
              Minat program
            </span>
            <select
              value={form.programInterest}
              onChange={(e) => setForm({ ...form, programInterest: e.target.value })}
              className="rounded-xl border border-brand-navy/12 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30"
            >
              {PROGRAMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          {error ? (
            <p className="rounded-lg bg-brand-red-soft px-3 py-2 text-sm text-brand-red">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-xl bg-brand-red py-3.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {loading ? "Mendaftar…" : "Daftar"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-brand-navy/50">
          Sudah punya akun?{" "}
          <Link to="/login" className="font-semibold text-brand-red">
            Masuk
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
