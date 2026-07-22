import { Link } from "react-router-dom";

/** Papikostik — materi menyusul. */
export function CharacterTestPage() {
  return (
    <div className="mx-auto max-w-lg py-12 text-center">
      <p className="text-sm text-brand-navy/60">Papikostik belum dibuka. Selesaikan CFIT dulu.</p>
      <Link to="/dashboard" className="mt-4 inline-block text-sm font-semibold text-brand-red">
        Kembali ke dashboard
      </Link>
    </div>
  );
}
