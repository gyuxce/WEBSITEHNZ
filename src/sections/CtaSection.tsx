import { useState } from "react";
import { Send } from "lucide-react";
import { Reveal } from "../components/Reveal";

export function CtaSection() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section id="kontak" className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-navy to-brand-navy-deep px-8 py-12 md:px-14 md:py-16 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
            <div
              className="absolute inset-0 opacity-40 -z-0"
              style={{ background: "radial-gradient(45% 65% at 90% 10%, rgba(230,25,53,0.3) 0%, transparent 60%)" }}
            />
            <div className="relative z-10">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-sakura">Mulai dari sini</span>
              <h2 className="font-display font-extrabold text-3xl md:text-4xl text-white mt-3 leading-tight text-balance">
                Konsultasikan langkah pertamamu ke Jepang
              </h2>
              <p className="mt-4 text-white/60 max-w-md leading-relaxed">
                Tim Harunokaze akan membantu memetakan program yang paling sesuai dengan kondisi dan tujuanmu.
              </p>
            </div>

            <div className="relative z-10 rounded-2xl bg-white/[0.06] border border-white/15 p-7">
              {submitted ? (
                <div className="flex flex-col items-center text-center gap-3 py-8">
                  <div className="h-12 w-12 rounded-full bg-brand-red/20 flex items-center justify-center">
                    <Send size={20} className="text-brand-red" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-white">Terkirim!</h3>
                  <p className="text-sm text-white/60">Tim kami akan segera menghubungimu untuk menjadwalkan konsultasi.</p>
                </div>
              ) : (
                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-white/50 mb-1.5">
                      Nama Lengkap
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Nama kamu"
                      className="w-full rounded-lg bg-white/[0.08] border border-white/15 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-brand-red"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-white/50 mb-1.5">
                      Nomor WhatsApp
                    </label>
                    <input
                      required
                      type="tel"
                      placeholder="08xx-xxxx-xxxx"
                      className="w-full rounded-lg bg-white/[0.08] border border-white/15 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-brand-red"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-white/50 mb-1.5">
                      Minat Program
                    </label>
                    <select className="w-full rounded-lg bg-white/[0.08] border border-white/15 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-brand-red [&>option]:text-brand-navy">
                      <option>Program Konstruksi</option>
                      <option>Program Kaigo / Perawatan</option>
                      <option>Pemetaan Potensi</option>
                      <option>Belum yakin, ingin konsultasi</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-brand-red px-6 py-3.5 text-sm font-bold text-white transition-all hover:bg-brand-red-hover"
                  >
                    Kirim & Jadwalkan Konsultasi
                  </button>
                </form>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
