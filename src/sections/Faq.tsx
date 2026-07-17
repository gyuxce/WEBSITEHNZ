import { useState } from "react";
import { Plus } from "lucide-react";
import { SectionHeading } from "../components/SectionHeading";
import { Reveal } from "../components/Reveal";
import { faqs } from "../data/content";

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 md:py-28 bg-brand-bg">
      <div className="max-w-3xl mx-auto px-6 md:px-10">
        <SectionHeading eyebrow="FAQ" title="Pertanyaan yang sering ditanyakan" center />

        <div className="border-t border-brand-navy/10">
          {faqs.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <Reveal key={item.q} delay={i * 0.05}>
                <div className="border-b border-brand-navy/10">
                  <button
                    className="w-full flex items-center justify-between gap-6 py-6 text-left"
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                  >
                    <span className="font-display font-semibold text-base md:text-lg text-brand-navy">{item.q}</span>
                    <Plus
                      size={20}
                      className={`shrink-0 text-brand-red transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`}
                    />
                  </button>
                  <div
                    className="overflow-hidden transition-all duration-300 ease-in-out"
                    style={{ maxHeight: isOpen ? "240px" : "0px" }}
                  >
                    <p className="pb-6 text-sm md:text-base text-brand-navy/55 leading-relaxed max-w-2xl">{item.a}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
