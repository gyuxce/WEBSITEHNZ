import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, FileCheck } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
  CFIT_GENERAL_INSTRUCTIONS,
  CFIT_SUBTESTS,
  CFIT_SUBTEST_GUIDE,
  CFIT_TOTAL_QUESTIONS,
  calculateCfitRawScores,
  type CfitAnswers,
  type CfitQuestion,
} from "../data/cfitQuestions";
import { calculateCfitIq } from "../data/cfitScoring";
import { supabase } from "../lib/supabase";
import type { Json } from "../lib/database.types";

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function hasAnswer(question: CfitQuestion, answers: CfitAnswers) {
  const value = answers[question.id];
  if (question.answerMode === "multiple") {
    return Array.isArray(value) && value.length === 2;
  }
  return typeof value === "string" && value.length > 0;
}

export function CfitTestPage() {
  const { user, profile, progress, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [started, setStarted] = useState(false);
  const [subtestIndex, setSubtestIndex] = useState(0);
  const [answers, setAnswers] = useState<CfitAnswers>({});
  const [birthDate, setBirthDate] = useState(profile?.birth_date ?? "");
  const [remaining, setRemaining] = useState(CFIT_SUBTESTS[0].durationSeconds);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const startedAtRef = useRef<string | null>(null);
  const finishingRef = useRef(false);

  const currentSubtest = CFIT_SUBTESTS[subtestIndex];
  const pimsleurDone = progress?.language_test_status === "completed";
  const alreadyDone = progress?.cfit_test_status === "completed";
  const canTake = Boolean(pimsleurDone && !alreadyDone);

  const answeredTotal = useMemo(
    () =>
      CFIT_SUBTESTS.reduce(
        (total, subtest) =>
          total + subtest.questions.filter((question) => hasAnswer(question, answers)).length,
        0,
      ),
    [answers],
  );

  const currentSubtestComplete = currentSubtest.questions.every((question) =>
    hasAnswer(question, answers),
  );

  const finishCfit = useCallback(async () => {
    if (!user || finishingRef.current) return;
    finishingRef.current = true;
    setSubmitting(true);
    setError("");

    const completedAt = new Date();
    const duration = startedAtRef.current
      ? Math.max(0, Math.round((Date.now() - new Date(startedAtRef.current).getTime()) / 1000))
      : null;
    const rawScores = calculateCfitRawScores(answers);
    const iqResult = calculateCfitIq(rawScores.rawTotal, profile?.birth_date ?? birthDate, completedAt);

    const { error: insertError } = await supabase.from("cfit_results").insert({
      user_id: user.id,
      answers: answers as Json,
      raw_subtest1: rawScores.rawSubtest1,
      raw_subtest2: rawScores.rawSubtest2,
      raw_subtest3: rawScores.rawSubtest3,
      raw_subtest4: rawScores.rawSubtest4,
      raw_total: rawScores.rawTotal,
      iq: iqResult.iq,
      category: iqResult.category,
      age_years: iqResult.ageYears,
      age_months: iqResult.ageMonths,
      norm_code: iqResult.normCode,
      duration_seconds: duration,
      started_at: startedAtRef.current ?? new Date().toISOString(),
      completed_at: completedAt.toISOString(),
    });

    if (insertError) {
      finishingRef.current = false;
      setSubmitting(false);
      setError(insertError.message);
      return;
    }

    const { error: progressError } = await supabase
      .from("user_progress")
      .update({
        cfit_test_status: "completed",
        papikostik_test_status: "available",
      })
      .eq("user_id", user.id);

    if (progressError) {
      finishingRef.current = false;
      setSubmitting(false);
      setError(progressError.message);
      return;
    }

    await refreshProfile();
    setSubmitting(false);
    navigate("/dashboard", { replace: true });
  }, [answers, navigate, refreshProfile, user]);

  const goNextSubtest = useCallback(
    (force = false) => {
      if (!force && !currentSubtestComplete) {
        setError(
          currentSubtest.answerMode === "multiple"
            ? "Setiap soal pada subtes ini harus memilih tepat dua jawaban."
            : "Lengkapi semua jawaban pada subtes ini terlebih dahulu.",
        );
        return;
      }

      setError("");
      if (subtestIndex < CFIT_SUBTESTS.length - 1) {
        const nextIndex = subtestIndex + 1;
        setSubtestIndex(nextIndex);
        setRemaining(CFIT_SUBTESTS[nextIndex].durationSeconds);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      void finishCfit();
    },
    [currentSubtest.answerMode, currentSubtestComplete, finishCfit, subtestIndex],
  );

  useEffect(() => {
    if (!started || submitting) return;
    if (remaining <= 0) {
      goNextSubtest(true);
      return;
    }

    const timer = window.setTimeout(() => setRemaining((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [goNextSubtest, remaining, started, submitting]);

  async function handleStart() {
    if (!user) return;
    if (!birthDate) {
      setError("Isi tanggal lahir terlebih dahulu agar scoring IQ CFIT bisa dihitung.");
      return;
    }

    setSubmitting(true);
    setError("");
    startedAtRef.current = new Date().toISOString();

    if (birthDate !== profile?.birth_date) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ birth_date: birthDate })
        .eq("id", user.id);

      if (profileError) {
        setSubmitting(false);
        setError(profileError.message);
        return;
      }
    }

    const { error: progressError } = await supabase
      .from("user_progress")
      .update({ cfit_test_status: "in_progress" })
      .eq("user_id", user.id);

    if (progressError) {
      setSubmitting(false);
      setError(progressError.message);
      return;
    }

    await refreshProfile();
    setRemaining(CFIT_SUBTESTS[0].durationSeconds);
    setStarted(true);
    setSubmitting(false);
  }

  function selectSingle(questionId: string, value: string) {
    setAnswers((previous) => ({ ...previous, [questionId]: value }));
  }

  function toggleMultiple(questionId: string, value: string) {
    setAnswers((previous) => {
      const current = Array.isArray(previous[questionId]) ? (previous[questionId] as string[]) : [];
      if (current.includes(value)) {
        return { ...previous, [questionId]: current.filter((item) => item !== value) };
      }
      if (current.length >= 2) {
        return { ...previous, [questionId]: [current[1], value] };
      }
      return { ...previous, [questionId]: [...current, value] };
    });
  }

  if (alreadyDone) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <FileCheck className="mx-auto text-brand-red" size={32} />
        <p className="mt-4 font-bold text-brand-navy">CFIT sudah selesai.</p>
        <Link to="/test/papikostik" className="mt-4 inline-block text-sm font-semibold text-brand-red">
          Lanjut ke PAPI Kostick
        </Link>
      </div>
    );
  }

  if (!canTake) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <p className="text-sm text-brand-navy/60">
          Selesaikan tes Pimsleur terlebih dahulu untuk membuka CFIT.
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
            CFIT
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-brand-navy/55">
            CFIT terdiri dari 4 subtes berurutan. Baca instruksi berikut sebelum mulai
            mengerjakan.
          </p>
          <div className="mt-6 rounded-xl bg-brand-bg p-4">
            <p className="text-sm font-bold text-brand-navy">Instruksi Umum</p>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-brand-navy/60">
              {CFIT_GENERAL_INSTRUCTIONS.map((instruction) => (
                <li key={instruction} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-brand-red" />
                  <span>{instruction}</span>
                </li>
              ))}
            </ul>
          </div>
          <label className="mt-6 flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-brand-navy/50">
              Tanggal lahir
            </span>
            <input
              type="date"
              required
              value={birthDate}
              onChange={(event) => setBirthDate(event.target.value)}
              className="rounded-xl border border-brand-navy/12 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30"
            />
            <span className="text-xs text-brand-navy/45">
              Dipakai untuk memilih norma usia CFIT saat raw score dikonversi ke IQ.
            </span>
          </label>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {CFIT_SUBTESTS.map((subtest) => (
              <div key={subtest.id} className="rounded-xl bg-brand-bg p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-brand-navy/40">
                  {subtest.title}
                </p>
                <p className="mt-1 text-sm font-bold text-brand-navy">
                  {subtest.questions.length} soal - {formatTime(subtest.durationSeconds)}
                </p>
                <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-brand-navy/55">
                  {CFIT_SUBTEST_GUIDE[subtest.id].map((instruction) => (
                    <li key={instruction}>{instruction}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
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
            {submitting ? "Menyiapkan..." : "Mulai CFIT"}
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
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold ${
            remaining <= 30 ? "bg-red-100 text-red-700" : "bg-brand-red-soft text-brand-red"
          }`}
        >
          <Clock size={16} />
          {formatTime(Math.max(remaining, 0))}
        </span>
      </div>

      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-wide text-brand-navy/40">
          {currentSubtest.title} - {subtestIndex + 1}/{CFIT_SUBTESTS.length}
        </p>
        <h1 className="mt-1 font-display text-2xl font-extrabold text-brand-navy">
          {currentSubtest.title}
        </h1>
        <p className="mt-2 text-sm text-brand-navy/55">{currentSubtest.instruction}</p>
        <ul className="mt-3 space-y-1 text-sm text-brand-navy/50">
          {CFIT_SUBTEST_GUIDE[currentSubtest.id].map((instruction) => (
            <li key={instruction}>{instruction}</li>
          ))}
        </ul>
        <p className="mt-1 text-sm text-brand-navy/45">
          Terjawab {answeredTotal}/{CFIT_TOTAL_QUESTIONS}
        </p>
      </div>

      <div className="space-y-4">
        {currentSubtest.questions.map((question) => (
          <QuestionCard
            key={question.id}
            question={question}
            value={answers[question.id]}
            onSingle={selectSingle}
            onMultiple={toggleMultiple}
          />
        ))}
      </div>

      {error ? (
        <p className="mt-4 rounded-lg bg-brand-red-soft px-3 py-2 text-sm text-brand-red">
          {error}
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={submitting || !currentSubtestComplete}
          onClick={() => goNextSubtest(false)}
          className="rounded-xl bg-brand-red px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {submitting
            ? "Menyimpan..."
            : subtestIndex < CFIT_SUBTESTS.length - 1
              ? "Lanjut subtes berikutnya"
              : "Selesai CFIT"}
        </button>
      </div>
    </div>
  );
}

function QuestionCard({
  question,
  value,
  onSingle,
  onMultiple,
}: {
  question: CfitQuestion;
  value?: string | string[];
  onSingle: (questionId: string, value: string) => void;
  onMultiple: (questionId: string, value: string) => void;
}) {
  const selectedValues = Array.isArray(value) ? value : [];

  return (
    <div className="rounded-2xl border border-brand-navy/8 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-brand-navy">Soal {question.number}</p>
        {question.answerMode === "multiple" ? (
          <span className="text-xs font-semibold text-brand-navy/45">Pilih 2 jawaban</span>
        ) : null}
      </div>
      <div className="mt-4 rounded-xl bg-white p-2">
        <img
          src={question.imageSrc}
          alt={`CFIT subtes ${question.subtest} soal ${question.number}`}
          className="mx-auto max-h-[240px] w-full object-contain"
        />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {question.options.map((option) => {
          const selected =
            question.answerMode === "multiple" ? selectedValues.includes(option) : value === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() =>
                question.answerMode === "multiple"
                  ? onMultiple(question.id, option)
                  : onSingle(question.id, option)
              }
              className={`rounded-xl border px-3 py-3 text-center text-sm font-bold transition-all ${
                selected
                  ? "border-brand-red bg-brand-red-soft text-brand-red"
                  : "border-brand-navy/10 text-brand-navy/70 hover:border-brand-navy/25"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
