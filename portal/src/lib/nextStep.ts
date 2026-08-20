import type { UserProgress } from "./database.types";

export type NextStepTone = "action" | "wait" | "done";

export type NextStep = {
  key: string;
  href: string;
  title: string;
  description: string;
  cta: string;
  tone: NextStepTone;
};

function isPaid(progress: UserProgress | null): boolean {
  return progress?.payment_status === "verified" || progress?.payment_status === "paid";
}

/** Satu langkah yang harus dikerjakan peserta sekarang. Alur lengkap tetap tampil di dashboard. */
export function getParticipantNextStep(progress: UserProgress | null): NextStep {
  if (!isPaid(progress)) {
    return {
      key: "payment",
      href: "/payment",
      title: "Bayar pemetaan dulu",
      description: "Setelah pembayaran terverifikasi, tiga tes terbuka berurutan: Pimsleur, CFIT, lalu PAPI.",
      cta: "Bayar sekarang",
      tone: "action",
    };
  }

  if (progress?.language_test_status !== "completed") {
    const resume = progress?.language_test_status === "in_progress";
    return {
      key: "language",
      href: "/test/pimsleur",
      title: resume ? "Lanjutkan tes Pimsleur" : "Kerjakan tes Pimsleur",
      description: "Tes aptitude bahasa · tahap 2–6. Ini tes pertama dari tiga.",
      cta: resume ? "Lanjutkan tes" : "Mulai tes Pimsleur",
      tone: "action",
    };
  }

  if (progress?.cfit_test_status !== "completed") {
    const resume = progress?.cfit_test_status === "in_progress";
    return {
      key: "cfit",
      href: "/test/cfit",
      title: resume ? "Lanjutkan tes CFIT" : "Kerjakan tes CFIT",
      description: "Tes kognitif. Setelah ini, PAPI Kostick akan terbuka.",
      cta: resume ? "Lanjutkan tes" : "Mulai tes CFIT",
      tone: "action",
    };
  }

  if (progress?.papikostik_test_status !== "completed") {
    const resume = progress?.papikostik_test_status === "in_progress";
    return {
      key: "papikostik",
      href: "/test/papikostik",
      title: resume ? "Lanjutkan tes PAPI Kostick" : "Kerjakan tes PAPI Kostick",
      description: "Tes preferensi kerja. Ini tes terakhir sebelum review.",
      cta: resume ? "Lanjutkan tes" : "Mulai tes PAPI",
      tone: "action",
    };
  }

  if (progress?.result_status === "completed") {
    return {
      key: "certificate",
      href: "/result/certificate",
      title: "Sertifikat sudah siap",
      description: "Hasil sudah disetujui. Unduh sertifikat pemetaanmu.",
      cta: "Lihat sertifikat",
      tone: "done",
    };
  }

  return {
    key: "result",
    href: "/result/papikostik",
    title: "Menunggu review hasil",
    description:
      "Tiga tes sudah selesai. Psikolog, QC, dan admin meninjau hasil sebelum sertifikat terbit.",
    cta: "Lihat status review",
    tone: "wait",
  };
}

export function getProgressStepHref(
  stepKey: string,
  progress: UserProgress | null,
  status: "done" | "active" | "pending" | "locked" | "optional",
): string | null {
  if (status === "locked" || status === "pending") return null;

  switch (stepKey) {
    case "registration":
      return "/dashboard";
    case "payment":
      return "/payment";
    case "language":
      return progress?.language_test_status === "completed" ? "/result/pimsleur" : "/test/pimsleur";
    case "cfit":
      return progress?.cfit_test_status === "completed" ? "/result/cfit" : "/test/cfit";
    case "papikostik":
      return progress?.papikostik_test_status === "completed"
        ? "/result/papikostik"
        : "/test/papikostik";
    case "result":
      return "/result/papikostik";
    case "certificate":
      return progress?.result_status === "completed" ? "/result/certificate" : null;
    default:
      return null;
  }
}
