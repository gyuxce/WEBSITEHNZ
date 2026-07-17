import type { ReactNode } from "react";
import { Check, Clock, Sparkle } from "lucide-react";
import { Reveal } from "../components/Reveal";
import { mappingPoints, mappingSteps } from "../data/content";

const statusStyles: Record<string, { label: string; className: string; icon: ReactNode }> = {
  done: { label: "Selesai", className: "bg-emerald-50 text-emerald-600", icon: <Check size={12} /> },
  active: { label: "Berlangsung", className: "bg-brand-red-soft text-brand-red", icon: <Sparkle size={12} /> },
  pending: { label: "Menunggu", className: "bg-brand-navy/5 text-brand-navy/45", icon: <Clock size={12} /> },
  optional: { label: "Opsional", className: "bg-brand-navy/5 text-brand-navy/45", icon: <Clock size={12} /> },
};

export function Mapping() {
  return (
    <section id="pemetaan" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-6 md:px-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <Reveal direction="left">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-brand-red mb-3">Pemetaan Potensi</span>
          <h2 className="font-display font-extrabold text-3xl md:text-4xl text-brand-navy leading-tight text-balance">
            Kenali kesiapanmu sebelum melangkah
          </h2>
          <p className="mt-4 text-base text-brand-navy/55 leading-relaxed">
            Sebelum masuk program, calon peserta melalui pemetaan potensi digital untuk mengetahui kesiapan bahasa,
            kemampuan, dan kepribadian — hasilnya jadi dasar rekomendasi jalur karier yang paling sesuai.
          </p>
          <ul className="mt-7 flex flex-col gap-3.5">
            {mappingPoints.map((point) => (
              <li key={point} className="flex gap-3 text-sm text-brand-navy/65">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand-red shrink-0" />
                {point}
              </li>
            ))}
          </ul>
          <a
            href="#kontak"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand-navy px-7 py-3.5 text-sm font-bold text-white transition-all hover:bg-brand-navy-light hover:-translate-y-0.5"
          >
            Coba Pemetaan Potensi
          </a>
        </Reveal>

        <Reveal direction="right" delay={0.1}>
          <div className="rounded-2xl border border-brand-navy/8 bg-brand-bg p-3 shadow-xl shadow-brand-navy/5">
            <div className="rounded-xl bg-white p-6 md:p-7">
              {mappingSteps.map((step, i) => {
                const style = statusStyles[step.status];
                return (
                  <div
                    key={step.label}
                    className={`flex items-center justify-between py-4 text-sm ${
                      i !== mappingSteps.length - 1 ? "border-b border-brand-navy/8" : ""
                    }`}
                  >
                    <span className="text-brand-navy/75 font-medium">{step.label}</span>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide rounded-full px-3 py-1 ${style.className}`}>
                      {style.icon}
                      {style.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
