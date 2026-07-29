import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { PIMSLEUR_MAX_SCORE } from "../data/pimsleurQuestions";
import type { PimsleurResult } from "../lib/database.types";

const WHATSAPP_URL = "https://wa.me/message/DWVTJESHI2RQC1";

export function PimsleurResultPage() {
  const { user, progress } = useAuth();
  const [result, setResult] = useState<PimsleurResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const languageDone = progress?.language_test_status === "completed";

  useEffect(() => {
    if (!user || !languageDone) {
      setLoading(false);
      return;
    }

    async function load() {
      const { data, error: qError } = await supabase
        .from("pimsleur_results")
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
  }, [user, languageDone]);

  if (!languageDone) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <p className="text-sm text-brand-navy/60">Selesaikan tes Pimsleur terlebih dahulu.</p>
        <Link to="/test/pimsleur" className="mt-4 inline-block text-sm font-semibold text-brand-red">
          Ke tes Pimsleur
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

  const percent = Math.round((result.score_total / PIMSLEUR_MAX_SCORE) * 100);
  const cfitDone = progress?.cfit_test_status === "completed";
  const papikostikDone = progress?.papikostik_test_status === "completed";

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        to="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-brand-navy/50 hover:text-brand-red"
      >
        <ArrowLeft size={16} /> Dashboard
      </Link>

      <div className="rounded-2xl border border-brand-navy/8 bg-white p-8 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-red">Hasil Pimsleur</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold text-brand-navy">
          Grade {result.grade} — {result.grade_label}
        </h1>
        <p className="mt-2 text-sm text-brand-navy/55">
          Status: <strong className="text-brand-navy">{result.status_label}</strong>
        </p>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Total" value={`${result.score_total}/${PIMSLEUR_MAX_SCORE}`} />
          <Stat label="Persen" value={`${percent}%`} />
          <Stat label="Verbal" value={String(result.score_verbal)} />
          <Stat label="Audio" value={String(result.score_audio)} />
        </div>

        <div className="mt-6 grid gap-2 text-sm text-brand-navy/70 sm:grid-cols-5">
          <Mini label="Tahap 2" value={result.score_section2} />
          <Mini label="Tahap 3" value={result.score_section3} />
          <Mini label="Tahap 4" value={result.score_section4} />
          <Mini label="Tahap 5" value={result.score_section5} />
          <Mini label="Tahap 6" value={result.score_section6} />
        </div>

        <p className="mt-6 rounded-xl bg-brand-bg p-4 text-sm leading-relaxed text-brand-navy/70">
          {result.recommendation}
        </p>

        <div className="mt-8 rounded-xl border border-dashed border-brand-navy/15 bg-brand-bg/60 p-5">
          <p className="font-bold text-brand-navy">Tahap berikutnya</p>
          <p className="mt-1 text-sm text-brand-navy/55">
            Hasil Pimsleur sudah tersimpan. Lanjutkan CFIT terlebih dahulu. PAPI Kostick akan
            dibuka setelah CFIT selesai.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {!cfitDone ? (
              <Link
                to="/test/cfit"
                className="rounded-full bg-white px-4 py-2 text-xs font-bold text-brand-navy shadow-sm hover:text-brand-red"
              >
                Lanjut CFIT
              </Link>
            ) : null}
            {cfitDone && !papikostikDone ? (
              <Link
                to="/test/papikostik"
                className="rounded-full bg-white px-4 py-2 text-xs font-bold text-brand-navy shadow-sm hover:text-brand-red"
              >
                Lanjut PAPI Kostick
              </Link>
            ) : null}
          </div>
        </div>

        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-navy px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-navy-light"
        >
          <MessageCircle size={16} />
          Konsultasi WhatsApp
        </a>
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

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-brand-navy/8 px-3 py-2 text-center">
      <p className="text-[10px] font-bold uppercase text-brand-navy/40">{label}</p>
      <p className="font-bold text-brand-navy">{value}</p>
    </div>
  );
}
