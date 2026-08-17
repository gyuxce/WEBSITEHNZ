/** Pimsleur Language Aptitude Battery — soal (tanpa kunci) */

export type PimsleurOption = { label: string; value: string };

export type PimsleurQuestion = {
  id: string;
  section: 2 | 3 | 4 | 5 | 6;
  number: number;
  prompt: string;
  options: PimsleurOption[];
  hint?: string;
};

export const PIMSLEUR_DURATION_SEC = 30 * 60; // 30 menit
export const PIMSLEUR_MAX_SCORE = 101;

/** Audio path — upload file ke portal/public/audio/pimsleur/ */
export const PIMSLEUR_AUDIO = {
  section3: "/audio/pimsleur/section3.mp3",
  section4: "/audio/pimsleur/section4.mp3",
  section5: "/audio/pimsleur/section5.mp3",
  section6: "/audio/pimsleur/section6.mp3",
} as const;

export const PIMSLEUR_SECTIONS = [
  {
    id: 2 as const,
    title: "Tahap 2 — Minat",
    description: "Perkiraan minat belajar bahasa asing.",
    hasAudio: false,
    maxScore: 8,
  },
  {
    id: 3 as const,
    title: "Tahap 3 — Kosa Kata",
    description: "Pilih padanan kata yang paling sesuai. Putar audio, lalu jawab.",
    hasAudio: true,
    maxScore: 24,
  },
  {
    id: 4 as const,
    title: "Tahap 4 — Analisis Bahasa",
    description: "Terjemahkan kalimat berdasarkan daftar kata di bawah. Putar audio, lalu jawab.",
    hasAudio: true,
    maxScore: 15,
  },
  {
    id: 5 as const,
    title: "Tahap 5 — Diskriminasi Suara",
    description: "Dengarkan audio, lalu pilih jawaban yang sesuai.",
    hasAudio: true,
    maxScore: 30,
  },
  {
    id: 6 as const,
    title: "Tahap 6 — Asosiasi Sistem Suara",
    description: "Dengarkan audio, lalu pilih kata yang paling sesuai.",
    hasAudio: true,
    maxScore: 24,
  },
];

const s3 = (
  n: number,
  prompt: string,
  opts: [string, string, string, string],
  letterStart: "a" | "e",
): PimsleurQuestion => {
  const letters = letterStart === "a" ? ["a", "b", "c", "d"] : ["e", "f", "g", "h"];
  return {
    id: `s3-${n}`,
    section: 3,
    number: n,
    prompt,
    options: opts.map((label, i) => ({ label: `[${letters[i]}] ${label}`, value: letters[i].toUpperCase() })),
  };
};

const s4 = (
  n: number,
  prompt: string,
  opts: [string, string, string, string],
  letterStart: "a" | "e",
): PimsleurQuestion => {
  const letters = letterStart === "a" ? ["a", "b", "c", "d"] : ["e", "f", "g", "h"];
  return {
    id: `s4-${n}`,
    section: 4,
    number: n,
    prompt,
    options: opts.map((label, i) => ({ label: `[${letters[i]}] ${label}`, value: letters[i].toUpperCase() })),
  };
};

export const SECTION2_QUESTION: PimsleurQuestion = {
  id: "s2-1",
  section: 2,
  number: 1,
  prompt:
    "Kami ingin Anda memberi perkiraan seberapa minat Anda dalam mempelajari bahasa asing modern. Pertimbangkan seberapa berguna, seberapa menikmati, dan seberapa besar minat dibanding mata pelajaran lain.",
  options: [
    { label: "Sangat Tidak Tertarik", value: "0" },
    { label: "Kurang Tertarik", value: "2" },
    { label: "Sedikit Tertarik", value: "4" },
    { label: "Cukup Tertarik", value: "6" },
    { label: "Sangat Tertarik", value: "8" },
  ],
};

export const SECTION3_QUESTIONS: PimsleurQuestion[] = [
  s3(1, "Tidak berbuah", ["Disengaja", "Berhasil", "Beruntung", "Inefektif"], "a"),
  s3(2, "Riang", ["Muram", "Gembira", "Puas", "Lelah"], "e"),
  s3(3, "Bertenaga", ["Lemah", "Sakitan", "Kuat", "Waspada"], "a"),
  s3(4, "Jahat", ["Haus", "Baik", "Keji", "Dermawan"], "e"),
  s3(5, "Lincah", ["Semangat", "Cantik", "Jinak", "Muram"], "a"),
  s3(6, "Banyak mulut", ["Penjanji", "Berkelit", "Sulit", "Cerewet"], "e"),
  s3(7, "Kocak", ["Lama", "Bosan", "Riuh", "Spontan"], "a"),
  s3(8, "Besar hati", ["Bangga", "Ramah", "Ragu", "Tidak bahagia"], "e"),
  s3(9, "Lucu", ["Detail", "Aneh", "Lama", "Cemerlang"], "a"),
  s3(10, "Dikritik", ["Didukung", "Ditegur", "Disanjung", "Diperlama"], "e"),
  s3(11, "Ganjil", ["Terang", "Mitos", "Aneh", "Unik"], "a"),
  s3(12, "Murah hati", ["Sopan", "Kasar", "Membosankan", "Dermawan"], "e"),
  s3(13, "Gaduh", ["Keras", "Tenang", "Dendam", "Takut"], "a"),
  s3(14, "Lihai", ["Cemerlang", "Tangkas", "Ceroboh", "Lambat"], "e"),
  s3(15, "Gelisah", ["Lapar", "Lelah", "Lincah", "Berdebar"], "a"),
  s3(16, "Terpesona", ["Terangsang", "Terpuaskan", "Gundah", "Terhabiskan"], "e"),
  s3(17, "Biasa", ["Istimewa", "Lambat", "Berbeda", "Rata-rata"], "a"),
  s3(18, "Menyusut", ["Menghilang", "Meningkat", "Menurun", "Menyambung"], "e"),
  s3(19, "Lapang", ["Sempit", "Luas", "Kecil", "Resah"], "a"),
  s3(20, "Plinplan", ["Berubah", "Tetap", "Keras", "Tenang"], "e"),
  s3(21, "Bersahaja", ["Sombong", "Sederhana", "Geram", "Angkuh"], "a"),
  s3(22, "Ditertibkan", ["Dibujuk", "Dipilih", "Disopankan", "Dihukum"], "e"),
  s3(23, "Mereda", ["Menyebar", "Meningkat", "Menurun", "Memulai"], "a"),
  s3(24, "Tidak sepakat", ["Bantah", "Bela", "Hilang", "Turun"], "e"),
];

export const SECTION4_WORD_LIST = [
  "gade = ayah, seorang ayah",
  "shi = kuda, seekor kuda",
  "gade shir le = Ayah melihat seekor kuda",
  "gade shir la = Ayah telah melihat seekor kuda",
  "be = membawa",
  "so = Saya",
  "wo = Anda",
  "so shir le = Saya melihat seekor kuda",
  "sowle = Saya melihat Anda",
  "so shir lem = Saya tidak melihat seekor kuda",
];

export const SECTION4_QUESTIONS: PimsleurQuestion[] = [
  s4(1, "Ayah membawa seekor kuda", ["gade shir be", "gade shir ba", "shi gader be", "shi gader ba"], "a"),
  s4(2, "Ayah telah membawa seekor kuda", ["gade shir be", "gade shir ba", "shi gader be", "shi gader ba"], "e"),
  s4(3, "Seekor kuda telah membawa Ayah", ["gade shir be", "gade shir ba", "shi gader be", "shi gader ba"], "a"),
  s4(4, "Seekor kuda membawa Ayah", ["gade shir be", "gade shir ba", "shi gader be", "shi gader ba"], "e"),
  s4(5, "Anda membawa Saya", ["sowle", "sowbe", "wosle", "wosbe"], "a"),
  s4(6, "Anda telah melihat Ayah", ["wo gader le", "so gader le", "so gader la", "wo gader la"], "e"),
  s4(7, "Saya telah membawa Anda", ["wosba", "sowbe", "sowba", "sowla"], "a"),
  s4(8, "Anda telah membawa Ayah", ["wo gader ba", "wo gader be", "wo gade ba", "so gade be"], "e"),
  s4(9, "Anda telah melihat saya", ["sowla", "wosba", "wosla", "wosle"], "a"),
  s4(10, "Anda tidak membawa seekor kuda", ["wo shir lem", "wo shir bem", "wo shir bam", "wo shi bem"], "e"),
  s4(11, "Anda tidak melihat Saya", ["sowlem", "wosle", "wosolem", "woslem"], "a"),
  s4(12, "Saya tidak telah membawa Ayah", ["so gader bam", "so gade bam", "so gader bem", "so gader lam"], "e"),
  s4(13, "Anda telah melihat seekor kuda", ["wo shir le", "wo shir la", "wo shir be", "wo shir ba"], "a"),
  s4(14, "Saya tidak telah melihat Anda", ["woslam", "sowlam", "sowlem", "woslem"], "e"),
  s4(15, "Ayah tidak membawa seekor kuda", ["gade shir bem", "shir gader bem", "gade shi bem", "gade shir bam"], "a"),
];

export const SECTION5_QUESTIONS: PimsleurQuestion[] = Array.from({ length: 30 }, (_, i) => {
  const n = i + 1;
  const options =
    n <= 7
      ? [
          { label: "Kabin", value: "Kabin" },
          { label: "Boa", value: "Boa" },
        ]
      : n <= 15
        ? [
            { label: "Boa", value: "Boa" },
            { label: "Teman", value: "Teman" },
          ]
        : [
            { label: "Kabin", value: "Kabin" },
            { label: "Boa", value: "Boa" },
            { label: "Teman", value: "Teman" },
          ];
  return {
    id: `s5-${n}`,
    section: 5 as const,
    number: n,
    prompt: `Soal ${n} — dengarkan audio, lalu pilih jawaban`,
    options,
  };
});

const s6 = (n: number, opts: [string, string, string, string]): PimsleurQuestion => ({
  id: `s6-${n}`,
  section: 6,
  number: n,
  prompt: `Soal ${n} — dengarkan audio, pilih kata yang paling sesuai`,
  options: opts.map((label, i) => ({ label, value: String(i + 1) })),
});

export const SECTION6_QUESTIONS: PimsleurQuestion[] = [
  s6(1, ["snosfen", "sonsfen", "snosnef", "sonsnef"]),
  s6(2, ["tharksel", "thraksel", "thraskel", "tharskel"]),
  s6(3, ["tiksgel", "tigskel", "tiskgel", "tigksel"]),
  s6(4, ["nimbril", "minbirl", "nimbirl", "minbril"]),
  s6(5, ["thorlig", "throgil", "thorgil", "throlig"]),
  s6(6, ["rosktreg", "rostkreg", "roskstreg", "rotskreg"]),
  s6(7, ["afrep", "arfep", "afper", "arpef"]),
  s6(8, ["kalther", "klather", "kathler", "Klather"]),
  s6(9, ["wotner", "wontner", "wonter", "wentnor"]),
  s6(10, ["riilig", "rigiil", "riigiil", "riiliig"]),
  s6(11, ["tronbleg", "tornbleg", "trolbneg", "torlbneg"]),
  s6(12, ["klesket", "kelsket", "klekset", "kelkset"]),
  s6(13, ["widnt", "windt", "witnd", "wintd"]),
  s6(14, ["nasperdop", "napserdop", "napseprod", "naspeprod"]),
  s6(15, ["mazordli", "marzodli", "madorzli", "marodzli"]),
  s6(16, ["cheblogez", "cheboglez", "chelbogez", "chelgobez"]),
  s6(17, ["filsanter", "fislanter", "fislatner", "filslatner"]),
  s6(18, ["krimsloder", "krilsmoder", "klimsroder", "klidsmoder"]),
  s6(19, ["nasfoshan", "nafsoshan", "nashfosan", "nafshosan"]),
  s6(20, ["birilam", "bririlam", "birilnam", "bririlnam"]),
  s6(21, ["kriblaltos", "krilbaltos", "kirblaltos", "kirlbaltos"]),
  s6(22, ["saferkal", "sakerfal", "safekral", "sakrefal"]),
  s6(23, ["trazbimen", "trambizen", "tranbimez", "trazbinem"]),
  s6(24, ["tolandas", "todandlas", "toldandas", "tolandlas"]),
];

export function getQuestionsForSection(section: 2 | 3 | 4 | 5 | 6): PimsleurQuestion[] {
  switch (section) {
    case 2:
      return [SECTION2_QUESTION];
    case 3:
      return SECTION3_QUESTIONS;
    case 4:
      return SECTION4_QUESTIONS;
    case 5:
      return SECTION5_QUESTIONS;
    case 6:
      return SECTION6_QUESTIONS;
  }
}
