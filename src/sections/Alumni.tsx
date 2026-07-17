import { Quote } from "lucide-react";
import { SectionHeading } from "../components/SectionHeading";
import { Reveal } from "../components/Reveal";
import { alumniStories } from "../data/content";
import alumni1 from "../assets/images/alumni-1.jpg";
import alumni2 from "../assets/images/alumni-2.jpg";
import alumni3 from "../assets/images/alumni-3.jpg";

const photos: Record<string, string> = {
  "alumni-1": alumni1,
  "alumni-2": alumni2,
  "alumni-3": alumni3,
};

export function Alumni() {
  return (
    <section id="alumni" className="py-20 md:py-28 bg-gradient-to-b from-brand-navy to-brand-navy-deep text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-10 relative z-10">
        <SectionHeading
          eyebrow="Alumni & Aktivitas"
          title="Cerita dari mereka yang sudah melewati jalur ini"
          description="Sebagian kecil dari dokumentasi kegiatan, kelas, dan pengalaman alumni program Harunokaze."
          light
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {alumniStories.map((story, i) => (
            <Reveal key={story.who} delay={i * 0.1}>
              <div className="h-full flex flex-col gap-5 rounded-2xl bg-white/[0.04] border border-white/10 p-7 backdrop-blur-sm transition-colors hover:bg-white/[0.07]">
                <Quote size={22} className="text-brand-red" />
                <p className="text-lg font-medium leading-relaxed flex-1">"{story.quote}"</p>
                <div className="flex items-center gap-3 text-sm text-white/50">
                  <img
                    src={photos[story.photo]}
                    alt={story.who}
                    className="h-10 w-10 rounded-full object-cover shrink-0 ring-2 ring-white/10"
                  />
                  {story.who}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
