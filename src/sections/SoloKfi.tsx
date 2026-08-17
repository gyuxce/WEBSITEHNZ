import { ArrowUpRight } from "lucide-react";
import { Reveal } from "../components/Reveal";
import { instagramUrl, soloKfiProgram } from "../data/content";
import logoHarunokaze from "../assets/images/logo-hnz-transparent.png";
import logoKasuga from "../assets/images/solo-kfi/logo-kasuga-farm.png";
import logisticsImg from "../assets/images/solo-kfi/solo-logistics-trucks.jpg";

export function SoloKfi() {
  return (
    <section id="solo" className="py-20 md:py-28 bg-white relative overflow-hidden">
      <div
        className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full opacity-40"
        style={{
          background: "radial-gradient(circle, rgba(230,25,53,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-7xl mx-auto px-6 md:px-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center relative z-10">
        <Reveal direction="left">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-brand-red mb-3">
            {soloKfiProgram.eyebrow}
          </span>
          <h2 className="font-display font-extrabold text-3xl md:text-4xl text-brand-navy leading-tight text-balance">
            {soloKfiProgram.title}
          </h2>
          <p className="mt-3 text-base md:text-lg font-semibold text-brand-navy/70">
            {soloKfiProgram.subtitle}
          </p>
          <p className="mt-4 text-base text-brand-navy/55 leading-relaxed max-w-xl">
            {soloKfiProgram.description}
          </p>

          <a
            href={instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand-red px-7 py-3.5 text-sm font-bold text-white transition-all hover:bg-brand-red-hover hover:-translate-y-0.5"
          >
            {soloKfiProgram.ctaLabel}
            <ArrowUpRight size={16} strokeWidth={2.5} />
          </a>
        </Reveal>

        <Reveal direction="right" delay={0.08}>
          <div className="relative">
            <div className="absolute -inset-3 rounded-[1.75rem] bg-gradient-to-br from-brand-red/10 via-transparent to-brand-navy/10" />
            <figure className="relative overflow-hidden rounded-2xl border border-brand-navy/8 bg-brand-bg shadow-xl shadow-brand-navy/8">
              <div className="flex items-center justify-between gap-4 border-b border-brand-navy/8 bg-white px-5 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={logoHarunokaze}
                    alt="Harunokaze"
                    className="h-11 w-auto object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="text-brand-navy/25 font-display font-bold text-lg leading-none">×</span>
                  <img
                    src={logoKasuga}
                    alt="LPK Kasuga Farm Indonesia"
                    className="h-12 w-auto object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <span className="hidden sm:inline-flex shrink-0 rounded-full bg-brand-navy px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  {soloKfiProgram.badge}
                </span>
              </div>

              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={logisticsImg}
                  alt={soloKfiProgram.imageAlt}
                  className="h-full w-full object-cover object-center"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-navy-deep/45 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-end justify-between gap-3">
                  <p className="text-sm font-semibold text-white drop-shadow-sm max-w-[16rem] leading-snug">
                    Jalur persiapan karier Driver di Jepang
                  </p>
                  <span className="sm:hidden inline-flex rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-navy">
                    {soloKfiProgram.badge}
                  </span>
                </div>
              </div>
            </figure>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
