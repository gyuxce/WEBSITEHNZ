import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CreditCard, FileCheck, MessageCircle, TestTube } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { ProgressSteps } from "../components/ProgressSteps";
import { LANDING_URL } from "../lib/supabase";

const WHATSAPP_URL = "https://wa.me/message/DWVTJESHI2RQC1";

export function DashboardPage() {
  const { profile, progress } = useAuth();

  const paymentDone = progress?.payment_status === "verified";
  const languageDone = progress?.language_test_status === "completed";
  const characterDone = progress?.character_test_status === "completed";
  const resultDone = progress?.result_status === "completed";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      <div className="lg:col-span-3 space-y-6">
        <div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-brand-navy">
            Halo, {profile?.full_name?.split(" ")[0] ?? "Peserta"} 👋
          </h1>
          <p className="mt-2 text-brand-navy/55 text-sm leading-relaxed">
            Ikuti langkah pemetaan potensi di bawah ini. Setiap tahap akan terbuka setelah tahap sebelumnya selesai.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ActionCard
            icon={<CreditCard size={20} />}
            title="Pembayaran Pemetaan"
            description="Bayar biaya pemetaan untuk membuka tes"
            href="/payment"
            disabled={paymentDone}
            cta={paymentDone ? "Sudah dibayar" : "Bayar sekarang"}
          />
          <ActionCard
            icon={<TestTube size={20} />}
            title="Tes Bahasa"
            description="Tes bakat bahasa Jepang (5 soal)"
            href="/test/language"
            disabled={!paymentDone || languageDone}
            cta={languageDone ? "Selesai" : "Mulai tes"}
          />
          <ActionCard
            icon={<TestTube size={20} />}
            title="Tes Kepribadian"
            description="Kuesioner singkat kepribadian"
            href="/test/character"
            disabled={!languageDone || characterDone}
            cta={characterDone ? "Selesai" : "Mulai tes"}
          />
          <ActionCard
            icon={<FileCheck size={20} />}
            title="Hasil & Sertifikat"
            description="Lihat skor dan unduh sertifikat"
            href="/result"
            disabled={!characterDone}
            cta={resultDone ? "Lihat hasil" : "Belum tersedia"}
          />
        </div>

        {characterDone && (
          <div className="rounded-2xl border border-brand-navy/8 bg-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex gap-3">
              <MessageCircle className="text-brand-red shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-brand-navy text-sm">Konsultasi lanjutan (opsional)</p>
                <p className="text-xs text-brand-navy/55 mt-1">
                  Diskusikan hasil pemetaan dengan tim Harunokaze
                </p>
              </div>
            </div>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-navy text-white text-sm font-bold px-5 py-2.5 hover:bg-brand-navy-light transition-colors shrink-0"
            >
              Chat WhatsApp
              <ArrowRight size={16} />
            </a>
          </div>
        )}
      </div>

      <div className="lg:col-span-2">
        <ProgressSteps progress={progress} />
        <a
          href={LANDING_URL}
          className="mt-4 block text-center text-xs text-brand-navy/40 hover:text-brand-red transition-colors"
        >
          ← Kembali ke website Harunokaze
        </a>
      </div>
    </div>
  );
}

function ActionCard({
  icon,
  title,
  description,
  href,
  disabled,
  cta,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  href: string;
  disabled?: boolean;
  cta: string;
}) {
  const inner = (
  <>
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-brand-red-soft text-brand-red flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <p className="font-bold text-brand-navy text-sm">{title}</p>
          <p className="text-xs text-brand-navy/50 mt-1">{description}</p>
        </div>
      </div>
      <span
        className={`mt-4 inline-flex items-center gap-1 text-xs font-bold ${
          disabled ? "text-brand-navy/30" : "text-brand-red"
        }`}
      >
        {cta}
        {!disabled && <ArrowRight size={14} />}
      </span>
    </>
  );

  if (disabled) {
    return (
      <div className="rounded-2xl border border-brand-navy/8 bg-white/60 p-5 opacity-60 cursor-not-allowed">
        {inner}
      </div>
    );
  }

  return (
    <Link
      to={href}
      className="rounded-2xl border border-brand-navy/8 bg-white p-5 hover:border-brand-red/20 hover:shadow-md transition-all"
    >
      {inner}
    </Link>
  );
}
