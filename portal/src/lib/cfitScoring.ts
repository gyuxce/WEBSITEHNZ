/** Kunci & skoring CFIT 3A — jangan expose ke UI soal */
import norma from "../data/cfitNorma.json";
import type { CfitSubtestId } from "../data/cfitQuestions";

const KEYS: Record<CfitSubtestId, string[]> = {
  1: ["B", "C", "B", "D", "E", "B", "D", "B", "F", "C", "B", "B", "E"],
  2: [
    "BE",
    "AE",
    "AD",
    "CE",
    "BE",
    "AD",
    "BE",
    "BE",
    "AD",
    "BD",
    "AE",
    "CD",
    "BC",
    "AB",
  ],
  3: ["E", "E", "E", "B", "C", "D", "E", "E", "A", "A", "F", "C", "C"],
  4: ["B", "A", "D", "D", "A", "B", "C", "D", "A", "D"],
};

type AgeBand = "A1" | "A2" | "A3" | "A4" | "A5" | "A6";

export type CfitScoreBreakdown = {
  score_subtest1: number;
  score_subtest2: number;
  score_subtest3: number;
  score_subtest4: number;
  score_raw: number;
  iq: number;
  age_years: number;
  age_months: number;
  age_band: AgeBand;
  classification: string;
  classification_label: string;
};

/** Normalisasi jawaban multi-select: "EB" / "E,B" → "BE" */
export function normalizeAnswer(raw: string | undefined | null): string {
  if (!raw) return "";
  const letters = raw
    .toUpperCase()
    .replace(/[^A-F]/g, "")
    .split("")
    .sort();
  return letters.join("");
}

function scoreSubtest(subtest: CfitSubtestId, answers: Record<string, string>): number {
  const keys = KEYS[subtest];
  let score = 0;
  for (let i = 0; i < keys.length; i++) {
    const id = `s${subtest}_q${i + 1}`;
    if (normalizeAnswer(answers[id]) === keys[i]) score += 1;
  }
  return score;
}

/** Usia kronologis pada tanggal tes (tahun + bulan penuh). */
export function ageAtDate(birthDate: string, onDate: Date = new Date()) {
  const birth = new Date(birthDate + "T00:00:00");
  if (Number.isNaN(birth.getTime())) {
    throw new Error("Tanggal lahir tidak valid");
  }

  let years = onDate.getFullYear() - birth.getFullYear();
  let months = onDate.getMonth() - birth.getMonth();
  if (onDate.getDate() < birth.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years: Math.max(0, years), months: Math.max(0, months) };
}

export function ageBandFromAge(years: number, months: number): AgeBand {
  if (years < 13) return "A1";
  if (years === 13 && months <= 4) return "A1";
  if (years === 13) return "A2";
  if (years === 14) return "A3";
  if (years === 15) return "A4";
  if (years === 16) return "A5";
  return "A6";
}

function lookupIq(band: AgeBand, raw: number): number {
  const table = (norma.bands as Record<string, Record<string, number>>)[band] ?? {};
  const exact = table[String(raw)];
  if (typeof exact === "number") return exact;

  // Ambil skor mentah terdekat yang ada di tabel (turun dulu, lalu naik)
  for (let d = 1; d <= 50; d++) {
    const down = table[String(raw - d)];
    if (typeof down === "number") return down;
    const up = table[String(raw + d)];
    if (typeof up === "number") return up;
  }
  return 0;
}

export function classifyIq(iq: number): { classification: string; classification_label: string } {
  if (iq > 170) {
    return { classification: "GENIUS", classification_label: "Potensi Intelektual Istimewa" };
  }
  if (iq >= 140) {
    return {
      classification: "SANGAT SUPERIOR",
      classification_label: "Potensi Intelektual Sangat Unggul",
    };
  }
  if (iq >= 120) {
    return { classification: "SUPERIOR", classification_label: "Potensi Intelektual Unggul" };
  }
  if (iq >= 110) {
    return {
      classification: "RATA-RATA ATAS",
      classification_label: "Potensi Intelektual Rata-Rata Atas",
    };
  }
  if (iq >= 90) {
    return { classification: "RATA-RATA", classification_label: "Potensi Intelektual Rata-Rata" };
  }
  if (iq >= 80) {
    return {
      classification: "RATA-RATA BAWAH",
      classification_label: "Potensi Intelektual Berkembang",
    };
  }
  if (iq >= 70) {
    return { classification: "BORDERLINE", classification_label: "Memerlukan Penguatan Dasar" };
  }
  return {
    classification: "MENTALLY DEFECTIVE",
    classification_label: "Memerlukan Pendampingan Intensif",
  };
}

export function scoreCfit(
  answers: Record<string, string>,
  birthDate: string,
  onDate: Date = new Date(),
): CfitScoreBreakdown {
  const score_subtest1 = scoreSubtest(1, answers);
  const score_subtest2 = scoreSubtest(2, answers);
  const score_subtest3 = scoreSubtest(3, answers);
  const score_subtest4 = scoreSubtest(4, answers);
  const score_raw = score_subtest1 + score_subtest2 + score_subtest3 + score_subtest4;

  const { years, months } = ageAtDate(birthDate, onDate);
  const age_band = ageBandFromAge(years, months);
  const iq = lookupIq(age_band, score_raw);
  const cls = classifyIq(iq);

  return {
    score_subtest1,
    score_subtest2,
    score_subtest3,
    score_subtest4,
    score_raw,
    iq,
    age_years: years,
    age_months: months,
    age_band,
    classification: cls.classification,
    classification_label: cls.classification_label,
  };
}
