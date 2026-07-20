import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const serverKey = Deno.env.get("MIDTRANS_SERVER_KEY") ?? "";

    // Verify Midtrans signature (SHA512)
    const { order_id, status_code, gross_amount, signature_key } = body;
    const sigInput = `${order_id}${status_code}${gross_amount}${serverKey}`;
    const hashBuffer = await crypto.subtle.digest("SHA-512", new TextEncoder().encode(sigInput));
    const expectedSig = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (signature_key && expectedSig !== signature_key) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 403 });
    }

    const transactionStatus = body.transaction_status;
    let paymentStatus = "pending";

    if (transactionStatus === "settlement" || transactionStatus === "capture") {
      paymentStatus = "settlement";
    } else if (transactionStatus === "expire") {
      paymentStatus = "expire";
    } else if (transactionStatus === "cancel" || transactionStatus === "deny") {
      paymentStatus = transactionStatus;
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    await supabaseAdmin
      .from("payments")
      .update({
        status: paymentStatus,
        midtrans_transaction_id: body.transaction_id ?? null,
      })
      .eq("order_id", order_id);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
