import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PENDING_RETRY_AFTER_MS = 2 * 60 * 1000;

type NotificationLog = {
  status: "pending" | "sent" | "failed";
  created_at: string;
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

function uniqueEmails(emails: string[]) {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const email of emails) {
    const normalized = email.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    unique.push(email.trim());
  }
  return unique;
}

async function psychologistAccountEmails(supabaseAdmin: SupabaseClient) {
  const { data: profiles, error } = await supabaseAdmin
    .from("profiles")
    .select("id, notification_email")
    .eq("role", "psychologist");
  if (error) throw new Error(error.message);

  const emails: string[] = [];
  for (const profile of profiles ?? []) {
    const inbox = typeof profile.notification_email === "string" ? profile.notification_email.trim() : "";
    if (inbox) {
      emails.push(inbox);
      continue;
    }
    const { data, error: userError } = await supabaseAdmin.auth.admin.getUserById(profile.id);
    if (userError || !data.user?.email) continue;
    emails.push(data.user.email);
  }
  return emails;
}

function shouldRetry(log: NotificationLog | null) {
  if (!log) return true;
  if (log.status === "sent") return false;
  if (log.status === "failed") return true;
  return Date.now() - new Date(log.created_at).getTime() >= PENDING_RETRY_AFTER_MS;
}

async function notifyParticipant(
  supabaseAdmin: SupabaseClient,
  userId: string,
  recipients: string[],
  resendApiKey: string,
  fromEmail: string,
  portalUrl: string,
): Promise<"sent" | "skipped" | "failed"> {
  const [profileResponse, progressResponse, papiResponse, logResponse] = await Promise.all([
    supabaseAdmin.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
    supabaseAdmin.from("user_progress").select("papikostik_test_status").eq("user_id", userId).maybeSingle(),
    supabaseAdmin.from("papikostik_results").select("completed_at, review_status").eq("user_id", userId).maybeSingle(),
    supabaseAdmin
      .from("psychologist_notification_logs")
      .select("status, created_at")
      .eq("user_id", userId)
      .eq("notification_type", "papikostik_completed")
      .maybeSingle(),
  ]);

  const queryError =
    profileResponse.error || progressResponse.error || papiResponse.error || logResponse.error;
  if (queryError) throw new Error(queryError.message);

  if (!papiResponse.data || progressResponse.data?.papikostik_test_status !== "completed") {
    return "skipped";
  }

  const existingLog = (logResponse.data as NotificationLog | null) ?? null;
  if (!shouldRetry(existingLog)) {
    return "skipped";
  }

  const recipientEmail = recipients.join(", ");
  if (!existingLog) {
    const { error: logError } = await supabaseAdmin.from("psychologist_notification_logs").insert({
      user_id: userId,
      notification_type: "papikostik_completed",
      recipient_email: recipientEmail,
      status: "pending",
    });
    if (logError?.code === "23505") return "skipped";
    if (logError) throw new Error(logError.message);
  } else {
    const { error: resetError } = await supabaseAdmin
      .from("psychologist_notification_logs")
      .update({
        recipient_email: recipientEmail,
        status: "pending",
        error_message: null,
      })
      .eq("user_id", userId)
      .eq("notification_type", "papikostik_completed");
    if (resetError) throw new Error(resetError.message);
  }

  const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (authUserError) throw new Error(authUserError.message);

  const participantName =
    profileResponse.data?.full_name?.trim() || authUser.user?.email || "Peserta";
  const reviewUrl = `${portalUrl}/psychologist/papikostik/${encodeURIComponent(userId)}`;
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
      .eq("user_id", userId)
      .eq("notification_type", "papikostik_completed");
    console.error("Resend failed for", userId, errorMessage);
    return "failed";
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
    .eq("user_id", userId)
    .eq("notification_type", "papikostik_completed");
  if (updateError) console.error("Could not update notification log:", updateError.message);

  return "sent";
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

  if (!authHeader || !supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  if (!resendApiKey) {
    return jsonResponse({ error: "RESEND_API_KEY belum diset di Edge Function secrets" }, 500);
  }
  if (!fromEmail) {
    return jsonResponse({ error: "RESEND_FROM_EMAIL belum diset di Edge Function secrets" }, 500);
  }

  try {
    const payload = (await req.json().catch(() => ({}))) as { backfill?: boolean };
    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();
    if (userError || !user) return jsonResponse({ error: "Unauthorized" }, 401);

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const recipients = uniqueEmails([
      ...recipientList(Deno.env.get("PSYCHOLOGIST_NOTIFICATION_EMAIL")),
      ...(await psychologistAccountEmails(supabaseAdmin)),
    ]);
    if (recipients.length === 0) {
      return jsonResponse(
        { error: "Tidak ada email psikolog. Isi Gmail notifikasi di profil psikolog, atau secret PSYCHOLOGIST_NOTIFICATION_EMAIL." },
        500,
      );
    }

    const portalUrl = (Deno.env.get("PORTAL_URL") || "https://portal.harunokaze.id").replace(/\/$/, "");
    const { data: actorProfile, error: actorError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (actorError) return jsonResponse({ error: actorError.message }, 500);

    const isStaff = actorProfile?.role === "admin" || actorProfile?.role === "psychologist";
    if (payload.backfill) {
      if (!isStaff) return jsonResponse({ error: "Hanya staf yang dapat mengirim ulang notifikasi" }, 403);

      const { data: pendingRows, error: pendingError } = await supabaseAdmin
        .from("papikostik_results")
        .select("user_id")
        .eq("review_status", "pending");
      if (pendingError) return jsonResponse({ error: pendingError.message }, 500);

      let sent = 0;
      let failed = 0;
      for (const row of pendingRows ?? []) {
        const result = await notifyParticipant(
          supabaseAdmin,
          row.user_id,
          recipients,
          resendApiKey,
          fromEmail,
          portalUrl,
        );
        if (result === "sent") sent += 1;
        if (result === "failed") failed += 1;
      }
      return jsonResponse({ notified: sent > 0, sent, failed, backfill: true });
    }

    const result = await notifyParticipant(
      supabaseAdmin,
      user.id,
      recipients,
      resendApiKey,
      fromEmail,
      portalUrl,
    );
    if (result === "failed") {
      return jsonResponse({ error: "Resend gagal mengirim notifikasi" }, 502);
    }
    return jsonResponse({ notified: result === "sent", status: result });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unexpected notification error" },
      500,
    );
  }
});
