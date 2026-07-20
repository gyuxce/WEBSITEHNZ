import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/database.types";

type Question = Database["public"]["Tables"]["test_questions"]["Row"];

const TEST_DURATION_SEC = 300; // 5 minutes

export function LanguageTestPage() {
  const { user, progress, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(TEST_DURATION_SEC);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canTakeTest =
    progress?.payment_status === "verified" && progress.language_test_status !== "completed";

  useEffect(() => {
    if (!canTakeTest) return;

    async function load() {
      const { data, error: qError } = await supabase
        .from("test_questions")
        .select("*")
        .eq("test_type", "language")
        .eq("active", true)
        .order("order_index");

      if (qError || !data?.length) {
        setError("Soal tes belum tersedia. Hubungi admin.");
        setLoading(false);
        return;
      }

      setQuestions(data);

      if (user) {
        const { data: session } = await supabase
          .from("test_sessions")
          .insert({ user_id: user.id, test_type: "language" })
          .select("id")
          .single();

        if (session) {
          setSessionId(session.id);
          await supabase
            .from("user_progress")
            .update({ language_test_status: "in_progress" })
            .eq("user_id", user.id);
        }
      }

      setLoading(false);
    }

    load();
  }, [canTakeTest, user]);

  const finishTest = useCallback(async () => {
    if (!sessionId || !user || submitting) return;
    setSubmitting(true);

    let correct = 0;
    for (const q of questions) {
      const isCorrect = answers[q.id] === q.correct_answer;
      if (isCorrect) correct++;
      await supabase.from("test_answers").insert({
        session_id: sessionId,
        question_id: q.id,
        answer: answers[q.id] ?? "",
        is_correct: isCorrect,
      });
    }

    const score = Math.round((correct / questions.length) * 100);
    const passed = score >= 60;

    await supabase
      .from("test_sessions")
      .update({ completed_at: new Date().toISOString(), score, passed })
      .eq("id", sessionId);

    await supabase
      .from("user_progress")
      .update({
        language_test_status: "completed",
        character_test_status: "available",
      })
      .eq("user_id", user.id);

    await refreshProfile();
    setSubmitting(false);
    navigate("/dashboard");
  }, [sessionId, user, submitting, questions, answers, refreshProfile, navigate]);

  useEffect(() => {
    if (!canTakeTest || loading || submitting) return;
    if (timeLeft <= 0) {
      finishTest();
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, canTakeTest, loading, submitting, finishTest]);

  if (progress?.language_test_status === "completed") {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <p className="text-brand-navy font-bold">Tes bahasa sudah selesai.</p>
        <Link to="/dashboard" className="mt-4 inline-block text-brand-red font-semibold text-sm">
          Kembali ke dashboard
        </Link>
      </div>
    );
  }

  if (!canTakeTest) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <p className="text-brand-navy/60 text-sm">Selesaikan pembayaran terlebih dahulu untuk membuka tes.</p>
        <Link to="/payment" className="mt-4 inline-block text-brand-red font-semibold text-sm">
          Ke halaman pembayaran
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 rounded-full border-2 border-brand-red border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-brand-red py-12">{error}</p>;
  }

  const q = questions[current];
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-brand-navy/50 hover:text-brand-red">
          <ArrowLeft size={16} /> Dashboard
        </Link>
        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-red">
          <Clock size={16} />
          {mins}:{secs.toString().padStart(2, "0")}
        </span>
      </div>

      <div className="rounded-2xl border border-brand-navy/8 bg-white p-8 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-brand-navy/40 mb-2">
          Soal {current + 1} dari {questions.length}
        </p>
        <h2 className="font-display font-bold text-lg text-brand-navy mb-6">{q.question_text}</h2>

        <div className="flex flex-col gap-3">
          {q.options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setAnswers({ ...answers, [q.id]: opt.value })}
              className={`text-left rounded-xl border px-4 py-3.5 text-sm font-medium transition-all ${
                answers[q.id] === opt.value
                  ? "border-brand-red bg-brand-red-soft text-brand-red"
                  : "border-brand-navy/10 hover:border-brand-navy/25"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="mt-8 flex gap-3">
          {current > 0 && (
            <button
              type="button"
              onClick={() => setCurrent((c) => c - 1)}
              className="flex-1 rounded-xl border border-brand-navy/15 py-3 text-sm font-bold text-brand-navy"
            >
              Sebelumnya
            </button>
          )}
          {current < questions.length - 1 ? (
            <button
              type="button"
              disabled={!answers[q.id]}
              onClick={() => setCurrent((c) => c + 1)}
              className="flex-1 rounded-xl bg-brand-red text-white py-3 text-sm font-bold disabled:opacity-40"
            >
              Selanjutnya
            </button>
          ) : (
            <button
              type="button"
              disabled={!answers[q.id] || submitting}
              onClick={finishTest}
              className="flex-1 rounded-xl bg-brand-navy text-white py-3 text-sm font-bold disabled:opacity-40"
            >
              {submitting ? "Menyimpan..." : "Selesai"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
