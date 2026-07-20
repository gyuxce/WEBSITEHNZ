import { LANDING_URL } from "../lib/supabase";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <a href={LANDING_URL} className={`inline-flex items-center gap-2.5 ${className}`}>
      <img src="/logo.png" alt="Harunokaze" className="h-9 w-9 rounded-lg object-contain" />
      <div>
        <p className="font-display font-extrabold text-brand-navy leading-none text-lg">Harunokaze</p>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-red mt-0.5">
          Portal Pemetaan
        </p>
      </div>
    </a>
  );
}
