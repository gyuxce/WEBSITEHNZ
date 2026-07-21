import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { navLinks, portalUrl } from "../data/content";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleNavClick = (href: string) => {
    setOpen(false);
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: "smooth" });
  };

  const headerSolid = scrolled || open;

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        headerSolid
          ? "bg-white shadow-[0_1px_0_0_rgba(15,34,64,0.08)]"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 md:px-10 py-3">
        <a href="#top" onClick={() => handleNavClick("#top")} className="relative z-10">
          <Logo layout="horizontal" size={56} />
        </a>

        <div className="hidden lg:flex items-center gap-9 text-sm font-semibold text-brand-navy/70">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => {
                e.preventDefault();
                handleNavClick(link.href);
              }}
              className="relative transition-colors hover:text-brand-navy group"
            >
              {link.label}
              <span className="absolute -bottom-1.5 left-0 h-[2px] w-0 bg-brand-red transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <a
            href="#kontak"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick("#kontak");
            }}
            className="inline-flex items-center gap-2 rounded-full border border-brand-navy/15 px-5 py-2.5 text-sm font-semibold text-brand-navy transition-all hover:border-brand-navy hover:bg-brand-navy hover:text-white"
          >
            Konsultasi
          </a>
          <a
            href={`${portalUrl}/register`}
            className="inline-flex items-center gap-2 rounded-full bg-brand-red px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-brand-red-hover"
          >
            Mulai Pemetaan
          </a>
        </div>

        <button
          className="lg:hidden relative z-10 p-2 text-brand-navy"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </nav>

      {/* Panel terpisah: bg solid putih, tidak pakai opacity parent header */}
      <div
        className={`lg:hidden fixed inset-x-0 top-[64px] bottom-0 z-40 bg-white transition-transform duration-300 ease-out ${
          open ? "translate-y-0 pointer-events-auto" : "-translate-y-2 pointer-events-none invisible"
        }`}
        aria-hidden={!open}
      >
        <div className="flex h-full flex-col overflow-y-auto px-6 py-8">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(link.href);
                }}
                className="py-3.5 text-lg font-semibold text-brand-navy border-b border-brand-navy/10"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <a
              href={`${portalUrl}/register`}
              className="flex w-full items-center justify-center rounded-full bg-brand-red px-6 py-3.5 text-center text-sm font-bold text-white"
            >
              Mulai Pemetaan
            </a>
            <a
              href="#kontak"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick("#kontak");
              }}
              className="flex w-full items-center justify-center rounded-full border border-brand-navy/15 bg-white px-6 py-3.5 text-center text-sm font-bold text-brand-navy"
            >
              Konsultasi
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
