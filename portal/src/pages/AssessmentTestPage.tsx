import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Database, FileCheck } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { ASSESSMENTS, type AssessmentType } from "../data/assessmentCatalog";
import { supabase } from "../lib/supabase";
import type { Database as AppDatabase } from "../lib/database.types";

type Question = AppDatabase["public"]["Tables"]["test_questions"]["Row"];
type ProgressUpdate = AppDatabase["public"]["Tables"]["user_progress"]["Update"];

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function AssessmentTestPage({ type }: { type: AssessmentType }) {
  const config = ASSESSMENTS[type];
  const { user, progress, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(config.durationSeconds);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const pimsleurDone = progress?.language_test_status === "completed";
  const cfitDone = progress?.cfit_test_status === "completed";
  const assessmentStatus = progress?.[config.progressField];
  const alreadyDone = assessmentStatus === "completed";
  const prerequisiteDone = config.type === "cfit" ? pimsleurDone : cfitDone;
  const prerequisiteLabel = config.type === "cfit" ? "tes Pimsleur" : "CFIT";
  const canTake = Boolean(prerequisiteDone && !alreadyDone);

  const answeredCount = Object.keys(answers).length;
  const currentQuestion = questions[current];
  const allAnswered = useMemo(
    () => questions.length > 0 && questions.every((q) => Boolean(answers[q.id])),
    [answers, questions],
  );

  useEffect(() => {
    if (!canTake) {
      setLoading(false);
      return;
    }

    async function loadQuestions() {
      setLoading(true);
      setError("");

      const { data, error: qError } = await supabase
        .from("test_questions")
        .select("*")
        .eq("test_type", config.testType)
        .eq("active", true)
        .order("order_index");

      if (qError) {
        setError(qError.message);
        setLoading(false);
        return;
      }

      setQuestions(data ?? []);
      setLoading(false);
    }

    void loadQuestions();
  }, [canTake, config.testType]);

  const finishTest = useCallback(async () => {
    if (!user || !sessionId || submitting) return;
    setSubmitting(true);
    setError("");

    let correct = 0;
    for (const question of questions) {
      const answer = answers[question.id] ?? "";
      const isCorrect =
        config.scoringMode === "correct" ? answer === question.correct_answer : null;

      if (isCorrect) correct++;

      const { error: answerError } = await supabase.from("test_answers").insert({
        session_id: sessionId,
        question_id: question.id,
        answer,
        is_correct: isCorrect,
      });

      if (answerError) {
        setError(answerError.message);
        setSubmitting(false);
        return;
      }
    }

    const score =
      config.scoringMode === "correct"
        ? Math.round((correct / Math.max(questions.length, 1)) * 100)
        : null;

    const { error: sessionError } = await supabase
      .from("test_sessions")
      .update({
        completed_at: new Date().toISOString(),
        score,
        passed: score === null ? null : score >= 60,
      })
      .eq("id", sessionId);

    if (sessionError) {
      setError(sessionError.message);
      setSubmitting(false);
      return;
    }

    const progressUpdate: ProgressUpdate =
      config.progressField === "cfit_test_status"
        ? { cfit_test_status: "completed", papikostik_test_status: "available" }
        : { papikostik_test_status: "completed" };

    const { error: progressError } = await supabase
      .from("user_progress")
      .update(progressUpdate)
      .eq("user_id", user.id);

    if (progressError) {
      setError(progressError.message);
      setSubmitting(false);
      return;
    }

    await refreshProfile();
    setSubmitting(false);
    navigate("/dashboard", { replace: true });
  }, [
    answers,
    config.progressField,
    config.scoringMode,
    navigate,
    questions,
    refreshProfile,
    sessionId,
    submitting,
    user,
  ]);

  useEffect(() => {
    if (!started || submitting) return;
    if (timeLeft <= 0) {
      void finishTest();
      return;
    }

    const timer = window.setTimeout(() => setTimeLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [finishTest, started, submitting, timeLeft]);

  async function handleStart() {
    if (!user || !questions.length) return;
    setSubmitting(true);
    setError("");

    const { data, error: sessionError } = await supabase
      .from("test_sessions")
      .insert({ user_id: user.id, test_type: config.testType })
      .select("id")
      .single();

    if (sessionError || !data) {
      setError(sessionError?.message ?? "Gagal membuat sesi tes.");
      setSubmitting(false);
      return;
    }

    const progressUpdate: ProgressUpdate =
      config.progressField === "cfit_test_status"
        ? { cfit_test_status: "in_progress" }
        : { papikostik_test_status: "in_progress" };

    const { error: progressError } = await supabase
      .from("user_progress")
      .update(progressUpdate)
      .eq("user_id", user.id);

    if (progressError) {
      setError(progressError.message);
      setSubmitting(false);
      return;
    }

    setSessionId(data.id);
    setStarted(true);
    setSubmitting(false);
    await refreshProfile();
  }

  if (alreadyDone) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <FileCheck className="mx-auto text-brand-red" size={32} />
        <p className="mt-4 font-bold text-brand-navy">{config.shortTitle} sudah selesai.</p>
        <Link to="/dashboard" className="mt-4 inline-block text-sm font-semibold text-brand-red">
          Kembali ke dashboard
        </Link>
      </div>
    );
  }

  if (!canTake) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <p className="text-sm text-brand-navy/60">
          Selesaikan {prerequisiteLabel} terlebih dahulu untuk membuka {config.shortTitle}.
        </p>
        <Link to="/dashboard" className="mt-4 inline-block text-sm font-semibold text-brand-red">
          Kembali ke dashboard
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

  if (error) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <p className="rounded-lg bg-brand-red-soft px-3 py-2 text-sm text-brand-red">{error}</p>
        <Link to="/dashboard" className="mt-4 inline-block text-sm font-semibold text-brand-red">
          Kembali ke dashboard
        </Link>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <Database className="mx-auto text-brand-red" size={32} />
        <h1 className="mt-4 font-display text-xl font-extrabold text-brand-navy">
          Materi {config.shortTitle} belum tersedia
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-brand-navy/55">
          Halaman tes sudah siap. Admin perlu menambahkan soal aktif dengan{" "}
          <span className="font-mono text-brand-navy">test_type = "{config.testType}"</span> di
          tabel <span className="font-mono text-brand-navy">test_questions</span>.
        </p>
        <Link to="/dashboard" className="mt-5 inline-block text-sm font-semibold text-brand-red">
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
            {config.title}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-brand-navy/55">{config.description}</p>
          <div className="mt-6 grid gap-3 text-sm text-brand-navy/70 sm:grid-cols-3">
            <Info label="Jumlah soal" value={String(questions.length)} />
            <Info label="Durasi" value={`${Math.round(config.durationSeconds / 60)} menit`} />
            <Info
              label="Penilaian"
              value={config.scoringMode === "correct" ? "Kunci jawaban" : "Tersimpan untuk review"}
            />
          </div>
          <button
            type="button"
            onClick={() => void handleStart()}
            disabled={submitting}
            className="mt-8 w-full rounded-xl bg-brand-red py-3.5 text-sm font-bold text-white hover:bg-brand-red-hover disabled:opacity-50 sm:w-auto sm:px-8"
          >
            {submitting ? "Menyiapkan..." : `Mulai ${config.shortTitle}`}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-brand-navy/50 hover:text-brand-red"
        >
          <ArrowLeft size={16} /> Dashboard
        </Link>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold ${
            timeLeft <= 60 ? "bg-red-100 text-red-700" : "bg-brand-red-soft text-brand-red"
          }`}
        >
          <Clock size={16} />
          {formatTime(Math.max(timeLeft, 0))}
        </span>
      </div>

      <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-brand-navy/40">
            Soal {current + 1} dari {questions.length}
          </p>
          <h1 className="font-display text-xl font-extrabold text-brand-navy sm:text-2xl">
            {config.shortTitle}
          </h1>
        </div>
        <p className="text-sm text-brand-navy/50">
          Terjawab {answeredCount}/{questions.length}
        </p>
      </div>

      <div className="rounded-2xl border border-brand-navy/8 bg-white p-6 shadow-sm">
        <p className="text-sm font-bold leading-snug text-brand-navy">
          {currentQuestion.question_text}
        </p>
        <div className="mt-5 grid gap-2">
          {currentQuestion.options.map((option) => {
            const selected = answers[currentQuestion.id] === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  setAnswers((previous) => ({ ...previous, [currentQuestion.id]: option.value }))
                }
                className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all ${
                  selected
                    ? "border-brand-red bg-brand-red-soft text-brand-red"
                    : "border-brand-navy/10 text-brand-navy/80 hover:border-brand-navy/25"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        {current > 0 ? (
          <button
            type="button"
            onClick={() => setCurrent((value) => value - 1)}
            className="rounded-xl border border-brand-navy/15 px-5 py-3 text-sm font-bold text-brand-navy"
          >
            Sebelumnya
          </button>
        ) : null}
        {current < questions.length - 1 ? (
          <button
            type="button"
            disabled={!answers[currentQuestion.id]}
            onClick={() => setCurrent((value) => value + 1)}
            className="rounded-xl bg-brand-red px-6 py-3 text-sm font-bold text-white disabled:opacity-40"
          >
            Selanjutnya
          </button>
        ) : (
          <button
            type="button"
            disabled={!allAnswered || submitting}
            onClick={() => void finishTest()}
            className="rounded-xl bg-brand-navy px-6 py-3 text-sm font-bold text-white disabled:opacity-40"
          >
            {submitting ? "Menyimpan..." : "Selesai"}
          </button>
        )}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-brand-bg p-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-brand-navy/40">{label}</p>
      <p className="mt-1 text-sm font-bold text-brand-navy">{value}</p>
    </div>
  );
}
