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
  {
    auth: {
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  },
);

export const isSupabaseConfigured =
  Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes("your-project"));

const rawPrice = import.meta.env.VITE_PEMETAAN_PRICE;
export const PEMETAAN_PRICE = Number.isFinite(Number(rawPrice)) && Number(rawPrice) > 0
  ? Number(rawPrice)
  : 150000;
export const LANDING_URL = import.meta.env.VITE_LANDING_URL ?? "https://www.harunokaze.id";
