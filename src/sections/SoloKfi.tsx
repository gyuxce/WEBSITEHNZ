import { ArrowUpRight } from "lucide-react";
import { Reveal } from "../components/Reveal";
import { instagramUrl, soloKfiProgram } from "../data/content";
import logoHarunokaze from "../assets/images/solo-kfi/logo-harunokaze.png";
import logoKasuga from "../assets/images/solo-kfi/logo-kasuga-farm.png";
import workerImg from "../assets/images/solo-kfi/solo-warehouse-worker.jpg";
import trucksImg from "../assets/images/solo-kfi/solo-logistics-trucks.jpg";
import walkingImg from "../assets/images/solo-kfi/solo-drivers-walking.jpg";

const galleryImages = {
  worker: workerImg,
  trucks: trucksImg,
  walking: walkingImg,
} as const;

export function SoloKfi() {
  const [worker, trucks, walking] = soloKfiProgram.gallery;

  return (
    <section id="hnz-solo" className="py-20 md:py-28 bg-white relative overflow-hidden">
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

          <ul className="mt-6 flex flex-col gap-3 max-w-xl">
            {soloKfiProgram.highlights.map((item) => (
              <li key={item} className="flex gap-3 text-sm text-brand-navy/65 leading-relaxed">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand-red shrink-0" />
                {item}
              </li>
            ))}
          </ul>

          <p className="mt-6 text-sm text-brand-navy/45 leading-relaxed max-w-xl">
            {soloKfiProgram.ctaNote}
          </p>

          <a
            href={instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-red px-7 py-3.5 text-sm font-bold text-white transition-all hover:bg-brand-red-hover hover:-translate-y-0.5"
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
                  <div className="flex h-12 w-[6.75rem] items-center justify-center sm:h-14 sm:w-32">
                    <img
                      src={logoHarunokaze}
                      alt="Harunokaze"
                      className="max-h-full max-w-full object-contain"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <span className="text-brand-navy/25 font-display font-bold text-lg leading-none shrink-0">
                    ×
                  </span>
                  <div className="flex h-12 w-[6.75rem] items-center justify-center sm:h-14 sm:w-32">
                    <img
                      src={logoKasuga}
                      alt="LPK Kasuga Farm Indonesia"
                      className="max-h-full max-w-full object-contain"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </div>
                <span className="hidden sm:inline-flex shrink-0 rounded-full bg-brand-navy px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  {soloKfiProgram.badge}
                </span>
              </div>

              <div className="relative grid grid-cols-5 grid-rows-2 gap-1.5 p-1.5 bg-white min-h-[280px] sm:min-h-[320px]">
                <div className="relative col-span-3 row-span-2 overflow-hidden rounded-xl">
                  <img
                    src={galleryImages[worker.key]}
                    alt={worker.alt}
                    className="h-full w-full object-cover object-[center_20%]"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-navy-deep/50 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-end justify-between gap-2">
                    <p className="text-sm font-semibold text-white drop-shadow-sm max-w-[14rem] leading-snug">
                      Jalur persiapan karier Driver di Jepang
                    </p>
                    <span className="sm:hidden inline-flex rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-navy">
                      {soloKfiProgram.badge}
                    </span>
                  </div>
                </div>

                <div className="relative col-span-2 overflow-hidden rounded-xl">
                  <img
                    src={galleryImages[trucks.key]}
                    alt={trucks.alt}
                    className="h-full w-full object-cover object-center"
                    loading="lazy"
                    decoding="async"
                  />
                </div>

                <div className="relative col-span-2 overflow-hidden rounded-xl">
                  <img
                    src={galleryImages[walking.key]}
                    alt={walking.alt}
                    className="h-full w-full object-cover object-[center_30%]"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            </figure>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
