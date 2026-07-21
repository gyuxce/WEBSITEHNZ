import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import {
  getQuestionsForSection,
  PIMSLEUR_MAX_SCORE,
  PIMSLEUR_SECTIONS,
} from "../data/pimsleurQuestions";
import type { PimsleurResult } from "../lib/database.types";

type Detail = PimsleurResult & {
  full_name: string;
  whatsapp: string | null;
  city: string | null;
};

export function AdminPimsleurDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const { profile, loading: authLoading } = useAuth();
  const [row, setRow] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId || authLoading || profile?.role !== "admin") return;

    async function load() {
      const { data, error: qError } = await supabase
        .from("pimsleur_results")
        .select("*")
        .eq("user_id", userId!)
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (qError) {
        setError(qError.message);
        setLoading(false);
        return;
      }

      if (!data) {
        setRow(null);
        setLoading(false);
        return;
      }

      const { data: p } = await supabase
        .from("profiles")
        .select("full_name, whatsapp, city")
        .eq("id", userId!)
        .maybeSingle();

      setRow({
        ...data,
        full_name: p?.full_name ?? "—",
        whatsapp: p?.whatsapp ?? null,
        city: p?.city ?? null,
      });
      setLoading(false);
    }

    void load();
  }, [userId, authLoading, profile?.role]);

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
        <p className="text-sm text-brand-red">{error || "Hasil tidak ditemukan."}</p>
        <Link to="/admin/pimsleur" className="mt-4 inline-block text-sm font-semibold text-brand-red">
          Kembali
        </Link>
      </div>
    );
  }

  const answers = (row.answers ?? {}) as Record<string, string>;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/admin/pimsleur"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-brand-navy/50 hover:text-brand-red"
      >
        <ArrowLeft size={16} /> Daftar hasil
      </Link>

      <h1 className="font-display text-2xl font-extrabold text-brand-navy">{row.full_name}</h1>
      <p className="mt-1 text-sm text-brand-navy/50">
        Grade {row.grade} · {row.score_total}/{PIMSLEUR_MAX_SCORE} · {row.status_label}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {(
          [
            ["S2", row.score_section2],
            ["S3", row.score_section3],
            ["S4", row.score_section4],
            ["S5", row.score_section5],
            ["S6", row.score_section6],
          ] as const
        ).map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-brand-navy/8 bg-white p-3 text-center"
          >
            <p className="text-[10px] font-bold uppercase text-brand-navy/40">{label}</p>
            <p className="font-display text-lg font-extrabold text-brand-navy">{value}</p>
          </div>
        ))}
      </div>

      <p className="mt-4 rounded-xl bg-brand-bg p-4 text-sm text-brand-navy/70">{row.recommendation}</p>

      <div className="mt-8 space-y-8">
        {PIMSLEUR_SECTIONS.map((section) => {
          const qs = getQuestionsForSection(section.id);
          return (
            <section key={section.id}>
              <h2 className="mb-3 font-display text-lg font-bold text-brand-navy">{section.title}</h2>
              <div className="space-y-2">
                {qs.map((q) => {
                  const ans = answers[q.id] ?? "—";
                  const optLabel = q.options.find((o) => o.value === ans)?.label ?? ans;
                  return (
                    <div
                      key={q.id}
                      className="rounded-xl border border-brand-navy/8 bg-white px-4 py-3 text-sm"
                    >
                      <p className="font-medium text-brand-navy">
                        {q.number}. {q.prompt}
                      </p>
                      <p className="mt-1 text-brand-navy/55">Jawaban: {optLabel}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
