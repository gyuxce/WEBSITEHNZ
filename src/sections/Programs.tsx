import { SectionHeading } from "../components/SectionHeading";
import { Reveal } from "../components/Reveal";
import { TiltCard } from "../components/TiltCard";
import { programs } from "../data/content";
import bahasaImg from "../assets/images/program-bahasa.jpg";
import konstruksiImg from "../assets/images/program-konstruksi.jpg";
import kaigoImg from "../assets/images/program-kaigo.jpg";

const programImages: Record<number, { src: string; position: string }> = {
  0: { src: bahasaImg, position: "object-[center_22%]" },
  1: { src: konstruksiImg, position: "object-[center_20%]" },
  2: { src: kaigoImg, position: "object-[center_18%]" },
};

export function Programs() {
  return (
    <section id="program" className="py-16 md:py-20 bg-brand-bg">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <SectionHeading
          eyebrow="Program Kerja Jepang"
          title="Jalur belajar & peluang kerja yang jelas arahnya"
          description="Program disusun berbasis kebutuhan riil mitra kerja di Jepang, dengan pendidikan yang mengutamakan kesiapan, bukan sekadar sertifikat."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {programs.map((program, i) => {
            const image = programImages[i];
            return (
              <Reveal key={program.title} delay={(i % 3) * 0.08}>
                <TiltCard className="h-full flex flex-col rounded-2xl bg-white border border-brand-navy/8 overflow-hidden transition-shadow duration-300 hover:shadow-xl hover:shadow-brand-navy/8 hover:border-brand-red/20">
                  {image ? (
                    <div className="relative h-36 overflow-hidden shrink-0">
                      <img
                        src={image.src}
                        alt={program.title}
                        loading="lazy"
                        decoding="async"
                        className={`h-full w-full object-cover ${image.position}`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-brand-navy-deep/35 to-transparent" />
                      <div className="absolute top-2.5 left-2.5 h-9 w-9 rounded-lg bg-white/95 backdrop-blur-sm flex items-center justify-center text-brand-red font-display font-bold text-sm shadow-sm">
                        {program.icon}
                      </div>
                    </div>
                  ) : (
                    <div className="pt-5 px-5">
                      <div className="h-11 w-11 rounded-xl bg-brand-red-soft flex items-center justify-center text-brand-red font-display font-bold text-base">
                        {program.icon}
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col gap-2 p-5 flex-1">
                    <h3 className="font-display font-bold text-base text-brand-navy leading-snug">{program.title}</h3>
                    <p className="text-[13px] text-brand-navy/55 leading-relaxed flex-1">{program.description}</p>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-brand-red pt-1">{program.meta}</div>
                  </div>
                </TiltCard>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
