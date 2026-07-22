import { Link } from "react-router-dom";

/** Legacy sertifikat HTML — digantikan hasil Pimsleur/CFIT. */
export function ResultPage() {
  return (
    <div className="mx-auto max-w-lg py-12 text-center">
      <p className="text-sm text-brand-navy/60">Halaman sertifikat legacy sudah dinonaktifkan.</p>
      <Link to="/result/pimsleur" className="mt-4 inline-block text-sm font-semibold text-brand-red">
        Lihat hasil Pimsleur
      </Link>
    </div>
  );
}
