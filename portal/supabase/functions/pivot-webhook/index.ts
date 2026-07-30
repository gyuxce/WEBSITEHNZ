import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function getStringAtKeys(value: unknown, keys: string[]): string | null {
  if (!value || typeof value !== "object") return null;
  const object = value as Record<string, unknown>;
  for (const key of keys) {
    if (typeof object[key] === "string" && object[key]) return object[key] as string;
  }
  for (const child of Object.values(object)) {
    const found = getStringAtKeys(child, keys);
    if (found) return found;
  }
  return null;
}

function mapPaymentStatus(payload: unknown) {
  const status = (
    getStringAtKeys(payload, [
      "status",
      "paymentStatus",
      "payment_status",
      "transactionStatus",
      "transaction_status",
      "event",
      "eventType",
    ]) ?? ""
  ).toUpperCase();

  if (
    ["SUCCESS", "SUCCEEDED", "SETTLED", "COMPLETED", "PAID", "CAPTURED", "CONFIRMED"].some(
      (value) => status.includes(value),
    )
  ) {
    return "settlement";
  }
  if (status.includes("EXPIRE")) return "expire";
  if (status.includes("CANCEL")) return "cancel";
  if (["FAIL", "DENY", "REJECT"].some((value) => status.includes(value))) return "deny";
  return "pending";
}

serve(async (req) => {
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const callbackApiKey = Deno.env.get("PIVOT_CALLBACK_API_KEY");
    const receivedApiKey =
      req.headers.get("X-API-Key") ??
      req.headers.get("X-CALLBACK-API-KEY") ??
      req.headers.get("Callback-API-Key");
    if (!callbackApiKey || receivedApiKey !== callbackApiKey) {
      return jsonResponse({ error: "Invalid callback key" }, 403);
    }

    const payload = await req.json();
    const orderId = getStringAtKeys(payload, [
      "clientReferenceId",
      "client_reference_id",
      "orderId",
      "order_id",
      "merchantOrderId",
      "merchant_order_id",
    ]);
    if (!orderId) return jsonResponse({ error: "Missing client reference" }, 400);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const paymentStatus = mapPaymentStatus(payload);
    const providerReferenceId = getStringAtKeys(payload, [
      "id",
      "paymentSessionId",
      "payment_session_id",
      "paymentId",
      "payment_id",
      "transactionId",
      "transaction_id",
    ]);

    const { error } = await supabaseAdmin
      .from("payments")
      .update({
        status: paymentStatus,
        provider: "pivot",
        provider_reference_id: providerReferenceId,
        raw_payload: payload,
      })
      .eq("order_id", orderId);
    if (error) return jsonResponse({ error: error.message }, 500);

    return jsonResponse({ ok: true });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unknown error" },
      500,
    );
  }
});
