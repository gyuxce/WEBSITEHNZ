import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { heroStats, heroSteps, portalUrl } from "../data/content";
import heroImage from "../assets/images/hero-japan-journey.jpg";
import { CountUpStat } from "../components/CountUpStat";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-24 md:pt-28 pb-10 md:pb-14">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 85% 0%, rgba(230,25,53,0.08) 0%, transparent 60%), radial-gradient(50% 40% at 5% 15%, rgba(15,34,64,0.06) 0%, transparent 60%)",
        }}
      />

      <div className="max-w-7xl mx-auto px-6 md:px-10 grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-12 items-center">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full bg-brand-red-soft px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-brand-red mb-4"
          >
            <Sparkles size={12} />
            Ekosistem Karier Jepang · Harunokaze
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="font-display font-extrabold text-[2.1rem] sm:text-4xl lg:text-[2.75rem] leading-[1.1] tracking-tight text-brand-navy text-balance"
          >
            Menyiapkan langkahmu ke Jepang,{" "}
            <span className="text-brand-red">dari niat sampai pulang.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12 }}
            className="mt-4 text-[0.95rem] md:text-base text-brand-navy/60 max-w-xl leading-relaxed"
          >
            Harunokaze mendampingi perjalanan kariermu sejak persiapan, pendidikan &amp; pelatihan, job
            matching, keberangkatan, selama bekerja di Jepang, hingga kembali ke Indonesia — satu ekosistem,
            bukan sekadar pendaftaran LPK.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.18 }}
            className="mt-6 flex flex-wrap items-center gap-3"
          >
            <a
              href={`${portalUrl}/register`}
              className="group inline-flex items-center gap-2 rounded-full bg-brand-red px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-red/25 transition-all hover:bg-brand-red-hover hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand-red/30"
            >
              Mulai Pemetaan Potensi
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="#kontak"
              className="inline-flex items-center gap-2 rounded-full border border-brand-navy/15 px-6 py-3 text-sm font-bold text-brand-navy transition-all hover:border-brand-navy hover:bg-brand-navy hover:text-white"
            >
              Konsultasi Gratis
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-8 grid grid-cols-3 gap-5 max-w-lg"
          >
            {heroStats.map((stat) => (
              <div key={stat.label}>
                <CountUpStat value={stat.value} className="font-display font-extrabold text-xl md:text-2xl text-brand-navy" />
                <div className="text-[11px] text-brand-navy/50 mt-0.5 leading-snug">{stat.label}</div>
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
          <div className="absolute -inset-3 rounded-[1.75rem] bg-gradient-to-br from-brand-red/10 to-brand-navy/10 blur-2xl -z-10" />
          <div className="relative rounded-2xl overflow-hidden aspect-[4/5] max-h-[min(520px,62vh)] shadow-2xl shadow-brand-navy/20">
            <img
              src={heroImage}
              alt="Calon peserta Harunokaze bersiap menuju Jepang"
              className="absolute inset-0 h-full w-full object-cover object-[center_28%]"
            />
            {/* Soft gradient only at bottom — keeps Fuji & sakura visible */}
            <div className="absolute inset-0 bg-gradient-to-t from-brand-navy-deep/85 via-brand-navy-deep/15 to-transparent" />

            <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
              <Sparkles size={11} className="text-brand-sakura" />
              Perjalananmu dimulai di sini
            </div>

            {/* Compact glass strip — doesn't cover most of the photo */}
            <div className="absolute bottom-0 inset-x-0 p-3.5 md:p-4">
              <div className="rounded-xl bg-brand-navy-deep/55 backdrop-blur-md border border-white/15 px-4 py-3.5">
                <div className="flex items-baseline justify-between gap-3 mb-2.5">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-sakura">Alur singkat peserta</span>
                    <h3 className="font-display text-sm font-bold text-white mt-0.5">Satu jalur, banyak titik dukungan</h3>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                  {heroSteps.map((step) => (
                    <div
                      key={step.label}
                      className={`flex items-center gap-2 text-[11px] leading-tight ${
                        step.active ? "text-white font-semibold" : "text-white/55"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                          step.active ? "bg-brand-red shadow-[0_0_0_3px_rgba(230,25,53,0.25)]" : "bg-white/30"
                        }`}
                      />
                      <span className="line-clamp-1">{step.label}</span>
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
