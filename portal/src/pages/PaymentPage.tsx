import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, CreditCard, ShieldCheck } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { PEMETAAN_PRICE, supabase } from "../lib/supabase";

export function PaymentPage() {
  const { user, progress, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isPaid = progress?.payment_status === "verified" || progress?.payment_status === "paid";

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);

  /** Demo / sandbox: tandai lunas tanpa gateway (Pivot masih belum siap). */
  const handleDemoMarkPaid = async () => {
    if (!user) return;
    setLoading(true);
    setError("");

    const orderId = `HNZ-DEMO-${Date.now()}`;

    const { error: payError } = await supabase.from("payments").insert({
      user_id: user.id,
      order_id: orderId,
      amount: PEMETAAN_PRICE,
      status: "settlement",
      provider: "sandbox",
    });

    if (payError) {
      setError(payError.message);
      setLoading(false);
      return;
    }

    await supabase
      .from("user_progress")
      .update({ payment_status: "verified", language_test_status: "available" })
      .eq("user_id", user.id);

    await refreshProfile();
    setLoading(false);
  };

  const canStartLanguageTest =
    progress?.payment_status === "verified" || progress?.language_test_status === "available";

  return (
    <div className="mx-auto max-w-lg">
      <Link
        to="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-brand-navy/50 hover:text-brand-red"
      >
        <ArrowLeft size={16} /> Kembali ke dashboard
      </Link>

      <div className="rounded-2xl border border-brand-navy/8 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-red-soft text-brand-red">
            <CreditCard size={24} />
          </div>
          <div>
            <h1 className="font-display text-xl font-extrabold text-brand-navy">
              Pembayaran Pemetaan
            </h1>
            <p className="text-xs text-brand-navy/50">Biaya akses tes potensi & bahasa</p>
          </div>
        </div>

        <div className="mb-6 rounded-xl bg-brand-bg p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-brand-navy/40">
            Total pembayaran
          </p>
          <p className="mt-1 font-display text-3xl font-extrabold text-brand-navy">
            {formatPrice(PEMETAAN_PRICE)}
          </p>
          <p className="mt-2 text-xs text-brand-navy/45">
            Sementara ini memakai <strong className="text-brand-navy">mode demo</strong> agar alur
            tes bisa dilanjutkan. Gateway pembayaran (Pivot/Paper.id) belum diaktifkan.
          </p>
        </div>

        {isPaid ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              <ShieldCheck size={20} />
              Pembayaran berhasil! Tes Pimsleur sudah terbuka.
            </div>
            {canStartLanguageTest && progress?.language_test_status !== "completed" && (
              <Link
                to="/test/pimsleur"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-red py-3.5 text-sm font-bold text-white transition-colors hover:bg-brand-red-hover"
              >
                Lanjut ke Tes Pimsleur
                <ArrowRight size={18} />
              </Link>
            )}
            {progress?.language_test_status === "completed" && (
              <Link
                to="/result/pimsleur"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-navy py-3.5 text-sm font-bold text-white transition-colors hover:bg-brand-navy-light"
              >
                Lihat hasil Pimsleur
                <ArrowRight size={18} />
              </Link>
            )}
          </div>
        ) : (
          <>
            {error ? (
              <p className="mb-4 rounded-lg bg-brand-red-soft px-3 py-2 text-sm text-brand-red">
                {error}
              </p>
            ) : null}

            <button
              type="button"
              onClick={() => void handleDemoMarkPaid()}
              disabled={loading}
              className="w-full rounded-xl bg-brand-red py-3.5 text-sm font-bold text-white transition-colors hover:bg-brand-red-hover disabled:opacity-50"
            >
              {loading ? "Memproses…" : "Lanjutkan (mode demo)"}
            </button>

            <p className="mt-3 text-center text-xs text-brand-navy/45">
              Satu klik menandai biaya pemetaan sebagai lunas dan membuka Tes Pimsleur.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
