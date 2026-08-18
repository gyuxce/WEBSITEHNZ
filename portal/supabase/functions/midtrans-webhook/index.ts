import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

type PaymentRow = {
  id: string;
  user_id: string;
  invoice_id: string | null;
  amount: number;
  currency: string;
  status: string;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function mapPaymentStatus(transactionStatus: unknown, fraudStatus: unknown) {
  if (transactionStatus === "settlement") return "settlement";
  if (transactionStatus === "capture" && (!fraudStatus || fraudStatus === "accept")) {
    return "settlement";
  }
  if (transactionStatus === "expire") return "expire";
  if (transactionStatus === "cancel" || transactionStatus === "deny") return transactionStatus;
  return "pending";
}

serve(async (req) => {
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const serverKey = Deno.env.get("MIDTRANS_SERVER_KEY") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!serverKey || !supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: "Webhook belum dikonfigurasi" }, 500);
    }

    const payload = await req.json();
    const orderId = typeof payload?.order_id === "string" ? payload.order_id : "";
    const statusCode = String(payload?.status_code ?? "");
    const grossAmount = String(payload?.gross_amount ?? "");
    const signatureKey = typeof payload?.signature_key === "string" ? payload.signature_key : "";
    if (!orderId || !statusCode || !grossAmount || !signatureKey) {
      return jsonResponse({ error: "Payload Midtrans tidak lengkap" }, 400);
    }

    const signatureInput = `${orderId}${statusCode}${grossAmount}${serverKey}`;
    const hashBuffer = await crypto.subtle.digest(
      "SHA-512",
      new TextEncoder().encode(signatureInput),
    );
    const expectedSignature = Array.from(new Uint8Array(hashBuffer))
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("");
    if (expectedSignature !== signatureKey) {
      return jsonResponse({ error: "Invalid signature" }, 403);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const { data: paymentData, error: paymentError } = await supabaseAdmin
      .from("payments")
      .select("id,user_id,invoice_id,amount,currency,status")
      .eq("order_id", orderId)
      .eq("provider", "midtrans")
      .maybeSingle();
    if (paymentError) return jsonResponse({ error: paymentError.message }, 500);

    const payment = paymentData as PaymentRow | null;
    if (!payment) return jsonResponse({ error: "Payment record not found" }, 404);

    const providerAmount = Number(grossAmount);
    const paymentStatus = mapPaymentStatus(payload?.transaction_status, payload?.fraud_status);
    if (paymentStatus === "settlement") {
      if (
        payment.invoice_id === null ||
        !Number.isInteger(providerAmount) ||
        providerAmount !== payment.amount ||
        payment.currency !== "IDR"
      ) {
        await supabaseAdmin
          .from("payments")
          .update({ status: "deny", raw_payload: payload })
          .eq("id", payment.id);
        return jsonResponse({ error: "Payment amount, currency, or invoice does not match" }, 409);
      }

      const { data: invoice, error: invoiceError } = await supabaseAdmin
        .from("assessment_invoices")
        .select("id,user_id,amount,currency,status")
        .eq("id", payment.invoice_id)
        .maybeSingle();
      if (invoiceError) return jsonResponse({ error: invoiceError.message }, 500);
      if (
        !invoice ||
        invoice.user_id !== payment.user_id ||
        invoice.amount !== payment.amount ||
        invoice.currency !== payment.currency ||
        invoice.status === "cancelled"
      ) {
        await supabaseAdmin
          .from("payments")
          .update({ status: "deny", raw_payload: payload })
          .eq("id", payment.id);
        return jsonResponse({ error: "Invoice payment mismatch" }, 409);
      }
    }

    if (payment.status === "settlement") {
      return jsonResponse({ ok: true, status: "settlement", ignored: true });
    }
    if (paymentStatus === "pending" && payment.status !== "pending") {
      return jsonResponse({ ok: true, status: payment.status, ignored: true });
    }

    const { error: updateError } = await supabaseAdmin
      .from("payments")
      .update({
        status: paymentStatus,
        midtrans_transaction_id: payload?.transaction_id ?? null,
        raw_payload: payload,
      })
      .eq("id", payment.id);
    if (updateError) return jsonResponse({ error: updateError.message }, 500);

    return jsonResponse({ ok: true, status: paymentStatus });
  } catch (error) {
    console.error("midtrans-webhook error:", error);
    return jsonResponse({ error: "Webhook payment gagal diproses" }, 500);
  }
});
