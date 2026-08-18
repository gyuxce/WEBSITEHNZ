import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Award,
  ClipboardList,
  CreditCard,
  FileCheck,
  MessageCircle,
  ReceiptText,
  TestTube,
  Users,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { ProgressSteps } from "../components/ProgressSteps";
import { LANDING_URL } from "../lib/supabase";
import { isPsychologistRole } from "../lib/access";

const WHATSAPP_URL = "https://wa.me/message/DWVTJESHI2RQC1";

export function DashboardPage() {
  const { profile, progress } = useAuth();
  const isAdmin = profile?.role === "admin";

  if (isAdmin) {
    return <AdminHome name={profile?.full_name?.split(" ")[0] ?? "Admin"} />;
  }

  if (isPsychologistRole(profile?.role)) {
    return <PsychologistHome name={profile?.full_name?.split(" ")[0] ?? "Psikolog"} />;
  }

  return <ParticipantHome profileName={profile?.full_name?.split(" ")[0] ?? "Peserta"} progress={progress} />;
}

function PsychologistHome({ name }: { name: string }) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-brand-red">
          Panel psikolog
        </p>
        <h1 className="font-display text-2xl font-extrabold text-brand-navy md:text-3xl">
          Halo, {name}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-brand-navy/55">
          Kelola pembacaan hasil asesmen peserta dan tulis interpretasi psikolog. Menu pembayaran dan
          persetujuan sertifikat tidak tersedia di area ini.
        </p>
      </div>

      <Link
        to="/psychologist/papikostik"
        className="flex items-center justify-between gap-4 rounded-2xl border border-brand-navy/8 bg-white p-6 transition-all hover:border-brand-red/20 hover:shadow-md"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-red-soft text-brand-red">
            <FileCheck size={24} />
          </div>
          <div>
            <p className="font-display text-lg font-bold text-brand-navy">Antrean review PAPI Kostick</p>
            <p className="mt-1 text-sm text-brand-navy/50">
              Baca profil faktor dan isi interpretasi psikolog peserta
            </p>
          </div>
        </div>
        <ArrowRight className="shrink-0 text-brand-red" size={20} />
      </Link>

      <Link
        to="/psychologist/recap"
        className="flex items-center justify-between gap-4 rounded-2xl border border-brand-navy/8 bg-white p-6 transition-all hover:border-brand-red/20 hover:shadow-md"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-red-soft text-brand-red">
            <ClipboardList size={24} />
          </div>
          <div>
            <p className="font-display text-lg font-bold text-brand-navy">Rekap asesmen peserta</p>
            <p className="mt-1 text-sm text-brand-navy/50">
              Lihat ringkasan tiga tes, waktu pengerjaan, dan status kelengkapan
            </p>
          </div>
        </div>
        <ArrowRight className="shrink-0 text-brand-red" size={20} />
      </Link>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          to="/psychologist/pimsleur"
          className="rounded-2xl border border-brand-navy/8 bg-white p-5 transition-all hover:border-brand-red/20 hover:shadow-md"
        >
          <p className="font-display font-bold text-brand-navy">Hasil Pimsleur</p>
          <p className="mt-1 text-sm text-brand-navy/50">Lihat skor dan detail jawaban peserta</p>
        </Link>
        <Link
          to="/psychologist/cfit"
          className="rounded-2xl border border-brand-navy/8 bg-white p-5 transition-all hover:border-brand-red/20 hover:shadow-md"
        >
          <p className="font-display font-bold text-brand-navy">Hasil CFIT</p>
          <p className="mt-1 text-sm text-brand-navy/50">Lihat IQ, kategori, dan detail jawaban</p>
        </Link>
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
        to="/admin/payments"
        className="flex items-center justify-between gap-4 rounded-2xl border border-brand-navy/8 bg-white p-6 transition-all hover:border-brand-red/20 hover:shadow-md"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-red-soft text-brand-red">
            <ReceiptText size={24} />
          </div>
          <div>
            <p className="font-display text-lg font-bold text-brand-navy">Tagihan peserta</p>
            <p className="mt-1 text-sm text-brand-navy/50">
              Tetapkan nominal, jatuh tempo, dan pantau status pembayaran
            </p>
          </div>
        </div>
        <ArrowRight className="shrink-0 text-brand-red" size={20} />
      </Link>

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

      <Link
        to="/admin/cfit"
        className="flex items-center justify-between gap-4 rounded-2xl border border-brand-navy/8 bg-white p-6 transition-all hover:border-brand-red/20 hover:shadow-md"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-red-soft text-brand-red">
            <TestTube size={24} />
          </div>
          <div>
            <p className="font-display text-lg font-bold text-brand-navy">Hasil CFIT peserta</p>
            <p className="mt-1 text-sm text-brand-navy/50">
              Raw score, IQ, kategori, dan detail jawaban per soal
            </p>
          </div>
        </div>
        <ArrowRight className="shrink-0 text-brand-red" size={20} />
      </Link>

      <Link
        to="/admin/papikostik"
        className="flex items-center justify-between gap-4 rounded-2xl border border-brand-navy/8 bg-white p-6 transition-all hover:border-brand-red/20 hover:shadow-md"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-red-soft text-brand-red">
            <FileCheck size={24} />
          </div>
          <div>
            <p className="font-display text-lg font-bold text-brand-navy">
              Hasil PAPI Kostick peserta
            </p>
            <p className="mt-1 text-sm text-brand-navy/50">
              Skor 20 faktor, detail jawaban, dan catatan review psikolog/admin
            </p>
          </div>
        </div>
        <ArrowRight className="shrink-0 text-brand-red" size={20} />
      </Link>

      <Link
        to="/admin/recap"
        className="flex items-center justify-between gap-4 rounded-2xl border border-brand-navy/8 bg-white p-6 transition-all hover:border-brand-red/20 hover:shadow-md"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-red-soft text-brand-red">
            <ClipboardList size={24} />
          </div>
          <div>
            <p className="font-display text-lg font-bold text-brand-navy">Rekap asesmen peserta</p>
            <p className="mt-1 text-sm text-brand-navy/50">
              Ringkasan tiga tes dan status review dalam satu tampilan admin
            </p>
          </div>
        </div>
        <ArrowRight className="shrink-0 text-brand-red" size={20} />
      </Link>

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
  const cfitDone = progress?.cfit_test_status === "completed";
  const papikostikDone = progress?.papikostik_test_status === "completed";
  const finalApproved = progress?.result_status === "completed";
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
            Ikuti langkah pemetaan potensi. Setelah bayar, kerjakan Pimsleur dan lihat rekomendasi
            awalmu.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ActionCard
            icon={<CreditCard size={20} />}
            title="Pembayaran Pemetaan"
            description="Bayar Rp99.000 untuk membuka tes"
            href="/payment"
            disabled={paymentDone}
            cta={paymentDone ? "Sudah dibayar" : "Bayar sekarang"}
          />
          <ActionCard
            icon={<TestTube size={20} />}
            title="Tes Pimsleur"
            description="Aptitude bahasa · 30 menit · tahap 2–6"
            href="/test/pimsleur"
            disabled={!paymentDone || pimsleurDone}
            cta={pimsleurDone ? "Selesai" : "Mulai tes"}
          />
          <ActionCard
            icon={<TestTube size={20} />}
            title="CFIT"
            description="Tes kognitif, aktif setelah Pimsleur"
            href="/test/cfit"
            disabled={!pimsleurDone || cfitDone}
            cta={cfitDone ? "Selesai" : pimsleurDone ? "Mulai tes" : "Terkunci"}
          />
          <ActionCard
            icon={<TestTube size={20} />}
            title="PAPI Kostick"
            description="Tes preferensi kerja, aktif setelah CFIT"
            href="/test/papikostik"
            disabled={!cfitDone || papikostikDone}
            cta={papikostikDone ? "Selesai" : cfitDone ? "Mulai tes" : "Terkunci"}
          />
          <ActionCard
            icon={<FileCheck size={20} />}
            title="Hasil Pimsleur"
            description="Skor per tahap, grade A–F, rekomendasi"
            href="/result/pimsleur"
            disabled={!resultAvailable}
            cta={resultAvailable ? "Lihat hasil" : "Belum tersedia"}
          />
          <ActionCard
            icon={<FileCheck size={20} />}
            title="Hasil CFIT"
            description="Raw score, IQ, dan kategori"
            href="/result/cfit"
            disabled={!cfitDone}
            cta={cfitDone ? "Lihat hasil" : "Belum tersedia"}
          />
          <ActionCard
            icon={<FileCheck size={20} />}
            title="Status PAPI Kostick"
            description="Status jawaban dan review psikolog/admin"
            href="/result/papikostik"
            disabled={!papikostikDone}
            cta={papikostikDone ? "Lihat status" : "Belum tersedia"}
          />
          <ActionCard
            icon={<Award size={20} />}
            title="Sertifikat Pemetaan"
            description="Tersedia setelah psikolog, QC, dan admin menyetujui hasil"
            href="/result/certificate"
            disabled={!finalApproved}
            cta={finalApproved ? "Lihat sertifikat" : "Menunggu review"}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-brand-navy/12 bg-white px-5 py-3 text-sm font-bold text-brand-navy hover:border-brand-red/30 hover:text-brand-red"
          >
            <MessageCircle size={18} />
            Konsultasi lanjutan (WhatsApp)
          </a>
          <a
            href={LANDING_URL}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-brand-navy/12 bg-white px-5 py-3 text-sm font-bold text-brand-navy hover:border-brand-red/30 hover:text-brand-red"
          >
            ← Kembali ke website
          </a>
        </div>
      </div>

      <div className="lg:col-span-2">
        <ProgressSteps progress={progress} />
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
