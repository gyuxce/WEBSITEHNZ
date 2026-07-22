import { Link } from "react-router-dom";
import { LANDING_URL } from "../lib/api";

export function Logo({ className = "", homeHref }: { className?: string; homeHref?: string }) {
  const content = (
    <>
      <img src="/logo.png" alt="Harunokaze" className="h-9 w-9 rounded-lg object-contain" />
      <div>
        <p className="font-display font-extrabold text-brand-navy leading-none text-lg">Harunokaze</p>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-red mt-0.5">
          Portal Pemetaan
        </p>
      </div>
    </>
  );

  if (homeHref?.startsWith("/")) {
    return (
      <Link to={homeHref} className={`inline-flex items-center gap-2.5 ${className}`}>
        {content}
      </Link>
    );
  }

  return (
    <a href={homeHref ?? LANDING_URL} className={`inline-flex items-center gap-2.5 ${className}`}>
      {content}
    </a>
  );
}
