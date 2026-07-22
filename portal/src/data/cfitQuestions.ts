/** CFIT 3A — soal (tanpa kunci). Gambar dari form Google Screenshots. */

export type CfitChoiceMode = "single" | "multi2";

export type CfitSubtestId = 1 | 2 | 3 | 4;

export type CfitQuestion = {
  id: string;
  subtest: CfitSubtestId;
  number: number;
  imageSrc: string;
  choiceMode: CfitChoiceMode;
  options: string[];
};

export type CfitSubtestMeta = {
  id: CfitSubtestId;
  title: string;
  description: string;
  durationSec: number;
  questionCount: number;
  choiceMode: CfitChoiceMode;
  options: string[];
};

/** Halaman PNG yang berisi soal (sering 2 soal / halaman). */
const PAGE_MAP: Record<CfitSubtestId, Record<number, number>> = {
  1: {
    1: 2, 2: 2, 3: 3, 4: 3, 5: 4, 6: 4, 7: 5, 8: 5, 9: 6, 10: 6, 11: 7, 12: 7, 13: 8,
  },
  2: {
    1: 2, 2: 2, 3: 3, 4: 3, 5: 4, 6: 4, 7: 5, 8: 5, 9: 6, 10: 6, 11: 7, 12: 7, 13: 8, 14: 8,
  },
  3: {
    1: 2, 2: 2, 3: 3, 4: 3, 5: 4, 6: 4, 7: 5, 8: 5, 9: 6, 10: 6, 11: 7, 12: 7, 13: 8,
  },
  4: {
    1: 2, 2: 2, 3: 3, 4: 3, 5: 4, 6: 4, 7: 5, 8: 5, 9: 6, 10: 6,
  },
};

function pagePath(subtest: CfitSubtestId, page: number) {
  return `/cfit/s${subtest}/page-${String(page).padStart(2, "0")}.png`;
}

export const CFIT_SUBTESTS: CfitSubtestMeta[] = [
  {
    id: 1,
    title: "Subtes 1 — Series",
    description: "Pilih satu jawaban (A–F) yang melanjutkan deret.",
    durationSec: 3 * 60,
    questionCount: 13,
    choiceMode: "single",
    options: ["A", "B", "C", "D", "E", "F"],
  },
  {
    id: 2,
    title: "Subtes 2 — Classifications",
    description: "Pilih tepat dua jawaban (mis. B dan E) yang paling cocok.",
    durationSec: 4 * 60,
    questionCount: 14,
    choiceMode: "multi2",
    options: ["A", "B", "C", "D", "E"],
  },
  {
    id: 3,
    title: "Subtes 3 — Matrices",
    description: "Pilih satu jawaban (A–F) yang melengkapi matriks.",
    durationSec: 3 * 60,
    questionCount: 13,
    choiceMode: "single",
    options: ["A", "B", "C", "D", "E", "F"],
  },
  {
    id: 4,
    title: "Subtes 4 — Conditions",
    description: "Pilih satu jawaban (A–E) sesuai kondisi gambar.",
    durationSec: 150,
    questionCount: 10,
    choiceMode: "single",
    options: ["A", "B", "C", "D", "E"],
  },
];

export const CFIT_MAX_RAW = 50;

export function getQuestionsForSubtest(subtest: CfitSubtestId): CfitQuestion[] {
  const meta = CFIT_SUBTESTS.find((s) => s.id === subtest)!;
  const pages = PAGE_MAP[subtest];
  return Array.from({ length: meta.questionCount }, (_, i) => {
    const number = i + 1;
    return {
      id: `s${subtest}_q${number}`,
      subtest,
      number,
      imageSrc: pagePath(subtest, pages[number] ?? 2),
      choiceMode: meta.choiceMode,
      options: meta.options,
    };
  });
}
