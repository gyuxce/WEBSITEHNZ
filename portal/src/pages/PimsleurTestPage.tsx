import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
  getQuestionsForSection,
  PIMSLEUR_AUDIO,
  PIMSLEUR_DURATION_SEC,
  PIMSLEUR_SECTIONS,
  SECTION4_WORD_LIST,
  type PimsleurQuestion,
} from "../data/pimsleurQuestions";
import { scorePimsleur } from "../lib/pimsleurScoring";
import { supabase } from "../lib/supabase";

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function PimsleurTestPage() {
  const { user, progress, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [started, setStarted] = useState(false);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [remaining, setRemaining] = useState(PIMSLEUR_DURATION_SEC);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const startedAtRef = useRef<string | null>(null);
  const finishingRef = useRef(false);

  const sectionMeta = PIMSLEUR_SECTIONS[sectionIndex];
  const questions = useMemo(
    () => getQuestionsForSection(sectionMeta.id),
    [sectionMeta.id],
  );

  const totalQuestions = useMemo(
    () =>
      PIMSLEUR_SECTIONS.reduce(
        (sum, s) => sum + getQuestionsForSection(s.id).length,
        0,
      ),
    [],
  );

  const answeredCount = Object.keys(answers).length;
  const sectionAnswered = questions.every((question) => Boolean(answers[question.id]));
  const allAnswered = PIMSLEUR_SECTIONS.every((section) =>
    getQuestionsForSection(section.id).every((question) => Boolean(answers[question.id])),
  );

  const paymentOk =
    progress?.payment_status === "verified" || progress?.payment_status === "paid";
  const alreadyDone = progress?.language_test_status === "completed";
  const canTake = Boolean(paymentOk && !alreadyDone);

  const finishTest = useCallback(async () => {
    if (!user || finishingRef.current) return;
    finishingRef.current = true;
    setSubmitting(true);
    setError("");

    const scored = scorePimsleur(answers);
    const duration = startedAtRef.current
      ? Math.max(
          0,
          Math.round((Date.now() - new Date(startedAtRef.current).getTime()) / 1000),
        )
      : PIMSLEUR_DURATION_SEC - remaining;

    const { error: insertError } = await supabase.from("pimsleur_results").insert({
      user_id: user.id,
      answers,
      score_section2: scored.score_section2,
      score_section3: scored.score_section3,
      score_section4: scored.score_section4,
      score_section5: scored.score_section5,
      score_section6: scored.score_section6,
      score_verbal: scored.score_verbal,
      score_audio: scored.score_audio,
      score_total: scored.score_total,
      grade: scored.grade,
      grade_label: scored.grade_label,
      status_label: scored.status_label,
      recommendation: scored.recommendation,
      duration_seconds: duration,
      started_at: startedAtRef.current ?? new Date().toISOString(),
      completed_at: new Date().toISOString(),
    });

    if (insertError) {
      finishingRef.current = false;
      setSubmitting(false);
      setError(insertError.message);
      return;
    }

    await supabase
      .from("user_progress")
      .update({
        language_test_status: "completed",
        cfit_test_status: "available",
        result_status: "available",
      })
      .eq("user_id", user.id);

    await refreshProfile();
    setSubmitting(false);
    navigate("/result/pimsleur", { replace: true });
  }, [user, answers, remaining, refreshProfile, navigate]);

  useEffect(() => {
    if (!started || submitting) return;
    if (remaining <= 0) {
      void finishTest();
      return;
    }
    const t = window.setTimeout(() => setRemaining((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [started, remaining, submitting, finishTest]);

  async function handleStart() {
    if (!user) return;
    startedAtRef.current = new Date().toISOString();
    await supabase
      .from("user_progress")
      .update({ language_test_status: "in_progress" })
      .eq("user_id", user.id);
    await refreshProfile();
    setStarted(true);
  }

  function onSelect(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function goNext() {
    if (sectionIndex < PIMSLEUR_SECTIONS.length - 1) {
      setSectionIndex((v) => v + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!allAnswered) {
      setError("Lengkapi semua jawaban terlebih dahulu sebelum melihat hasil.");
      return;
    }
    void finishTest();
  }

  if (alreadyDone) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <p className="font-bold text-brand-navy">Tes Pimsleur sudah selesai.</p>
        <Link
          to="/result/pimsleur"
          className="mt-4 inline-block text-sm font-semibold text-brand-red"
        >
          Lihat hasil
        </Link>
      </div>
    );
  }

  if (!canTake) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <p className="text-sm text-brand-navy/60">
          Selesaikan pembayaran terlebih dahulu untuk membuka tes Pimsleur.
        </p>
        <Link to="/payment" className="mt-4 inline-block text-sm font-semibold text-brand-red">
          Ke halaman pembayaran
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
            Tes Aptitude Bahasa (Pimsleur)
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-brand-navy/55">
            Mengukur kemampuan belajar bahasa asing. Durasi total{" "}
            <strong className="text-brand-navy">25 menit</strong> untuk tahap 2–6. Nomor tahap
            mengikuti materi audio (tahap 1 tidak digunakan). Audio diputar sendiri pada tahap yang
            membutuhkan suara.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-brand-navy/70">
            {PIMSLEUR_SECTIONS.map((s) => (
              <li key={s.id}>
                • {s.title}
                {s.hasAudio ? " — ada audio" : ""}
              </li>
            ))}
            <li>• Setelah selesai, hasil Pimsleur langsung tampil dan bisa dikonsultasikan.</li>
          </ul>
          {error ? (
            <p className="mt-4 rounded-lg bg-brand-red-soft px-3 py-2 text-sm text-brand-red">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => void handleStart()}
            className="mt-8 w-full rounded-xl bg-brand-red py-3.5 text-sm font-bold text-white hover:bg-brand-red-hover sm:w-auto sm:px-8"
          >
            Mulai tes 25 menit
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
            remaining <= 60
              ? "bg-red-100 text-red-700"
              : "bg-brand-red-soft text-brand-red"
          }`}
        >
          <Clock size={16} />
          {formatTime(Math.max(remaining, 0))}
        </span>
      </div>

      <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-brand-navy/40">
            Tahap {sectionMeta.id} · {sectionIndex + 1}/{PIMSLEUR_SECTIONS.length}
          </p>
          <h1 className="font-display text-xl font-extrabold text-brand-navy sm:text-2xl">
            {sectionMeta.title.replace(/^Tahap \d+ — /, "")}
          </h1>
        </div>
        <p className="text-sm text-brand-navy/50">
          Terjawab {answeredCount}/{totalQuestions}
        </p>
      </div>

      <p className="mb-5 text-sm leading-relaxed text-brand-navy/55">{sectionMeta.description}</p>

      {sectionMeta.hasAudio ? <SectionAudioPlayer sectionId={sectionMeta.id} /> : null}

      {sectionMeta.id === 4 ? (
        <div className="mb-6 rounded-xl border border-brand-navy/8 bg-white p-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-brand-navy/40">
            Daftar kata
          </p>
          <ul className="grid gap-x-6 gap-y-1.5 font-mono text-[13px] leading-relaxed text-brand-navy/80 sm:grid-cols-2">
            {SECTION4_WORD_LIST.map((line) => (
              <li key={line} className="border-b border-brand-navy/5 pb-1.5 last:border-0 sm:odd:pr-2">
                {line}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="space-y-4">
        {questions.map((q) => (
          <QuestionCard
            key={q.id}
            question={q}
            value={answers[q.id]}
            onSelect={onSelect}
          />
        ))}
      </div>

      {error ? (
        <p className="mt-4 rounded-lg bg-brand-red-soft px-3 py-2 text-sm text-brand-red">
          {error}
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        {sectionIndex > 0 ? (
          <button
            type="button"
            onClick={() => {
              setSectionIndex((v) => v - 1);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="rounded-xl border border-brand-navy/15 px-5 py-3 text-sm font-bold text-brand-navy"
          >
            Tahap sebelumnya
          </button>
        ) : null}
        <button
          type="button"
          disabled={submitting || !sectionAnswered}
          onClick={goNext}
          className="rounded-xl bg-brand-red px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {submitting
            ? "Menyimpan…"
            : sectionIndex < PIMSLEUR_SECTIONS.length - 1
              ? "Lanjut tahap berikutnya"
              : "Selesai & lihat hasil"}
        </button>
      </div>
    </div>
  );
}

function SectionAudioPlayer({ sectionId }: { sectionId: 2 | 3 | 4 | 5 | 6 }) {
  const src =
    sectionId === 3
      ? PIMSLEUR_AUDIO.section3
      : sectionId === 4
        ? PIMSLEUR_AUDIO.section4
        : sectionId === 5
          ? PIMSLEUR_AUDIO.section5
          : sectionId === 6
            ? PIMSLEUR_AUDIO.section6
            : null;

  if (!src) return null;

  return (
    <div className="mb-6 rounded-xl border border-brand-navy/8 bg-white p-4">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-navy/40">Audio</p>
      <audio controls preload="metadata" className="w-full" src={src}>
        Browser Anda tidak mendukung pemutar audio.
      </audio>
    </div>
  );
}

function QuestionCard({
  question,
  value,
  onSelect,
}: {
  question: PimsleurQuestion;
  value?: string;
  onSelect: (id: string, value: string) => void;
}) {
  const optionCount = question.options.length;
  const gridClass =
    optionCount <= 2
      ? "grid-cols-1 sm:grid-cols-2"
      : optionCount === 3
        ? "grid-cols-1 sm:grid-cols-3"
        : "grid-cols-1 sm:grid-cols-2";

  return (
    <div className="rounded-2xl border border-brand-navy/8 bg-white p-5 shadow-sm">
      <p className="text-sm font-bold leading-snug text-brand-navy">
        <span className="mr-2 inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-brand-bg px-1.5 text-xs text-brand-navy/60">
          {question.number}
        </span>
        {question.prompt}
      </p>
      <div className={`mt-4 grid gap-2 ${gridClass}`}>
        {question.options.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSelect(question.id, opt.value)}
              className={`rounded-xl border px-3.5 py-3 text-left text-sm font-medium transition-all ${
                selected
                  ? "border-brand-red bg-brand-red-soft text-brand-red"
                  : "border-brand-navy/10 text-brand-navy/80 hover:border-brand-navy/25"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
