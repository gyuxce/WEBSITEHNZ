import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, CreditCard, ShieldCheck } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { PEMETAAN_PRICE, supabase } from "../lib/supabase";

export function PaymentPage() {
  const { user, progress, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sandboxMode, setSandboxMode] = useState(false);

  const isPaid = progress?.payment_status === "verified" || progress?.payment_status === "paid";

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);

  const handlePayPivot = async () => {
    if (!user) return;
    setLoading(true);
    setError("");

    try {
      const { data, error: fnError } = await supabase.functions.invoke("pivot-create");

      if (fnError) throw fnError;
      if (!data?.redirect_url) throw new Error(data?.error ?? "Gagal membuat sesi pembayaran Pivot");
      window.location.assign(data.redirect_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan pembayaran");
    } finally {
      setLoading(false);
    }
  };

  /** Local-only fallback while the payment gateway is being tested. */
  const handleSandboxMarkPaid = async () => {
    if (!user) return;
    setLoading(true);
    setError("");

    const orderId = `HNZ-SANDBOX-${Date.now()}`;

    const { error: payError } = await supabase.from("payments").insert({
      user_id: user.id,
      order_id: orderId,
      amount: PEMETAAN_PRICE,
      status: "settlement",
      provider: "pivot",
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
    setSandboxMode(false);
  };

  const canStartLanguageTest =
    progress?.payment_status === "verified" || progress?.language_test_status === "available";

  return (
    <div className="max-w-lg mx-auto">
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-brand-navy/50 hover:text-brand-red mb-6">
        <ArrowLeft size={16} /> Kembali ke dashboard
      </Link>

      <div className="rounded-2xl border border-brand-navy/8 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-xl bg-brand-red-soft text-brand-red flex items-center justify-center">
            <CreditCard size={24} />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-xl text-brand-navy">Pembayaran Pemetaan</h1>
            <p className="text-xs text-brand-navy/50">Biaya akses tes potensi & bahasa</p>
          </div>
        </div>

        <div className="rounded-xl bg-brand-bg p-5 mb-6">
          <p className="text-xs font-bold uppercase tracking-wide text-brand-navy/40">Total pembayaran</p>
          <p className="font-display font-extrabold text-3xl text-brand-navy mt-1">{formatPrice(PEMETAAN_PRICE)}</p>
          <p className="text-xs text-brand-navy/45 mt-2">Pembayaran aman via Paper.id (QRIS, transfer bank, e-wallet)</p>
        </div>

        {isPaid ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50 text-emerald-700 px-4 py-3 text-sm font-semibold">
              <ShieldCheck size={20} />
              Pembayaran berhasil! Tes Pimsleur sudah terbuka.
            </div>
            {canStartLanguageTest && progress?.language_test_status !== "completed" && (
              <Link
                to="/test/pimsleur"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-red text-white font-bold py-3.5 text-sm hover:bg-brand-red-hover transition-colors"
              >
                Lanjut ke Tes Pimsleur
                <ArrowRight size={18} />
              </Link>
            )}
            {progress?.language_test_status === "completed" && (
              <Link
                to="/result/pimsleur"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-navy text-white font-bold py-3.5 text-sm hover:bg-brand-navy-light transition-colors"
              >
                Lihat hasil Pimsleur
                <ArrowRight size={18} />
              </Link>
            )}
          </div>
        ) : (
          <>
            {error && (
              <p className="text-sm text-brand-red bg-brand-red-soft rounded-lg px-3 py-2 mb-4">{error}</p>
            )}

            <button
              type="button"
              onClick={handlePayPivot}
              disabled={loading}
              className="w-full rounded-xl bg-brand-red text-white font-bold py-3.5 text-sm hover:bg-brand-red-hover transition-colors disabled:opacity-50"
            >
              {loading ? "Memproses..." : "Bayar via Paper.id"}
            </button>

            {import.meta.env.DEV ? (
              <div className="mt-6 pt-6 border-t border-brand-navy/8">
              <button
                type="button"
                onClick={() => setSandboxMode(!sandboxMode)}
                className="text-xs text-brand-navy/40 hover:text-brand-navy underline"
              >
                Mode sandbox (development)
              </button>
              {sandboxMode && (
                <div className="mt-3">
                  <p className="text-xs text-brand-navy/50 mb-2">
                    Tandai pembayaran sebagai lunas tanpa gateway. Hanya untuk testing lokal.
                  </p>
                  <button
                    type="button"
                    onClick={handleSandboxMarkPaid}
                    disabled={loading}
                    className="w-full rounded-xl border border-brand-navy/15 text-brand-navy font-bold py-3 text-sm"
                  >
                    Simulasikan pembayaran berhasil
                  </button>
                </div>
              )}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
