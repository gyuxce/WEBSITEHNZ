import { portalUrl } from "../data/content";

export function MobileCtaBar() {
  return (
    <div
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-brand-navy/10 px-4 pt-3 shadow-[0_-8px_24px_-8px_rgba(15,34,64,0.15)]"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
    >
      <div className="grid grid-cols-2 gap-2.5">
        <a
          href="#kontak"
          className="inline-flex h-12 items-center justify-center rounded-full border border-brand-navy/15 px-3 text-sm font-bold text-brand-navy"
        >
          Konsultasi
        </a>
        <a
          href={`${portalUrl}/register`}
          className="inline-flex h-12 items-center justify-center rounded-full bg-brand-red px-3 text-sm font-bold text-white shadow-lg shadow-brand-red/25"
        >
          Mulai Pemetaan
        </a>
      </div>
    </div>
  );
}
