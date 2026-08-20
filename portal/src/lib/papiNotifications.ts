import { supabase } from "./supabase";

type NotifyOptions = {
  backfill?: boolean;
  test?: boolean;
};

function functionErrorMessage(error: { message: string } | null, data: unknown) {
  if (data && typeof data === "object" && "error" in data && typeof data.error === "string") {
    return data.error;
  }
  return error?.message ?? "Gagal mengirim notifikasi PAPI.";
}

/** Ask the server to email psychologists about a completed PAPI Kostick. */
export async function notifyPapikostikCompleted(
  options?: NotifyOptions,
): Promise<{ ok: boolean; message: string }> {
  const { data, error } = await supabase.functions.invoke("notify-papikostik-completed", {
    body: {
      backfill: Boolean(options?.backfill),
      test: Boolean(options?.test),
    },
  });
  if (error) {
    const message = functionErrorMessage(error, data);
    console.error("PAPI psychologist notification failed:", message);
    return { ok: false, message };
  }
  if (data && typeof data === "object" && "error" in data && typeof data.error === "string") {
    return { ok: false, message: data.error };
  }
  if (options?.test && data && typeof data === "object" && "to" in data && Array.isArray(data.to)) {
    return { ok: true, message: `Email tes terkirim ke ${data.to.join(", ")}.` };
  }
  return { ok: true, message: "Notifikasi diproses." };
}
