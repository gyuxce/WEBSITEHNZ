import { Link } from "react-router-dom";

/** Legacy language test — digantikan Pimsleur. */
export function LanguageTestPage() {
  return (
    <div className="mx-auto max-w-lg py-12 text-center">
      <p className="text-sm text-brand-navy/60">
        Tes bahasa lama sudah diganti dengan Tes Pimsleur.
      </p>
      <Link to="/test/pimsleur" className="mt-4 inline-block text-sm font-semibold text-brand-red">
        Ke Tes Pimsleur
      </Link>
    </div>
  );
}
