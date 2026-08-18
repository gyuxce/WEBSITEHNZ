import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Loader2,
  ReceiptText,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { useAuth } from "../contexts/AuthContext";
import type { Database } from "../lib/database.types";
import { supabase } from "../lib/supabase";

type RedirectStatus = "success" | "failure" | "expired" | null;
type ParticipantInvoice =
  Database["public"]["Functions"]["ensure_own_assessment_invoice"]["Returns"][number];

const POLL_INTERVAL_MS = 2500;
const POLL_MAX_MS = 60000;

const formatPrice = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export function PaymentPage() {
  const { user, progress, refreshProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [invoice, setInvoice] = useState<ParticipantInvoice | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmTimedOut, setConfirmTimedOut] = useState(false);
  const [redirectMessage, setRedirectMessage] = useState("");
  const [showPaymentSuccessDialog, setShowPaymentSuccessDialog] = useState(false);
  const handledRedirect = useRef(false);
  const statusCheckInFlight = useRef(false);

  const isPaid =
    invoice?.status === "paid" ||
    progress?.payment_status === "verified" ||
    progress?.payment_status === "paid";
  const canStartLanguageTest =
    progress?.payment_status === "verified" || progress?.language_test_status === "available";
  const isOverdue = Boolean(
    invoice?.due_date &&
      new Date(`${invoice.due_date}T23:59:59+07:00`).getTime() < Date.now(),
  );

  const loadInvoice = useCallback(
    async (showLoader = true) => {
      if (!user) return;
      if (showLoader) setInvoiceLoading(true);

      const { data, error: invoiceError } = await supabase.rpc(
        "ensure_own_assessment_invoice",
      );
      if (invoiceError) {
        setError(invoiceError.message);
      } else {
        setInvoice(data?.[0] ?? null);
      }
      if (showLoader) setInvoiceLoading(false);
    },
    [user],
  );

  useEffect(() => {
    void loadInvoice();
  }, [loadInvoice]);

  const clearPaymentParam = useCallback(() => {
    setSearchParams(
      (prev) => {
        prev.delete("payment");
        return prev;
      },
      { replace: true },
    );
  }, [setSearchParams]);

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
  }, [clearPaymentParam, searchParams]);

  useEffect(() => {
    if (confirming && isPaid) {
      setConfirming(false);
      setConfirmTimedOut(false);
      setShowPaymentSuccessDialog(true);
      clearPaymentParam();
    }
  }, [clearPaymentParam, confirming, isPaid]);

  const checkPaymentStatus = useCallback(async () => {
    if (!invoice || isPaid || statusCheckInFlight.current) return;
    statusCheckInFlight.current = true;

    try {
      const { error: fnError } = await supabase.functions.invoke("pivot-status", {
        body: { invoice_id: invoice.id },
      });
      if (fnError instanceof FunctionsHttpError) {
        let serverMsg = "Status pembayaran belum dapat diperiksa";
        try {
          const errBody = await fnError.context.json();
          serverMsg = errBody?.error ?? serverMsg;
        } catch {
          // The response body can be empty or already consumed.
        }
        throw new Error(serverMsg);
      }
      if (fnError) throw fnError;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status pembayaran belum dapat diperiksa");
    } finally {
      statusCheckInFlight.current = false;
    }
  }, [invoice, isPaid]);

  useEffect(() => {
    if (!confirming) return;
    let active = true;
    let elapsed = 0;

    const tick = async () => {
      if (!active) return;
      await checkPaymentStatus();
      if (!active) return;
      await Promise.all([refreshProfile(), loadInvoice(false)]);
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
  }, [checkPaymentStatus, confirming, loadInvoice, refreshProfile]);

  const handlePayPivot = async () => {
    if (!user || !invoice) {
      setError("Tagihan pembayaran belum tersedia.");
      return;
    }
    if (isOverdue) {
      setError("Tagihan sudah melewati tanggal jatuh tempo. Hubungi admin untuk memperbaruinya.");
      return;
    }

    setLoading(true);
    setError("");
    setRedirectMessage("");

    try {
      const { data, error: fnError } = await supabase.functions.invoke("pivot-create", {
        body: { invoice_id: invoice.id },
      });

      if (fnError instanceof FunctionsHttpError) {
        let serverMsg = "Edge Function gagal";
        try {
          const errBody = await fnError.context.json();
          serverMsg = errBody?.error ?? serverMsg;
        } catch {
          // The function may return an empty or already-consumed response body.
        }
        throw new Error(serverMsg);
      }
      if (fnError) throw fnError;
      if (!data?.redirect_url) throw new Error(data?.error ?? "Gagal membuat sesi pembayaran Pivot");
      window.location.assign(data.redirect_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan pembayaran");
    } finally {
      setLoading(false);
    }
  };

  const nextTestPath =
    progress?.language_test_status === "completed" ? "/result/pimsleur" : "/test/pimsleur";
  const nextTestLabel =
    progress?.language_test_status === "completed" ? "Lihat hasil Pimsleur" : "Lanjut ke Tes Pimsleur";

  return (
    <div className="mx-auto max-w-lg">
      <Link
        to="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-brand-navy/50 hover:text-brand-red"
      >
        <ArrowLeft size={16} /> Kembali ke dashboard
      </Link>

      <div className="rounded-2xl border border-brand-navy/8 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-red-soft text-brand-red">
            <CreditCard size={24} />
          </div>
          <div>
            <h1 className="font-display text-xl font-extrabold text-brand-navy">
              Pembayaran Pemetaan
            </h1>
            <p className="text-xs text-brand-navy/50">Biaya pemetaan ditetapkan Rp99.000</p>
          </div>
        </div>

        {invoiceLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-brand-red" size={28} />
          </div>
        ) : isPaid ? (
          <div className="space-y-4">
            {invoice ? <InvoiceSummary invoice={invoice} /> : null}
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              <ShieldCheck size={20} />
              Pembayaran berhasil. Tes Pimsleur sudah terbuka.
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
        ) : confirming ? (
          <div className="space-y-4">
            {invoice ? <InvoiceSummary invoice={invoice} /> : null}
            <div className="flex items-center gap-3 rounded-xl bg-brand-red-soft px-4 py-4 text-sm font-semibold text-brand-navy">
              <Loader2 size={20} className="animate-spin text-brand-red" />
              <div>
                <p className="font-bold">Menunggu konfirmasi pembayaran</p>
                <p className="mt-1 text-xs font-medium text-brand-navy/55">
                  Status diperbarui otomatis. Kami juga memeriksa status langsung ke Pivot.
                </p>
              </div>
            </div>
          </div>
        ) : !invoice ? (
          <div className="rounded-xl border border-brand-navy/8 bg-brand-bg p-5 text-center">
            <ReceiptText className="mx-auto text-brand-navy/35" size={30} />
            <p className="mt-3 text-sm font-bold text-brand-navy">Tagihan belum tersedia</p>
            <p className="mt-1 text-xs leading-relaxed text-brand-navy/50">
              Tagihan Rp99.000 akan dibuat otomatis. Coba muat ulang halaman beberapa saat lagi.
            </p>
          </div>
        ) : confirmTimedOut ? (
          <div className="space-y-4">
            <InvoiceSummary invoice={invoice} />
            <div className="flex items-start gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
              <XCircle size={20} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-bold">Konfirmasi belum diterima</p>
                <p className="mt-1 text-xs font-medium text-amber-700/80">
                  Pembayaran mungkin masih diproses. Periksa lagi sebelum membuat sesi baru.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setConfirmTimedOut(false);
                setConfirming(true);
              }}
              className="w-full rounded-xl border border-brand-navy/15 py-3.5 text-sm font-bold text-brand-navy transition-colors hover:bg-brand-navy/2"
            >
              Cek status pembayaran
            </button>
            <button
              type="button"
              onClick={() => setConfirmTimedOut(false)}
              className="w-full rounded-xl bg-brand-red py-3.5 text-sm font-bold text-white transition-colors hover:bg-brand-red-hover"
            >
              Mulai pembayaran baru
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <InvoiceSummary invoice={invoice} />
            {error && (
              <p className="rounded-lg bg-brand-red-soft px-3 py-2 text-sm text-brand-red">
                {error}
              </p>
            )}
            {redirectMessage && (
              <p className="rounded-lg bg-brand-red-soft px-3 py-2 text-sm text-brand-red">
                {redirectMessage}
              </p>
            )}
            {isOverdue ? (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                Tagihan melewati jatuh tempo. Hubungi admin untuk memperbarui tagihan.
              </p>
            ) : null}
            <button
              type="button"
              onClick={handlePayPivot}
              disabled={loading || isOverdue}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-red py-3.5 text-sm font-bold text-white transition-colors hover:bg-brand-red-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <CreditCard size={18} />}
              {loading ? "Memproses..." : `Bayar ${formatPrice(invoice.amount)}`}
            </button>
            <div className="flex items-center justify-center gap-2 text-xs text-brand-navy/45">
              <ShieldCheck size={15} className="text-emerald-600" />
              Diproses melalui Pivot Payment
            </div>
          </div>
        )}

        {!invoiceLoading && error && (isPaid || confirming || !invoice) ? (
          <p className="mt-4 rounded-lg bg-brand-red-soft px-3 py-2 text-sm text-brand-red">
            {error}
          </p>
        ) : null}
      </div>

      {showPaymentSuccessDialog && isPaid ? (
        <div className="fixed inset-0 z-50 flex items-end bg-brand-navy/45 p-4 sm:items-center sm:justify-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-success-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-8"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <ShieldCheck size={36} strokeWidth={2.5} />
            </div>
            <div className="mt-5 text-center">
              <p className="text-xs font-bold uppercase text-emerald-600">Pembayaran diterima</p>
              <h2 id="payment-success-title" className="mt-2 font-display text-2xl font-extrabold text-brand-navy">
                Pembayaran berhasil
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-brand-navy/60">
                Tagihan {invoice ? formatPrice(invoice.amount) : ""} sudah lunas. Akses Tes Pimsleur
                sekarang sudah dibuka.
              </p>
            </div>
            <div className="mt-7 space-y-3">
              <Link
                to={nextTestPath}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-red py-3.5 text-sm font-bold text-white transition-colors hover:bg-brand-red-hover"
              >
                {nextTestLabel}
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/dashboard"
                onClick={() => setShowPaymentSuccessDialog(false)}
                className="flex w-full items-center justify-center rounded-xl border border-brand-navy/12 py-3 text-sm font-bold text-brand-navy transition-colors hover:bg-brand-bg"
              >
                Kembali ke dashboard
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function InvoiceSummary({ invoice }: { invoice: ParticipantInvoice }) {
  return (
    <div className="rounded-xl bg-brand-bg p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase text-brand-navy/40">Nomor tagihan</p>
          <p className="mt-1 break-all text-sm font-bold text-brand-navy">
            {invoice.invoice_number}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold uppercase text-brand-navy/55">
          {invoice.status === "paid" ? "Lunas" : "Menunggu"}
        </span>
      </div>
      <div className="mt-5 border-t border-brand-navy/8 pt-4">
        <p className="text-sm text-brand-navy/60">{invoice.description}</p>
        <p className="mt-2 font-display text-2xl font-extrabold text-brand-navy">
          {formatPrice(invoice.amount)}
        </p>
        {invoice.due_date ? (
          <p className="mt-2 text-xs text-brand-navy/45">
            Jatuh tempo {formatDate(invoice.due_date)}
          </p>
        ) : null}
      </div>
    </div>
  );
}
