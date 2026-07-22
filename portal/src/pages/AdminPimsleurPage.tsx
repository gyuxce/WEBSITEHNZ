import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { apiFetch } from "../lib/api";
import { PIMSLEUR_MAX_SCORE } from "../data/pimsleurQuestions";

type AdminRow = {
  id: string;
  user_id: string;
  score_section2: number;
  score_section3: number;
  score_section4: number;
  score_section5: number;
  score_section6: number;
  score_total: number;
  grade: string;
  completed_at: string;
  full_name: string;
  email: string | null;
  whatsapp: string | null;
  city: string | null;
};

export function AdminPimsleurPage() {
  const { profile, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading || profile?.role !== "admin") return;

    async function load() {
      try {
        const data = await apiFetch<{ rows: AdminRow[] }>("/admin/pimsleur");
        setRows(data.rows ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat data");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [authLoading, profile?.role]);

  if (!authLoading && profile?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        to="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-brand-navy/50 hover:text-brand-red"
      >
        <ArrowLeft size={16} /> Panel staf
      </Link>

      <h1 className="font-display text-2xl font-extrabold text-brand-navy">Hasil Pimsleur peserta</h1>
      <p className="mt-1 text-sm text-brand-navy/50">
        Daftar peserta, skor tahap 2–6, dan grade A–F.
      </p>

      {loading || authLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-red border-t-transparent" />
        </div>
      ) : error ? (
        <div className="mt-6 space-y-2">
          <p className="text-sm text-brand-red">{error}</p>
          <p className="text-xs text-brand-navy/50">
            Jika error 403, pastikan `profiles.role = 'admin'` untuk akun staf di Neon.
          </p>
        </div>
      ) : rows.length === 0 ? (
        <p className="mt-6 text-sm text-brand-navy/50">Belum ada hasil Pimsleur.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-brand-navy/8 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-brand-navy/8 bg-brand-bg text-xs uppercase tracking-wide text-brand-navy/45">
              <tr>
                <th className="px-4 py-3 font-bold">Peserta</th>
                <th className="px-4 py-3 font-bold">Total</th>
                <th className="px-4 py-3 font-bold">Grade</th>
                <th className="px-4 py-3 font-bold">T2–T6</th>
                <th className="px-4 py-3 font-bold">Selesai</th>
                <th className="px-4 py-3 font-bold" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-brand-navy/5 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-brand-navy">{row.full_name || "—"}</p>
                    <p className="text-xs text-brand-navy/45">
                      {row.email ?? "—"}
                      {row.whatsapp ? ` · ${row.whatsapp}` : ""}
                      {row.city ? ` · ${row.city}` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-bold text-brand-navy">
                    {row.score_total}/{PIMSLEUR_MAX_SCORE}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-brand-red-soft px-2.5 py-1 text-xs font-bold text-brand-red">
                      {row.grade}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-brand-navy/60">
                    {row.score_section2}/{row.score_section3}/{row.score_section4}/
                    {row.score_section5}/{row.score_section6}
                  </td>
                  <td className="px-4 py-3 text-xs text-brand-navy/50">
                    {new Date(row.completed_at).toLocaleString("id-ID")}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/pimsleur/${row.user_id}`}
                      className="text-xs font-bold text-brand-red hover:underline"
                    >
                      Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
