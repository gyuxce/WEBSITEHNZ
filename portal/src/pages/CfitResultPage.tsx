import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { CFIT_TOTAL_QUESTIONS } from "../data/cfitQuestions";
import { calculateCfitIqFromNorm } from "../data/cfitScoring";
import { supabase } from "../lib/supabase";
import type { CfitResult } from "../lib/database.types";

export function CfitResultPage() {
  const { user, progress } = useAuth();
  const [result, setResult] = useState<CfitResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cfitDone = progress?.cfit_test_status === "completed";

  useEffect(() => {
    if (!user || !cfitDone) {
      setLoading(false);
      return;
    }

    async function load() {
      const { data, error: qError } = await supabase
        .from("cfit_results")
        .select("*")
        .eq("user_id", user!.id)
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (qError) setError(qError.message);
      else setResult(data);
      setLoading(false);
    }

    void load();
  }, [user, cfitDone]);

  if (!cfitDone) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <p className="text-sm text-brand-navy/60">Selesaikan CFIT terlebih dahulu.</p>
        <Link to="/test/cfit" className="mt-4 inline-block text-sm font-semibold text-brand-red">
          Ke tes CFIT
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-red border-t-transparent" />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <p className="text-sm text-brand-red">{error || "Hasil CFIT belum ditemukan."}</p>
        <Link to="/dashboard" className="mt-4 inline-block text-sm font-semibold text-brand-red">
          Kembali ke dashboard
        </Link>
      </div>
    );
  }

  const fallback = calculateCfitIqFromNorm(result.raw_total, result.norm_code);
  const displayIq = result.iq ?? fallback.iq;
  const displayCategory = result.category ?? fallback.category;

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        to="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-brand-navy/50 hover:text-brand-red"
      >
        <ArrowLeft size={16} /> Dashboard
      </Link>

      <div className="rounded-2xl border border-brand-navy/8 bg-white p-8 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-red">Hasil CFIT</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold text-brand-navy">
          IQ {displayIq ?? "-"}
        </h1>
        <p className="mt-2 text-sm text-brand-navy/55">
          {displayCategory ?? "Kategori belum tersedia"}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Raw Total" value={`${result.raw_total ?? 0}/${CFIT_TOTAL_QUESTIONS}`} />
          <Stat label="Norma" value={result.norm_code ?? "-"} />
          <Stat label="Usia" value={formatAge(result.age_years, result.age_months)} />
          <Stat label="Selesai" value={new Date(result.completed_at).toLocaleDateString("id-ID")} />
        </div>

        <div className="mt-6 grid gap-2 text-sm text-brand-navy/70 sm:grid-cols-4">
          <Mini label="Subtes 1" value={result.raw_subtest1} max={13} />
          <Mini label="Subtes 2" value={result.raw_subtest2} max={14} />
          <Mini label="Subtes 3" value={result.raw_subtest3} max={13} />
          <Mini label="Subtes 4" value={result.raw_subtest4} max={10} />
        </div>

        <p className="mt-6 rounded-xl bg-brand-bg p-4 text-sm leading-relaxed text-brand-navy/65">
          Hasil CFIT adalah bagian dari pemetaan potensi. Interpretasi final tetap digabungkan
          dengan Pimsleur dan PAPI Kostick.
        </p>
      </div>
    </div>
  );
}

function formatAge(years: number | null, months: number | null) {
  if (years === null) return "-";
  return `${years} th ${months ?? 0} bln`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-brand-bg p-4 text-center">
      <p className="text-[11px] font-bold uppercase tracking-wide text-brand-navy/40">{label}</p>
      <p className="mt-1 font-display text-xl font-extrabold text-brand-navy">{value}</p>
    </div>
  );
}

function Mini({ label, value, max }: { label: string; value: number | null; max: number }) {
  return (
    <div className="rounded-lg border border-brand-navy/8 px-3 py-2 text-center">
      <p className="text-[10px] font-bold uppercase text-brand-navy/40">{label}</p>
      <p className="font-bold text-brand-navy">
        {value ?? 0}/{max}
      </p>
    </div>
  );
}
