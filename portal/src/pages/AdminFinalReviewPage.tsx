import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Award, CheckCircle2, Save } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/database.types";

type FinalAssessment =
  Database["public"]["Functions"]["admin_get_final_assessment"]["Returns"][number];

export function AdminFinalReviewPage() {
  const { userId } = useParams<{ userId: string }>();
  const { profile, loading: authLoading, refreshProfile } = useAuth();
  const [assessment, setAssessment] = useState<FinalAssessment | null>(null);
  const [psychologistInterpretation, setPsychologistInterpretation] = useState("");
  const [participantSummary, setParticipantSummary] = useState("");
  const [qcNotes, setQcNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!userId || authLoading || profile?.role !== "admin") return;

    async function load() {
      const { data, error: queryError } = await supabase.rpc("admin_get_final_assessment", {
        p_user_id: userId!,
      });
      const first = data?.[0] ?? null;

      if (queryError || !first) {
        setError(queryError?.message ?? "Data asesmen final tidak ditemukan.");
        setLoading(false);
        return;
      }

      setAssessment(first);
      setPsychologistInterpretation(first.psychologist_interpretation ?? "");
      setParticipantSummary(first.participant_summary ?? "");
      setQcNotes(first.qc_notes ?? "");
      setLoading(false);
    }

    void load();
  }, [userId, authLoading, profile?.role]);

  const allTestsComplete = useMemo(
    () =>
      assessment?.pimsleur_score_total !== null &&
      assessment?.cfit_raw_total !== null &&
      assessment?.papi_total_all !== null,
    [assessment],
  );
  const approved = assessment?.final_review_status === "approved";

  async function saveDraft() {
    if (!userId || !assessment) return;
    setSaving(true);
    setError("");
    setMessage("");

    const { data, error: saveError } = await supabase.rpc("admin_upsert_final_review", {
      p_user_id: userId,
      p_psychologist_interpretation: psychologistInterpretation,
      p_participant_summary: participantSummary,
      p_qc_notes: qcNotes,
    });

    if (saveError) {
      setError(saveError.message);
      setSaving(false);
      return;
    }

    setAssessment({
      ...assessment,
      review_id: data.id,
      psychologist_interpretation: data.psychologist_interpretation,
      participant_summary: data.participant_summary,
      qc_notes: data.qc_notes,
      final_review_status: data.status,
      approved_at: data.approved_at,
    });
    setMessage("Draft review berhasil disimpan.");
    setSaving(false);
  }

  async function publishAssessment() {
    if (!userId || !assessment) return;
    if (!psychologistInterpretation.trim() || !participantSummary.trim()) {
      setError("Isi interpretasi psikolog dan narasi peserta sebelum menerbitkan sertifikat.");
      return;
    }
    if (!window.confirm("Setujui hasil final dan terbitkan sertifikat peserta ini?")) return;

    setPublishing(true);
    setError("");
    setMessage("");
    const { data, error: publishError } = await supabase.rpc("admin_publish_assessment", {
      p_user_id: userId,
    });

    if (publishError) {
      setError(publishError.message);
      setPublishing(false);
      return;
    }

    setAssessment({
      ...assessment,
      final_review_status: "approved",
      approved_at: new Date().toISOString(),
      certificate_code: data?.[0]?.certificate_code ?? assessment.certificate_code,
    });
    setMessage(`Sertifikat berhasil diterbitkan: ${data?.[0]?.certificate_code ?? "-"}`);
    await refreshProfile();
    setPublishing(false);
  }

  if (!authLoading && profile?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading || authLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-red border-t-transparent" />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <p className="text-sm text-brand-red">{error || "Data tidak ditemukan."}</p>
        <Link to="/admin/recap" className="mt-4 inline-block text-sm font-semibold text-brand-red">
          Kembali ke rekap
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        to="/admin/recap"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-brand-navy/50 hover:text-brand-red"
      >
        <ArrowLeft size={16} /> Rekap asesmen
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-brand-red">
            Review final admin
          </p>
          <h1 className="font-display text-2xl font-extrabold text-brand-navy">
            {assessment.full_name}
          </h1>
          <p className="mt-1 text-sm text-brand-navy/50">{assessment.email ?? "-"}</p>
        </div>
        <StatusBadge status={assessment.final_review_status} />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Score label="Pimsleur" value={`${assessment.pimsleur_score_total ?? "-"} · Grade ${assessment.pimsleur_grade ?? "-"}`} />
        <Score label="CFIT" value={`Raw ${assessment.cfit_raw_total ?? "-"} · IQ ${assessment.cfit_iq ?? "-"}`} />
        <Score label="PAPI Kostick" value={`${assessment.papi_total_all ?? "-"}/90 · ${assessment.papi_review_status ?? "-"}`} />
      </div>

      {!allTestsComplete ? (
        <div className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
          Sertifikat belum dapat diterbitkan karena belum semua tes memiliki hasil.
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <ReviewField
          label="Interpretasi psikolog"
          value={psychologistInterpretation}
          onChange={setPsychologistInterpretation}
          placeholder="Masukkan hasil pembacaan dan interpretasi psikolog. Ini bersifat internal."
          disabled={approved}
        />
        <ReviewField
          label="Narasi untuk peserta / hasil refined"
          value={participantSummary}
          onChange={setParticipantSummary}
          placeholder="Tulis ulang dengan bahasa yang konsultatif, jelas, dan sesuai untuk peserta."
          disabled={approved}
        />
      </div>

      <div className="mt-6">
        <ReviewField
          label="Catatan QC internal"
          value={qcNotes}
          onChange={setQcNotes}
          placeholder="Catatan perubahan, pengecekan, atau alasan persetujuan internal."
          disabled={approved}
        />
      </div>

      {error ? <p className="mt-5 rounded-lg bg-brand-red-soft px-3 py-2 text-sm text-brand-red">{error}</p> : null}
      {message ? <p className="mt-5 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}

      <div className="mt-6 flex flex-wrap gap-3">
        {!approved ? (
          <>
            <button
              type="button"
              onClick={() => void saveDraft()}
              disabled={saving || publishing || !allTestsComplete}
              className="inline-flex items-center gap-2 rounded-xl border border-brand-navy/15 px-5 py-3 text-sm font-bold text-brand-navy disabled:opacity-50"
            >
              <Save size={18} /> {saving ? "Menyimpan..." : "Simpan draft review"}
            </button>
            <button
              type="button"
              onClick={() => void publishAssessment()}
              disabled={saving || publishing || !allTestsComplete}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-red px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              <CheckCircle2 size={18} />
              {publishing ? "Menerbitkan..." : "Setujui & terbitkan sertifikat"}
            </button>
          </>
        ) : (
          <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-700">
            <Award size={18} /> Sertifikat {assessment.certificate_code ?? "sudah diterbitkan"}
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewField({
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-bold uppercase tracking-wide text-brand-navy/45">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        rows={10}
        placeholder={placeholder}
        className="rounded-xl border border-brand-navy/12 bg-white px-4 py-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-red/30 disabled:bg-brand-bg disabled:text-brand-navy/60"
      />
    </label>
  );
}

function Score({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-brand-navy/8 bg-white p-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-brand-navy/40">{label}</p>
      <p className="mt-1 text-sm font-extrabold text-brand-navy">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: FinalAssessment["final_review_status"] }) {
  const config = {
    locked: ["Belum siap", "bg-brand-bg text-brand-navy/50"],
    pending_psychologist: ["Menunggu interpretasi psikolog", "bg-amber-50 text-amber-700"],
    pending_qc: ["Menunggu QC / persetujuan", "bg-brand-red-soft text-brand-red"],
    approved: ["Disetujui & terbit", "bg-emerald-50 text-emerald-700"],
  }[status];

  return <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${config[1]}`}>{config[0]}</span>;
}
