import type { Profile } from "./database.types";

export type StaffRole = Profile["role"];

export function isAdminRole(role: StaffRole | null | undefined) {
  return role === "admin";
}

export function isPsychologistRole(role: StaffRole | null | undefined) {
  return role === "psychologist";
}

export function isAssessmentStaffRole(role: StaffRole | null | undefined) {
  return isAdminRole(role) || isPsychologistRole(role);
}
