import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_BASE_URL = "https://api.pivot-payment.com";
const ACTIVE_SESSION_MINUTES = 15;

type Invoice = {
  id: string;
  user_id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  description: string;
  status: "issued" | "paid" | "cancelled";
  due_date: string | null;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
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

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    givenName: parts[0] ?? "Peserta",
    surname: parts.slice(1).join(" ") || "Harunokaze",
  };
}

function isProductionBaseUrl(baseUrl: string) {
  try {
    return new URL(baseUrl).hostname.toLowerCase() === "api.pivot-payment.com";
  } catch {
    return false;
  }
}

function isStagingPaymentUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return url.protocol !== "https:" || host.includes("-stg") || host.includes("staging");
  } catch {
    return true;
  }
}

function currentJakartaDate() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

async function readResponsePayload(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function getAccessToken(baseUrl: string, clientId: string, clientSecret: string) {
  const response = await fetch(`${baseUrl}/v1/access-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-MERCHANT-ID": clientId,
      "X-MERCHANT-SECRET": clientSecret,
    },
    body: JSON.stringify({ grantType: "client_credentials" }),
  });
  const payload = await readResponsePayload(response);
  if (!response.ok) {
    throw new Error(`Autentikasi Pivot gagal: ${JSON.stringify(payload)}`);
  }

  const token = getStringAtKeys(payload, ["accessToken", "access_token", "token"]);
  if (!token) throw new Error("Pivot tidak mengembalikan access token");
  return token;
}

async function getRedirectUrl(baseUrl: string, token: string, paymentResponse: unknown) {
  const directUrl = getStringAtKeys(paymentResponse, [
    "redirectUrl",
    "redirectURL",
    "paymentUrl",
    "paymentURL",
  ]);
  if (directUrl) return directUrl;

  const paymentId = getStringAtKeys(paymentResponse, [
    "id",
    "paymentSessionId",
    "payment_session_id",
    "paymentId",
    "payment_id",
  ]);
  if (!paymentId) return null;

  const detailResponse = await fetch(`${baseUrl}/v2/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  const detailPayload = await readResponsePayload(detailResponse);
  if (!detailResponse.ok) return null;
  return getStringAtKeys(detailPayload, [
    "redirectUrl",
    "redirectURL",
    "paymentUrl",
    "paymentURL",
  ]);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseUser = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );
    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();
    if (userError || !user) return jsonResponse({ error: "Unauthorized" }, 401);
    if (!user.email) return jsonResponse({ error: "Email akun peserta tidak tersedia" }, 400);

    const baseUrl = (Deno.env.get("PIVOT_BASE_URL") || DEFAULT_BASE_URL).replace(/\/$/, "");
    const clientId = Deno.env.get("PIVOT_CLIENT_ID");
    const clientSecret = Deno.env.get("PIVOT_CLIENT_SECRET");
    const successUrl = Deno.env.get("PIVOT_SUCCESS_URL");
    const failureUrl = Deno.env.get("PIVOT_FAILURE_URL");
    const expirationUrl = Deno.env.get("PIVOT_EXPIRATION_URL");

    if (
      !supabaseUrl ||
      !serviceRoleKey ||
      !clientId ||
      !clientSecret ||
      !successUrl ||
      !failureUrl ||
      !expirationUrl
    ) {
      return jsonResponse({ error: "Konfigurasi server pembayaran belum lengkap" }, 500);
    }
    if (!isProductionBaseUrl(baseUrl)) {
      return jsonResponse(
        { error: "PIVOT_BASE_URL masih bukan endpoint production Pivot" },
        500,
      );
    }

    let body: { invoice_id?: unknown } = {};
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invoice wajib dipilih" }, 400);
    }
    const invoiceId = typeof body.invoice_id === "string" ? body.invoice_id.trim() : "";
    if (!invoiceId) return jsonResponse({ error: "Invoice wajib dipilih" }, 400);

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const { data: invoiceData, error: invoiceError } = await supabaseAdmin
      .from("assessment_invoices")
      .select("id,user_id,invoice_number,amount,currency,description,status,due_date")
      .eq("id", invoiceId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (invoiceError) return jsonResponse({ error: invoiceError.message }, 500);
    const invoice = invoiceData as Invoice | null;
    if (!invoice) return jsonResponse({ error: "Tagihan peserta tidak ditemukan" }, 404);
    if (invoice.status === "paid") {
      return jsonResponse({ error: "Tagihan ini sudah lunas" }, 409);
    }
    if (invoice.status !== "issued") {
      return jsonResponse({ error: "Tagihan ini sudah tidak aktif" }, 409);
    }
    if (invoice.due_date && invoice.due_date < currentJakartaDate()) {
      return jsonResponse({ error: "Tagihan sudah melewati tanggal jatuh tempo" }, 409);
    }
    if (
      !Number.isInteger(invoice.amount) ||
      invoice.amount < 1000 ||
      invoice.amount > 100000000 ||
      invoice.currency !== "IDR"
    ) {
      console.error("pivot-create invoice mismatch", {
        invoiceId: invoice.id,
        amount: invoice.amount,
        currency: invoice.currency,
      });
      return jsonResponse({ error: "Nominal atau mata uang tagihan tidak valid" }, 500);
    }

    const activeSince = new Date(Date.now() - ACTIVE_SESSION_MINUTES * 60_000).toISOString();
    const { error: expireError } = await supabaseAdmin
      .from("payments")
      .update({ status: "expire" })
      .eq("invoice_id", invoice.id)
      .eq("status", "pending")
      .lt("created_at", activeSince);
    if (expireError) return jsonResponse({ error: expireError.message }, 500);

    const { data: activePayment, error: activePaymentError } = await supabaseAdmin
      .from("payments")
      .select("id,order_id,amount,currency,payment_url")
      .eq("invoice_id", invoice.id)
      .eq("status", "pending")
      .not("payment_url", "is", null)
      .gte("created_at", activeSince)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (activePaymentError) return jsonResponse({ error: activePaymentError.message }, 500);

    if (activePayment?.payment_url) {
      const sessionMatchesInvoice =
        activePayment.amount === invoice.amount && activePayment.currency === invoice.currency;
      if (sessionMatchesInvoice && !isStagingPaymentUrl(activePayment.payment_url)) {
        return jsonResponse({
          redirect_url: activePayment.payment_url,
          order_id: activePayment.order_id,
          invoice_number: invoice.invoice_number,
        });
      }

      const { error: cancelError } = await supabaseAdmin
        .from("payments")
        .update({ status: "cancel" })
        .eq("id", activePayment.id);
      if (cancelError) return jsonResponse({ error: cancelError.message }, 500);
    }

    const [{ data: profile }, token] = await Promise.all([
      supabaseAdmin.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
      getAccessToken(baseUrl, clientId, clientSecret),
    ]);
    const fullName = String(profile?.full_name || user.user_metadata?.full_name || "Peserta");
    const name = splitName(fullName);
    const orderId = `${invoice.invoice_number}-${Date.now()}`;

    const { error: insertError } = await supabaseAdmin.from("payments").insert({
      user_id: user.id,
      invoice_id: invoice.id,
      order_id: orderId,
      amount: invoice.amount,
      currency: invoice.currency,
      status: "pending",
      payment_type: "pemetaan",
      provider: "pivot",
    });
    if (insertError?.code === "23505") {
      return jsonResponse(
        { error: "Sesi pembayaran sedang dibuat. Tunggu beberapa detik lalu coba lagi." },
        409,
      );
    }
    if (insertError) return jsonResponse({ error: insertError.message }, 500);

    const requestBody = {
      clientReferenceId: orderId,
      amount: { value: invoice.amount, currency: invoice.currency },
      paymentType: "SINGLE",
      mode: "REDIRECT",
      redirectUrl: {
        successReturnUrl: successUrl,
        failureReturnUrl: failureUrl,
        expirationReturnUrl: expirationUrl,
      },
      customer: {
        givenName: name.givenName,
        surname: name.surname,
        email: user.email,
      },
      orderInformation: {
        productDetails: [
          {
            type: "SERVICE",
            category: "SERVICE",
            subCategory: "ASSESSMENT",
            name: invoice.description,
            description: "Akses rangkaian tes pemetaan potensi",
            quantity: 1,
            price: { value: invoice.amount, currency: invoice.currency },
          },
        ],
      },
    };

    let paymentResponse: Response;
    try {
      paymentResponse = await fetch(`${baseUrl}/v2/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "X-REQUEST-ID": orderId,
        },
        body: JSON.stringify(requestBody),
      });
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Network error";
      await supabaseAdmin
        .from("payments")
        .update({ status: "deny", raw_payload: { error: message } })
        .eq("order_id", orderId);
      return jsonResponse({ error: "Tidak dapat terhubung ke Pivot. Silakan coba lagi." }, 502);
    }
    const paymentPayload = await readResponsePayload(paymentResponse);

    if (!paymentResponse.ok) {
      console.error("pivot-create rejected:", JSON.stringify(paymentPayload));
      await supabaseAdmin
        .from("payments")
        .update({ status: "deny", raw_payload: paymentPayload })
        .eq("order_id", orderId);
      const providerMessage = getStringAtKeys(paymentPayload, [
        "message",
        "errorMessage",
        "error_message",
        "description",
      ]);
      return jsonResponse(
        { error: providerMessage ? `Pivot menolak pembayaran: ${providerMessage}` : "Pivot menolak pembayaran" },
        400,
      );
    }

    const redirectUrl = await getRedirectUrl(baseUrl, token, paymentPayload);
    const providerReferenceId = getStringAtKeys(paymentPayload, [
      "id",
      "paymentSessionId",
      "payment_session_id",
      "paymentId",
      "payment_id",
    ]);
    if (!redirectUrl || isStagingPaymentUrl(redirectUrl)) {
      await supabaseAdmin
        .from("payments")
        .update({
          status: "deny",
          provider_reference_id: providerReferenceId,
          raw_payload: paymentPayload,
        })
        .eq("order_id", orderId);
      return jsonResponse(
        {
          error: redirectUrl
            ? "Pivot masih mengembalikan URL sandbox; periksa kembali secret production"
            : "Pivot tidak mengembalikan URL pembayaran",
        },
        502,
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("payments")
      .update({
        provider_reference_id: providerReferenceId,
        payment_url: redirectUrl,
        raw_payload: paymentPayload,
      })
      .eq("order_id", orderId);
    if (updateError) return jsonResponse({ error: updateError.message }, 500);

    return jsonResponse({
      redirect_url: redirectUrl,
      order_id: orderId,
      invoice_number: invoice.invoice_number,
    });
  } catch (error) {
    console.error("pivot-create error:", error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unknown error" },
      500,
    );
  }
});
