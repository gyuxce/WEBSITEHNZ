import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CreditCard, FileCheck, MessageCircle, TestTube, Users } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { ProgressSteps } from "../components/ProgressSteps";
import { LANDING_URL } from "../lib/supabase";

const WHATSAPP_URL = "https://wa.me/message/DWVTJESHI2RQC1";

export function DashboardPage() {
  const { profile, progress } = useAuth();
  const isAdmin = profile?.role === "admin";

  if (isAdmin) {
    return <AdminHome name={profile?.full_name?.split(" ")[0] ?? "Admin"} />;
  }

  return <ParticipantHome profileName={profile?.full_name?.split(" ")[0] ?? "Peserta"} progress={progress} />;
}

function AdminHome({ name }: { name: string }) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-brand-red">Panel staf</p>
        <h1 className="font-display text-2xl font-extrabold text-brand-navy md:text-3xl">
          Halo, {name}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-brand-navy/55">
          Ini beranda admin — khusus kelola hasil peserta. Menu pembayaran/tes peserta tidak ditampilkan
          di sini agar tidak bentrok.
        </p>
      </div>

      <Link
        to="/admin/pimsleur"
        className="flex items-center justify-between gap-4 rounded-2xl border border-brand-navy/8 bg-white p-6 transition-all hover:border-brand-red/20 hover:shadow-md"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-red-soft text-brand-red">
            <Users size={24} />
          </div>
          <div>
            <p className="font-display text-lg font-bold text-brand-navy">Hasil Pimsleur peserta</p>
            <p className="mt-1 text-sm text-brand-navy/50">
              Daftar peserta, skor tahap 2–6, grade A–F, dan detail jawaban
            </p>
          </div>
        </div>
        <ArrowRight className="shrink-0 text-brand-red" size={20} />
      </Link>

      <div className="rounded-2xl border border-dashed border-brand-navy/15 bg-white/60 p-5 text-sm text-brand-navy/55">
        <p className="font-semibold text-brand-navy">Menyusul</p>
        <p className="mt-1">Admin Papikostik &amp; CFIT akan muncul di sini setelah materi siap.</p>
      </div>

      <a
        href={LANDING_URL}
        className="block text-center text-xs text-brand-navy/40 transition-colors hover:text-brand-red"
      >
        ← Kembali ke website Harunokaze
      </a>
    </div>
  );
}

function ParticipantHome({
  profileName,
  progress,
}: {
  profileName: string;
  progress: ReturnType<typeof useAuth>["progress"];
}) {
  const paymentDone =
    progress?.payment_status === "verified" || progress?.payment_status === "paid";
  const pimsleurDone = progress?.language_test_status === "completed";
  const resultAvailable =
    progress?.result_status === "available" ||
    progress?.result_status === "completed" ||
    pimsleurDone;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
      <div className="space-y-6 lg:col-span-3">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-brand-red">Beranda</p>
          <h1 className="font-display text-2xl font-extrabold text-brand-navy md:text-3xl">
            Halo, {profileName}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-brand-navy/55">
            Ikuti langkah pemetaan potensi. Setelah bayar, kerjakan Pimsleur. Papikostik &amp; CFIT
            menyusul.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            title="Tes Pimsleur"
            description="Aptitude bahasa · 25 menit · tahap 2–6"
            href="/test/pimsleur"
            disabled={!paymentDone || pimsleurDone}
            cta={pimsleurDone ? "Selesai" : "Mulai tes"}
          />
          <ActionCard
            icon={<TestTube size={20} />}
            title="Papikostik"
            description="Tes kepribadian — materi menyusul"
            href="/dashboard"
            disabled
            cta="Segera hadir"
          />
          <ActionCard
            icon={<FileCheck size={20} />}
            title="Hasil Pimsleur"
            description="Skor per tahap, grade A–F, rekomendasi"
            href="/result/pimsleur"
            disabled={!resultAvailable}
            cta={resultAvailable ? "Lihat hasil" : "Belum tersedia"}
          />
        </div>

        {pimsleurDone ? (
          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-brand-navy/8 bg-white p-6 sm:flex-row sm:items-center">
            <div className="flex gap-3">
              <MessageCircle className="mt-0.5 shrink-0 text-brand-red" size={20} />
              <div>
                <p className="text-sm font-bold text-brand-navy">Konsultasi lanjutan (opsional)</p>
                <p className="mt-1 text-xs text-brand-navy/55">
                  Diskusikan hasil Pimsleur dengan tim Harunokaze
                </p>
              </div>
            </div>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-brand-navy px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-navy-light"
            >
              Chat WhatsApp
              <ArrowRight size={16} />
            </a>
          </div>
        ) : null}
      </div>

      <div className="lg:col-span-2">
        <ProgressSteps progress={progress} />
        <a
          href={LANDING_URL}
          className="mt-4 block text-center text-xs text-brand-navy/40 transition-colors hover:text-brand-red"
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
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-red-soft text-brand-red">
          {icon}
        </div>
        <div>
          <p className="text-sm font-bold text-brand-navy">{title}</p>
          <p className="mt-1 text-xs text-brand-navy/50">{description}</p>
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
      <div className="cursor-not-allowed rounded-2xl border border-brand-navy/8 bg-white/60 p-5 opacity-60">
        {inner}
      </div>
    );
  }

  return (
    <Link
      to={href}
      className="rounded-2xl border border-brand-navy/8 bg-white p-5 transition-all hover:border-brand-red/20 hover:shadow-md"
    >
      {inner}
    </Link>
  );
}
