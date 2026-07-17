import { Clock, MapPin, MessageCircle } from "lucide-react";
import { Reveal } from "../components/Reveal";
import { officeInfo, whatsappUrl } from "../data/content";

export function Location() {
  return (
    <section id="lokasi" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-6 md:px-10 grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-12 items-center">
        <Reveal direction="left">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-brand-red mb-3">
            Lokasi & Kontak
          </span>
          <h2 className="font-display font-extrabold text-3xl md:text-4xl text-brand-navy leading-tight text-balance">
            Bisa datang langsung, bisa juga konsultasi online
          </h2>
          <p className="mt-4 text-base text-brand-navy/55 leading-relaxed max-w-md">
            Tim Harunokaze & LPK Wiwitan Baru berbasis di Sukabumi, Jawa Barat. Hubungi kami untuk agenda kunjungan
            atau konsultasi jarak jauh.
          </p>

          <div className="mt-7 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-brand-red shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-brand-navy">{officeInfo.city}</div>
                <div className="text-sm text-brand-navy/50">{officeInfo.addressNote}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock size={18} className="text-brand-red shrink-0 mt-0.5" />
              <div className="text-sm text-brand-navy/60">{officeInfo.hours}</div>
            </div>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand-navy px-7 py-3.5 text-sm font-bold text-white transition-all hover:bg-brand-navy-light hover:-translate-y-0.5"
          >
            <MessageCircle size={16} />
            Chat via WhatsApp
          </a>
        </Reveal>

        <Reveal direction="right" delay={0.1}>
          <div className="relative rounded-2xl bg-gradient-to-br from-brand-navy to-brand-navy-deep overflow-hidden min-h-[320px] flex items-center justify-center">
            <div
              className="absolute inset-0 opacity-25"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
                backgroundSize: "36px 36px",
              }}
            />
            <svg viewBox="0 0 400 300" className="absolute inset-0 w-full h-full opacity-40" preserveAspectRatio="none">
              <path d="M -20 220 C 100 180, 220 260, 420 190" stroke="#E61935" strokeWidth="1.5" fill="none" strokeDasharray="2 6" />
              <path d="M -20 80 C 140 140, 240 40, 420 100" stroke="#FFB3C6" strokeWidth="1.5" fill="none" strokeDasharray="2 6" />
            </svg>

            <div className="relative z-10 flex flex-col items-center gap-3">
              <span className="relative flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-red opacity-60" />
                <span className="relative inline-flex rounded-full h-5 w-5 bg-brand-red" />
              </span>
              <div className="rounded-xl bg-white/10 backdrop-blur-md border border-white/15 px-5 py-3 text-center">
                <div className="text-white font-display font-bold">{officeInfo.city}</div>
                <div className="text-white/50 text-xs mt-0.5">Kantor & Kampus Harunokaze</div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
