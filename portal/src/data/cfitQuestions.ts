export type CfitSubtestId = 1 | 2 | 3 | 4;

export type CfitAnswerMode = "single" | "multiple";

export type CfitAnswerValue = string | string[];

export type CfitAnswers = Record<string, CfitAnswerValue>;

export type CfitQuestion = {
  id: string;
  subtest: CfitSubtestId;
  number: number;
  imageSrc: string;
  options: string[];
  answerMode: CfitAnswerMode;
};

export type CfitSubtest = {
  id: CfitSubtestId;
  title: string;
  instruction: string;
  durationSeconds: number;
  answerMode: CfitAnswerMode;
  questions: CfitQuestion[];
};

const SINGLE_OPTIONS = ["A", "B", "C", "D", "E", "F"];
const MULTIPLE_OPTIONS = ["A", "B", "C", "D", "E", "F"];

export const CFIT_GENERAL_INSTRUCTIONS = [
  "Tes CFIT terbagi menjadi 4 subtes berurutan dengan waktu pengerjaan berbeda.",
  "Kerjakan sesuai urutan subtes yang tampil di layar.",
  "Pastikan jawaban benar-benar terisi sebelum lanjut. Jika waktu habis, sistem otomatis melanjutkan ke subtes berikutnya.",
  "Subtes 1 terdiri dari 13 soal selama 7 menit, Subtes 2 terdiri dari 14 soal selama 8 menit, Subtes 3 terdiri dari 13 soal selama 7 menit, dan Subtes 4 terdiri dari 10 soal selama 6.5 menit.",
];

export const CFIT_SUBTEST_GUIDE: Record<CfitSubtestId, string[]> = {
  1: [
    "Empat kotak di sebelah kiri adalah soal dan enam kotak di sebelah kanan adalah pilihan jawaban A-F.",
    "Tugas peserta adalah melengkapi kotak kosong dengan pilihan jawaban yang paling tepat.",
  ],
  2: [
    "Setiap soal menampilkan lima gambar: tiga gambar sama dan dua gambar berbeda.",
    "Tugas peserta adalah memilih dua gambar yang berbeda.",
  ],
  3: [
    "Setiap soal memiliki satu kotak besar berisi empat kotak kecil.",
    "Tugas peserta adalah mencari bagian yang hilang dari gambar tersebut.",
  ],
  4: [
    "Perhatikan hubungan pola pada gambar soal.",
    "Tugas peserta adalah memilih gambar yang sesuai dengan pola tersebut.",
  ],
};

function makeQuestions(
  subtest: CfitSubtestId,
  count: number,
  answerMode: CfitAnswerMode,
): CfitQuestion[] {
  return Array.from({ length: count }, (_, index) => {
    const number = index + 1;
    return {
      id: `cfit-s${subtest}-${number}`,
      subtest,
      number,
      imageSrc: `/cfit/subtes-${subtest}/q${String(number).padStart(2, "0")}.png`,
      options: answerMode === "multiple" ? MULTIPLE_OPTIONS : SINGLE_OPTIONS,
      answerMode,
    };
  });
}

export const CFIT_SUBTESTS: CfitSubtest[] = [
  {
    id: 1,
    title: "Subtes 1",
    instruction:
      "Lengkapi pola gambar dengan memilih satu jawaban yang paling tepat.",
    durationSeconds: 7 * 60,
    answerMode: "single",
    questions: makeQuestions(1, 13, "single"),
  },
  {
    id: 2,
    title: "Subtes 2",
    instruction:
      "Pilih dua gambar yang berbeda dari kelompok gambar yang tersedia.",
    durationSeconds: 8 * 60,
    answerMode: "multiple",
    questions: makeQuestions(2, 14, "multiple"),
  },
  {
    id: 3,
    title: "Subtes 3",
    instruction:
      "Pilih bagian yang paling tepat untuk melengkapi gambar utama.",
    durationSeconds: 7 * 60,
    answerMode: "single",
    questions: makeQuestions(3, 13, "single"),
  },
  {
    id: 4,
    title: "Subtes 4",
    instruction:
      "Pilih gambar yang paling sesuai dengan hubungan pola pada soal.",
    durationSeconds: 6 * 60 + 30,
    answerMode: "single",
    questions: makeQuestions(4, 10, "single"),
  },
];

export const CFIT_TOTAL_QUESTIONS = CFIT_SUBTESTS.reduce(
  (total, subtest) => total + subtest.questions.length,
  0,
);

export const CFIT_TOTAL_DURATION_SECONDS = CFIT_SUBTESTS.reduce(
  (total, subtest) => total + subtest.durationSeconds,
  0,
);

export const CFIT_ANSWER_KEYS: Partial<Record<string, CfitAnswerValue>> = {
  "cfit-s1-1": "B",
  "cfit-s1-2": "C",
  "cfit-s1-3": "B",
  "cfit-s1-4": "D",
  "cfit-s1-5": "E",
  "cfit-s1-6": "B",
  "cfit-s1-7": "D",
  "cfit-s1-8": "B",
  "cfit-s1-9": "F",
  "cfit-s1-10": "C",
  "cfit-s1-11": "B",
  "cfit-s1-12": "B",
  "cfit-s1-13": "E",
  "cfit-s2-1": ["B", "E"],
  "cfit-s2-2": ["A", "E"],
  "cfit-s2-3": ["A", "D"],
  "cfit-s2-4": ["C", "E"],
  "cfit-s2-5": ["B", "E"],
  "cfit-s2-6": ["A", "D"],
  "cfit-s2-7": ["B", "E"],
  "cfit-s2-8": ["B", "E"],
  "cfit-s2-9": ["A", "D"],
  "cfit-s2-10": ["B", "D"],
  "cfit-s2-11": ["A", "E"],
  "cfit-s2-12": ["C", "D"],
  "cfit-s2-13": ["B", "C"],
  "cfit-s2-14": ["A", "B"],
  "cfit-s3-1": "E",
  "cfit-s3-2": "E",
  "cfit-s3-3": "E",
  "cfit-s3-4": "B",
  "cfit-s3-5": "C",
  "cfit-s3-6": "D",
  "cfit-s3-7": "E",
  "cfit-s3-8": "E",
  "cfit-s3-9": "A",
  "cfit-s3-10": "A",
  "cfit-s3-11": "F",
  "cfit-s3-12": "C",
  "cfit-s3-13": "C",
  "cfit-s4-1": "B",
  "cfit-s4-2": "A",
  "cfit-s4-3": "D",
  "cfit-s4-4": "D",
  "cfit-s4-5": "A",
  "cfit-s4-6": "B",
  "cfit-s4-7": "C",
  "cfit-s4-8": "D",
  "cfit-s4-9": "A",
  "cfit-s4-10": "D",
};

function normalizeAnswer(value: CfitAnswerValue | undefined) {
  if (Array.isArray(value)) {
    return [...value].map((item) => item.toUpperCase()).sort().join("|");
  }
  return value?.toUpperCase() ?? "";
}

function scoreSubtest(subtest: CfitSubtest, answers: CfitAnswers) {
  const keyedQuestions = subtest.questions.filter((question) => CFIT_ANSWER_KEYS[question.id]);
  if (keyedQuestions.length !== subtest.questions.length) return null;

  return keyedQuestions.reduce((score, question) => {
    const expected = normalizeAnswer(CFIT_ANSWER_KEYS[question.id]);
    const actual = normalizeAnswer(answers[question.id]);
    return score + (expected === actual ? 1 : 0);
  }, 0);
}

export function calculateCfitRawScores(answers: CfitAnswers) {
  const rawSubtest1 = scoreSubtest(CFIT_SUBTESTS[0], answers);
  const rawSubtest2 = scoreSubtest(CFIT_SUBTESTS[1], answers);
  const rawSubtest3 = scoreSubtest(CFIT_SUBTESTS[2], answers);
  const rawSubtest4 = scoreSubtest(CFIT_SUBTESTS[3], answers);
  const scores = [rawSubtest1, rawSubtest2, rawSubtest3, rawSubtest4];

  return {
    rawSubtest1,
    rawSubtest2,
    rawSubtest3,
    rawSubtest4,
    rawTotal: scores.every((score) => typeof score === "number")
      ? scores.reduce((total, score) => total + (score ?? 0), 0)
      : null,
  };
}
