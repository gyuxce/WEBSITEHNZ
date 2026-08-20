import { supabase } from "./supabase";

/** Ask the server to email psychologists about a completed PAPI Kostick. */
export async function notifyPapikostikCompleted(options?: {
  backfill?: boolean;
}): Promise<void> {
  const { error } = await supabase.functions.invoke("notify-papikostik-completed", {
    body: { backfill: Boolean(options?.backfill) },
  });
  if (error) {
    console.error("PAPI psychologist notification failed:", error.message);
  }
}
