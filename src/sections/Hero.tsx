import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { heroStats, heroSteps } from "../data/content";
import heroImage from "../assets/images/hero-japan-journey.jpg";

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
          <div className="relative rounded-3xl overflow-hidden min-h-[460px] shadow-2xl shadow-brand-navy/20">
            <img
              src={heroImage}
              alt="Calon peserta Harunokaze bersiap menuju Jepang"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-navy-deep via-brand-navy-deep/40 to-transparent" />

            <div className="absolute top-6 left-6 inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white">
              <Sparkles size={14} className="text-brand-sakura" />
              Perjalananmu dimulai di sini
            </div>

            <div className="absolute bottom-0 inset-x-0 p-6 md:p-7">
              <div className="rounded-2xl bg-brand-navy-deep/70 backdrop-blur-md border border-white/10 p-6">
                <span className="text-xs font-bold uppercase tracking-widest text-brand-sakura">Alur singkat peserta</span>
                <h3 className="font-display text-lg font-bold text-white mt-2">Satu jalur, banyak titik dukungan</h3>
                <div className="flex flex-col gap-3 mt-5">
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
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
