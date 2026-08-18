import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Clock, Download, RefreshCw, Search } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { PIMSLEUR_MAX_SCORE } from "../data/pimsleurQuestions";
import {
  downloadCsv,
  formatAdminDateTime,
  isAdminToday,
  isWithinAdminDateRange,
} from "../lib/adminTools";
import { supabase } from "../lib/supabase";
import { isAssessmentStaffRole, isPsychologistRole } from "../lib/access";

type PimsleurRow = {
  user_id: string;
  score_total: number;
  grade: string;
  completed_at: string;
  full_name: string;
  email: string | null;
  whatsapp: string | null;
  city: string | null;
};

type CfitRow = {
  user_id: string;
  raw_total: number | null;
  iq: number | null;
  category: string | null;
  completed_at: string;
  full_name: string;
  email: string | null;
  whatsapp: string | null;
  city: string | null;
};

type PapikostikRow = {
  user_id: string;
  total_all: number | null;
  is_complete_pattern: boolean | null;
  review_status: "pending" | "reviewed";
  completed_at: string;
  full_name: string;
  email: string | null;
  whatsapp: string | null;
  city: string | null;
};

type RecapRow = {
  userId: string;
  fullName: string;
  email: string | null;
  whatsapp: string | null;
  city: string | null;
  pimsleur: PimsleurRow | null;
  cfit: CfitRow | null;
  papikostik: PapikostikRow | null;
};

type RecapFilter = "all" | "today" | "recent" | "complete" | "incomplete";

const FILTER_OPTIONS: Array<{ value: RecapFilter; label: string }> = [
  { value: "all", label: "Semua" },
  { value: "recent", label: "Aktivitas 24 jam" },
  { value: "today", label: "Hari ini" },
  { value: "incomplete", label: "Belum lengkap" },
  { value: "complete", label: "Lengkap" },
];

const isWithinLastHours = (value: string | null, hours: number) => {
  if (!value) return false;
  const elapsed = Date.now() - new Date(value).getTime();
  return elapsed >= 0 && elapsed <= hours * 60 * 60 * 1000;
};

function getCompletedAtValues(row: RecapRow) {
  return [row.pimsleur?.completed_at, row.cfit?.completed_at, row.papikostik?.completed_at].filter(
    (value): value is string => Boolean(value),
  );
}

function getLatestCompletedAt(row: RecapRow) {
  return getCompletedAtValues(row).reduce<string | null>((latest, value) => {
    if (!latest || new Date(value).getTime() > new Date(latest).getTime()) return value;
    return latest;
  }, null);
}

function hasActivityToday(row: RecapRow) {
  return getCompletedAtValues(row).some((value) => isAdminToday(value));
}

function hasRecentActivity(row: RecapRow) {
  return getCompletedAtValues(row).some((value) => isWithinLastHours(value, 24));
}

function isComplete(row: RecapRow) {
  return Boolean(row.pimsleur && row.cfit && row.papikostik);
}

export function AdminRecapPage() {
  const { profile, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<RecapRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<RecapFilter>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const isPsychologist = isPsychologistRole(profile?.role);
  const detailBasePath = isPsychologist ? "/psychologist" : "/admin";

  const loadRows = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError("");

    const [pimsleurResponse, cfitResponse, papikostikResponse] = await Promise.all([
      supabase.rpc("admin_list_pimsleur_results"),
      supabase.rpc("admin_list_cfit_results"),
      supabase.rpc("admin_list_papikostik_results"),
    ]);

    const responseError = pimsleurResponse.error ?? cfitResponse.error ?? papikostikResponse.error;
    if (responseError) {
      setError(responseError.message);
      if (showLoader) setLoading(false);
      return;
    }

    const recapMap = new Map<string, RecapRow>();
    const getRow = (value: {
      user_id: string;
      full_name: string;
      email: string | null;
      whatsapp: string | null;
      city: string | null;
    }) => {
      const existing = recapMap.get(value.user_id);
      if (existing) return existing;

      const newRow: RecapRow = {
        userId: value.user_id,
        fullName: value.full_name || "Peserta",
        email: value.email,
        whatsapp: value.whatsapp,
        city: value.city,
        pimsleur: null,
        cfit: null,
        papikostik: null,
      };
      recapMap.set(value.user_id, newRow);
      return newRow;
    };

    for (const result of (pimsleurResponse.data as PimsleurRow[] | null) ?? []) {
      getRow(result).pimsleur = result;
    }
    for (const result of (cfitResponse.data as CfitRow[] | null) ?? []) {
      getRow(result).cfit = result;
    }
    for (const result of (papikostikResponse.data as PapikostikRow[] | null) ?? []) {
      getRow(result).papikostik = result;
    }

    setRows([...recapMap.values()]);
    setLastUpdatedAt(new Date().toISOString());
    if (showLoader) setLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading || !isAssessmentStaffRole(profile?.role)) return;
    void loadRows();
  }, [authLoading, loadRows, profile?.role]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRows(false);
    setRefreshing(false);
  };

  const handleExport = () => {
    downloadCsv(
      `harunokaze-rekap-asesmen-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        "Nama",
        "Email",
        "WhatsApp",
        "Kota",
        "Pimsleur selesai",
        "CFIT selesai",
        "PAPI selesai",
        "Aktivitas terakhir",
        "Status",
      ],
      filteredRows.map((row) => [
        row.fullName,
        row.email ?? "",
        row.whatsapp ?? "",
        row.city ?? "",
        formatAdminDateTime(row.pimsleur?.completed_at ?? null),
        formatAdminDateTime(row.cfit?.completed_at ?? null),
        formatAdminDateTime(row.papikostik?.completed_at ?? null),
        formatAdminDateTime(getLatestCompletedAt(row)),
        isComplete(row) ? "Lengkap" : "Belum lengkap",
      ]),
    );
  };

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return rows
      .filter((row) => {
        if (filter === "recent") return hasRecentActivity(row);
        if (filter === "today") return hasActivityToday(row);
        if (filter === "complete") return isComplete(row);
        if (filter === "incomplete") return !isComplete(row);
        return true;
      })
      .filter((row) => isWithinAdminDateRange(getLatestCompletedAt(row), fromDate, toDate))
      .filter((row) =>
        [row.fullName, row.email, row.whatsapp, row.city]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalized)),
      )
      .sort((left, right) => {
        const leftDate = getLatestCompletedAt(left);
        const rightDate = getLatestCompletedAt(right);
        return (
          (rightDate ? new Date(rightDate).getTime() : 0) -
          (leftDate ? new Date(leftDate).getTime() : 0)
        );
      });
  }, [filter, fromDate, query, rows, toDate]);

  const completedCount = useMemo(() => rows.filter(isComplete).length, [rows]);
  const activityTodayCount = useMemo(() => rows.filter(hasActivityToday).length, [rows]);
  const recentActivityCount = useMemo(() => rows.filter(hasRecentActivity).length, [rows]);

  if (!authLoading && !isAssessmentStaffRole(profile?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="mx-auto max-w-7xl">
      <Link
        to="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-brand-navy/50 hover:text-brand-red"
      >
        <ArrowLeft size={16} /> Panel staf
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-brand-red">
            {isPsychologist ? "Area psikolog" : "Admin-only"}
          </p>
          <h1 className="font-display text-2xl font-extrabold text-brand-navy">
            Rekap asesmen peserta
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-brand-navy/50">
            Ringkasan Pimsleur, CFIT, dan PAPI Kostick. Waktu diambil dari saat peserta menyelesaikan
            masing-masing tes.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-bold">
          <span className="rounded-full bg-brand-bg px-3 py-2 text-brand-navy/55">
            Peserta {rows.length}
          </span>
          <span className="rounded-full bg-sky-50 px-3 py-2 text-sky-700">
            Aktivitas 24 jam {recentActivityCount}
          </span>
          <span className="rounded-full bg-brand-bg px-3 py-2 text-brand-navy/55">
            Hari ini {activityTodayCount}
          </span>
          <span className="rounded-full bg-emerald-50 px-3 py-2 text-emerald-700">
            Lengkap {completedCount}
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void handleRefresh()}
          disabled={refreshing || loading}
          className="inline-flex items-center gap-2 rounded-lg border border-brand-navy/12 bg-white px-3 py-2 text-xs font-bold text-brand-navy transition-colors hover:border-brand-red/30 hover:text-brand-red disabled:opacity-50"
        >
          <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Memuat" : "Refresh"}
        </button>
        <button
          type="button"
          onClick={handleExport}
          disabled={filteredRows.length === 0}
          className="inline-flex items-center gap-2 rounded-lg border border-brand-navy/12 bg-white px-3 py-2 text-xs font-bold text-brand-navy transition-colors hover:border-brand-red/30 hover:text-brand-red disabled:opacity-50"
        >
          <Download size={15} /> Export CSV
        </button>
        <span className="text-xs text-brand-navy/40">
          {lastUpdatedAt ? `Diperbarui ${formatAdminDateTime(lastUpdatedAt)} WIB` : "Belum dimuat"}
        </span>
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
          placeholder="Cari nama, email, WhatsApp, atau kota"
          className="w-full rounded-xl border border-brand-navy/10 bg-white py-3 pl-10 pr-4 text-sm text-brand-navy outline-none transition focus:border-brand-red/40 focus:ring-2 focus:ring-brand-red/10"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFilter(option.value)}
            className={`rounded-full px-3 py-2 text-xs font-bold transition-colors ${
              filter === option.value
                ? "bg-brand-navy text-white"
                : "bg-white text-brand-navy/55 hover:bg-brand-bg hover:text-brand-navy"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 rounded-xl border border-brand-navy/8 bg-white p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wide text-brand-navy/45">
            Aktivitas tes dari
          </span>
          <input
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-brand-navy/12 px-3 py-2.5 text-sm text-brand-navy outline-none focus:border-brand-red/40 focus:ring-2 focus:ring-brand-red/10"
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wide text-brand-navy/45">
            Aktivitas tes sampai
          </span>
          <input
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-brand-navy/12 px-3 py-2.5 text-sm text-brand-navy outline-none focus:border-brand-red/40 focus:ring-2 focus:ring-brand-red/10"
          />
        </label>
        <button
          type="button"
          onClick={() => {
            setFromDate("");
            setToDate("");
          }}
          disabled={!fromDate && !toDate}
          className="rounded-lg border border-brand-navy/12 px-3 py-2.5 text-xs font-bold text-brand-navy/65 hover:bg-brand-bg disabled:opacity-40"
        >
          Hapus tanggal
        </button>
      </div>

      {loading || authLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-red border-t-transparent" />
        </div>
      ) : error ? (
        <div className="mt-6 space-y-2">
          <p className="text-sm text-brand-red">{error}</p>
          <p className="text-xs text-brand-navy/50">
            Pastikan migration admin Pimsleur, CFIT, dan PAPI Kostick sudah dijalankan di Supabase.
          </p>
        </div>
      ) : rows.length === 0 ? (
        <p className="mt-6 text-sm text-brand-navy/50">Belum ada hasil asesmen peserta.</p>
      ) : filteredRows.length === 0 ? (
        <p className="mt-6 text-sm text-brand-navy/50">
          Tidak ada peserta yang sesuai dengan pencarian atau filter ini.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-brand-navy/8 bg-white">
          <table className="min-w-[1160px] w-full text-left text-sm">
            <thead className="border-b border-brand-navy/8 bg-brand-bg text-xs uppercase tracking-wide text-brand-navy/45">
              <tr>
                <th className="px-4 py-3 font-bold">Peserta</th>
                <th className="px-4 py-3 font-bold">Aktivitas terakhir</th>
                <th className="px-4 py-3 font-bold">Pimsleur</th>
                <th className="px-4 py-3 font-bold">CFIT</th>
                <th className="px-4 py-3 font-bold">PAPI Kostick</th>
                <th className="px-4 py-3 font-bold">Detail</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr
                  key={row.userId}
                  className={`border-b border-brand-navy/5 align-top last:border-0 ${
                    isWithinLastHours(getLatestCompletedAt(row), 1) ? "bg-sky-50/60" : ""
                  }`}
                >
                  <td className="px-4 py-4">
                    <p className="font-semibold text-brand-navy">{row.fullName}</p>
                    <div className="mt-1 space-y-0.5 text-xs leading-relaxed text-brand-navy/45">
                      <p className="break-all">{row.email ?? "Email belum tersedia"}</p>
                      <p>WhatsApp: {row.whatsapp ?? "-"}</p>
                      <p>Kota: {row.city ?? "-"}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {isWithinLastHours(getLatestCompletedAt(row), 1) ? (
                      <span className="inline-flex rounded-full bg-sky-100 px-2 py-1 text-[11px] font-bold text-sky-700">
                        Baru selesai
                      </span>
                    ) : null}
                    <CompletionTime value={getLatestCompletedAt(row)} />
                  </td>
                  <td className="px-4 py-4">
                    <Status done={Boolean(row.pimsleur)} />
                    {row.pimsleur ? (
                      <>
                        <p className="mt-2 text-xs text-brand-navy/65">
                          {row.pimsleur.score_total}/{PIMSLEUR_MAX_SCORE} - Grade {row.pimsleur.grade}
                        </p>
                        <CompletionTime value={row.pimsleur.completed_at} />
                      </>
                    ) : null}
                  </td>
                  <td className="px-4 py-4">
                    <Status done={Boolean(row.cfit)} />
                    {row.cfit ? (
                      <>
                        <p className="mt-2 text-xs text-brand-navy/65">
                          Raw {row.cfit.raw_total ?? "-"}/50 - IQ {row.cfit.iq ?? "-"}
                          <br />
                          {row.cfit.category ?? "Kategori belum tersedia"}
                        </p>
                        <CompletionTime value={row.cfit.completed_at} />
                      </>
                    ) : null}
                  </td>
                  <td className="px-4 py-4">
                    <Status done={Boolean(row.papikostik)} />
                    {row.papikostik ? (
                      <>
                        <p className="mt-2 text-xs text-brand-navy/65">
                          {row.papikostik.total_all ?? 0}/90 - {" "}
                          {row.papikostik.review_status === "reviewed"
                            ? "Reviewed"
                            : "Menunggu review"}
                        </p>
                        <CompletionTime value={row.papikostik.completed_at} />
                      </>
                    ) : null}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col items-start gap-1.5 text-xs font-bold">
                      <DetailLink
                        href={row.pimsleur ? `${detailBasePath}/pimsleur/${row.userId}` : null}
                        label="Pimsleur"
                      />
                      <DetailLink href={row.cfit ? `${detailBasePath}/cfit/${row.userId}` : null} label="CFIT" />
                      <DetailLink
                        href={row.papikostik ? `${detailBasePath}/papikostik/${row.userId}` : null}
                        label="PAPI"
                      />
                      {!isPsychologist ? (
                        <DetailLink
                          href={isComplete(row) ? `/admin/review/${row.userId}` : null}
                          label="Review final"
                        />
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CompletionTime({ value }: { value: string | null }) {
  if (!value) return null;

  return (
    <p className="mt-2 inline-flex items-start gap-1 text-[11px] leading-relaxed text-brand-navy/45">
      <Clock size={12} className="mt-0.5 shrink-0" />
      {formatAdminDateTime(value)}
    </p>
  );
}

function Status({ done }: { done: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
        done ? "bg-emerald-50 text-emerald-700" : "bg-brand-bg text-brand-navy/45"
      }`}
    >
      {done ? "Selesai" : "Belum selesai"}
    </span>
  );
}

function DetailLink({ href, label }: { href: string | null; label: string }) {
  if (!href) return <span className="text-brand-navy/25">{label}</span>;
  return (
    <Link to={href} className="text-brand-red hover:underline">
      {label}
    </Link>
  );
}
