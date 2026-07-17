import { SectionHeading } from "../components/SectionHeading";
import { Reveal } from "../components/Reveal";
import { programs } from "../data/content";

export function Programs() {
  return (
    <section id="program" className="py-20 md:py-28 bg-brand-bg">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <SectionHeading
          eyebrow="Program Kerja Jepang"
          title="Jalur belajar & peluang kerja yang jelas arahnya"
          description="Program disusun berbasis kebutuhan riil mitra kerja di Jepang, dengan pendidikan yang mengutamakan kesiapan, bukan sekadar sertifikat."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {programs.map((program, i) => (
            <Reveal key={program.title} delay={(i % 3) * 0.08}>
              <div className="h-full flex flex-col gap-4 rounded-2xl bg-white border border-brand-navy/8 p-7 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-brand-navy/8 hover:border-brand-red/20">
                <div className="h-12 w-12 rounded-xl bg-brand-red-soft flex items-center justify-center text-brand-red font-display font-bold text-lg">
                  {program.icon}
                </div>
                <h3 className="font-display font-bold text-lg text-brand-navy">{program.title}</h3>
                <p className="text-sm text-brand-navy/55 leading-relaxed flex-1">{program.description}</p>
                <div className="text-[11px] font-bold uppercase tracking-wider text-brand-red">{program.meta}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
