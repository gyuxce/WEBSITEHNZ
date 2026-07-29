import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { PIMSLEUR_MAX_SCORE } from "../data/pimsleurQuestions";
import { supabase } from "../lib/supabase";

type PimsleurRow = {
  user_id: string;
  score_total: number;
  grade: string;
  completed_at: string;
  full_name: string;
  email: string | null;
  whatsapp: string | null;
  city: string | null;
};

type CfitRow = {
  user_id: string;
  raw_total: number | null;
  iq: number | null;
  category: string | null;
  completed_at: string;
  full_name: string;
  email: string | null;
  whatsapp: string | null;
  city: string | null;
};

type PapikostikRow = {
  user_id: string;
  total_all: number | null;
  is_complete_pattern: boolean | null;
  review_status: "pending" | "reviewed";
  completed_at: string;
  full_name: string;
  email: string | null;
  whatsapp: string | null;
  city: string | null;
};

type RecapRow = {
  userId: string;
  fullName: string;
  email: string | null;
  whatsapp: string | null;
  city: string | null;
  pimsleur: PimsleurRow | null;
  cfit: CfitRow | null;
  papikostik: PapikostikRow | null;
};

export function AdminRecapPage() {
  const { profile, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<RecapRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading || profile?.role !== "admin") return;

    async function load() {
      const [pimsleurResponse, cfitResponse, papikostikResponse] = await Promise.all([
        supabase.rpc("admin_list_pimsleur_results"),
        supabase.rpc("admin_list_cfit_results"),
        supabase.rpc("admin_list_papikostik_results"),
      ]);

      const responseError =
        pimsleurResponse.error ?? cfitResponse.error ?? papikostikResponse.error;
      if (responseError) {
        setError(responseError.message);
        setLoading(false);
        return;
      }

      const recapMap = new Map<string, RecapRow>();
      const getRow = (value: {
        user_id: string;
        full_name: string;
        email: string | null;
        whatsapp: string | null;
        city: string | null;
      }) => {
        const existing = recapMap.get(value.user_id);
        if (existing) return existing;

        const newRow: RecapRow = {
          userId: value.user_id,
          fullName: value.full_name || "Peserta",
          email: value.email,
          whatsapp: value.whatsapp,
          city: value.city,
          pimsleur: null,
          cfit: null,
          papikostik: null,
        };
        recapMap.set(value.user_id, newRow);
        return newRow;
      };

      for (const result of (pimsleurResponse.data as PimsleurRow[] | null) ?? []) {
        getRow(result).pimsleur = result;
      }
      for (const result of (cfitResponse.data as CfitRow[] | null) ?? []) {
        getRow(result).cfit = result;
      }
      for (const result of (papikostikResponse.data as PapikostikRow[] | null) ?? []) {
        getRow(result).papikostik = result;
      }

      setRows(
        [...recapMap.values()].sort((a, b) => a.fullName.localeCompare(b.fullName, "id")),
      );
      setLoading(false);
    }

    void load();
  }, [authLoading, profile?.role]);

  const completedCount = useMemo(
    () =>
      rows.filter((row) => row.pimsleur && row.cfit && row.papikostik).length,
    [rows],
  );

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

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-brand-red">
            Admin-only
          </p>
          <h1 className="font-display text-2xl font-extrabold text-brand-navy">
            Rekap asesmen peserta
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-brand-navy/50">
            Ringkasan Pimsleur, CFIT, dan PAPI Kostick dalam satu tampilan. Kesimpulan akhir tetap
            diisi manual oleh psikolog/admin.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-brand-bg px-4 py-3 text-sm font-semibold text-brand-navy/65">
          <ClipboardList size={18} className="text-brand-red" />
          {completedCount}/{rows.length} lengkap
        </div>
      </div>

      {loading || authLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-red border-t-transparent" />
        </div>
      ) : error ? (
        <div className="mt-6 space-y-2">
          <p className="text-sm text-brand-red">{error}</p>
          <p className="text-xs text-brand-navy/50">
            Pastikan migration admin Pimsleur, CFIT, dan PAPI Kostick sudah dijalankan di Supabase.
          </p>
        </div>
      ) : rows.length === 0 ? (
        <p className="mt-6 text-sm text-brand-navy/50">Belum ada hasil asesmen peserta.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-brand-navy/8 bg-white">
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="border-b border-brand-navy/8 bg-brand-bg text-xs uppercase tracking-wide text-brand-navy/45">
              <tr>
                <th className="px-4 py-3 font-bold">Peserta</th>
                <th className="px-4 py-3 font-bold">Pimsleur</th>
                <th className="px-4 py-3 font-bold">CFIT</th>
                <th className="px-4 py-3 font-bold">PAPI Kostick</th>
                <th className="px-4 py-3 font-bold">Detail</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.userId} className="border-b border-brand-navy/5 align-top last:border-0">
                  <td className="px-4 py-4">
                    <p className="font-semibold text-brand-navy">{row.fullName}</p>
                    <p className="mt-1 text-xs text-brand-navy/45">
                      {row.email ?? "-"}
                      {row.whatsapp ? ` - ${row.whatsapp}` : ""}
                      {row.city ? ` - ${row.city}` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <Status done={Boolean(row.pimsleur)} />
                    {row.pimsleur ? (
                      <p className="mt-2 text-xs text-brand-navy/65">
                        {row.pimsleur.score_total}/{PIMSLEUR_MAX_SCORE} - Grade {row.pimsleur.grade}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-4">
                    <Status done={Boolean(row.cfit)} />
                    {row.cfit ? (
                      <p className="mt-2 text-xs text-brand-navy/65">
                        Raw {row.cfit.raw_total ?? "-"}/50 - IQ {row.cfit.iq ?? "-"}
                        <br />
                        {row.cfit.category ?? "Kategori belum tersedia"}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-4">
                    <Status done={Boolean(row.papikostik)} />
                    {row.papikostik ? (
                      <p className="mt-2 text-xs text-brand-navy/65">
                        {row.papikostik.total_all ?? 0}/90 -{" "}
                        {row.papikostik.review_status === "reviewed" ? "Reviewed" : "Menunggu review"}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col items-start gap-1.5 text-xs font-bold">
                      <DetailLink href={row.pimsleur ? `/admin/pimsleur/${row.userId}` : null} label="Pimsleur" />
                      <DetailLink href={row.cfit ? `/admin/cfit/${row.userId}` : null} label="CFIT" />
                      <DetailLink href={row.papikostik ? `/admin/papikostik/${row.userId}` : null} label="PAPI" />
                    </div>
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

function Status({ done }: { done: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
        done ? "bg-emerald-50 text-emerald-700" : "bg-brand-bg text-brand-navy/45"
      }`}
    >
      {done ? "Selesai" : "Belum selesai"}
    </span>
  );
}

function DetailLink({ href, label }: { href: string | null; label: string }) {
  if (!href) return <span className="text-brand-navy/25">{label}</span>;
  return (
    <Link to={href} className="text-brand-red hover:underline">
      {label}
    </Link>
  );
}
