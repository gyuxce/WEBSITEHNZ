/** App config + typed API fetch (Neon / Better Auth backend). */

export const PEMETAAN_PRICE = Number(import.meta.env.VITE_PEMETAAN_PRICE ?? 150000);
export const LANDING_URL = import.meta.env.VITE_LANDING_URL ?? "https://www.harunokaze.id";
export const MIDTRANS_CLIENT_KEY = import.meta.env.VITE_MIDTRANS_CLIENT_KEY ?? "";

export const isApiConfigured = Boolean(
  import.meta.env.VITE_API_READY !== "false",
);

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new ApiError(data.error || res.statusText || "Request failed", res.status);
  }
  return data;
}
