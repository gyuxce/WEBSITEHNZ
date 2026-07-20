import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

const CHARACTER_QUESTIONS = [
  {
    id: "c1",
    text: "Saat menghadapi tugas baru yang menantang, kamu cenderung...",
    options: [
      { label: "Langsung mencoba dan belajar sambil jalan", value: "a" },
      { label: "Merencanakan detail dulu sebelum mulai", value: "b" },
      { label: "Menunggu arahan dari orang yang lebih berpengalaman", value: "c" },
      { label: "Mencari informasi sebanyak mungkin terlebih dahulu", value: "d" },
    ],
  },
  {
    id: "c2",
    text: "Dalam bekerja di tim, kamu lebih sering...",
    options: [
      { label: "Mengambil inisiatif memimpin", value: "a" },
      { label: "Menjadi penyeimbang dan mediator", value: "b" },
      { label: "Fokus menyelesaikan tugas teknis", value: "c" },
      { label: "Mendukung anggota tim yang membutuhkan", value: "d" },
    ],
  },
  {
    id: "c3",
    text: "Ketika bekerja di lingkungan dengan budaya berbeda, kamu...",
    options: [
      { label: "Bersemangat beradaptasi dan belajar budaya baru", value: "a" },
      { label: "Bertanya langsung jika tidak mengerti", value: "b" },
      { label: "Mengamati dulu sebelum bertindak", value: "c" },
      { label: "Mencari komunitas yang familiar", value: "d" },
    ],
  },
  {
    id: "c4",
    text: "Motivasi terbesarmu bekerja di Jepang adalah...",
    options: [
      { label: "Pengembangan karier dan skill", value: "a" },
      { label: "Stabilitas finansial keluarga", value: "b" },
      { label: "Pengalaman hidup di luar negeri", value: "c" },
      { label: "Menerapkan ilmu dan membanggakan keluarga", value: "d" },
    ],
  },
  {
    id: "c5",
    text: "Saat menghadapi tekanan deadline, kamu...",
    options: [
      { label: "Semakin fokus dan produktif", value: "a" },
      { label: "Meminta bantuan tim", value: "b" },
      { label: "Mengatur ulang prioritas", value: "c" },
      { label: "Tetap tenang dan bekerja bertahap", value: "d" },
    ],
  },
];

export function CharacterTestPage() {
  const { user, progress, refreshProfile } = useAuth();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const canTake =
    progress?.language_test_status === "completed" && progress.character_test_status !== "completed";

  const finishTest = async () => {
    if (!user || submitting) return;
    setSubmitting(true);

    const { data: session } = await supabase
      .from("test_sessions")
      .insert({ user_id: user.id, test_type: "character" })
      .select("id")
      .single();

    if (session) {
      await supabase
        .from("test_sessions")
        .update({
          completed_at: new Date().toISOString(),
          score: 100,
          passed: true,
        })
        .eq("id", session.id);
    }

    await supabase
      .from("user_progress")
      .update({
        character_test_status: "completed",
        result_status: "available",
      })
      .eq("user_id", user.id);

    await refreshProfile();
    setSubmitting(false);
  };

  if (progress?.character_test_status === "completed") {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <p className="text-brand-navy font-bold">Tes kepribadian sudah selesai.</p>
        <Link to="/result" className="mt-4 inline-block text-brand-red font-semibold text-sm">
          Lihat hasil
        </Link>
      </div>
    );
  }

  if (!canTake) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <p className="text-brand-navy/60 text-sm">Selesaikan tes bahasa terlebih dahulu.</p>
        <Link to="/dashboard" className="mt-4 inline-block text-brand-red font-semibold text-sm">
          Kembali ke dashboard
        </Link>
      </div>
    );
  }

  const q = CHARACTER_QUESTIONS[current];

  return (
    <div className="max-w-xl mx-auto">
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-brand-navy/50 hover:text-brand-red mb-6">
        <ArrowLeft size={16} /> Dashboard
      </Link>

      <div className="rounded-2xl border border-brand-navy/8 bg-white p-8 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-brand-navy/40 mb-2">
          Tes Kepribadian — {current + 1}/{CHARACTER_QUESTIONS.length}
        </p>
        <h2 className="font-display font-bold text-lg text-brand-navy mb-6">{q.text}</h2>

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
              className="flex-1 rounded-xl border border-brand-navy/15 py-3 text-sm font-bold"
            >
              Sebelumnya
            </button>
          )}
          {current < CHARACTER_QUESTIONS.length - 1 ? (
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
