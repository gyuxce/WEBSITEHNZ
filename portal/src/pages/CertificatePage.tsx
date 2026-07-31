import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Award, Download, ExternalLink } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { buildCertificateHtml } from "../lib/certificateHtml";
import { LANDING_URL, supabase } from "../lib/supabase";
import type { CfitResult, PapikostikResult, PimsleurResult } from "../lib/database.types";

function generateCertificateCode(): string {
  const part = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `HNZ-${new Date().getFullYear()}-${part}`;
}

export function CertificatePage() {
  const { user, profile, progress, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [certificateCode, setCertificateCode] = useState("");
  const [issuedAt, setIssuedAt] = useState("");
  const [pimsleur, setPimsleur] = useState<PimsleurResult | null>(null);
  const [cfit, setCfit] = useState<CfitResult | null>(null);
  const [papi, setPapi] = useState<PapikostikResult | null>(null);

  const canView =
    progress?.result_status === "completed" ||
    progress?.result_status === "available" ||
    papi?.review_status === "reviewed";

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function load() {
      const [pimsleurRes, cfitRes, papiRes, certRes] = await Promise.all([
        supabase
          .from("pimsleur_results")
          .select("*")
          .eq("user_id", user!.id)
          .order("completed_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("cfit_results")
          .select("*")
          .eq("user_id", user!.id)
          .order("completed_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("papikostik_results")
          .select("*")
          .eq("user_id", user!.id)
          .order("completed_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from("certificates").select("*").eq("user_id", user!.id).maybeSingle(),
      ]);

      if (pimsleurRes.error || cfitRes.error || papiRes.error || certRes.error) {
        setError(
          pimsleurRes.error?.message ||
            cfitRes.error?.message ||
            papiRes.error?.message ||
            certRes.error?.message ||
            "Gagal memuat data sertifikat",
        );
        setLoading(false);
        return;
      }

      setPimsleur(pimsleurRes.data);
      setCfit(cfitRes.data);
      setPapi(papiRes.data);

      const reviewed = papiRes.data?.review_status === "reviewed";
      if (!reviewed) {
        setLoading(false);
        return;
      }

      if (certRes.data) {
        setCertificateCode(certRes.data.certificate_code);
        setIssuedAt(certRes.data.issued_at);
      } else {
        const code = generateCertificateCode();
        const recommendation =
          papiRes.data?.final_summary ||
          papiRes.data?.psychologist_notes ||
          "Peserta telah menyelesaikan seluruh tahapan pemetaan potensi.";
        const score = pimsleurRes.data?.score_total ?? 0;
        const { data: created, error: createError } = await supabase
          .from("certificates")
          .insert({
            user_id: user!.id,
            certificate_code: code,
            score,
            recommendation,
          })
          .select("*")
          .single();

        if (createError) {
          setError(createError.message);
        } else if (created) {
          setCertificateCode(created.certificate_code);
          setIssuedAt(created.issued_at);
          await supabase
            .from("user_progress")
            .update({ result_status: "completed" })
            .eq("user_id", user!.id);
          await refreshProfile();
        }
      }

      setLoading(false);
    }

    void load();
  }, [user, refreshProfile]);

  const reviewed = papi?.review_status === "reviewed";

  const handleDownload = () => {
    if (!profile || !certificateCode) return;

    const html = buildCertificateHtml({
      fullName: profile.full_name,
      certificateCode,
      issuedAt: issuedAt || new Date().toISOString(),
      cfitRawTotal: cfit?.raw_total ?? null,
      cfitIq: cfit?.iq ?? null,
      cfitCategory: cfit?.category ?? null,
      papiHasil: papi?.final_summary
        ? papi.final_summary.split("\n")[0].slice(0, 120)
        : "Telah direview psikolog",
      papiCatatan: papi?.psychologist_notes || papi?.final_summary || null,
      pimsleurScore: pimsleur?.score_total ?? null,
      pimsleurGrade: pimsleur?.grade ?? null,
      pimsleurStatusLabel: pimsleur?.status_label ?? null,
      pimsleurRecommendation: pimsleur?.recommendation ?? null,
    });

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sertifikat-pemetaan-${certificateCode}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-red border-t-transparent" />
      </div>
    );
  }

  if (!reviewed && !canView) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <p className="text-sm text-brand-navy/60">
          Sertifikat muncul setelah psikolog menyelesaikan review PAPI Kostick.
        </p>
        <Link to="/dashboard" className="mt-4 inline-block text-sm font-semibold text-brand-red">
          Kembali ke dashboard
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <p className="text-sm text-brand-red">{error}</p>
        <Link to="/dashboard" className="mt-4 inline-block text-sm font-semibold text-brand-red">
          Kembali ke dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <Link
        to="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-brand-navy/50 hover:text-brand-red"
      >
        <ArrowLeft size={16} /> Dashboard
      </Link>

      <div className="rounded-2xl border border-brand-navy/8 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-red-soft text-brand-red">
          <Award size={32} />
        </div>
        <h1 className="font-display text-2xl font-extrabold text-brand-navy">
          Sertifikasi Pemetaan Talenta
        </h1>
        <p className="mt-1 text-sm text-brand-navy/50">{profile?.full_name}</p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-brand-bg p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-brand-navy/40">
              Kode sertifikat
            </p>
            <p className="mt-1 font-mono text-sm font-bold text-brand-navy">{certificateCode || "-"}</p>
          </div>
          <div className="rounded-xl bg-brand-bg p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-brand-navy/40">
              Status review
            </p>
            <p className="mt-1 text-sm font-bold text-emerald-700">Selesai</p>
          </div>
        </div>

        <div className="mt-6 space-y-2 rounded-xl border border-brand-navy/8 p-4 text-left text-sm text-brand-navy/65">
          <p>
            <span className="font-bold text-brand-navy">Pimsleur:</span>{" "}
            {pimsleur
              ? `${pimsleur.score_total} / ${pimsleur.grade} · ${pimsleur.status_label}`
              : "Belum ada"}
          </p>
          <p>
            <span className="font-bold text-brand-navy">CFIT:</span>{" "}
            {cfit
              ? `Raw ${cfit.raw_total ?? "-"}/50 · IQ ${cfit.iq ?? "-"} · ${cfit.category ?? "-"}`
              : "Belum ada"}
          </p>
          <p>
            <span className="font-bold text-brand-navy">PAPI:</span>{" "}
            {papi?.final_summary
              ? papi.final_summary.split("\n")[0].slice(0, 100)
              : "Telah direview psikolog"}
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownload}
          disabled={!certificateCode}
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-red px-6 py-3.5 text-sm font-bold text-white hover:bg-brand-red-hover disabled:opacity-50"
        >
          <Download size={18} />
          Unduh Sertifikat (HTML/PDF via print)
        </button>

        <a
          href={LANDING_URL}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-brand-navy/12 px-6 py-3.5 text-sm font-bold text-brand-navy hover:bg-brand-bg"
        >
          <ExternalLink size={16} />
          Kembali ke website Harunokaze
        </a>
      </div>
    </div>
  );
}
