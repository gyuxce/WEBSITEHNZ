import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, CreditCard, ShieldCheck } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { PEMETAAN_PRICE, apiFetch, MIDTRANS_CLIENT_KEY } from "../lib/api";

export function PaymentPage() {
  const { user, progress, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sandboxMode, setSandboxMode] = useState(false);

  const isPaid = progress?.payment_status === "verified" || progress?.payment_status === "paid";

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);

  const handlePayMidtrans = async () => {
    if (!user) return;
    setLoading(true);
    setError("");

    try {
      const data = await apiFetch<{ token: string; order_id: string; error?: string }>(
        "/payments/midtrans/create",
        {
          method: "POST",
          body: JSON.stringify({ amount: PEMETAAN_PRICE }),
        },
      );

      if (!data?.token) throw new Error(data?.error ?? "Gagal membuat transaksi Midtrans");

      if (!window.snap) {
        throw new Error("Midtrans Snap belum dimuat. Pastikan VITE_MIDTRANS_CLIENT_KEY sudah diset.");
      }

      window.snap.pay(data.token, {
        onSuccess: async () => {
          await refreshProfile();
        },
        onPending: async () => {
          await refreshProfile();
        },
        onError: () => {
          setError("Pembayaran gagal. Silakan coba lagi.");
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan pembayaran");
    } finally {
      setLoading(false);
    }
  };

  /** Sandbox fallback when Midtrans belum dikonfigurasi */
  const handleSandboxMarkPaid = async () => {
    if (!user) return;
    setLoading(true);
    setError("");

    try {
      await apiFetch("/payments/sandbox/settle", { method: "POST", body: "{}" });
      await refreshProfile();
      setSandboxMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal sandbox pay");
    } finally {
      setLoading(false);
    }
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
          <p className="text-xs text-brand-navy/45 mt-2">Pembayaran aman via Midtrans (QRIS, transfer bank, e-wallet)</p>
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
              onClick={handlePayMidtrans}
              disabled={loading || !MIDTRANS_CLIENT_KEY}
              className="w-full rounded-xl bg-brand-red text-white font-bold py-3.5 text-sm hover:bg-brand-red-hover transition-colors disabled:opacity-50"
            >
              {loading ? "Memproses..." : "Bayar dengan Midtrans"}
            </button>

            {!MIDTRANS_CLIENT_KEY && (
              <p className="mt-3 text-xs text-brand-navy/45 text-center">
                Midtrans belum dikonfigurasi. Gunakan mode sandbox di bawah untuk testing.
              </p>
            )}

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
                    Tandai pembayaran sebagai lunas tanpa Midtrans. Hanya untuk testing lokal.
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
          </>
        )}
      </div>
    </div>
  );
}
