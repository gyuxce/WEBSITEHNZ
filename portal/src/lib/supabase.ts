import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase env belum diset. Copy portal/.env.example ke portal/.env dan isi VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY.",
  );
}

export const supabase = createClient<Database>(
  supabaseUrl ?? "https://placeholder.supabase.co",
  supabaseAnonKey ?? "placeholder",
);

export const isSupabaseConfigured =
  Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes("your-project"));

export const PEMETAAN_PRICE = Number(import.meta.env.VITE_PEMETAAN_PRICE ?? 150000);
export const LANDING_URL = import.meta.env.VITE_LANDING_URL ?? "http://localhost:5173";
export const MIDTRANS_CLIENT_KEY = import.meta.env.VITE_MIDTRANS_CLIENT_KEY ?? "";
