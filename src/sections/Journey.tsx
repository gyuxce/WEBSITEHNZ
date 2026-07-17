import { SectionHeading } from "../components/SectionHeading";
import { Reveal } from "../components/Reveal";
import { journeyStages } from "../data/content";

export function Journey() {
  return (
    <section id="tahapan" className="py-20 md:py-28 bg-gradient-to-b from-brand-navy to-brand-navy-deep text-white relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: "radial-gradient(40% 60% at 100% 0%, rgba(230,25,53,0.25) 0%, transparent 60%)",
        }}
      />
      <div className="max-w-7xl mx-auto px-6 md:px-10 relative z-10">
        <SectionHeading
          eyebrow="Tahapan Peserta"
          title="Enam tahap, satu pendampingan yang tidak putus"
          description="Dari pertama kali mencari tahu, sampai kembali ke Indonesia dengan pengalaman kerja — setiap tahap punya bentuk dukungan yang jelas."
          light
        />

        <div className="relative">
          <div className="hidden lg:block absolute top-6 left-0 w-full h-px bg-white/10" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-12">
            {journeyStages.map((stage, i) => (
              <Reveal key={stage.num} delay={i * 0.06}>
                <div className="flex flex-col items-start gap-4">
                  <div
                    className={`relative z-10 h-12 w-12 rounded-full flex items-center justify-center font-mono text-sm font-bold border transition-colors ${
                      i === 0
                        ? "bg-brand-red text-white border-brand-red"
                        : "bg-brand-navy-light text-brand-sakura border-white/15"
                    }`}
                  >
                    {stage.num}
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-base mb-1.5">{stage.title}</h4>
                    <p className="text-sm text-white/50 leading-relaxed">{stage.description}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
