import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { navLinks } from "../data/content";

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

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/85 backdrop-blur-lg shadow-[0_1px_0_0_rgba(15,34,64,0.08)]" : "bg-transparent"
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
        </div>

        <button
          className="lg:hidden relative z-10 p-2 text-brand-navy"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </nav>

      <div
        className={`lg:hidden fixed inset-0 top-[64px] bg-white transition-all duration-300 ${
          open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <div className="flex flex-col gap-1 px-6 py-8">
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
          <a
            href="#kontak"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick("#kontak");
            }}
            className="mt-6 rounded-full bg-brand-red px-6 py-3.5 text-center text-base font-bold text-white"
          >
            Konsultasi Gratis
          </a>
        </div>
      </div>
    </header>
  );
}
