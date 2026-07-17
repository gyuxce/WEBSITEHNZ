import { ShieldCheck, BadgeCheck, FileCheck2, Handshake } from "lucide-react";
import { trustBadges } from "../data/content";
import { Reveal } from "./Reveal";

const icons = [ShieldCheck, BadgeCheck, FileCheck2, Handshake];

export function TrustBadges() {
  return (
    <div className="border-y border-brand-navy/8 bg-white">
      <Reveal>
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {trustBadges.map((label, i) => {
            const Icon = icons[i % icons.length];
            return (
              <div key={label} className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-brand-navy/60">
                <Icon size={16} className="text-brand-red shrink-0" />
                {label}
              </div>
            );
          })}
        </div>
      </Reveal>
    </div>
  );
}
