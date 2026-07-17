import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { heroStats, heroSteps } from "../data/content";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-36 md:pt-44 pb-20 md:pb-28">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 85% 0%, rgba(230,25,53,0.08) 0%, transparent 60%), radial-gradient(50% 40% at 5% 15%, rgba(15,34,64,0.06) 0%, transparent 60%)",
        }}
      />

      <div className="max-w-7xl mx-auto px-6 md:px-10 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-14 lg:gap-16 items-center">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full bg-brand-red-soft px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-brand-red mb-6"
          >
            <Sparkles size={14} />
            Ekosistem Karier Jepang · Harunokaze
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="font-display font-extrabold text-[2.5rem] sm:text-5xl lg:text-[3.4rem] leading-[1.08] tracking-tight text-brand-navy text-balance"
          >
            Menyiapkan langkahmu ke Jepang,{" "}
            <span className="text-brand-red">dari niat sampai pulang.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12 }}
            className="mt-6 text-lg text-brand-navy/60 max-w-xl leading-relaxed"
          >
            Harunokaze mendampingi perjalanan kariermu sejak persiapan, pendidikan &amp; pelatihan, job
            matching, keberangkatan, selama bekerja di Jepang, hingga kembali ke Indonesia — satu ekosistem,
            bukan sekadar pendaftaran LPK.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.18 }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <a
              href="#pemetaan"
              className="group inline-flex items-center gap-2 rounded-full bg-brand-red px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-red/25 transition-all hover:bg-brand-red-hover hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand-red/30"
            >
              Mulai Pemetaan Potensi
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="#kontak"
              className="inline-flex items-center gap-2 rounded-full border border-brand-navy/15 px-7 py-3.5 text-sm font-bold text-brand-navy transition-all hover:border-brand-navy hover:bg-brand-navy hover:text-white"
            >
              Konsultasi Gratis
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-14 grid grid-cols-3 gap-6 max-w-lg"
          >
            {heroStats.map((stat) => (
              <div key={stat.label}>
                <div className="font-display font-extrabold text-2xl md:text-3xl text-brand-navy">{stat.value}</div>
                <div className="text-xs text-brand-navy/50 mt-1 leading-snug">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="relative"
        >
          <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-brand-red/10 to-brand-navy/10 blur-2xl -z-10" />
          <div className="relative rounded-3xl bg-gradient-to-b from-brand-navy to-brand-navy-deep p-8 md:p-9 text-white overflow-hidden min-h-[420px] flex flex-col justify-between shadow-2xl shadow-brand-navy/20">
            <svg viewBox="0 0 400 420" className="absolute inset-0 w-full h-full opacity-40" preserveAspectRatio="none">
              <path d="M -20 60 C 100 20, 180 100, 420 50" stroke="#E61935" strokeWidth="1.5" fill="none" opacity="0.5" />
              <path d="M -20 160 C 120 220, 220 120, 420 190" stroke="#FFB3C6" strokeWidth="1.5" fill="none" opacity="0.4" />
              <path d="M -20 320 C 140 280, 240 380, 420 330" stroke="#E61935" strokeWidth="1.5" fill="none" opacity="0.3" />
            </svg>

            <div className="relative z-10">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-sakura">Alur singkat peserta</span>
              <h3 className="font-display text-xl font-bold mt-3">Satu jalur, banyak titik dukungan</h3>
            </div>

            <div className="relative z-10 flex flex-col gap-4 mt-8">
              {heroSteps.map((step) => (
                <div
                  key={step.label}
                  className={`flex items-center gap-3 text-sm transition-colors ${
                    step.active ? "text-white font-semibold" : "text-white/55"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      step.active ? "bg-brand-red shadow-[0_0_0_4px_rgba(230,25,53,0.25)]" : "bg-white/30"
                    }`}
                  />
                  {step.label}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
