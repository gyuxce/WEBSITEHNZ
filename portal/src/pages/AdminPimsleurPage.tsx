import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { PIMSLEUR_MAX_SCORE } from "../data/pimsleurQuestions";
import type { PimsleurResult } from "../lib/database.types";

type AdminRow = PimsleurResult & {
  full_name: string;
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
      const { data: results, error: qError } = await supabase
        .from("pimsleur_results")
        .select("*")
        .order("completed_at", { ascending: false });

      if (qError) {
        setError(qError.message);
        setLoading(false);
        return;
      }

      const list = results ?? [];
      const ids = [...new Set(list.map((r) => r.user_id))];
      const { data: profiles } = ids.length
        ? await supabase.from("profiles").select("id, full_name, whatsapp, city").in("id", ids)
        : { data: [] };

      const map = new Map((profiles ?? []).map((p) => [p.id, p]));
      setRows(
        list.map((r) => ({
          ...r,
          full_name: map.get(r.user_id)?.full_name ?? "—",
          whatsapp: map.get(r.user_id)?.whatsapp ?? null,
          city: map.get(r.user_id)?.city ?? null,
        })),
      );
      setLoading(false);
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
        <ArrowLeft size={16} /> Dashboard
      </Link>

      <h1 className="font-display text-2xl font-extrabold text-brand-navy">
        Admin — Hasil Pimsleur
      </h1>
      <p className="mt-1 text-sm text-brand-navy/50">
        Daftar peserta, skor per tahap, dan grade A–F.
      </p>

      {loading || authLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-red border-t-transparent" />
        </div>
      ) : error ? (
        <p className="mt-6 text-sm text-brand-red">{error}</p>
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
                    <p className="font-semibold text-brand-navy">{row.full_name}</p>
                    <p className="text-xs text-brand-navy/45">
                      {row.city ?? "—"} · {row.whatsapp ?? "—"}
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
