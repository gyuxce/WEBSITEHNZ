export type CfitNormCode = "A1" | "A2" | "A3" | "A4" | "A5" | "A6";

const CFIT_IQ_BY_NORM: Record<CfitNormCode, Record<number, number>> = {
  A1: {
    7: 63, 8: 67, 9: 70, 10: 73, 11: 76, 12: 80, 13: 81, 14: 85, 15: 88, 16: 91,
    17: 94, 18: 98, 19: 101, 20: 104, 21: 106, 22: 109, 23: 113, 24: 116,
    25: 119, 26: 123, 27: 126, 28: 128, 29: 131, 30: 134, 31: 137, 32: 140,
    33: 142, 34: 147, 35: 150, 36: 152, 37: 155, 38: 159, 39: 161, 40: 165,
    41: 167, 42: 171, 43: 175, 44: 176, 45: 179, 46: 183,
  },
  A2: {
    7: 60, 8: 63, 9: 67, 10: 70, 11: 73, 12: 76, 13: 78, 14: 81, 15: 85, 16: 88,
    17: 91, 18: 94, 19: 98, 20: 101, 21: 103, 22: 106, 23: 109, 24: 113,
    25: 116, 26: 119, 27: 123, 28: 124, 29: 128, 30: 131, 31: 134, 32: 137,
    33: 139, 34: 144, 35: 147, 36: 149, 37: 152, 38: 155, 39: 159, 40: 161,
    41: 163, 42: 168, 43: 171, 44: 173, 45: 176, 46: 179, 47: 183,
  },
  A3: {
    7: 57, 8: 60, 9: 63, 10: 67, 11: 70, 12: 73, 13: 75, 14: 78, 15: 81, 16: 85,
    17: 88, 18: 91, 19: 94, 20: 98, 21: 100, 22: 103, 23: 106, 24: 109,
    25: 113, 26: 116, 27: 119, 28: 121, 29: 124, 30: 128, 31: 131, 32: 134,
    33: 136, 34: 140, 35: 144, 36: 145, 37: 149, 38: 152, 39: 155, 40: 159,
    41: 160, 42: 165, 43: 168, 44: 169, 45: 173, 46: 176, 47: 179, 48: 183,
  },
  A4: {
    7: 56, 8: 58, 9: 62, 10: 65, 11: 68, 12: 72, 13: 73, 14: 76, 15: 80, 16: 83,
    17: 86, 18: 89, 19: 93, 20: 96, 21: 98, 22: 101, 23: 104, 24: 108,
    25: 111, 26: 114, 27: 117, 28: 119, 29: 123, 30: 126, 31: 129, 32: 133,
    33: 134, 34: 139, 35: 142, 36: 144, 37: 147, 38: 150, 39: 154, 40: 157,
    41: 159, 42: 163, 43: 167, 44: 168, 45: 171, 46: 175, 47: 178, 48: 181,
  },
  A5: {
    7: 55, 8: 57, 9: 60, 10: 63, 11: 67, 12: 70, 13: 72, 14: 75, 15: 78, 16: 81,
    17: 85, 18: 88, 19: 91, 20: 94, 21: 96, 22: 100, 23: 103, 24: 106,
    25: 109, 26: 113, 27: 116, 28: 117, 29: 121, 30: 124, 31: 128, 32: 131,
    33: 133, 34: 137, 35: 140, 36: 142, 37: 145, 38: 149, 39: 152, 40: 155,
    41: 157, 42: 161, 43: 165, 44: 167, 45: 169, 46: 173, 47: 176, 48: 179,
    49: 183,
  },
  A6: {
    7: 55, 8: 57, 9: 60, 10: 63, 11: 67, 12: 70, 13: 72, 14: 75, 15: 78, 16: 81,
    17: 85, 18: 88, 19: 91, 20: 94, 21: 96, 22: 100, 23: 103, 24: 107,
    25: 109, 26: 113, 27: 116, 28: 117, 29: 121, 30: 124, 31: 128, 32: 131,
    33: 133, 34: 137, 35: 140, 36: 142, 37: 145, 38: 149, 39: 152, 40: 155,
    41: 157, 42: 161, 43: 165, 44: 167, 45: 169, 46: 173, 47: 176, 48: 179,
    49: 183,
  },
};

function parseIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

export function getCfitCategory(iq: number | null) {
  if (iq === null) return null;
  if (iq > 170) return "Potensi Intelektual Istimewa";
  if (iq >= 140) return "Potensi Intelektual Sangat Unggul";
  if (iq >= 120) return "Potensi Intelektual Unggul";
  if (iq >= 110) return "Potensi Intelektual Rata-Rata Atas";
  if (iq >= 90) return "Potensi Intelektual Rata-Rata";
  if (iq >= 80) return "Potensi Intelektual Berkembang";
  if (iq >= 70) return "Memerlukan Penguatan Dasar";
  if (iq >= 30) return "Memerlukan Pendampingan Intensif";
  return null;
}

export function calculateAgeAt(birthDate: string | null | undefined, at: Date) {
  if (!birthDate) return null;
  const birth = parseIsoDate(birthDate);
  if (!birth || birth > at) return null;

  let years = at.getFullYear() - birth.getFullYear();
  let months = at.getMonth() - birth.getMonth();
  if (at.getDate() < birth.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years < 0) return null;
  return { years, months, totalMonths: years * 12 + months };
}

function getNormCode(totalMonths: number): CfitNormCode | null {
  if (totalMonths < 13 * 12) return null;
  if (totalMonths <= 13 * 12 + 4) return "A1";
  if (totalMonths <= 13 * 12 + 11) return "A2";
  if (totalMonths <= 14 * 12 + 11) return "A3";
  if (totalMonths <= 15 * 12 + 11) return "A4";
  if (totalMonths <= 16 * 12 + 11) return "A5";
  return "A6";
}

function lookupIq(normCode: CfitNormCode, rawTotal: number) {
  const table = CFIT_IQ_BY_NORM[normCode];
  if (table[rawTotal] !== undefined) return table[rawTotal];

  const rawScores = Object.keys(table).map(Number);
  const minRaw = Math.min(...rawScores);
  const maxRaw = Math.max(...rawScores);
  if (rawTotal > maxRaw) return table[maxRaw];
  if (rawTotal < minRaw) return table[minRaw];
  return null;
}

function isCfitNormCode(value: string | null | undefined): value is CfitNormCode {
  return (
    value === "A1" ||
    value === "A2" ||
    value === "A3" ||
    value === "A4" ||
    value === "A5" ||
    value === "A6"
  );
}

export function calculateCfitIqFromNorm(rawTotal: number | null, normCode: string | null | undefined) {
  if (rawTotal === null || !isCfitNormCode(normCode)) {
    return { iq: null, category: null };
  }

  const iq = lookupIq(normCode, rawTotal);
  return {
    iq,
    category: getCfitCategory(iq),
  };
}

export function calculateCfitIq(rawTotal: number | null, birthDate: string | null | undefined, at: Date) {
  const age = calculateAgeAt(birthDate, at);
  const normCode = age ? getNormCode(age.totalMonths) : null;
  const { iq, category } = calculateCfitIqFromNorm(rawTotal, normCode);

  return {
    iq,
    category,
    normCode,
    ageYears: age?.years ?? null,
    ageMonths: age?.months ?? null,
  };
}
