import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

type AdminPapikostikRow = {
  id: string;
  user_id: string;
  total_top: number | null;
  total_bottom: number | null;
  total_all: number | null;
  is_complete_pattern: boolean | null;
  review_status: "pending" | "reviewed";
  completed_at: string;
  reviewed_at: string | null;
  full_name: string;
  email: string | null;
  whatsapp: string | null;
  city: string | null;
};

export function AdminPapikostikPage() {
  const { profile, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<AdminPapikostikRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading || profile?.role !== "admin") return;

    async function load() {
      const { data, error: qError } = await supabase.rpc("admin_list_papikostik_results");

      if (qError) {
        setError(qError.message);
        setLoading(false);
        return;
      }

      setRows((data as AdminPapikostikRow[]) ?? []);
      setLoading(false);
    }

    void load();
  }, [authLoading, profile?.role]);

  if (!authLoading && profile?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        to="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-brand-navy/50 hover:text-brand-red"
      >
        <ArrowLeft size={16} /> Panel staf
      </Link>

      <h1 className="font-display text-2xl font-extrabold text-brand-navy">
        Hasil PAPI Kostick peserta
      </h1>
      <p className="mt-1 text-sm text-brand-navy/50">
        Daftar skor faktor dan status review psikolog/admin.
      </p>

      {loading || authLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-red border-t-transparent" />
        </div>
      ) : error ? (
        <div className="mt-6 space-y-2">
          <p className="text-sm text-brand-red">{error}</p>
          <p className="text-xs text-brand-navy/50">
            Jika error fungsi tidak ditemukan, jalankan migration PAPI Kostick terbaru di Supabase
            SQL Editor.
          </p>
        </div>
      ) : rows.length === 0 ? (
        <p className="mt-6 text-sm text-brand-navy/50">Belum ada hasil PAPI Kostick.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-brand-navy/8 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-brand-navy/8 bg-brand-bg text-xs uppercase tracking-wide text-brand-navy/45">
              <tr>
                <th className="px-4 py-3 font-bold">Peserta</th>
                <th className="px-4 py-3 font-bold">Total</th>
                <th className="px-4 py-3 font-bold">Validasi</th>
                <th className="px-4 py-3 font-bold">Review</th>
                <th className="px-4 py-3 font-bold">Selesai</th>
                <th className="px-4 py-3 font-bold" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-brand-navy/5 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-brand-navy">{row.full_name || "-"}</p>
                    <p className="text-xs text-brand-navy/45">
                      {row.email ?? "-"}
                      {row.whatsapp ? ` · ${row.whatsapp}` : ""}
                      {row.city ? ` · ${row.city}` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-bold text-brand-navy">
                    {row.total_all ?? 0}/90
                    <p className="text-xs font-normal text-brand-navy/45">
                      Atas {row.total_top ?? 0} · Bawah {row.total_bottom ?? 0}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        row.is_complete_pattern
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {row.is_complete_pattern ? "Lengkap" : "Cek jawaban"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        row.review_status === "reviewed"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {row.review_status === "reviewed" ? "Reviewed" : "Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-brand-navy/50">
                    {new Date(row.completed_at).toLocaleString("id-ID")}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/papikostik/${row.user_id}`}
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
