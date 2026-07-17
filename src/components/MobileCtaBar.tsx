export function MobileCtaBar() {
  return (
    <div
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-brand-navy/10 px-4 pt-3 shadow-[0_-8px_24px_-8px_rgba(15,34,64,0.15)]"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
    >
      <div className="flex items-center gap-2.5">
        <a
          href="#kontak"
          className="flex-1 text-center rounded-full border border-brand-navy/15 px-4 py-3 text-sm font-bold text-brand-navy"
        >
          Konsultasi
        </a>
        <a
          href="#pemetaan"
          className="flex-1 text-center rounded-full bg-brand-red px-4 py-3 text-sm font-bold text-white shadow-lg shadow-brand-red/25"
        >
          Mulai Pemetaan Potensi
        </a>
      </div>
    </div>
  );
}
