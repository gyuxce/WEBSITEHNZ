import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Clock, FileCheck } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
  PAPI_DURATION_SECONDS,
  PAPI_QUESTIONS,
  calculatePapiScores,
  type PapiAnswers,
  type PapiChoice,
  type PapiQuestion,
} from "../data/papikostikQuestions";
import { supabase } from "../lib/supabase";
import type { Json } from "../lib/database.types";

function formatTime(totalSeconds: number) {
  const seconds = Math.max(totalSeconds, 0);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function PapikostikTestPage() {
  const { user, progress, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<PapiAnswers>({});
  const [remaining, setRemaining] = useState(PAPI_DURATION_SECONDS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const startedAtRef = useRef<string | null>(null);

  const cfitDone = progress?.cfit_test_status === "completed";
  const alreadyDone = progress?.papikostik_test_status === "completed";
  const currentQuestion = PAPI_QUESTIONS[currentIndex];
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const allAnswered = answeredCount === PAPI_QUESTIONS.length;

  useEffect(() => {
    if (!started || submitting) return;
    const timer = window.setInterval(() => {
      setRemaining((value) => Math.max(value - 1, 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [started, submitting]);

  async function handleStart() {
    if (!user) return;
    setSubmitting(true);
    setError("");
    startedAtRef.current = new Date().toISOString();

    const { error: progressError } = await supabase
      .from("user_progress")
      .update({ papikostik_test_status: "in_progress" })
      .eq("user_id", user.id);

    if (progressError) {
      setSubmitting(false);
      setError(progressError.message);
      return;
    }

    await refreshProfile();
    setStarted(true);
    setSubmitting(false);
  }

  function selectAnswer(questionId: string, choice: PapiChoice) {
    setAnswers((previous) => ({ ...previous, [questionId]: choice }));
    setError("");
  }

  function goNext() {
    if (!answers[currentQuestion.id]) {
      setError("Pilih salah satu pernyataan yang paling sesuai sebelum lanjut.");
      return;
    }
    setError("");
    setCurrentIndex((value) => Math.min(value + 1, PAPI_QUESTIONS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleFinish() {
    if (!user) return;
    if (!allAnswered) {
      setError("Lengkapi semua 90 soal terlebih dahulu.");
      return;
    }

    setSubmitting(true);
    setError("");
    const completedAt = new Date();
    const duration = startedAtRef.current
      ? Math.max(0, Math.round((Date.now() - new Date(startedAtRef.current).getTime()) / 1000))
      : null;
    const scores = calculatePapiScores(answers);

    const { error: insertError } = await supabase.from("papikostik_results").insert({
      user_id: user.id,
      answers: answers as unknown as Json,
      scores: scores.scores as unknown as Json,
      analyses: scores.analyses as unknown as Json,
      total_top: scores.totalTop,
      total_bottom: scores.totalBottom,
      total_all: scores.totalAll,
      is_complete_pattern: scores.isCompletePattern,
      duration_seconds: duration,
      started_at: startedAtRef.current ?? new Date().toISOString(),
      completed_at: completedAt.toISOString(),
    });

    if (insertError) {
      setSubmitting(false);
      setError(insertError.message);
      return;
    }

    const { error: progressError } = await supabase
      .from("user_progress")
      .update({ papikostik_test_status: "completed" })
      .eq("user_id", user.id);

    if (progressError) {
      setSubmitting(false);
      setError(progressError.message);
      return;
    }

    await refreshProfile();
    setSubmitting(false);
    navigate("/result/papikostik", { replace: true });
  }

  if (alreadyDone) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <FileCheck className="mx-auto text-brand-red" size={32} />
        <p className="mt-4 font-bold text-brand-navy">PAPI Kostick sudah selesai.</p>
        <Link to="/result/papikostik" className="mt-4 inline-block text-sm font-semibold text-brand-red">
          Lihat status review
        </Link>
      </div>
    );
  }

  if (!cfitDone) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <p className="text-sm text-brand-navy/60">
          Selesaikan CFIT terlebih dahulu untuk membuka PAPI Kostick.
        </p>
        <Link to="/dashboard" className="mt-4 inline-block text-sm font-semibold text-brand-red">
          Kembali ke dashboard
        </Link>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="mx-auto max-w-2xl">
        <Link
          to="/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-brand-navy/50 hover:text-brand-red"
        >
          <ArrowLeft size={16} /> Dashboard
        </Link>
        <div className="rounded-2xl border border-brand-navy/8 bg-white p-8 shadow-sm">
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-brand-red">
            Pemetaan Potensi
          </p>
          <h1 className="font-display text-2xl font-extrabold text-brand-navy md:text-3xl">
            PAPI Kostick
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-brand-navy/55">
            Tes ini berisi 90 pasangan pernyataan. Pada setiap nomor, pilih satu pernyataan
            yang paling menggambarkan diri Anda dalam konteks kerja.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Info label="Jumlah soal" value="90" />
            <Info label="Tipe" value="Pilihan A/B" />
            <Info label="Estimasi" value="20 menit" />
          </div>
          <ul className="mt-6 space-y-2 text-sm leading-relaxed text-brand-navy/60">
            <li>Pilih jawaban secara spontan sesuai diri Anda.</li>
            <li>Tidak ada jawaban benar atau salah.</li>
            <li>Hasil akan disimpan untuk dibaca psikolog/admin.</li>
          </ul>
          {error ? (
            <p className="mt-4 rounded-lg bg-brand-red-soft px-3 py-2 text-sm text-brand-red">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => void handleStart()}
            disabled={submitting}
            className="mt-8 w-full rounded-xl bg-brand-red py-3.5 text-sm font-bold text-white hover:bg-brand-red-hover disabled:opacity-50 sm:w-auto sm:px-8"
          >
            {submitting ? "Menyiapkan..." : "Mulai PAPI Kostick"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-brand-navy/50 hover:text-brand-red"
        >
          <ArrowLeft size={16} /> Dashboard
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-red-soft px-3 py-1.5 text-sm font-bold text-brand-red">
          <Clock size={16} />
          {formatTime(remaining)}
        </span>
      </div>

      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-wide text-brand-navy/40">
          Soal {currentQuestion.number}/{PAPI_QUESTIONS.length}
        </p>
        <h1 className="mt-1 font-display text-2xl font-extrabold text-brand-navy">
          Pilih yang paling sesuai
        </h1>
        <p className="mt-2 text-sm text-brand-navy/45">
          Terjawab {answeredCount}/{PAPI_QUESTIONS.length}
        </p>
        <div className="mt-4 h-2 rounded-full bg-brand-navy/8">
          <div
            className="h-2 rounded-full bg-brand-red transition-all"
            style={{ width: `${(answeredCount / PAPI_QUESTIONS.length) * 100}%` }}
          />
        </div>
      </div>

      <QuestionCard
        question={currentQuestion}
        selected={answers[currentQuestion.id]}
        onSelect={selectAnswer}
      />

      {error ? (
        <p className="mt-4 rounded-lg bg-brand-red-soft px-3 py-2 text-sm text-brand-red">
          {error}
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={currentIndex === 0 || submitting}
          onClick={() => {
            setError("");
            setCurrentIndex((value) => Math.max(value - 1, 0));
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="rounded-xl border border-brand-navy/12 px-6 py-3 text-sm font-bold text-brand-navy disabled:opacity-40"
        >
          Sebelumnya
        </button>
        {currentIndex < PAPI_QUESTIONS.length - 1 ? (
          <button
            type="button"
            disabled={submitting}
            onClick={goNext}
            className="rounded-xl bg-brand-red px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            Lanjut
          </button>
        ) : (
          <button
            type="button"
            disabled={submitting || !allAnswered}
            onClick={() => void handleFinish()}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-red px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            <CheckCircle2 size={18} />
            {submitting ? "Menyimpan..." : "Selesai PAPI"}
          </button>
        )}
      </div>

      {!allAnswered && currentIndex === PAPI_QUESTIONS.length - 1 ? (
        <p className="mt-3 text-xs text-brand-navy/45">
          Masih ada {PAPI_QUESTIONS.length - answeredCount} soal yang belum dijawab. Gunakan nomor
          soal di bawah untuk kembali.
        </p>
      ) : null}

      <div className="mt-6 grid grid-cols-10 gap-1.5 sm:grid-cols-[repeat(15,minmax(0,1fr))]">
        {PAPI_QUESTIONS.map((question, index) => {
          const selected = Boolean(answers[question.id]);
          const active = index === currentIndex;
          return (
            <button
              key={question.id}
              type="button"
              onClick={() => {
                setError("");
                setCurrentIndex(index);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`h-8 rounded-lg text-xs font-bold ${
                active
                  ? "bg-brand-red text-white"
                  : selected
                    ? "bg-brand-red-soft text-brand-red"
                    : "bg-white text-brand-navy/45"
              }`}
            >
              {question.number}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function QuestionCard({
  question,
  selected,
  onSelect,
}: {
  question: PapiQuestion;
  selected?: PapiChoice;
  onSelect: (questionId: string, choice: PapiChoice) => void;
}) {
  return (
    <div className="rounded-2xl border border-brand-navy/8 bg-white p-5 shadow-sm">
      <div className="grid gap-3">
        <ChoiceButton
          label="A"
          text={question.optionA}
          active={selected === "A"}
          onClick={() => onSelect(question.id, "A")}
        />
        <ChoiceButton
          label="B"
          text={question.optionB}
          active={selected === "B"}
          onClick={() => onSelect(question.id, "B")}
        />
      </div>
    </div>
  );
}

function ChoiceButton({
  label,
  text,
  active,
  onClick,
}: {
  label: string;
  text: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-24 items-start gap-4 rounded-xl border p-4 text-left transition-all ${
        active
          ? "border-brand-red bg-brand-red-soft text-brand-red"
          : "border-brand-navy/10 text-brand-navy hover:border-brand-navy/25"
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${
          active ? "bg-brand-red text-white" : "bg-brand-bg text-brand-navy/55"
        }`}
      >
        {label}
      </span>
      <span className="pt-1 text-sm font-semibold leading-relaxed">{text}</span>
    </button>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-brand-bg p-4 text-center">
      <p className="text-[11px] font-bold uppercase tracking-wide text-brand-navy/40">{label}</p>
      <p className="mt-1 font-display text-xl font-extrabold text-brand-navy">{value}</p>
    </div>
  );
}
