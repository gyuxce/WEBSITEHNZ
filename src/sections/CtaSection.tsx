import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Reveal } from "../components/Reveal";
import { buildConsultWhatsAppUrl } from "../data/content";

const INTEREST_OPTIONS = [
  "Program Konstruksi",
  "Program Kaigo / Perawatan",
  "Pemetaan Potensi",
  "Belum yakin, ingin konsultasi",
];

export function CtaSection() {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [interest, setInterest] = useState(INTEREST_OPTIONS[3]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = buildConsultWhatsAppUrl({ name, whatsapp, interest });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <section id="kontak" className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-navy to-brand-navy-deep px-8 py-12 md:px-14 md:py-16 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
            <div
              className="absolute inset-0 opacity-40 -z-0"
              style={{
                background:
                  "radial-gradient(45% 65% at 90% 10%, rgba(230,25,53,0.3) 0%, transparent 60%)",
              }}
            />
            <div className="relative z-10">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-sakura">
                Mulai dari sini
              </span>
              <h2 className="font-display font-extrabold text-3xl md:text-4xl text-white mt-3 leading-tight text-balance">
                Konsultasikan langkah pertamamu ke Jepang
              </h2>
              <p className="mt-4 text-white/60 max-w-md leading-relaxed">
                Isi singkat di samping, lalu lanjut chat WhatsApp — pesanmu sudah terisi otomatis
                agar tim Harunokaze lebih cepat membantu.
              </p>
            </div>

            <div className="relative z-10 rounded-2xl bg-white/[0.06] border border-white/15 p-7">
              <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-white/50 mb-1.5">
                    Nama Lengkap
                  </label>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
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
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="08xx-xxxx-xxxx"
                    className="w-full rounded-lg bg-white/[0.08] border border-white/15 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-brand-red"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-white/50 mb-1.5">
                    Minat Program
                  </label>
                  <select
                    value={interest}
                    onChange={(e) => setInterest(e.target.value)}
                    className="w-full rounded-lg bg-white/[0.08] border border-white/15 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-brand-red [&>option]:text-brand-navy"
                  >
                    {INTEREST_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-brand-red px-6 py-3.5 text-sm font-bold text-white transition-all hover:bg-brand-red-hover"
                >
                  <MessageCircle size={18} />
                  Lanjut ke WhatsApp
                </button>
              </form>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
