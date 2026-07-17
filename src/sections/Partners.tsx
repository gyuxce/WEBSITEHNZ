import { ShieldCheck } from "lucide-react";
import { SectionHeading } from "../components/SectionHeading";
import { Reveal } from "../components/Reveal";
import { partners } from "../data/content";
import trustImg from "../assets/images/partners-trust.jpg";

export function Partners() {
  return (
    <section id="partner" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <SectionHeading
          eyebrow="Partner & Legalitas"
          title="Berjalan bersama mitra resmi"
          description="Logo dan detail mitra ditampilkan setelah proses verifikasi kerja sama selesai difinalisasi oleh tim legal."
        />

        <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-8 items-stretch">
          <Reveal direction="left" className="rounded-2xl overflow-hidden min-h-[280px] relative">
            <img src={trustImg} alt="Kemitraan resmi Harunokaze" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-navy-deep/70 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 text-white text-sm font-semibold">
              Kemitraan resmi lintas lembaga Indonesia–Jepang
            </div>
          </Reveal>

          <div className="flex flex-col gap-6">
            <Reveal delay={0.05}>
              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-brand-navy/8 bg-brand-bg px-7 py-6">
                {partners.map((partner) => (
                  <span
                    key={partner}
                    className="text-xs font-semibold text-brand-navy/55 border border-dashed border-brand-navy/20 rounded-full px-4 py-2"
                  >
                    {partner}
                  </span>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.1} className="flex items-start gap-3 rounded-xl bg-brand-navy/[0.03] px-6 py-4">
              <ShieldCheck size={18} className="text-brand-red shrink-0 mt-0.5" />
              <p className="text-sm text-brand-navy/60 leading-relaxed">
                Harunokaze beroperasi bersama LPK &amp; SO Wiwitan Baru yang terdaftar dan menjalankan proses
                penempatan kerja sesuai jalur resmi ketenagakerjaan Indonesia–Jepang.
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
