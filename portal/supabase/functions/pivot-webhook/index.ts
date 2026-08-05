import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type PaymentRow = {
  id: string;
  user_id: string;
  invoice_id: string | null;
  amount: number;
  currency: string;
  status: string;
  provider_reference_id: string | null;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
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
    [
      "SUCCESS",
      "SUCCEEDED",
      "SETTLED",
      "COMPLETED",
      "PAID",
      "CAPTURED",
      "CONFIRMED",
      "AUTHORISED",
      "AUTHORIZED",
    ].some((value) => status.includes(value))
  ) {
    return "settlement";
  }
  if (status.includes("EXPIRE")) return "expire";
  if (status.includes("CANCEL")) return "cancel";
  if (["FAIL", "DENY", "REJECT"].some((value) => status.includes(value))) return "deny";
  return "pending";
}

function getCallbackAmount(payload: unknown) {
  if (!isRecord(payload)) return null;
  const data = isRecord(payload.data) ? payload.data : payload;
  if (!isRecord(data.amount)) return null;

  const value = Number(data.amount.value);
  const currency = typeof data.amount.currency === "string"
    ? data.amount.currency.toUpperCase()
    : "";
  if (!Number.isInteger(value) || value <= 0 || !currency) return null;
  return { value, currency };
}

serve(async (req) => {
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const callbackApiKey = Deno.env.get("PIVOT_CALLBACK_API_KEY");
    const authorization = req.headers.get("Authorization");
    const receivedApiKey =
      req.headers.get("X-API-Key") ??
      req.headers.get("X-CALLBACK-API-KEY") ??
      req.headers.get("Callback-API-Key") ??
      req.headers.get("X-CALLBACK-KEY") ??
      req.headers.get("X-PIVOT-CALLBACK-KEY") ??
      (authorization?.startsWith("Bearer ") ? authorization.slice(7) : null);
    if (!callbackApiKey || receivedApiKey !== callbackApiKey) {
      return jsonResponse({ error: "Invalid callback key" }, 403);
    }

    const payload: unknown = await req.json();
    console.log("pivot-webhook payload:", JSON.stringify(payload));

    const orderId = getStringAtKeys(payload, [
      "clientReferenceId",
      "client_reference_id",
      "orderId",
      "order_id",
      "merchantOrderId",
      "merchant_order_id",
      "requestId",
      "request_id",
    ]);
    const providerReferenceId = getStringAtKeys(payload, [
      "id",
      "paymentSessionId",
      "payment_session_id",
      "paymentId",
      "payment_id",
      "transactionId",
      "transaction_id",
    ]);

    if (!orderId && !providerReferenceId) {
      console.error("pivot-webhook: missing payment reference");
      return jsonResponse({ error: "Missing payment reference" }, 400);
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    let payment: PaymentRow | null = null;
    let lookupError: { message: string } | null = null;
    const selectFields =
      "id,user_id,invoice_id,amount,currency,status,provider_reference_id";

    if (orderId) {
      const response = await supabaseAdmin
        .from("payments")
        .select(selectFields)
        .eq("order_id", orderId)
        .maybeSingle();
      payment = response.data as PaymentRow | null;
      lookupError = response.error;
    }

    if (!payment && !lookupError && providerReferenceId) {
      const response = await supabaseAdmin
        .from("payments")
        .select(selectFields)
        .eq("provider", "pivot")
        .eq("provider_reference_id", providerReferenceId)
        .maybeSingle();
      payment = response.data as PaymentRow | null;
      lookupError = response.error;
    }

    if (lookupError) {
      console.error("pivot-webhook lookup failed:", lookupError.message);
      return jsonResponse({ error: lookupError.message }, 500);
    }
    if (!payment) {
      console.error("pivot-webhook: payment record not found", { orderId, providerReferenceId });
      return jsonResponse({ error: "Payment record not found" }, 404);
    }

    const paymentStatus = mapPaymentStatus(payload);
    const callbackAmount = getCallbackAmount(payload);

    // A paid invoice is final; acknowledge duplicate or late events without changing it.
    if (payment.status === "settlement") {
      return jsonResponse({ ok: true, status: "settlement", ignored: true });
    }
    if (paymentStatus === "pending" && payment.status !== "pending") {
      return jsonResponse({ ok: true, status: payment.status, ignored: true });
    }

    if (paymentStatus === "settlement") {
      const amountMatches = callbackAmount?.value === payment.amount;
      const currencyMatches = callbackAmount?.currency === payment.currency;
      if (!payment.invoice_id || !amountMatches || !currencyMatches) {
        console.error("pivot-webhook settlement mismatch", {
          paymentId: payment.id,
          expectedAmount: payment.amount,
          expectedCurrency: payment.currency,
          callbackAmount,
        });

        if (payment.status !== "settlement") {
          await supabaseAdmin
            .from("payments")
            .update({
              status: "deny",
              provider_reference_id: providerReferenceId ?? payment.provider_reference_id,
              raw_payload: payload,
            })
            .eq("id", payment.id);
        }
        return jsonResponse({ error: "Payment amount, currency, or invoice does not match" }, 409);
      }
    }

    const { error: updateError } = await supabaseAdmin
      .from("payments")
      .update({
        status: paymentStatus,
        provider: "pivot",
        provider_reference_id: providerReferenceId ?? payment.provider_reference_id,
        raw_payload: payload,
      })
      .eq("id", payment.id);

    if (updateError) {
      console.error("pivot-webhook update failed:", updateError.message);
      return jsonResponse({ error: updateError.message }, 500);
    }

    return jsonResponse({ ok: true, status: paymentStatus });
  } catch (error) {
    console.error("pivot-webhook error:", error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unknown error" },
      500,
    );
  }
});
