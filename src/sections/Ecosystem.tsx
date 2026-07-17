import { SectionHeading } from "../components/SectionHeading";
import { Reveal } from "../components/Reveal";
import { ecosystemRoles } from "../data/content";

export function Ecosystem() {
  return (
    <section id="ekosistem" className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <SectionHeading
          eyebrow="Apa itu Harunokaze"
          title="Satu ekosistem, tiga peran yang saling melengkapi"
          description="Harunokaze bukan nama lain dari LPK. Harunokaze adalah ekosistem yang menaungi perjalanan karier Jepang secara menyeluruh, dengan LPK & SO Wiwitan Baru sebagai motor pendidikan dan pelatihannya."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {ecosystemRoles.map((role, i) => (
            <Reveal key={role.tag} delay={i * 0.08}>
              <div className="h-full rounded-2xl border border-brand-navy/8 bg-white p-8 transition-all duration-300 hover:border-brand-red/20 hover:shadow-xl hover:shadow-brand-navy/5 hover:-translate-y-1">
                <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-brand-red bg-brand-red-soft rounded-full px-3 py-1 mb-5">
                  {role.tag}
                </span>
                <h3 className="font-display font-bold text-xl text-brand-navy mb-3">{role.title}</h3>
                <p className="text-sm text-brand-navy/55 leading-relaxed">{role.description}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2} className="mt-8">
          <div className="rounded-xl border-l-4 border-brand-red bg-brand-red-soft px-6 py-4 text-sm text-brand-navy/70">
            Catatan: struktur biaya, skema pembiayaan, dan detail legal-partner ditampilkan lengkap pada halaman{" "}
            <em>Tahapan &amp; Biaya</em> dan <em>Partner &amp; Legalitas</em> setelah dokumen resmi difinalisasi.
          </div>
        </Reveal>
      </div>
    </section>
  );
}
