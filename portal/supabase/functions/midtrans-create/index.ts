import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FIXED_ASSESSMENT_AMOUNT = 99000;

type Invoice = {
  id: string;
  user_id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  description: string;
  status: "issued" | "paid" | "cancelled";
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!authHeader || !supabaseUrl || !anonKey || !serviceRoleKey) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();
    if (userError || !user) return jsonResponse({ error: "Unauthorized" }, 401);
    if (!user.email) return jsonResponse({ error: "Email akun peserta tidak tersedia" }, 400);

    let body: { invoice_id?: unknown } = {};
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invoice wajib dipilih" }, 400);
    }
    const invoiceId = typeof body.invoice_id === "string" ? body.invoice_id.trim() : "";
    if (!invoiceId) return jsonResponse({ error: "Invoice wajib dipilih" }, 400);

    const serverKey = Deno.env.get("MIDTRANS_SERVER_KEY");
    if (!serverKey) return jsonResponse({ error: "MIDTRANS_SERVER_KEY belum dikonfigurasi" }, 500);

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const { data: invoiceData, error: invoiceError } = await supabaseAdmin
      .from("assessment_invoices")
      .select("id,user_id,invoice_number,amount,currency,description,status")
      .eq("id", invoiceId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (invoiceError) return jsonResponse({ error: invoiceError.message }, 500);

    const invoice = invoiceData as Invoice | null;
    if (!invoice) return jsonResponse({ error: "Tagihan peserta tidak ditemukan" }, 404);
    if (invoice.status === "paid") return jsonResponse({ error: "Tagihan ini sudah lunas" }, 409);
    if (invoice.status !== "issued") return jsonResponse({ error: "Tagihan ini sudah tidak aktif" }, 409);
    if (invoice.amount !== FIXED_ASSESSMENT_AMOUNT || invoice.currency !== "IDR") {
      return jsonResponse({ error: "Nominal tagihan tidak sesuai konfigurasi" }, 500);
    }

    const { data: activePayment, error: activePaymentError } = await supabaseAdmin
      .from("payments")
      .select("id,order_id")
      .eq("invoice_id", invoice.id)
      .eq("user_id", user.id)
      .eq("provider", "midtrans")
      .eq("status", "pending")
      .maybeSingle();
    if (activePaymentError) return jsonResponse({ error: activePaymentError.message }, 500);
    if (activePayment) {
      return jsonResponse(
        { error: "Sesi pembayaran masih aktif. Selesaikan atau tunggu sampai kedaluwarsa." },
        409,
      );
    }

    const orderId = `${invoice.invoice_number}-${Date.now()}`;
    const { error: insertError } = await supabaseAdmin.from("payments").insert({
      user_id: user.id,
      invoice_id: invoice.id,
      order_id: orderId,
      amount: invoice.amount,
      currency: invoice.currency,
      status: "pending",
      payment_type: "pemetaan",
      provider: "midtrans",
    });
    if (insertError) {
      if (insertError.code === "23505") {
        return jsonResponse({ error: "Sesi pembayaran sedang dibuat. Coba lagi sebentar." }, 409);
      }
      return jsonResponse({ error: insertError.message }, 500);
    }

    const isProduction = Deno.env.get("MIDTRANS_IS_PRODUCTION") === "true";
    const midtransUrl = isProduction
      ? "https://app.midtrans.com/snap/v1/transactions"
      : "https://app.sandbox.midtrans.com/snap/v1/transactions";

    let midtransResponse: Response;
    try {
      midtransResponse = await fetch(midtransUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${btoa(serverKey + ":")}`,
        },
        body: JSON.stringify({
          transaction_details: {
            order_id: orderId,
            gross_amount: invoice.amount,
          },
          customer_details: { email: user.email },
          item_details: [
            {
              id: "pemetaan",
              price: invoice.amount,
              quantity: 1,
              name: invoice.description,
            },
          ],
        }),
      });
    } catch {
      await supabaseAdmin.from("payments").update({ status: "deny" }).eq("order_id", orderId);
      return jsonResponse({ error: "Tidak dapat terhubung ke Midtrans" }, 502);
    }

    const midtransData = await midtransResponse.json();
    if (!midtransResponse.ok || typeof midtransData.token !== "string") {
      await supabaseAdmin
        .from("payments")
        .update({ status: "deny", raw_payload: midtransData })
        .eq("order_id", orderId);
      return jsonResponse({ error: "Midtrans menolak pembuatan pembayaran" }, 400);
    }

    await supabaseAdmin
      .from("payments")
      .update({ raw_payload: midtransData })
      .eq("order_id", orderId);

    return jsonResponse({ token: midtransData.token, order_id: orderId });
  } catch (error) {
    console.error("midtrans-create error:", error);
    return jsonResponse({ error: "Terjadi kesalahan saat membuat pembayaran" }, 500);
  }
});
