import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  ReceiptText,
  Save,
  Search,
  X,
} from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import type { Database } from "../lib/database.types";
import { supabase } from "../lib/supabase";

type InvoiceAdminRow =
  Database["public"]["Functions"]["admin_list_assessment_invoices"]["Returns"][number];

const DEFAULT_DESCRIPTION = "Pemetaan Potensi Harunokaze";

const formatPrice = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export function AdminPaymentsPage() {
  const { profile, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<InvoiceAdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<InvoiceAdminRow | null>(null);
  const [amountInput, setAmountInput] = useState("");
  const [description, setDescription] = useState(DEFAULT_DESCRIPTION);
  const [dueDate, setDueDate] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadRows = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError("");

    const { data, error: responseError } = await supabase.rpc(
      "admin_list_assessment_invoices",
    );
    if (responseError) {
      setError(responseError.message);
    } else {
      setRows(data ?? []);
    }
    if (showLoader) setLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading || profile?.role !== "admin") return;
    void loadRows();
  }, [authLoading, loadRows, profile?.role]);

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return rows;
    return rows.filter((row) =>
      [row.full_name, row.email, row.whatsapp, row.invoice_number]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized)),
    );
  }, [query, rows]);

  const totals = useMemo(
    () => ({
      issued: rows.filter((row) => row.invoice_status === "issued").length,
      paid: rows.filter((row) => row.invoice_status === "paid").length,
      legacy: rows.filter(
        (row) => !row.invoice_id && ["paid", "verified"].includes(row.progress_payment_status),
      ).length,
      missing: rows.filter(
        (row) => !row.invoice_id && row.progress_payment_status === "pending",
      ).length,
    }),
    [rows],
  );

  const openEditor = (row: InvoiceAdminRow) => {
    setEditing(row);
    setAmountInput(row.amount ? String(row.amount) : "");
    setDescription(row.description || DEFAULT_DESCRIPTION);
    setDueDate(row.due_date || "");
    setFormError("");
    setNotice("");
  };

  const closeEditor = () => {
    if (saving) return;
    setEditing(null);
    setFormError("");
  };

  const handleSave = async () => {
    if (!editing) return;
    const amount = Number(amountInput);
    if (!Number.isInteger(amount) || amount <= 0) {
      setFormError("Nominal harus berupa angka bulat lebih dari 0.");
      return;
    }

    setSaving(true);
    setFormError("");
    const { error: saveError } = await supabase.rpc("admin_upsert_assessment_invoice", {
      p_user_id: editing.user_id,
      p_amount: amount,
      p_description: description.trim() || DEFAULT_DESCRIPTION,
      p_due_date: dueDate || null,
    });

    if (saveError) {
      setFormError(saveError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setEditing(null);
    setNotice(`Tagihan ${editing.full_name} berhasil disimpan.`);
    await loadRows(false);
  };

  if (!authLoading && profile?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        to="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-brand-navy/50 hover:text-brand-red"
      >
        <ArrowLeft size={16} /> Panel staf
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-brand-red">
            Pembayaran
          </p>
          <h1 className="font-display text-2xl font-extrabold text-brand-navy">
            Tagihan peserta
          </h1>
          <p className="mt-1 text-sm text-brand-navy/50">
            Tetapkan nominal dan jatuh tempo sebelum peserta membuka pembayaran.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-bold">
          <span className="rounded-full bg-brand-bg px-3 py-2 text-brand-navy/55">
            Belum dibuat {totals.missing}
          </span>
          <span className="rounded-full bg-amber-50 px-3 py-2 text-amber-700">
            Menunggu {totals.issued}
          </span>
          <span className="rounded-full bg-emerald-50 px-3 py-2 text-emerald-700">
            Lunas {totals.paid}
          </span>
          {totals.legacy > 0 ? (
            <span className="rounded-full bg-sky-50 px-3 py-2 text-sky-700">
              Akses lama {totals.legacy}
            </span>
          ) : null}
        </div>
      </div>

      <div className="relative mt-6">
        <Search
          size={17}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-navy/35"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari nama, email, WhatsApp, atau nomor tagihan"
          className="w-full rounded-xl border border-brand-navy/10 bg-white py-3 pl-10 pr-4 text-sm text-brand-navy outline-none transition focus:border-brand-red/40 focus:ring-2 focus:ring-brand-red/10"
        />
      </div>

      {notice ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          <CheckCircle2 size={18} /> {notice}
        </div>
      ) : null}

      {loading || authLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-brand-red" size={30} />
        </div>
      ) : error ? (
        <div className="mt-6 rounded-xl bg-brand-red-soft px-4 py-3 text-sm text-brand-red">
          {error}
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="mt-6 rounded-xl border border-brand-navy/8 bg-white py-12 text-center">
          <ReceiptText className="mx-auto text-brand-navy/25" size={34} />
          <p className="mt-3 text-sm font-semibold text-brand-navy/50">
            {rows.length === 0 ? "Belum ada peserta terdaftar." : "Peserta tidak ditemukan."}
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-brand-navy/8 bg-white">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-brand-navy/8 bg-brand-bg text-xs uppercase text-brand-navy/45">
              <tr>
                <th className="px-4 py-3 font-bold">Peserta</th>
                <th className="px-4 py-3 font-bold">Tagihan</th>
                <th className="px-4 py-3 font-bold">Nominal</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 text-right font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr
                  key={row.user_id}
                  className="border-b border-brand-navy/5 align-top last:border-0"
                >
                  <td className="px-4 py-4">
                    <p className="font-semibold text-brand-navy">{row.full_name}</p>
                    <p className="mt-1 text-xs text-brand-navy/45">{row.email ?? "-"}</p>
                    {row.whatsapp ? (
                      <p className="mt-0.5 text-xs text-brand-navy/45">{row.whatsapp}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-mono text-xs font-semibold text-brand-navy/70">
                      {row.invoice_number ?? "Belum dibuat"}
                    </p>
                    {row.due_date ? (
                      <p className="mt-2 text-xs text-brand-navy/45">
                        Jatuh tempo {formatDate(`${row.due_date}T00:00:00`)}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-4 font-bold text-brand-navy">
                    {row.amount ? formatPrice(row.amount) : "-"}
                  </td>
                  <td className="px-4 py-4">
                    <InvoiceStatus
                      status={row.invoice_status}
                      legacyVerified={
                        !row.invoice_id &&
                        ["paid", "verified"].includes(row.progress_payment_status)
                      }
                    />
                    {row.last_payment_status ? (
                      <p className="mt-2 text-xs text-brand-navy/45">
                        Transaksi terakhir: {paymentStatusLabel(row.last_payment_status)}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => openEditor(row)}
                      disabled={
                        row.invoice_status === "paid" ||
                        (!row.invoice_id &&
                          ["paid", "verified"].includes(row.progress_payment_status))
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-brand-navy/12 px-3 py-2 text-xs font-bold text-brand-navy transition-colors hover:border-brand-red/30 hover:text-brand-red disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      {row.invoice_id ? <Pencil size={14} /> : <Plus size={14} />}
                      {row.invoice_status === "paid" ||
                      (!row.invoice_id &&
                        ["paid", "verified"].includes(row.progress_payment_status))
                        ? "Sudah aktif"
                        : row.invoice_id
                          ? "Edit"
                          : "Buat tagihan"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/35 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="invoice-dialog-title"
        >
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase text-brand-red">Tagihan peserta</p>
                <h2
                  id="invoice-dialog-title"
                  className="mt-1 font-display text-xl font-extrabold text-brand-navy"
                >
                  {editing.full_name}
                </h2>
                <p className="mt-1 text-xs text-brand-navy/45">{editing.email}</p>
              </div>
              <button
                type="button"
                onClick={closeEditor}
                disabled={saving}
                title="Tutup"
                aria-label="Tutup"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-brand-navy/45 hover:bg-brand-bg hover:text-brand-navy disabled:opacity-40"
              >
                <X size={19} />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="text-xs font-bold uppercase text-brand-navy/45">Nominal</span>
                <div className="mt-1.5 flex items-center rounded-lg border border-brand-navy/12 px-3 focus-within:border-brand-red/40 focus-within:ring-2 focus-within:ring-brand-red/10">
                  <span className="text-sm font-bold text-brand-navy/45">Rp</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    step="1"
                    value={amountInput}
                    onChange={(event) => setAmountInput(event.target.value)}
                    className="w-full bg-transparent px-2 py-3 text-sm font-bold text-brand-navy outline-none"
                    placeholder="0"
                  />
                </div>
                {Number(amountInput) > 0 ? (
                  <span className="mt-1.5 block text-xs text-brand-navy/45">
                    {formatPrice(Number(amountInput))}
                  </span>
                ) : null}
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase text-brand-navy/45">Deskripsi</span>
                <input
                  type="text"
                  maxLength={120}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-brand-navy/12 px-3 py-3 text-sm text-brand-navy outline-none focus:border-brand-red/40 focus:ring-2 focus:ring-brand-red/10"
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase text-brand-navy/45">
                  Jatuh tempo (opsional)
                </span>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-brand-navy/12 px-3 py-3 text-sm text-brand-navy outline-none focus:border-brand-red/40 focus:ring-2 focus:ring-brand-red/10"
                />
              </label>

              {formError ? (
                <p className="rounded-lg bg-brand-red-soft px-3 py-2 text-sm text-brand-red">
                  {formError}
                </p>
              ) : null}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeEditor}
                disabled={saving}
                className="rounded-lg border border-brand-navy/12 px-4 py-2.5 text-sm font-bold text-brand-navy hover:bg-brand-bg disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex min-w-28 items-center justify-center gap-2 rounded-lg bg-brand-red px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-red-hover disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                {saving ? "Menyimpan" : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function InvoiceStatus({
  status,
  legacyVerified,
}: {
  status: InvoiceAdminRow["invoice_status"];
  legacyVerified: boolean;
}) {
  const styles = {
    paid: "bg-emerald-50 text-emerald-700",
    issued: "bg-amber-50 text-amber-700",
    cancelled: "bg-brand-red-soft text-brand-red",
    missing: "bg-brand-bg text-brand-navy/45",
  };
  const key = legacyVerified ? "paid" : status ?? "missing";
  const label = legacyVerified
    ? "Akses aktif"
    : status === "paid"
    ? "Lunas"
    : status === "issued"
      ? "Menunggu"
      : status === "cancelled"
        ? "Dibatalkan"
        : "Belum dibuat";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${styles[key]}`}>
      {label}
    </span>
  );
}

function paymentStatusLabel(status: string) {
  if (status === "settlement") return "berhasil";
  if (status === "pending") return "menunggu";
  if (status === "expire") return "kedaluwarsa";
  if (status === "cancel") return "dibatalkan";
  if (status === "deny") return "gagal";
  return status;
}
