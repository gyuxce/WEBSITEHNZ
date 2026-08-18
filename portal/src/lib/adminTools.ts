const ADMIN_TIME_ZONE = "Asia/Jakarta";

const dateKeyFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: ADMIN_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  timeZone: ADMIN_TIME_ZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatAdminDateTime(value: string | null) {
  return value ? dateTimeFormatter.format(new Date(value)) : "-";
}

export function getAdminDateKey(value: string | null) {
  if (!value) return null;
  const parts = Object.fromEntries(
    dateKeyFormatter.formatToParts(new Date(value)).map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function isAdminToday(value: string | null) {
  return getAdminDateKey(value) === getAdminDateKey(new Date().toISOString());
}

export function isWithinAdminDateRange(
  value: string | null,
  fromDate: string,
  toDate: string,
) {
  const key = getAdminDateKey(value);
  if (!key) return false;
  if (fromDate && key < fromDate) return false;
  if (toDate && key > toDate) return false;
  return true;
}

function escapeCsvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function downloadCsv(filename: string, headers: string[], rows: unknown[][]) {
  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\r\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
