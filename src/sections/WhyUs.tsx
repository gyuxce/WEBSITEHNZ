import { SectionHeading } from "../components/SectionHeading";
import { Reveal } from "../components/Reveal";
import { whyUsPillars } from "../data/content";

export function WhyUs() {
  return (
    <section className="py-20 md:py-28 bg-brand-bg">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <SectionHeading
          eyebrow="Kenapa Harunokaze"
          title="Dibangun di atas disiplin, bukan janji"
          description="Empat prinsip yang jadi pegangan tim dalam menjalankan program — hasil dari proses evaluasi dan perbaikan berkelanjutan."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {whyUsPillars.map((pillar, i) => (
            <Reveal key={pillar.num} delay={i * 0.08}>
              <div className="group">
                <div className="font-display font-extrabold text-3xl text-brand-red/25 transition-colors group-hover:text-brand-red/60 mb-4">
                  {pillar.num}
                </div>
                <h4 className="font-display font-bold text-lg text-brand-navy mb-2.5">{pillar.title}</h4>
                <p className="text-sm text-brand-navy/55 leading-relaxed">{pillar.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
