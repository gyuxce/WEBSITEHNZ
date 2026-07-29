import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
  CFIT_ANSWER_KEYS,
  CFIT_SUBTESTS,
  CFIT_TOTAL_QUESTIONS,
  type CfitAnswerValue,
} from "../data/cfitQuestions";
import { supabase } from "../lib/supabase";
import type { Json } from "../lib/database.types";

type CfitDetail = {
  id: string;
  user_id: string;
  answers: Json;
  raw_subtest1: number | null;
  raw_subtest2: number | null;
  raw_subtest3: number | null;
  raw_subtest4: number | null;
  raw_total: number | null;
  iq: number | null;
  category: string | null;
  age_years: number | null;
  age_months: number | null;
  norm_code: string | null;
  duration_seconds: number | null;
  completed_at: string;
  full_name: string;
  email: string | null;
  whatsapp: string | null;
  city: string | null;
  birth_date: string | null;
};

export function AdminCfitDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const { profile, loading: authLoading } = useAuth();
  const [row, setRow] = useState<CfitDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId || authLoading || profile?.role !== "admin") return;

    async function load() {
      const { data, error: qError } = await supabase.rpc("admin_get_cfit_detail", {
        p_user_id: userId!,
      });

      if (qError) {
        setError(qError.message);
        setLoading(false);
        return;
      }

      const first = Array.isArray(data) ? data[0] : data;
      setRow((first as CfitDetail) ?? null);
      setLoading(false);
    }

    void load();
  }, [userId, authLoading, profile?.role]);

  const answers = useMemo(
    () => ((row?.answers ?? {}) as Record<string, CfitAnswerValue>),
    [row?.answers],
  );

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

  if (error || !row) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <p className="text-sm text-brand-red">{error || "Hasil CFIT tidak ditemukan."}</p>
        <Link to="/admin/cfit" className="mt-4 inline-block text-sm font-semibold text-brand-red">
          Kembali
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        to="/admin/cfit"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-brand-navy/50 hover:text-brand-red"
      >
        <ArrowLeft size={16} /> Daftar hasil CFIT
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

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <Stat label="Raw Total" value={`${row.raw_total ?? 0}/${CFIT_TOTAL_QUESTIONS}`} />
        <Stat label="IQ" value={String(row.iq ?? "-")} />
        <Stat label="Norma" value={row.norm_code ?? "-"} />
        <Stat label="Usia" value={formatAge(row.age_years, row.age_months)} />
      </div>

      <p className="mt-4 rounded-xl bg-brand-bg p-4 text-sm font-semibold text-brand-navy/75">
        {row.category ?? "Kategori belum tersedia"}
      </p>

      <div className="mt-8 space-y-8">
        {CFIT_SUBTESTS.map((subtest) => (
          <section key={subtest.id}>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-brand-navy">{subtest.title}</h2>
                <p className="text-xs text-brand-navy/45">{subtest.instruction}</p>
              </div>
              <span className="rounded-full bg-brand-red-soft px-3 py-1 text-xs font-bold text-brand-red">
                Skor {getSubtestScore(row, subtest.id)}/{subtest.questions.length}
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {subtest.questions.map((question) => {
                const actual = answers[question.id];
                const expected = CFIT_ANSWER_KEYS[question.id];
                const correct = normalizeAnswer(actual) === normalizeAnswer(expected);

                return (
                  <div
                    key={question.id}
                    className="rounded-2xl border border-brand-navy/8 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-bold text-brand-navy">Soal {question.number}</p>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                          correct ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                        }`}
                      >
                        {correct ? "Benar" : "Salah"}
                      </span>
                    </div>
                    <img
                      src={question.imageSrc}
                      alt={`CFIT subtes ${question.subtest} soal ${question.number}`}
                      className="mt-3 max-h-44 w-full object-contain"
                    />
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <AnswerBox label="Jawaban peserta" value={formatAnswer(actual)} />
                      <AnswerBox label="Kunci" value={formatAnswer(expected)} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function getSubtestScore(row: CfitDetail, subtestId: number) {
  if (subtestId === 1) return row.raw_subtest1 ?? 0;
  if (subtestId === 2) return row.raw_subtest2 ?? 0;
  if (subtestId === 3) return row.raw_subtest3 ?? 0;
  return row.raw_subtest4 ?? 0;
}

function normalizeAnswer(value: CfitAnswerValue | undefined) {
  if (Array.isArray(value)) return [...value].map((item) => item.toUpperCase()).sort().join("|");
  return value?.toUpperCase() ?? "";
}

function formatAnswer(value: CfitAnswerValue | undefined) {
  if (Array.isArray(value)) return value.join(", ");
  return value ?? "-";
}

function formatAge(years: number | null, months: number | null) {
  if (years === null) return "-";
  return `${years} th ${months ?? 0} bln`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-brand-navy/8 bg-white p-4 text-center">
      <p className="text-[11px] font-bold uppercase tracking-wide text-brand-navy/40">{label}</p>
      <p className="mt-1 font-display text-xl font-extrabold text-brand-navy">{value}</p>
    </div>
  );
}

function AnswerBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-brand-bg px-3 py-2">
      <p className="font-bold uppercase tracking-wide text-brand-navy/40">{label}</p>
      <p className="mt-1 text-sm font-bold text-brand-navy">{value}</p>
    </div>
  );
}
