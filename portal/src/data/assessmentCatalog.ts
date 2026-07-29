export type AssessmentType = "cfit" | "papikostik";

export type AssessmentConfig = {
  type: AssessmentType;
  title: string;
  shortTitle: string;
  description: string;
  testType: "cfit" | "papikostik";
  route: string;
  progressField: "cfit_test_status" | "papikostik_test_status";
  durationSeconds: number;
  scoringMode: "correct" | "completion";
};

export const ASSESSMENTS: Record<AssessmentType, AssessmentConfig> = {
  cfit: {
    type: "cfit",
    title: "CFIT",
    shortTitle: "CFIT",
    description: "Tes kemampuan kognitif. Materi soal dan kunci jawaban diambil dari database.",
    testType: "cfit",
    route: "/test/cfit",
    progressField: "cfit_test_status",
    durationSeconds: 30 * 60,
    scoringMode: "correct",
  },
  papikostik: {
    type: "papikostik",
    title: "PAPI Kostick",
    shortTitle: "Papikostik",
    description: "Tes preferensi kerja. Materi soal dan interpretasi resmi diambil dari database.",
    testType: "papikostik",
    route: "/test/papikostik",
    progressField: "papikostik_test_status",
    durationSeconds: 45 * 60,
    scoringMode: "completion",
  },
};
