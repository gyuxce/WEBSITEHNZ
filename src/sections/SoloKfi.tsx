import { useEffect, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Reveal } from "../components/Reveal";
import { instagramUrl, soloKfiProgram } from "../data/content";
import logoHarunokaze from "../assets/images/solo-kfi/logo-harunokaze.png";
import logoKasuga from "../assets/images/solo-kfi/logo-kasuga-farm.png";
import workerImg from "../assets/images/solo-kfi/solo-warehouse-worker.jpg";
import trucksImg from "../assets/images/solo-kfi/solo-logistics-trucks.jpg";
import walkingImg from "../assets/images/solo-kfi/solo-drivers-walking.jpg";
import driverCabImg from "../assets/images/solo-kfi/solo-driver-cab.jpg";

const galleryImages = {
  worker: workerImg,
  trucks: trucksImg,
  walking: walkingImg,
  cab: driverCabImg,
} as const;

const galleryPositions = {
  worker: "50% 48%",
  trucks: "50% 50%",
  walking: "50% 52%",
  cab: "50% 50%",
} as const;

export function SoloKfi() {
  const galleryItems = soloKfiProgram.gallery.map((item) => ({
    ...item,
    src: galleryImages[item.key],
  }));
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveGalleryIndex((current) => (current + 1) % galleryItems.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [galleryItems.length]);

  function moveGallery(step: number) {
    setActiveGalleryIndex(
      (current) => (current + step + galleryItems.length) % galleryItems.length,
    );
  }

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

              <div className="bg-white p-1.5">
                <div className="hidden grid-cols-2 gap-1.5 sm:grid">
                  {galleryItems.map((item, index) => (
                    <div key={item.key} className="relative aspect-[4/3] overflow-hidden rounded-xl">
                      <img
                        src={item.src}
                        alt={item.alt}
                        className="h-full w-full object-cover"
                        style={{ objectPosition: galleryPositions[item.key] }}
                        loading={index === 0 ? "eager" : "lazy"}
                        decoding="async"
                      />
                      {index === 0 ? (
                        <div className="absolute inset-0 bg-gradient-to-t from-brand-navy-deep/55 via-transparent to-transparent" />
                      ) : null}
                    </div>
                  ))}
                </div>

                <div className="relative aspect-[4/3] overflow-hidden rounded-xl sm:hidden">
                  <div
                    className="flex h-full transition-transform duration-700 ease-out"
                    style={{ transform: `translateX(-${activeGalleryIndex * 100}%)` }}
                  >
                    {galleryItems.map((item, index) => (
                      <div key={item.key} className="relative h-full w-full shrink-0">
                        <img
                          src={item.src}
                          alt={item.alt}
                          className="h-full w-full object-cover"
                          style={{ objectPosition: galleryPositions[item.key] }}
                          loading={index === 0 ? "eager" : "lazy"}
                          decoding="async"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-brand-navy-deep/65 via-transparent to-transparent" />
                        <p className="absolute bottom-4 left-4 right-4 text-sm font-semibold leading-snug text-white drop-shadow-sm">
                          {item.alt}
                        </p>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => moveGallery(-1)}
                    aria-label="Foto sebelumnya"
                    className="absolute left-3 top-1/2 inline-flex -translate-y-1/2 rounded-full bg-white/90 p-2 text-brand-navy shadow-sm transition hover:bg-white"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveGallery(1)}
                    aria-label="Foto berikutnya"
                    className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 rounded-full bg-white/90 p-2 text-brand-navy shadow-sm transition hover:bg-white"
                  >
                    <ChevronRight size={18} />
                  </button>
                  <div className="absolute bottom-3 right-4 flex gap-1.5" aria-label="Pilih foto">
                    {galleryItems.map((item, index) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setActiveGalleryIndex(index)}
                        aria-label={`Tampilkan foto ${index + 1}`}
                        aria-current={activeGalleryIndex === index ? "true" : undefined}
                        className={`h-1.5 rounded-full transition-all ${
                          activeGalleryIndex === index ? "w-5 bg-white" : "w-1.5 bg-white/60"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </figure>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
