import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Award, Download } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { buildCertificateHtml } from "../lib/certificateHtml";
import type { Database } from "../lib/database.types";

type Certificate = Database["public"]["Tables"]["certificates"]["Row"];

export function CertificatePage() {
  const { user, profile, progress } = useAuth();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const approved = progress?.result_status === "completed";

  useEffect(() => {
    if (!user || !approved) {
      setLoading(false);
      return;
    }

    async function load() {
      const { data, error: queryError } = await supabase
        .from("certificates")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (queryError) setError(queryError.message);
      setCertificate(data);
      setLoading(false);
    }

    void load();
  }, [user, approved]);

  function handleDownload() {
    if (!certificate || !profile) return;

    const html = buildCertificateHtml({
      fullName: profile.full_name,
      certificateCode: certificate.certificate_code,
      score: certificate.score,
      recommendation: certificate.recommendation,
      issuedAt: certificate.issued_at,
      programInterest: profile.program_interest,
    });
    const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `sertifikat-pemetaan-${certificate.certificate_code}.html`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (!approved) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <Award className="mx-auto text-brand-red" size={32} />
        <h1 className="mt-4 font-display text-xl font-extrabold text-brand-navy">
          Sertifikat belum tersedia
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-brand-navy/55">
          Hasil masih menunggu interpretasi psikolog, QC internal, dan persetujuan admin.
        </p>
        <Link to="/dashboard" className="mt-5 inline-block text-sm font-semibold text-brand-red">
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

  if (error || !certificate) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <p className="text-sm text-brand-red">{error || "Sertifikat belum ditemukan."}</p>
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
        <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-red-soft text-brand-red">
          <Award size={32} />
        </div>
        <p className="mt-5 text-xs font-bold uppercase tracking-widest text-brand-red">
          Pemetaan Potensi Harunokaze
        </p>
        <h1 className="mt-1 font-display text-2xl font-extrabold text-brand-navy">
          Sertifikat diterbitkan
        </h1>
        <p className="mt-1 text-sm text-brand-navy/50">{profile?.full_name}</p>

        <div className="mt-7 rounded-xl bg-brand-bg p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-brand-navy/40">
            Kode sertifikat
          </p>
          <p className="mt-2 font-mono text-sm font-bold text-brand-navy">
            {certificate.certificate_code}
          </p>
        </div>

        <div className="mt-5 rounded-xl border border-brand-navy/8 p-5 text-left">
          <p className="text-xs font-bold uppercase tracking-wide text-brand-navy/40">
            Narasi hasil
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-brand-navy/70">
            {certificate.recommendation}
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownload}
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-brand-navy px-6 py-3.5 text-sm font-bold text-white hover:bg-brand-navy-light"
        >
          <Download size={18} /> Unduh sertifikat
        </button>
      </div>
    </div>
  );
}
