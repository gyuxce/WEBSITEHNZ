import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ClipboardCheck } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

type PapiStatus = {
  total_all: number | null;
  completed_at: string;
  review_status: "pending" | "reviewed" | "approved";
  final_summary: string | null;
};

export function PapikostikResultPage() {
  const { user, progress } = useAuth();
  const [result, setResult] = useState<PapiStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const papikostikDone = progress?.papikostik_test_status === "completed";

  useEffect(() => {
    if (!user || !papikostikDone) {
      setLoading(false);
      return;
    }

    async function load() {
      const { data, error: qError } = await supabase
        .rpc("get_own_papikostik_status")
        .maybeSingle();

      if (qError) setError(qError.message);
      else setResult(data);
      setLoading(false);
    }

    void load();
  }, [user, papikostikDone]);

  if (!papikostikDone) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <p className="text-sm text-brand-navy/60">Selesaikan PAPI Kostick terlebih dahulu.</p>
        <Link to="/test/papikostik" className="mt-4 inline-block text-sm font-semibold text-brand-red">
          Ke tes PAPI Kostick
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
        <p className="text-sm text-brand-red">{error || "Hasil PAPI Kostick belum ditemukan."}</p>
        <Link to="/dashboard" className="mt-4 inline-block text-sm font-semibold text-brand-red">
          Kembali ke dashboard
        </Link>
      </div>
    );
  }

  const psychologistReviewed = result.review_status === "reviewed";
  const approved = result.review_status === "approved";

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        to="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-brand-navy/50 hover:text-brand-red"
      >
        <ArrowLeft size={16} /> Dashboard
      </Link>

      <div className="rounded-2xl border border-brand-navy/8 bg-white p-8 shadow-sm">
        <ClipboardCheck className="text-brand-red" size={32} />
        <p className="mt-5 text-xs font-bold uppercase tracking-widest text-brand-red">
          PAPI Kostick
        </p>
        <h1 className="mt-1 font-display text-2xl font-extrabold text-brand-navy">
          {approved
            ? "Hasil akhir disetujui"
            : psychologistReviewed
              ? "Review psikolog selesai"
              : "Jawaban sudah tersimpan"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-brand-navy/55">
          {approved
            ? "Narasi hasil telah melewati review psikolog, QC internal, dan persetujuan admin."
            : psychologistReviewed
              ? "Pembacaan psikolog selesai. Narasi untuk peserta masih menunggu QC dan persetujuan admin."
            : "Hasil PAPI Kostick sedang menunggu pembacaan psikolog/admin. Interpretasi final akan digabungkan dengan Pimsleur dan CFIT."}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Stat
            label="Status"
            value={approved ? "Disetujui" : psychologistReviewed ? "Reviewed" : "Pending"}
          />
          <Stat label="Jawaban" value={`${result.total_all ?? 0}/90`} />
          <Stat label="Selesai" value={new Date(result.completed_at).toLocaleDateString("id-ID")} />
        </div>

        {approved && result.final_summary ? (
          <div className="mt-6 rounded-xl bg-brand-bg p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-brand-navy/40">
              Narasi hasil
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-brand-navy/70">
              {result.final_summary}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-brand-bg p-4 text-center">
      <p className="text-[11px] font-bold uppercase tracking-wide text-brand-navy/40">{label}</p>
      <p className="mt-1 font-display text-lg font-extrabold text-brand-navy">{value}</p>
    </div>
  );
}
