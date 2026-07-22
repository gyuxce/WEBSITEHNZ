import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { CFIT_MAX_RAW } from "../data/cfitQuestions";
import { categoryFromIq, type CfitCategoryColor } from "../lib/cfitScoring";
import type { CfitResult } from "../lib/database.types";

const CATEGORY_STYLE: Record<
  CfitCategoryColor,
  { badge: string; panel: string; dot: string; short: string }
> = {
  red: {
    short: "Merah",
    badge: "bg-red-100 text-red-800 border-red-200",
    panel: "border-red-200 bg-red-50",
    dot: "bg-red-500",
  },
  yellow: {
    short: "Kuning",
    badge: "bg-amber-100 text-amber-900 border-amber-200",
    panel: "border-amber-200 bg-amber-50",
    dot: "bg-amber-400",
  },
  green: {
    short: "Hijau",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    panel: "border-emerald-200 bg-emerald-50",
    dot: "bg-emerald-500",
  },
};

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
        <p className="text-sm text-brand-navy/60">Selesaikan tes CFIT terlebih dahulu.</p>
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
        <p className="text-sm text-brand-red">{error || "Hasil belum ditemukan."}</p>
        <Link to="/dashboard" className="mt-4 inline-block text-sm font-semibold text-brand-red">
          Kembali ke dashboard
        </Link>
      </div>
    );
  }

  const fallback = categoryFromIq(result.iq);
  const color = (result.category_color ?? fallback.category_color) as CfitCategoryColor;
  const categoryLabel = result.category_label || fallback.category_label;
  const style = CATEGORY_STYLE[color];

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        to="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-brand-navy/50 hover:text-brand-red"
      >
        <ArrowLeft size={16} /> Dashboard
      </Link>

      <div className="rounded-2xl border border-brand-navy/8 bg-white p-8 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-red">Hasil CFIT 3A</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold text-brand-navy">
          IQ {result.iq} — {result.classification_label}
        </h1>
        <p className="mt-2 text-sm text-brand-navy/55">
          Klasifikasi: <strong className="text-brand-navy">{result.classification}</strong>
          {" · "}
          Norma {result.age_band} (usia {result.age_years} th {result.age_months} bln)
        </p>

        <div className={`mt-5 rounded-xl border p-4 ${style.panel}`}>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${style.badge}`}
            >
              <span className={`h-2 w-2 rounded-full ${style.dot}`} />
              {style.short}
            </span>
            <p className="text-sm font-semibold text-brand-navy">{categoryLabel}</p>
          </div>
          <ul className="mt-3 space-y-1 text-xs text-brand-navy/60">
            <li>• Merah — Borderline &amp; di bawahnya (IQ &lt; 80)</li>
            <li>• Kuning — Rata-rata bawah (IQ 80–89)</li>
            <li>• Hijau — Rata-rata ke atas (IQ ≥ 90)</li>
          </ul>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Stat label="IQ" value={String(result.iq)} />
          <Stat label="Skor mentah" value={`${result.score_raw}/${CFIT_MAX_RAW}`} />
          <Stat label="Norma" value={result.age_band} />
        </div>

        <div className="mt-6 grid gap-2 text-sm text-brand-navy/70 sm:grid-cols-4">
          <Mini label="Subtes 1" value={result.score_subtest1} max={13} />
          <Mini label="Subtes 2" value={result.score_subtest2} max={14} />
          <Mini label="Subtes 3" value={result.score_subtest3} max={13} />
          <Mini label="Subtes 4" value={result.score_subtest4} max={10} />
        </div>

        <div className="mt-8 rounded-xl border border-dashed border-brand-navy/15 bg-brand-bg/60 p-5">
          <p className="font-bold text-brand-navy">Tahap berikutnya: Papikostik</p>
          <p className="mt-1 text-sm text-brand-navy/55">
            Tes kepribadian sudah terbuka di dashboard. Materi &amp; review psikolog (SLA 1×24 jam)
            menyusul — untuk sekarang status menunggu materi.
          </p>
          <Link
            to="/dashboard"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand-red"
          >
            Kembali ke dashboard <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-brand-bg p-4 text-center">
      <p className="text-[11px] font-bold uppercase tracking-wide text-brand-navy/40">{label}</p>
      <p className="mt-1 font-display text-xl font-extrabold text-brand-navy">{value}</p>
    </div>
  );
}

function Mini({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div className="rounded-lg border border-brand-navy/8 px-3 py-2 text-center">
      <p className="text-[10px] font-bold uppercase text-brand-navy/40">{label}</p>
      <p className="font-bold text-brand-navy">
        {value}/{max}
      </p>
    </div>
  );
}
