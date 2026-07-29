import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
  PAPI_FACTORS,
  PAPI_QUESTIONS,
  getPapiAnalysis,
  type PapiAnswers,
  type PapiChoice,
  type PapiFactorCode,
} from "../data/papikostikQuestions";
import { supabase } from "../lib/supabase";
import type { Json } from "../lib/database.types";
import { PapiProfileChart } from "../components/PapiProfileChart";

type PapikostikDetail = {
  id: string;
  user_id: string;
  answers: Json;
  scores: Json;
  analyses: Json;
  total_top: number | null;
  total_bottom: number | null;
  total_all: number | null;
  is_complete_pattern: boolean | null;
  review_status: "pending" | "reviewed";
  psychologist_notes: string | null;
  final_summary: string | null;
  duration_seconds: number | null;
  completed_at: string;
  reviewed_at: string | null;
  full_name: string;
  email: string | null;
  whatsapp: string | null;
  city: string | null;
};

const ASPECTS = ["Arah kerja", "Kepemimpinan", "Aktivitas", "Pergaulan", "Gaya kerja", "Sifat", "Ketaatan"];

export function AdminPapikostikDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const { profile, loading: authLoading } = useAuth();
  const [row, setRow] = useState<PapikostikDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [notes, setNotes] = useState("");
  const [summary, setSummary] = useState("");

  useEffect(() => {
    if (!userId || authLoading || profile?.role !== "admin") return;

    async function load() {
      const { data, error: qError } = await supabase.rpc("admin_get_papikostik_detail", {
        p_user_id: userId!,
      });

      if (qError) {
        setError(qError.message);
        setLoading(false);
        return;
      }

      const first = Array.isArray(data) ? data[0] : data;
      const detail = (first as PapikostikDetail) ?? null;
      setRow(detail);
      setNotes(detail?.psychologist_notes ?? "");
      setSummary(detail?.final_summary ?? "");
      setLoading(false);
    }

    void load();
  }, [userId, authLoading, profile?.role]);

  const answers = useMemo(() => ((row?.answers ?? {}) as PapiAnswers), [row?.answers]);
  const scores = useMemo(
    () => ((row?.scores ?? {}) as Partial<Record<PapiFactorCode, number>>),
    [row?.scores],
  );

  async function saveReview() {
    if (!row) return;
    setSaving(true);
    setError("");
    setSaveMessage("");

    const reviewedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("papikostik_results")
      .update({
        review_status: "reviewed",
        psychologist_notes: notes.trim() || null,
        final_summary: summary.trim() || null,
        reviewed_at: reviewedAt,
      })
      .eq("user_id", row.user_id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setRow({
      ...row,
      review_status: "reviewed",
      psychologist_notes: notes.trim() || null,
      final_summary: summary.trim() || null,
      reviewed_at: reviewedAt,
    });
    setSaveMessage("Review berhasil disimpan.");
    setSaving(false);
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

  if (error && !row) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <p className="text-sm text-brand-red">{error}</p>
        <Link to="/admin/papikostik" className="mt-4 inline-block text-sm font-semibold text-brand-red">
          Kembali
        </Link>
      </div>
    );
  }

  if (!row) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <p className="text-sm text-brand-red">Hasil PAPI Kostick tidak ditemukan.</p>
        <Link to="/admin/papikostik" className="mt-4 inline-block text-sm font-semibold text-brand-red">
          Kembali
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        to="/admin/papikostik"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-brand-navy/50 hover:text-brand-red"
      >
        <ArrowLeft size={16} /> Daftar hasil PAPI
      </Link>

      <div>
        <h1 className="font-display text-2xl font-extrabold text-brand-navy">
          {row.full_name || "Peserta"}
        </h1>
        <p className="mt-1 text-sm text-brand-navy/50">
          {row.email ? `${row.email} · ` : ""}
          {row.whatsapp ? `${row.whatsapp} · ` : ""}
          Selesai {new Date(row.completed_at).toLocaleString("id-ID")}
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-5">
        <Stat label="Total" value={`${row.total_all ?? 0}/90`} />
        <Stat label="Atas" value={String(row.total_top ?? 0)} />
        <Stat label="Bawah" value={String(row.total_bottom ?? 0)} />
        <Stat label="Durasi" value={formatDuration(row.duration_seconds)} />
        <Stat label="Review" value={row.review_status === "reviewed" ? "Reviewed" : "Pending"} />
      </div>

      {!row.is_complete_pattern ? (
        <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          Pola total tidak 45/45. Cek kemungkinan data jawaban belum lengkap atau mapping perlu
          diverifikasi.
        </p>
      ) : null}

      <div className="mt-8">
        <PapiProfileChart scores={scores} />
      </div>

      <div className="mt-8 space-y-6">
        {ASPECTS.map((aspect) => (
          <section key={aspect}>
            <h2 className="mb-3 font-display text-lg font-bold text-brand-navy">{aspect}</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {PAPI_FACTORS.filter((factor) => factor.aspect === aspect).map((factor) => {
                const score = scores[factor.code] ?? 0;
                return (
                  <div key={factor.code} className="rounded-2xl border border-brand-navy/8 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-brand-red">
                          {factor.code}
                        </p>
                        <p className="mt-1 text-sm font-bold text-brand-navy">{factor.name}</p>
                      </div>
                      <span className="rounded-full bg-brand-red-soft px-3 py-1 text-sm font-extrabold text-brand-red">
                        {score}/9
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-brand-navy/60">
                      {getPapiAnalysis(factor.code, score)}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <section className="mt-8 rounded-2xl border border-brand-navy/8 bg-white p-5">
        <h2 className="font-display text-lg font-bold text-brand-navy">Review psikolog/admin</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-brand-navy/45">
              Catatan psikolog
            </span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={8}
              className="rounded-xl border border-brand-navy/12 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30"
              placeholder="Catatan detail untuk pembacaan psikolog/admin"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-brand-navy/45">
              Ringkasan akhir
            </span>
            <textarea
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              rows={8}
              className="rounded-xl border border-brand-navy/12 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30"
              placeholder="Ringkasan yang bisa dipakai untuk rekap final"
            />
          </label>
        </div>
        {error ? <p className="mt-4 text-sm text-brand-red">{error}</p> : null}
        {saveMessage ? <p className="mt-4 text-sm text-emerald-700">{saveMessage}</p> : null}
        <button
          type="button"
          onClick={() => void saveReview()}
          disabled={saving}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-red px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          <Save size={18} />
          {saving ? "Menyimpan..." : "Simpan review"}
        </button>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-display text-lg font-bold text-brand-navy">Detail jawaban</h2>
        <div className="overflow-x-auto rounded-2xl border border-brand-navy/8 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-brand-navy/8 bg-brand-bg text-xs uppercase tracking-wide text-brand-navy/45">
              <tr>
                <th className="px-4 py-3 font-bold">No</th>
                <th className="px-4 py-3 font-bold">Pilihan</th>
                <th className="px-4 py-3 font-bold">Faktor</th>
                <th className="px-4 py-3 font-bold">Pernyataan dipilih</th>
              </tr>
            </thead>
            <tbody>
              {PAPI_QUESTIONS.map((question) => {
                const choice = answers[question.id] as PapiChoice | undefined;
                return (
                  <tr key={question.id} className="border-b border-brand-navy/5 last:border-0">
                    <td className="px-4 py-3 font-bold text-brand-navy">{question.number}</td>
                    <td className="px-4 py-3 text-brand-navy">{choice ?? "-"}</td>
                    <td className="px-4 py-3 text-brand-navy">
                      {choice === "A" ? question.factorA : choice === "B" ? question.factorB : "-"}
                    </td>
                    <td className="px-4 py-3 text-brand-navy/65">
                      {choice === "A" ? question.optionA : choice === "B" ? question.optionB : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function formatDuration(seconds: number | null) {
  if (seconds === null) return "-";
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}m ${rest}s`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-brand-navy/8 bg-white p-4 text-center">
      <p className="text-[11px] font-bold uppercase tracking-wide text-brand-navy/40">{label}</p>
      <p className="mt-1 font-display text-lg font-extrabold text-brand-navy">{value}</p>
    </div>
  );
}
