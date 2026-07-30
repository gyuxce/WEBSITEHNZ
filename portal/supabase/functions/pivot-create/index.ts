import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_BASE_URL = "https://api-stg.pivot-payment.com";

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
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`Pivot auth gagal: ${JSON.stringify(payload)}`);
  }

  const token = getStringAtKeys(payload, ["accessToken", "access_token", "token"]);
  if (!token) throw new Error("Pivot tidak mengembalikan access token");
  return token;
}

async function getRedirectUrl(
  baseUrl: string,
  token: string,
  paymentResponse: unknown,
) {
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
    headers: { Authorization: `Bearer ${token}` },
  });
  const detailPayload = await detailResponse.json();
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

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Unauthorized" }, 401);

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );
    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();
    if (userError || !user) return jsonResponse({ error: "Unauthorized" }, 401);

    const baseUrl = (Deno.env.get("PIVOT_BASE_URL") || DEFAULT_BASE_URL).replace(/\/$/, "");
    const clientId = Deno.env.get("PIVOT_CLIENT_ID");
    const clientSecret = Deno.env.get("PIVOT_CLIENT_SECRET");
    const successUrl = Deno.env.get("PIVOT_SUCCESS_URL");
    const failureUrl = Deno.env.get("PIVOT_FAILURE_URL");
    const expirationUrl = Deno.env.get("PIVOT_EXPIRATION_URL");

    let body: { amount?: number } = {};
    try {
      body = await req.json();
    } catch {
      // body kosong diperbolehkan — fallback ke env/default
    }
    const fallbackAmount = Number(Deno.env.get("PIVOT_PAYMENT_AMOUNT") ?? "150000");
    const requestedAmount = Number(body.amount);
    const amount =
      Number.isFinite(requestedAmount) && requestedAmount > 0
        ? Math.round(requestedAmount)
        : Number.isFinite(fallbackAmount) && fallbackAmount > 0
          ? Math.round(fallbackAmount)
          : 150000;

    const MIN_AMOUNT = 1000;
    const MAX_AMOUNT = 10_000_000;

    if (!clientId || !clientSecret || !successUrl || !failureUrl || !expirationUrl) {
      return jsonResponse({ error: "Pivot secrets or return URLs are not configured" }, 500);
    }
    if (!Number.isInteger(amount) || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
      return jsonResponse({ error: `Nominal harus antara Rp ${MIN_AMOUNT} dan Rp ${MAX_AMOUNT}` }, 400);
    }

    const orderId = `HNZ-${user.id.slice(0, 8)}-${Date.now()}`;
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { error: insertError } = await supabaseAdmin.from("payments").insert({
      user_id: user.id,
      order_id: orderId,
      amount,
      status: "pending",
      payment_type: "pemetaan",
      provider: "pivot",
    });
    if (insertError) return jsonResponse({ error: insertError.message }, 500);

    const token = await getAccessToken(baseUrl, clientId, clientSecret);
    const name = splitName(String(user.user_metadata?.full_name ?? "Peserta"));
    const requestBody = {
      clientReferenceId: orderId,
      amount: { value: amount, currency: "IDR" },
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
              type: "PHYSICAL",
              category: "SERVICE",
              subCategory: "ASSESSMENT",
              name: "Pemetaan Potensi Harunokaze",
              description: "Akses rangkaian tes pemetaan potensi",
              quantity: 1,
              price: { value: amount, currency: "IDR" },
            },
          ],
        },
      };

    const paymentResponse = await fetch(`${baseUrl}/v2/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "X-REQUEST-ID": orderId,
      },
      body: JSON.stringify(requestBody),
    });
    const paymentPayload = await paymentResponse.json();

    if (!paymentResponse.ok) {
      await supabaseAdmin
        .from("payments")
        .update({ status: "deny", raw_payload: paymentPayload })
        .eq("order_id", orderId);
      return jsonResponse({ error: `Pivot payment gagal: ${JSON.stringify(paymentPayload)}` }, 400);
    }

    const redirectUrl = await getRedirectUrl(baseUrl, token, paymentPayload);
    const providerReferenceId = getStringAtKeys(paymentPayload, [
      "id",
      "paymentSessionId",
      "payment_session_id",
      "paymentId",
      "payment_id",
    ]);
    if (!redirectUrl) {
      await supabaseAdmin
        .from("payments")
        .update({ provider_reference_id: providerReferenceId, raw_payload: paymentPayload })
        .eq("order_id", orderId);
      return jsonResponse({ error: "Pivot tidak mengembalikan URL pembayaran" }, 502);
    }

    await supabaseAdmin
      .from("payments")
      .update({
        provider_reference_id: providerReferenceId,
        payment_url: redirectUrl,
        raw_payload: paymentPayload,
      })
      .eq("order_id", orderId);

    return jsonResponse({ redirect_url: redirectUrl, order_id: orderId });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unknown error" },
      500,
    );
  }
});
