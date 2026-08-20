import { Check, Clock, Lock, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import type { UserProgress } from "../lib/database.types";
import { PROGRESS_STEPS } from "../lib/database.types";
import { getParticipantNextStep, getProgressStepHref } from "../lib/nextStep";

type StepStatus = "done" | "active" | "pending" | "locked" | "optional";

function getStepStatus(stepKey: string, progress: UserProgress | null): StepStatus {
  if (!progress) return "pending";

  switch (stepKey) {
    case "registration":
      return progress.registration_status === "completed" ? "done" : "active";
    case "payment":
      if (progress.payment_status === "verified") return "done";
      if (progress.payment_status === "paid") return "active";
      return progress.registration_status === "completed" ? "active" : "locked";
    case "language":
      if (progress.language_test_status === "completed") return "done";
      if (progress.language_test_status === "in_progress") return "active";
      if (progress.language_test_status === "available") return "active";
      return progress.payment_status === "verified" || progress.payment_status === "paid"
        ? "active"
        : "locked";
    case "cfit":
      if (progress.cfit_test_status === "completed") return "done";
      if (progress.cfit_test_status === "in_progress") return "active";
      if (progress.cfit_test_status === "available") return "active";
      return progress.language_test_status === "completed" ? "active" : "locked";
    case "papikostik":
      if (progress.papikostik_test_status === "completed") return "done";
      if (progress.papikostik_test_status === "in_progress") return "active";
      if (progress.papikostik_test_status === "available") return "active";
      return progress.cfit_test_status === "completed" ? "active" : "locked";
    case "result":
      if (progress.result_status === "completed") return "done";
      if (progress.final_review_status === "pending_psychologist") return "active";
      if (progress.final_review_status === "pending_qc") return "active";
      if (
        progress.language_test_status === "completed" &&
        progress.cfit_test_status === "completed" &&
        progress.papikostik_test_status === "completed"
      ) {
        return "active";
      }
      return "locked";
    case "certificate":
      return progress.result_status === "completed" ? "done" : "locked";
    case "character":
      if (progress.character_test_status === "completed") return "done";
      if (progress.character_test_status === "available" || progress.character_test_status === "in_progress") {
        return "active";
      }
      return "locked";
    case "consultation":
      return progress.consultation_status === "completed" ? "done" : "optional";
    default:
      return "pending";
  }
}

const statusConfig: Record<StepStatus, { label: string; className: string; icon: ReactNode }> = {
  done: {
    label: "Selesai",
    className: "bg-emerald-50 text-emerald-600",
    icon: <Check size={12} />,
  },
  active: {
    label: "Berlangsung",
    className: "bg-brand-red-soft text-brand-red",
    icon: <Sparkles size={12} />,
  },
  pending: {
    label: "Menunggu",
    className: "bg-brand-navy/5 text-brand-navy/45",
    icon: <Clock size={12} />,
  },
  locked: {
    label: "Terkunci",
    className: "bg-brand-navy/5 text-brand-navy/30",
    icon: <Lock size={12} />,
  },
  optional: {
    label: "Opsional",
    className: "bg-brand-navy/5 text-brand-navy/45",
    icon: <Clock size={12} />,
  },
};

export function ProgressSteps({ progress }: { progress: UserProgress | null }) {
  const nextStep = getParticipantNextStep(progress);

  return (
    <div className="rounded-2xl border border-brand-navy/8 bg-white p-6 shadow-sm">
      <h2 className="mb-1 font-display text-lg font-bold text-brand-navy">Progress Pemetaan</h2>
      <p className="mb-4 text-xs leading-relaxed text-brand-navy/45">
        Semua langkah tetap tampil. Yang sudah terbuka bisa diklik.
      </p>
      <div className="flex flex-col">
        {PROGRESS_STEPS.map((step, i) => {
          const status = getStepStatus(step.key, progress);
          const style = statusConfig[status];
          const href = getProgressStepHref(step.key, progress, status);
          const isNext = step.key === nextStep.key;
          const rowClass = clsx(
            "flex items-center justify-between py-3.5 text-sm",
            i !== PROGRESS_STEPS.length - 1 && "border-b border-brand-navy/8",
            isNext && "rounded-xl bg-brand-red-soft/60 px-2 -mx-2",
            href && "transition-colors hover:text-brand-red",
          );

          const content = (
            <>
              <span className={clsx("font-medium", isNext ? "text-brand-navy" : "text-brand-navy/75")}>
                {step.label}
              </span>
              <span
                className={clsx(
                  "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide",
                  style.className,
                )}
              >
                {style.icon}
                {style.label}
              </span>
            </>
          );

          if (href) {
            return (
              <Link key={step.key} to={href} className={rowClass}>
                {content}
              </Link>
            );
          }

          return (
            <div key={step.key} className={rowClass}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { getStepStatus };
