import { Reveal } from "./Reveal";

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
  center?: boolean;
  light?: boolean;
}

export function SectionHeading({ eyebrow, title, description, center = false, light = false }: SectionHeadingProps) {
  return (
    <Reveal className={`max-w-2xl mb-14 md:mb-16 ${center ? "mx-auto text-center" : ""}`}>
      <span className={`inline-block text-xs font-bold uppercase tracking-widest ${light ? "text-brand-sakura" : "text-brand-red"}`}>
        {eyebrow}
      </span>
      <h2
        className={`font-display font-extrabold text-3xl md:text-4xl mt-3 leading-tight text-balance ${
          light ? "text-white" : "text-brand-navy"
        }`}
      >
        {title}
      </h2>
      {description && (
        <p className={`mt-4 text-base leading-relaxed ${light ? "text-white/60" : "text-brand-navy/55"}`}>{description}</p>
      )}
    </Reveal>
  );
}
