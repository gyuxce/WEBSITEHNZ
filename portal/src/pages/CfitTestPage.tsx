import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
  CFIT_SUBTESTS,
  getQuestionsForSubtest,
  type CfitQuestion,
  type CfitSubtestId,
} from "../data/cfitQuestions";
import { normalizeAnswer, scoreCfit } from "../lib/cfitScoring";
import { apiFetch } from "../lib/api";

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function CfitTestPage() {
  const { user, progress, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [birthDate, setBirthDate] = useState("");
  const [started, setStarted] = useState(false);
  const [subtestIndex, setSubtestIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [remaining, setRemaining] = useState(CFIT_SUBTESTS[0].durationSec);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const startedAtRef = useRef<string | null>(null);
  const finishingRef = useRef(false);
  const birthDateRef = useRef("");

  const subtestMeta = CFIT_SUBTESTS[subtestIndex];
  const questions = useMemo(
    () => getQuestionsForSubtest(subtestMeta.id),
    [subtestMeta.id],
  );

  const totalQuestions = useMemo(
    () => CFIT_SUBTESTS.reduce((sum, s) => sum + s.questionCount, 0),
    [],
  );

  const answeredCount = Object.keys(answers).filter((k) => answers[k]).length;

  const pimsleurDone = progress?.language_test_status === "completed";
  const alreadyDone = progress?.cfit_test_status === "completed";
  const unlocked =
    progress?.cfit_test_status === "available" ||
    progress?.cfit_test_status === "in_progress" ||
    (pimsleurDone && progress?.cfit_test_status !== "completed");
  const canTake = Boolean(unlocked && !alreadyDone);

  const finishTest = useCallback(async () => {
    if (!user || finishingRef.current) return;
    finishingRef.current = true;
    setSubmitting(true);
    setError("");

    const dob = birthDateRef.current;
    if (!dob) {
      finishingRef.current = false;
      setSubmitting(false);
      setError("Tanggal lahir wajib diisi.");
      return;
    }

    let scored;
    try {
      scored = scoreCfit(answers, dob);
    } catch (e) {
      finishingRef.current = false;
      setSubmitting(false);
      setError(e instanceof Error ? e.message : "Gagal menghitung skor");
      return;
    }

    const duration = startedAtRef.current
      ? Math.max(
          0,
          Math.round((Date.now() - new Date(startedAtRef.current).getTime()) / 1000),
        )
      : null;

    try {
      await apiFetch("/tests/cfit/submit", {
        method: "POST",
        body: JSON.stringify({
          answers,
          birth_date: dob,
          age_years: scored.age_years,
          age_months: scored.age_months,
          age_band: scored.age_band,
          score_subtest1: scored.score_subtest1,
          score_subtest2: scored.score_subtest2,
          score_subtest3: scored.score_subtest3,
          score_subtest4: scored.score_subtest4,
          score_raw: scored.score_raw,
          iq: scored.iq,
          classification: scored.classification,
          classification_label: scored.classification_label,
          category_color: scored.category_color,
          category_label: scored.category_label,
          duration_seconds: duration,
          started_at: startedAtRef.current ?? new Date().toISOString(),
        }),
      });
    } catch (err) {
      finishingRef.current = false;
      setSubmitting(false);
      setError(err instanceof Error ? err.message : "Gagal menyimpan hasil");
      return;
    }

    await refreshProfile();
    setSubmitting(false);
    navigate("/result/cfit", { replace: true });
  }, [user, answers, refreshProfile, navigate]);

  const advanceOrFinish = useCallback(() => {
    if (subtestIndex < CFIT_SUBTESTS.length - 1) {
      const next = subtestIndex + 1;
      setSubtestIndex(next);
      setRemaining(CFIT_SUBTESTS[next].durationSec);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    void finishTest();
  }, [subtestIndex, finishTest]);

  useEffect(() => {
    if (!started || submitting || finishingRef.current) return;
    if (remaining <= 0) {
      advanceOrFinish();
      return;
    }
    const t = window.setTimeout(() => setRemaining((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [started, remaining, submitting, advanceOrFinish]);

  async function handleStart() {
    if (!user) return;
    if (!birthDate) {
      setError("Isi tanggal lahir terlebih dahulu (untuk norma IQ).");
      return;
    }
    birthDateRef.current = birthDate;
    startedAtRef.current = new Date().toISOString();
    await apiFetch("/tests/cfit/start", { method: "POST", body: "{}" });
    await refreshProfile();
    setError("");
    setStarted(true);
    setRemaining(CFIT_SUBTESTS[0].durationSec);
  }

  function onSelectSingle(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function onToggleMulti(questionId: string, letter: string) {
    setAnswers((prev) => {
      const current = normalizeAnswer(prev[questionId]).split("").filter(Boolean);
      const set = new Set(current);
      if (set.has(letter)) set.delete(letter);
      else if (set.size < 2) set.add(letter);
      else {
        // ganti pilihan tertua: keep newest + this letter
        const kept = [...set].slice(-1);
        return { ...prev, [questionId]: normalizeAnswer(kept.join("") + letter) };
      }
      return { ...prev, [questionId]: normalizeAnswer([...set].join("")) };
    });
  }

  function goNextSubtest() {
    advanceOrFinish();
  }

  if (alreadyDone) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <p className="font-bold text-brand-navy">Tes CFIT sudah selesai.</p>
        <Link to="/result/cfit" className="mt-4 inline-block text-sm font-semibold text-brand-red">
          Lihat hasil
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
        <Link to="/test/pimsleur" className="mt-4 inline-block text-sm font-semibold text-brand-red">
          Ke tes Pimsleur
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
            Tes CFIT 3A
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-brand-navy/55">
            Tes kemampuan intelektual (non-verbal) dengan 4 subtes berbatas waktu. Kerjakan sendiri;
            timer tiap subtes berjalan otomatis. Setelah selesai, Papikostik akan terbuka.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-brand-navy/70">
            {CFIT_SUBTESTS.map((s) => (
              <li key={s.id}>
                • {s.title} — {formatTime(s.durationSec)} · {s.questionCount} soal
              </li>
            ))}
            <li>• Total skor mentah maks. 50 → IQ menurut norma usia</li>
          </ul>

          <label className="mt-8 block">
            <span className="text-xs font-bold uppercase tracking-wide text-brand-navy/40">
              Tanggal lahir
            </span>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              className="mt-2 w-full rounded-xl border border-brand-navy/15 bg-white px-4 py-3 text-sm text-brand-navy outline-none focus:border-brand-red"
            />
            <span className="mt-1.5 block text-xs text-brand-navy/45">
              Dibutuhkan untuk memilih norma usia (A1–A6). Data hanya dipakai untuk skoring.
            </span>
          </label>

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
            Mulai subtes 1
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
            remaining <= 30 ? "bg-red-100 text-red-700" : "bg-brand-red-soft text-brand-red"
          }`}
        >
          <Clock size={16} />
          {formatTime(Math.max(remaining, 0))}
        </span>
      </div>

      <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-brand-navy/40">
            Subtes {subtestMeta.id} · {subtestIndex + 1}/{CFIT_SUBTESTS.length}
          </p>
          <h1 className="font-display text-xl font-extrabold text-brand-navy sm:text-2xl">
            {subtestMeta.title.replace(/^Subtes \d+ — /, "")}
          </h1>
        </div>
        <p className="text-sm text-brand-navy/50">
          Terjawab {answeredCount}/{totalQuestions}
        </p>
      </div>

      <p className="mb-5 text-sm leading-relaxed text-brand-navy/55">{subtestMeta.description}</p>

      <div className="space-y-5">
        {questions.map((q) => (
          <QuestionCard
            key={q.id}
            question={q}
            value={answers[q.id]}
            onSelectSingle={onSelectSingle}
            onToggleMulti={onToggleMulti}
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
          disabled={submitting}
          onClick={goNextSubtest}
          className="rounded-xl bg-brand-red px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {submitting
            ? "Menyimpan…"
            : subtestIndex < CFIT_SUBTESTS.length - 1
              ? `Lanjut subtes ${((subtestMeta.id + 1) as CfitSubtestId)}`
              : "Selesai & lihat hasil"}
        </button>
      </div>
    </div>
  );
}

function QuestionCard({
  question,
  value,
  onSelectSingle,
  onToggleMulti,
}: {
  question: CfitQuestion;
  value?: string;
  onSelectSingle: (id: string, value: string) => void;
  onToggleMulti: (id: string, letter: string) => void;
}) {
  const selected = normalizeAnswer(value);
  const selectedSet = new Set(selected.split("").filter(Boolean));

  return (
    <div className="rounded-2xl border border-brand-navy/8 bg-white p-4 shadow-sm sm:p-5">
      <p className="mb-3 text-sm font-bold text-brand-navy">
        <span className="mr-2 inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-brand-bg px-1.5 text-xs text-brand-navy/60">
          {question.number}
        </span>
        Soal {question.number}
        {question.choiceMode === "multi2" ? (
          <span className="ml-2 text-xs font-medium text-brand-navy/45">
            (pilih 2 · {selected || "—"})
          </span>
        ) : null}
      </p>

      <div className="overflow-hidden rounded-xl border border-brand-navy/8 bg-brand-bg">
        <img
          src={question.imageSrc}
          alt={`CFIT subtes ${question.subtest} soal ${question.number}`}
          className="w-full object-contain"
          loading="lazy"
        />
      </div>

      <div
        className={`mt-4 grid gap-2 ${
          question.options.length <= 5 ? "grid-cols-5" : "grid-cols-3 sm:grid-cols-6"
        }`}
      >
        {question.options.map((opt) => {
          const isOn =
            question.choiceMode === "multi2" ? selectedSet.has(opt) : selected === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() =>
                question.choiceMode === "multi2"
                  ? onToggleMulti(question.id, opt)
                  : onSelectSingle(question.id, opt)
              }
              className={`rounded-xl border py-3 text-center text-sm font-bold transition-all ${
                isOn
                  ? "border-brand-red bg-brand-red-soft text-brand-red"
                  : "border-brand-navy/10 text-brand-navy/80 hover:border-brand-navy/25"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
