import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CreditCard, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { PEMETAAN_PRICE, supabase } from "../lib/supabase";

type RedirectStatus = "success" | "failure" | "expired" | null;

const POLL_INTERVAL_MS = 2500;
const POLL_MAX_MS = 60000;

export function PaymentPage() {
  const { user, progress, refreshProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sandboxMode, setSandboxMode] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmTimedOut, setConfirmTimedOut] = useState(false);
  const [redirectMessage, setRedirectMessage] = useState("");
  const handledRedirect = useRef(false);

  const isPaid = progress?.payment_status === "verified" || progress?.payment_status === "paid";

  const canStartLanguageTest =
    progress?.payment_status === "verified" || progress?.language_test_status === "available";

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);

  const clearPaymentParam = () => {
    setSearchParams(
      (prev) => {
        prev.delete("payment");
        return prev;
      },
      { replace: true },
    );
  };

  // Handle return-redirect dari Pivot: ?payment=success|failure|expired
  useEffect(() => {
    if (handledRedirect.current) return;
    const status = searchParams.get("payment") as RedirectStatus;
    if (!status) return;
    handledRedirect.current = true;

    if (status === "success") {
      setError("");
      setRedirectMessage("");
      setConfirmTimedOut(false);
      setConfirming(true);
    } else if (status === "failure") {
      setRedirectMessage("Pembayaran gagal. Silakan coba lagi.");
      clearPaymentParam();
    } else if (status === "expired") {
      setRedirectMessage("Sesi pembayaran kedaluwarsa. Silakan coba lagi.");
      clearPaymentParam();
    }
    // other values -> abaikan
  }, [searchParams]);

  // Berhenti menunggu begitu status verified terdeteksi (real-time atau polling)
  useEffect(() => {
    if (confirming && isPaid) {
      setConfirming(false);
      setConfirmTimedOut(false);
      clearPaymentParam();
    }
  }, [confirming, isPaid]);

  // Polling cadangan: webhook bisa telat sampai status terbaca
  useEffect(() => {
    if (!confirming) return;
    let active = true;
    let elapsed = 0;

    const tick = async () => {
      if (!active) return;
      await refreshProfile();
      elapsed += POLL_INTERVAL_MS;
      if (elapsed >= POLL_MAX_MS && active) {
        setConfirming(false);
        setConfirmTimedOut(true);
      }
    };

    void tick();
    const id = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [confirming, refreshProfile]);

  const handlePayPivot = async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    setRedirectMessage("");

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

  const handleRecheckStatus = async () => {
    setConfirmTimedOut(false);
    setConfirming(true);
  };

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
        ) : confirming ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-brand-red-soft text-brand-navy px-4 py-4 text-sm font-semibold">
              <Loader2 size={20} className="animate-spin text-brand-red" />
              <div>
                <p className="font-bold">Menunggu konfirmasi pembayaran…</p>
                <p className="mt-1 text-xs font-medium text-brand-navy/55">
                  Pembayaranmu sedang diverifikasi. Halaman ini akan diperbarui otomatis.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-brand-navy/8 px-4 py-3 text-xs text-brand-navy/50">
              <ShieldCheck size={16} className="shrink-0 text-emerald-600" />
              Sudah bayar? Biarkan terbuka — status bayar terkunci otomatis begitu diverifikasi.
            </div>
          </div>
        ) : confirmTimedOut ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl bg-amber-50 text-amber-700 px-4 py-3 text-sm font-semibold">
              <XCircle size={20} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-bold">Konfirmasi belum diterima</p>
                <p className="mt-1 text-xs font-medium text-amber-700/80">
                  Pembayaranmu mungkin masih diproses. Cek status lagi, atau jika belum dibayar, mulai sesi baru.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRecheckStatus}
              disabled={loading}
              className="w-full rounded-xl border border-brand-navy/15 text-brand-navy font-bold py-3.5 text-sm hover:bg-brand-navy/2 transition-colors disabled:opacity-50"
            >
              Cek status pembayaran
            </button>
            <button
              type="button"
              onClick={() => setConfirmTimedOut(false)}
              className="w-full rounded-xl bg-brand-red text-white font-bold py-3.5 text-sm hover:bg-brand-red-hover transition-colors"
            >
              Mulai pembayaran baru
            </button>
          </div>
        ) : (
          <>
            {error && (
              <p className="text-sm text-brand-red bg-brand-red-soft rounded-lg px-3 py-2 mb-4">{error}</p>
            )}
            {redirectMessage && (
              <p className="text-sm text-brand-red bg-brand-red-soft rounded-lg px-3 py-2 mb-4">{redirectMessage}</p>
            )}

            <button
              type="button"
              onClick={handlePayPivot}
              disabled={loading}
              className="w-full rounded-xl bg-brand-red text-white font-bold py-3.5 text-sm hover:bg-brand-red-hover transition-colors disabled:opacity-50"
            >
              {loading ? "Memproses..." : "Bayar via Paper.id"}
            </button>

            {import.meta.env.DEV || import.meta.env.VITE_DEMO_MODE === "true" ? (
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