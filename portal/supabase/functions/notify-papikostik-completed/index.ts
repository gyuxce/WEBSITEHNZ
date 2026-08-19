import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatCompletedAt(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function recipientList(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL");
  const recipients = recipientList(Deno.env.get("PSYCHOLOGIST_NOTIFICATION_EMAIL"));

  if (!authHeader || !supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  if (!resendApiKey || !fromEmail || recipients.length === 0) {
    return jsonResponse({ error: "Konfigurasi notifikasi email belum lengkap" }, 500);
  }

  try {
    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();
    if (userError || !user) return jsonResponse({ error: "Unauthorized" }, 401);

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const [profileResponse, progressResponse, papiResponse] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .maybeSingle(),
      supabaseAdmin
        .from("user_progress")
        .select("papikostik_test_status")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabaseAdmin
        .from("papikostik_results")
        .select("completed_at")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    const queryError = profileResponse.error || progressResponse.error || papiResponse.error;
    if (queryError) return jsonResponse({ error: queryError.message }, 500);
    if (profileResponse.data?.role !== "participant") {
      return jsonResponse({ error: "Only participants can trigger this notification" }, 403);
    }
    if (!papiResponse.data || progressResponse.data?.papikostik_test_status !== "completed") {
      return jsonResponse({ error: "PAPI Kostick belum selesai" }, 409);
    }

    const { data: existingLog, error: existingLogError } = await supabaseAdmin
      .from("psychologist_notification_logs")
      .select("status")
      .eq("user_id", user.id)
      .eq("notification_type", "papikostik_completed")
      .maybeSingle();
    if (existingLogError) return jsonResponse({ error: existingLogError.message }, 500);
    if (existingLog) {
      return jsonResponse({ notified: false, status: existingLog.status });
    }

    const recipientEmail = recipients.join(", ");
    const { error: logError } = await supabaseAdmin.from("psychologist_notification_logs").insert({
      user_id: user.id,
      notification_type: "papikostik_completed",
      recipient_email: recipientEmail,
      status: "pending",
    });
    if (logError?.code === "23505") return jsonResponse({ notified: false, status: "pending" });
    if (logError) return jsonResponse({ error: logError.message }, 500);

    const participantName = profileResponse.data.full_name?.trim() || user.email || "Peserta";
    const portalUrl = (Deno.env.get("PORTAL_URL") || "https://portal.harunokaze.id").replace(/\/$/, "");
    const reviewUrl = `${portalUrl}/psychologist/papikostik/${encodeURIComponent(user.id)}`;
    const completedAt = formatCompletedAt(papiResponse.data.completed_at);
    const safeName = escapeHtml(participantName);
    const safeReviewUrl = escapeHtml(reviewUrl);

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: recipients,
        subject: `PAPI Kostick baru perlu direview — ${participantName}`,
        html: `
          <div style="font-family:Arial,sans-serif;color:#0f2240;line-height:1.6">
            <h2 style="margin:0 0 12px">PAPI Kostick siap direview</h2>
            <p><strong>${safeName}</strong> telah menyelesaikan PAPI Kostick pada ${escapeHtml(completedAt)} WIB.</p>
            <p>Email ini hanya notifikasi. Detail hasil dan jawaban peserta tetap tersedia secara aman di portal.</p>
            <p style="margin-top:24px"><a href="${safeReviewUrl}" style="display:inline-block;background:#e61935;color:#fff;padding:11px 16px;border-radius:8px;text-decoration:none;font-weight:700">Buka review PAPI Kostick</a></p>
          </div>
        `,
      }),
    });
    const resendPayload: unknown = await resendResponse.json().catch(() => null);
    if (!resendResponse.ok) {
      const errorMessage = JSON.stringify(resendPayload ?? {}).slice(0, 1000);
      await supabaseAdmin
        .from("psychologist_notification_logs")
        .update({ status: "failed", error_message: errorMessage })
        .eq("user_id", user.id)
        .eq("notification_type", "papikostik_completed");
      return jsonResponse({ error: "Resend gagal mengirim notifikasi" }, 502);
    }

    const providerMessageId =
      resendPayload && typeof resendPayload === "object" && "id" in resendPayload
        ? String(resendPayload.id)
        : null;
    const { error: updateError } = await supabaseAdmin
      .from("psychologist_notification_logs")
      .update({
        status: "sent",
        provider_message_id: providerMessageId,
        sent_at: new Date().toISOString(),
        error_message: null,
      })
      .eq("user_id", user.id)
      .eq("notification_type", "papikostik_completed");
    if (updateError) console.error("Could not update notification log:", updateError.message);

    return jsonResponse({ notified: true });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unexpected notification error" },
      500,
    );
  }
});
