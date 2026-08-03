import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "deepseek/deepseek-v4-flash-0731";

type AnyRecord = Record<string, unknown>;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isRecord(value: unknown): value is AnyRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function textValue(value: unknown, maxLength = 12000): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function jsonText(value: unknown, maxLength = 16000): string {
  try {
    return JSON.stringify(value ?? {}, null, 2).slice(0, maxLength);
  } catch {
    return "{}";
  }
}

function messageContent(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (!Array.isArray(value)) return "";
  return value
    .map((part) => {
      if (typeof part === "string") return part;
      if (isRecord(part) && typeof part.text === "string") return part.text;
      return "";
    })
    .join("\n")
    .trim();
}

function parseJsonCandidate(value: string): AnyRecord | null {
  const cleaned = value
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    const parsed: unknown = JSON.parse(cleaned);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function factorSummary(scores: unknown, analyses: unknown): string {
  if (!isRecord(scores)) return "Tidak ada skor faktor PAPI.";
  const analysisMap = isRecord(analyses) ? analyses : {};
  return Object.entries(scores)
    .map(([code, score]) => `${code}: ${String(score)}/9 - ${textValue(analysisMap[code], 600)}`)
    .join("\n");
}

function buildPrompt(data: {
  psychologistInterpretation: string;
  participantSummary: string;
  qcNotes: string;
  pimsleur: AnyRecord;
  cfit: AnyRecord;
  papi: AnyRecord;
}) {
  const system = `Anda adalah editor QC internal untuk hasil pemetaan potensi peserta di Indonesia.
Tugas Anda hanya membuat DRAFT narasi yang lebih konsultatif, jelas, hangat, dan mudah dipahami peserta.
Jangan membuat diagnosis klinis, label medis, keputusan kelulusan, keputusan rekrutmen, atau klaim kepastian.
Jangan mengubah angka/skor, IQ, kategori, atau fakta hasil tes.
Jangan menyebut ChatGPT, AI, prompt, atau proses internal.
Gunakan istilah "peserta" dan bahasa Indonesia profesional yang tidak menghakimi.
Interpretasi psikolog adalah sumber utama. Data skor hanya dipakai untuk menjaga konsistensi fakta.
Jika ada kekurangan atau konflik data, jangan mengarang; tambahkan peringatan singkat di qc_flags.
Narasi harus berupa 2-5 paragraf, fokus pada kekuatan, area pengembangan, dan saran praktis yang wajar.
Hasil ini selalu memerlukan pemeriksaan dan persetujuan manusia sebelum diterbitkan.
Kembalikan JSON sesuai schema, tanpa markdown.`;

  const user = `Buat atau perbaiki narasi untuk peserta berdasarkan data berikut.

Interpretasi psikolog internal:
${data.psychologistInterpretation || "Belum diisi."}

Narasi peserta yang sudah ada (boleh diperbaiki, jangan diikuti jika kosong):
${data.participantSummary || "Belum ada."}

Catatan QC internal:
${data.qcNotes || "Belum ada."}

Ringkasan Pimsleur:
${jsonText(data.pimsleur)}

Ringkasan CFIT:
${jsonText(data.cfit)}

Ringkasan PAPI Kostick:
${jsonText({
    total_top: data.papi.total_top,
    total_bottom: data.papi.total_bottom,
    total_all: data.papi.total_all,
    is_complete_pattern: data.papi.is_complete_pattern,
    review_status: data.papi.review_status,
    factors: factorSummary(data.papi.scores, data.papi.analyses),
  })}`;

  return { system, user };
}

function requestBody(model: string, messages: Array<{ role: string; content: string }>, structured: boolean) {
  const body: AnyRecord = {
    model,
    messages,
    temperature: 0.2,
    max_tokens: 1400,
  };

  if (structured) {
    body.response_format = {
      type: "json_schema",
      json_schema: {
        name: "participant_refinement",
        strict: true,
        schema: {
          type: "object",
          properties: {
            participant_summary: { type: "string" },
            qc_flags: { type: "array", items: { type: "string" } },
            needs_human_review: { type: "boolean" },
          },
          required: ["participant_summary", "qc_flags", "needs_human_review"],
          additionalProperties: false,
        },
      },
    };
  }

  return body;
}

async function callOpenRouter(
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  structured: boolean,
) {
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": Deno.env.get("OPENROUTER_SITE_URL") || "https://www.harunokaze.id",
      "X-OpenRouter-Title": Deno.env.get("OPENROUTER_APP_TITLE") || "Harunokaze Portal",
    },
    body: JSON.stringify(requestBody(model, messages, structured)),
  });
  const raw = await response.text();
  let payload: unknown = null;
  try {
    payload = JSON.parse(raw);
  } catch {
    payload = { error: raw };
  }
  return { response, payload };
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

    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser();
    if (userError || !user) return jsonResponse({ error: "Unauthorized" }, 401);

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const { data: actorProfile, error: actorError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (actorError || actorProfile?.role !== "admin") {
      return jsonResponse({ error: "Admin access required" }, 403);
    }

    let input: AnyRecord = {};
    try {
      const body: unknown = await req.json();
      if (isRecord(body)) input = body;
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const targetUserId = textValue(input.user_id, 80);
    if (!targetUserId) return jsonResponse({ error: "user_id is required" }, 400);

    const [pimsleurResponse, cfitResponse, papiResponse, reviewResponse] = await Promise.all([
      supabaseAdmin
        .from("pimsleur_results")
        .select("score_total, score_verbal, score_audio, grade, grade_label, status_label, recommendation")
        .eq("user_id", targetUserId)
        .maybeSingle(),
      supabaseAdmin
        .from("cfit_results")
        .select("raw_subtest1, raw_subtest2, raw_subtest3, raw_subtest4, raw_total, iq, category, age_years, age_months, norm_code")
        .eq("user_id", targetUserId)
        .maybeSingle(),
      supabaseAdmin
        .from("papikostik_results")
        .select("scores, analyses, total_top, total_bottom, total_all, is_complete_pattern, review_status")
        .eq("user_id", targetUserId)
        .maybeSingle(),
      supabaseAdmin
        .from("assessment_final_reviews")
        .select("psychologist_interpretation, participant_summary, qc_notes")
        .eq("user_id", targetUserId)
        .maybeSingle(),
    ]);

    const queryError =
      pimsleurResponse.error || cfitResponse.error || papiResponse.error || reviewResponse.error;
    if (queryError) return jsonResponse({ error: queryError.message }, 500);
    if (!pimsleurResponse.data || !cfitResponse.data || !papiResponse.data) {
      return jsonResponse({ error: "Semua hasil Pimsleur, CFIT, dan PAPI harus tersedia dulu" }, 400);
    }

    const review = reviewResponse.data;
    const psychologistInterpretation = textValue(
      input.psychologist_interpretation ?? review?.psychologist_interpretation,
    );
    const participantSummary = textValue(input.participant_summary ?? review?.participant_summary);
    const qcNotes = textValue(input.qc_notes ?? review?.qc_notes);
    if (!psychologistInterpretation) {
      return jsonResponse({ error: "Isi interpretasi psikolog sebelum menjalankan refine AI" }, 400);
    }

    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) return jsonResponse({ error: "OPENROUTER_API_KEY belum diset di Supabase Secrets" }, 500);
    const model = Deno.env.get("OPENROUTER_MODEL") || DEFAULT_MODEL;
    const { system, user: userPrompt } = buildPrompt({
      psychologistInterpretation,
      participantSummary,
      qcNotes,
      pimsleur: pimsleurResponse.data,
      cfit: cfitResponse.data,
      papi: papiResponse.data,
    });
    const messages = [
      { role: "system", content: system },
      { role: "user", content: userPrompt },
    ];

    let result = await callOpenRouter(apiKey, model, messages, true);
    if (!result.response.ok && [400, 404, 422].includes(result.response.status)) {
      result = await callOpenRouter(apiKey, model, messages, false);
    }
    if (!result.response.ok) {
      const errorPayload = isRecord(result.payload) ? result.payload.error : result.payload;
      return jsonResponse({ error: `OpenRouter gagal: ${jsonText(errorPayload, 2000)}` }, 502);
    }

    const payload = isRecord(result.payload) ? result.payload : {};
    const choices = Array.isArray(payload.choices) ? payload.choices : [];
    const firstChoice = isRecord(choices[0]) ? choices[0] : {};
    const message = isRecord(firstChoice.message) ? firstChoice.message : {};
    const content = messageContent(message.content);
    const parsed = parseJsonCandidate(content);
    const refinedSummary = textValue(parsed?.participant_summary ?? content, 12000);
    if (!refinedSummary) return jsonResponse({ error: "OpenRouter mengembalikan narasi kosong" }, 502);

    const qcFlags = Array.isArray(parsed?.qc_flags)
      ? parsed.qc_flags.filter((value): value is string => typeof value === "string").slice(0, 10)
      : [];
    return jsonResponse({
      participant_summary: refinedSummary,
      qc_flags: qcFlags,
      needs_human_review: true,
      model,
    });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      500,
    );
  }
});
