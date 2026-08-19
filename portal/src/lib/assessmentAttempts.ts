import type { Database, Json } from "./database.types";
import { supabase } from "./supabase";

export type AssessmentAttemptType = "pimsleur" | "cfit" | "papikostik";
export type AssessmentAttempt =
  Database["public"]["Functions"]["start_assessment_attempt"]["Returns"][number];

function firstRow<T>(data: T[] | null, message: string) {
  const row = data?.[0];
  if (!row) throw new Error(message);
  return row;
}

export async function startAssessmentAttempt(
  assessmentType: AssessmentAttemptType,
  durationSeconds: number,
  stepDurationSeconds?: number,
) {
  const { data, error } = await supabase.rpc("start_assessment_attempt", {
    p_assessment_type: assessmentType,
    p_duration_seconds: durationSeconds,
    p_step_duration_seconds: stepDurationSeconds ?? null,
  });
  if (error) throw new Error(error.message);
  return firstRow(data, "Sesi asesmen belum tersedia.");
}

export async function saveAssessmentAttempt(
  attemptId: string,
  answers: Json,
  currentStep: number,
) {
  const { data, error } = await supabase.rpc("save_assessment_attempt", {
    p_attempt_id: attemptId,
    p_answers: answers,
    p_current_step: currentStep,
  });
  if (error) throw new Error(error.message);
  return firstRow(data, "Jawaban belum berhasil disimpan.");
}

export async function advanceAssessmentAttempt(
  attemptId: string,
  currentStep: number,
  stepDurationSeconds: number,
) {
  const { data, error } = await supabase.rpc("advance_assessment_attempt", {
    p_attempt_id: attemptId,
    p_current_step: currentStep,
    p_step_duration_seconds: stepDurationSeconds,
  });
  if (error) throw new Error(error.message);
  return firstRow(data, "Sesi asesmen belum berhasil dilanjutkan.");
}

export async function finishAssessmentAttempt(
  attemptId: string,
  answers: Json,
  currentStep: number,
) {
  const { data, error } = await supabase.rpc("finish_assessment_attempt", {
    p_attempt_id: attemptId,
    p_answers: answers,
    p_current_step: currentStep,
  });
  if (error) throw new Error(error.message);
  return firstRow(data, "Sesi asesmen belum berhasil ditutup.");
}

export function getRemainingSeconds(deadline: string | null | undefined) {
  if (!deadline) return 0;
  return Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / 1000));
}

export function getJsonRecord(value: Json): Record<string, Json | undefined> {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
