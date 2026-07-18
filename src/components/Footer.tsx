import { MessageCircle } from "lucide-react";
import { Logo } from "./Logo";
import { whatsappUrl } from "../data/content";

function InstagramGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="bg-brand-navy-deep text-white/70">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-16">
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10 pb-12 border-b border-white/10">
          <div>
            <Logo layout="horizontal" size={72} className="mb-4 brightness-110" />
            <p className="text-sm text-white/50 max-w-xs leading-relaxed">
              Ekosistem persiapan dan pengembangan karier Jepang, dari persiapan hingga kembali ke Indonesia.
            </p>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Jelajahi</h5>
            <ul className="flex flex-col gap-2.5 text-sm">
              <li><a href="#ekosistem" className="hover:text-white transition-colors">Ekosistem</a></li>
              <li><a href="#tahapan" className="hover:text-white transition-colors">Tahapan Peserta</a></li>
              <li><a href="#program" className="hover:text-white transition-colors">Program Kerja Jepang</a></li>
              <li><a href="#pemetaan" className="hover:text-white transition-colors">Pemetaan Potensi</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Informasi</h5>
            <ul className="flex flex-col gap-2.5 text-sm">
              <li><a href="#partner" className="hover:text-white transition-colors">Partner & Legalitas</a></li>
              <li><a href="#alumni" className="hover:text-white transition-colors">Alumni & Aktivitas</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
              <li><a href="#lokasi" className="hover:text-white transition-colors">Lokasi & Kontak</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Kontak</h5>
            <ul className="flex flex-col gap-2.5 text-sm">
              <li><a href="#kontak" className="hover:text-white transition-colors">Konsultasi Gratis</a></li>
              <li>
                <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-white transition-colors">
                  <MessageCircle size={14} /> WhatsApp Admin
                </a>
              </li>
              <li>
                <a href="#" className="inline-flex items-center gap-1.5 hover:text-white transition-colors">
                  <InstagramGlyph /> Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-8 text-xs text-white/35">
          <span>© {new Date().getFullYear()} Harunokaze × LPK & SO Wiwitan Baru. Seluruh hak cipta dilindungi.</span>
          <span>Bermitra resmi & terdaftar Kemenaker RI.</span>
        </div>
      </div>
    </footer>
  );
}
