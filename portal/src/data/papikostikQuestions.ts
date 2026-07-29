export type PapiChoice = "A" | "B";

export type PapiFactorCode =
  | "N" | "G" | "A"
  | "L" | "P" | "I"
  | "T" | "V"
  | "X" | "S" | "B" | "O"
  | "R" | "D" | "C"
  | "Z" | "E" | "K"
  | "F" | "W";

export type PapiQuestion = {
  id: string;
  number: number;
  optionA: string;
  optionB: string;
  factorA: PapiFactorCode;
  factorB: PapiFactorCode;
};

export type PapiAnswers = Record<string, PapiChoice>;

export type PapiFactor = {
  code: PapiFactorCode;
  name: string;
  aspect: string;
};

export const PAPI_DURATION_SECONDS = 20 * 60;

export const PAPI_FACTORS: PapiFactor[] = [
  { code: "N", name: "Penyelesaian secara prestasi", aspect: "Arah kerja" },
  { code: "G", name: "Peranan sebagai pekerja keras", aspect: "Arah kerja" },
  { code: "A", name: "Hasrat untuk berprestasi", aspect: "Arah kerja" },
  { code: "L", name: "Peran sebagai pimpinan", aspect: "Kepemimpinan" },
  { code: "P", name: "Pengendalian orang lain", aspect: "Kepemimpinan" },
  { code: "I", name: "Mudah dalam mengambil keputusan", aspect: "Kepemimpinan" },
  { code: "T", name: "Tipe selalu sibuk", aspect: "Aktivitas" },
  { code: "V", name: "Tipe yang bersemangat", aspect: "Aktivitas" },
  { code: "X", name: "Kebutuhan untuk mendapatkan perhatian", aspect: "Pergaulan" },
  { code: "S", name: "Pergaulan luas", aspect: "Pergaulan" },
  { code: "B", name: "Kebutuhan berkelompok", aspect: "Pergaulan" },
  { code: "O", name: "Kebutuhan untuk dekat dan menyayangi", aspect: "Pergaulan" },
  { code: "R", name: "Tipe teoritikal", aspect: "Gaya kerja" },
  { code: "D", name: "Suka pekerjaan yang terperinci", aspect: "Gaya kerja" },
  { code: "C", name: "Tipe teratur", aspect: "Gaya kerja" },
  { code: "Z", name: "Hasrat untuk berubah", aspect: "Sifat" },
  { code: "E", name: "Pengendalian emosi", aspect: "Sifat" },
  { code: "K", name: "Agresi", aspect: "Sifat" },
  { code: "F", name: "Dukungan terhadap atasan", aspect: "Ketaatan" },
  { code: "W", name: "Kebutuhan taat pada aturan dan pengarahan", aspect: "Ketaatan" },
];

const PAPI_ROWS: Array<[number, string, string, PapiFactorCode, PapiFactorCode]> = [
  [1, "Saya seorang pekerja keras", "saya bukan seorang pemurung", "G", "E"],
  [2, "Saya suka bekerja lebih baik dari yang lain", "Saya suka menekunipekerjaan yang saya lakukan sampai selesai", "A", "N"],
  [3, "Saya suka menunjukkan orang bagaimana melakukan hal-hal", "Saya ingin berbuat sebaik mungkin", "P", "A"],
  [4, "Saya suka melakukan hal-hal yang lucu", "Saya senang memberitahukan orang apa yang harus dikerjakan", "X", "P"],
  [5, "Saya suka bergabung dalam kelompok", "Saya suka jika diperhatikan oleh kelompok", "B", "X"],
  [6, "Saya suka membuat teman pribadi yang dekat", "Saya suka berteman dengan suatu kelompok", "O", "B"],
  [7, "Saya cepat berubah jika saya rasa diperlukan", "Saya berusaha membuat teman-teman pribadi yang dekat", "Z", "O"],
  [8, "Saya suka membalas jika saya disakiti", "Saya suka melakukan hal-hal baru yang berbeda", "K", "Z"],
  [9, "Saya ingin agar atasan menyukai saya", "Saya sukar memberitahu orang jika mereka salah", "F", "K"],
  [10, "Saya suka memberi petunjuk-petunjuk yang diberikan kepada saya", "Saya suka menyenangkan atasan", "W", "F"],
  [11, "Saya berusaha sangat keras", "Saya seorang yang teratur, menaruh barang ditempatnya", "G", "C"],
  [12, "Saya dapat membuat orang melakukan yang saya inginkan", "Saya tidak mudah marah", "L", "E"],
  [13, "Saya suka memberitahu kelompok apa yang harus dikerjakan", "Saya selalu menekuni suatu pekerjaan sampai selesai", "P", "N"],
  [14, "Saya ingin mendebarkan (exiting) dan menarik", "Saya ingin menjadi orang yang sangat berhasil", "X", "A"],
  [15, "Saya ingin sesuai dan diterima dalam kelompok", "Saya suka membantu orang lain mengambil keputusan", "B", "P"],
  [16, "Saya cemas bila seseorang tidak menyukai saya", "Saya suka orang memperhatikan saya", "O", "X"],
  [17, "Saya suka mencoba hal-hal baru", "Saya lebih suka bekerja bersama orang lain daripada diri sendiri", "Z", "B"],
  [18, "Saya kadang-kadang menyalahkan orang lain jika terjadi kesalahan", "Saya merasa terganggu jika ada yang tidak menyukai saya", "K", "O"],
  [19, "Saya suka menyenangkan atasan", "Saya merasa terganggu jika ada yang tidak menyukai saya", "F", "Z"],
  [20, "Saya menyukai petunjuk-petunjuk terperinci dalam menyelesaikan sesuatu", "Bila saya terganggu oleh siapa pun, saya akan memberitahu", "W", "K"],
  [21, "Saya selalu berusaha keras", "Saya suka melaksanakan tiap langkah dengan hati-hati", "G", "D"],
  [22, "Saya akan menjadi seorang pimpinan yang baik", "Saya dapat mengorganisir suatu pekerjaan dengan baik", "L", "C"],
  [23, "Saya mudah tersinggung", "Saya lambat dalam membuat keputusan", "I", "E"],
  [24, "Saya suka mengerjakan beberapa pekerjaan sekaligus", "Bila saya berada dalam suatu kelompok saya suka berdiam diri", "X", "N"],
  [25, "Saya sangat suka bila saya diundang", "Saya ingin lebih baik dari yang lain dalam mengerjakan sesuatu", "B", "A"],
  [26, "Saya suka membuat teman-teman pribadi menjadi dekat", "Saya suka menasihati orang lain", "O", "P"],
  [27, "Saya suka melakukan hal-hal yang baru dan berbeda", "Saya suka menceritakan bagaimana saya berhasil melakukan sesuatu", "Z", "X"],
  [28, "Bila saya betul, saya suka mempertahankannya", "Saya ingin diterima dan diakui dalam suatu kelompok", "K", "B"],
  [29, "Saya menghindari menjadi seorang yang berbeda", "Saya berusaha menjadi sangat dekat dengan orang", "F", "O"],
  [30, "Saya senang diberitahu bagaimana melakukan suatu pekerjaan", "Saya mudah bosan", "W", "Z"],
  [31, "Saya bekerja keras", "Saya banyak berpikir dan merencana", "G", "R"],
  [32, "Saya memimpin kelompok", "detil (hal-hal kecil) menarik bagi saya", "L", "D"],
  [33, "Saya dapat mengambil keputusan secara mudah dan cepat", "saya menyimpan barang-barang saya secara rapi & teratur", "I", "C"],
  [34, "Saya cepat dalam melaksanakan suatu pekerjaan", "Saya tidak sering marah atau sedih", "T", "E"],
  [35, "saya ingin menjadi bagian dari kelompok", "saya ingin melakukan suatu pekerjaan pada suatu saat", "B", "N"],
  [36, "Saya berusaha membuat teman dekat", "Saya suka bertanggung jawab bagi orang lain", "O", "A"],
  [37, "Saya suka mode yang terbaru untuk pakaian & mobil", "Saya suka bertanggung jawab bagi orang lain", "Z", "P"],
  [38, "Saya menyukai perdebatan", "Saya tertarik menjadi bagian dari kelompok", "K", "X"],
  [39, "Saya suka menyenangkan atasan", "Saya tertarik menjadi bagian dari kelompok", "F", "B"],
  [40, "Saya suka mengikuti peraturan dengan hati-hati", "Saya suka orang mengenal saya dengan baik", "W", "O"],
  [41, "Saya berusaha sangat keras", "Saya mempunyai sifat bersahabat", "G", "S"],
  [42, "Orang berpendapat bahwa saya pemimpin yang baik", "Saya berpikir panjang & berhati-hati", "L", "R"],
  [43, "Saya sering mengambil kesempatan", "Saya senang mengurusi hal-hal kecil", "I", "D"],
  [44, "Orang berpendapat bahwa saya bekerja cepat", "Orang berpendapat bahwa saya rapi & teratur", "T", "C"],
  [45, "Saya senang berolah raga", "Saya mempunyai pribadi yang menyenangkan", "V", "E"],
  [46, "Saya senang jika orang dekat & bersahabat dengan saya", "Saya selalu berusaha menyelesaikan sesuatu yang saya mulai", "O", "N"],
  [47, "Saya senang bereksperimen dan mencoba hal-hal baru", "Saya suka melaksanakan suatu pekerjaan suit dengan baik", "Z", "A"],
  [48, "Saya suka diperlakukan secara adil", "Saya suka memberitahukan orang llain bagaimana melakukan sesuatu", "K", "P"],
  [49, "Saya suka melakukan apa yang diharapkan dari saya", "Saya suka memperoleh perhatian", "F", "X"],
  [50, "Saya suka petunjuk-petunjuk terperinci dalam melaksanakan suatu pekerjaan", "Saya suka berada bersama orang-orang", "W", "B"],
  [51, "Saya selalu berusaha menyelesaikan pekerjaan secara sempurna", "Orang mengatakan bahwa saya tidak mengalami lelah", "G", "V"],
  [52, "Saya tipe pemimpin", "Saya mudah berteman", "L", "S"],
  [53, "Saya mengambil spekulasi", "Saya banyak sekali berpikir", "I", "R"],
  [54, "Saya bekerja dengan kecepatan yang teratur", "Saya bekerja dengan hal-hal kecil/terperinci", "T", "D"],
  [55, "Saya suka menyimpan banyak tenaga untuk berolahraga", "Saya suka menyimpan barang-barang secara rapi & teratur", "V", "C"],
  [56, "Saya dapat bergaul dengan semua orang", "Saya seorang yang even tempered (berwatak tenang)", "S", "E"],
  [57, "Saya ingin bertemu dengan orang-orang baru & melakukan hal-hal baru", "Saya selalu ingin menyelesaikan pekerjaan yang telah saya mulai", "Z", "N"],
  [58, "Saya biasanya mempertahankan pendapat yang saya yakini", "Saya biasanya suka bekerja keras", "K", "A"],
  [59, "Saya suka saran-saran dari orang-orang yang saya kagumi", "Saya suka melayani orang-orang yang berwenang terhadap saya", "F", "P"],
  [60, "Saya biarkan diri saya banyak dipengaruhi oleh orang lain", "Saya suka bila mendapat banyak perhatian", "W", "X"],
  [61, "Saya biasanya bekerja sangat keras", "Saya biasanya bekerja cepat", "G", "T"],
  [62, "Apabila saya bicara, kelompok mendengarkan", "Saya terampil dengan perkakas (alat-alat)", "L", "V"],
  [63, "Saya lambat dalam membuat teman", "Saya lambat dalam mengambil keputusan", "I", "S"],
  [64, "Saya biasanya makan secara cepat", "Saya suka membaca", "T", "R"],
  [65, "Saya suka pekerjaan dimana saya banyak bergerak", "Saya suka pekerjaan yang harus dilaksanakan hati-hati", "V", "D"],
  [66, "Saya membuat sebanyak mungkin teman", "Saya menemukan kembali apa yang saya simpan", "S", "C"],
  [67, "Saya merencanakan jauh-jauh sebelumnya", "Saya selalu menyenangkan", "R", "E"],
  [68, "Saya mempertahankan dengan bangga nama baik saya", "Saya terus menekuni suatu masalah sampai selesai", "K", "N"],
  [69, "Saya suka menyenangkan orang-orang yang saya kagumi", "saya ingin sukses", "F", "A"],
  [70, "Saya suka orang lain yang membuat keputusan-keputusan untuk kelompok", "Saya suka membuat keputusan-keputusan untuk kelompok", "W", "P"],
  [71, "Saya selalu berusaha keras", "Saya mengambil keputusan secara cepat dan mudah", "G", "I"],
  [72, "Kelompok biasanya melakukan apa yang saya inginkan", "Saya biasanya bekerja cepat", "L", "T"],
  [73, "Saya sering merasa lelah", "Saya lambat dalam mengambil keputusan", "I", "V"],
  [74, "Saya bekerja cepat", "Saya mudah berteman", "T", "S"],
  [75, "Saya biasanya mempunyai gairah dan tenaga", "Saya banyak menghabiskan waktu dengan berpikir", "V", "R"],
  [76, "Saya sangat ramah terhadap orang", "Saya suka pekerjaan yang memerlukan ketelitian", "S", "D"],
  [77, "Saya banyak berpikir dan merencana", "Saya menyimpan segala sesuatu pada tempatnya", "R", "C"],
  [78, "Saya suka pekerjaan yang menuntut hal-hal terperinci", "Saya tidak mudah marah", "D", "E"],
  [79, "Saya suka menurut orang yang saya kagumi", "Saya selalu menyelesaikan pekerjaan yang telah saya mulai", "F", "N"],
  [80, "Saya suka petunjuk-petunjuk yang jelas", "Saya suka bekerja keras", "W", "A"],
  [81, "Saya mengejar apa yang saya inginkan", "Saya seorang pemimpin yang baik", "G", "L"],
  [82, "Saya dapat membuat orang lain bekerja keras", "Saya seorang bertipe santai tapi beruntung", "L", "I"],
  [83, "Saya mengambil keputusan secara tepat", "Saya bicara dengan cepat", "I", "T"],
  [84, "Saya biasanya bekerja cepat", "Saya berolahraga secara teratur", "T", "V"],
  [85, "Saya tidak suka bertemu orang", "Saya cepat merasa lelah", "V", "S"],
  [86, "Saya membuat banyak sekali teman", "Saya banyak menghabiskan waktu dengan berpikir", "S", "R"],
  [87, "Saya suka bekerja dengan teori", "Saya suka bekerja dengan hal-hal terperinci", "R", "D"],
  [88, "Saya suka bekerja dengan hal-hal terperinci", "Saya suka mengorganisir pekerjaan saya", "D", "C"],
  [89, "Saya menaruh barang pada tempatnya", "Saya selalu menyenangkan", "C", "E"],
  [90, "Saya suka diberitahu tentang apa yang perlu saya lakukan", "Saya harus menyelesaikan apa yang saya mulai", "W", "N"],
];

export const PAPI_QUESTIONS: PapiQuestion[] = PAPI_ROWS.map(
  ([number, optionA, optionB, factorA, factorB]) => ({
    id: `papi-${number}`,
    number,
    optionA,
    optionB,
    factorA,
    factorB,
  }),
);

const TOP_TOTAL_FACTORS: PapiFactorCode[] = ["G", "L", "I", "T", "V", "S", "R", "D", "C", "E"];
const BOTTOM_TOTAL_FACTORS: PapiFactorCode[] = ["N", "A", "P", "X", "B", "O", "Z", "K", "F", "W"];

export function getPapiAnalysis(code: PapiFactorCode, score: number) {
  switch (code) {
    case "N":
      if (score <= 3) return "Cenderung ragu-ragu dalam situasi pengambilan keputusan, menunda atau menghindari situasi pengambilan keputusan";
      if (score <= 4) return "Berhati-hati dan cenderung ragu-ragu";
      if (score <= 6) return "Cukup bertanggung jawab terhadap pekerjaan";
      return "Ketekunan, tanggung jawab terhadap tugas tinggi";
    case "G":
      return score <= 4
        ? "Bekerja hanya untuk mengejar kesenangan saja bukan untuk memberikan suatu hasil yang baik"
        : "Kemauan bekerja keras tinggi";
    case "A":
      return score <= 5
        ? "Mencerminkan ketidakpastian tujuan dan kepuasan dalam pekerjaan tanpa perlu melanjutkan usaha untuk sukses"
        : "Tujuan didefinisikan secara jelas, kebutuhan untuk sukses tinggi, ambisi pribadi tinggi";
    case "L":
      return score <= 4
        ? "Cenderung tidak suka aktif menggunakan orang lain dalam bekerja"
        : "Memproyeksikan diri sebagai pemimpin dan mencoba menggunakan orang lain untuk mencapai tujuan";
    case "P":
      return score <= 4
        ? "Menurunnya keinginan untuk bertanggung jawab terhadap pekerjaan dan tindakan orang lain"
        : "Kebutuhan menerima tanggung jawab orang lain dan menjadi orang yang bertanggung jawab";
    case "I":
      if (score <= 3) return "Ragu-ragu sampai penundaan atau menolak situasi pengambilan keputusan";
      if (score <= 4) return "Berhati-hati sampai ragu-ragu dalam membuat keputusan";
      if (score <= 7) return "Mudah dan lancar sampai berhati-hati dalam membuat keputusan";
      return "Tidak ragu-ragu dalam proses pengambilan keputusan";
    case "T":
      return score <= 3 ? "Melakukan segala sesuatu menurut kemauannya sendiri" : "Tergolong aktif secara internal dan mental";
    case "V":
      return score <= 4
        ? "Keaktifannya tergolong rendah, cenderung pasif"
        : "Keaktifannya secara fisik tergolong agak baik, cenderung tipe sportif";
    case "X":
      if (score <= 1) return "Cenderung pemalu, suka menyendiri";
      if (score <= 3) return "Rendah hati, tulus";
      if (score <= 5) return "Khusus, memiliki pola yang nyata";
      return "Membutuhkan perhatian yang nyata";
    case "S":
      return score <= 5
        ? "Memiliki penilaian yang rendah terhadap hubungan sosial, cenderung kurang percaya pada orang lain"
        : "Tingkat kepercayaan dalam hubungan sosial tinggi, menyukai interaksi sosial";
    case "B":
      if (score <= 3) return "Selektif, secara umum melepaskan diri dari kelompok";
      if (score <= 5) return "Ada kebutuhan untuk diterima dan diakui tetapi tidak terlalu mudah dipengaruhi kelompok";
      return "Kebutuhan untuk disukai dan diakui oleh semua orang. Mudah dipengaruhi kelompok";
    case "O":
      if (score <= 2) return "Tidak menyukai hubungan antar pribadi dan interaksi perseorangan";
      if (score <= 4) return "Sadar akan kebutuhan antar pribadi tetapi dapat melepaskan diri dari orang lain";
      return "Ketergantungan yang sangat besar akan pengakuan dan penerimaan diri";
    case "R":
      return score <= 4 ? "Kurang perhatian-praktis" : "Penekanan pada nilai-nilai penalaran tergolong tinggi";
    case "D":
      return score <= 3
        ? "Menyadari kebutuhan akan kecermatan tetapi secara pribadi tidak berminat menangani hal-hal detail"
        : "Minat menangani hal-hal detail tergolong tinggi";
    case "C":
      if (score <= 2) return "Fleksibilitas sampai ketidak-teraturan";
      if (score <= 5) return "Tergolong teratur tetapi dengan fleksibilitas";
      return "Memiliki keteraturan yang sangat tinggi, cenderung kaku";
    case "Z":
      if (score <= 2) return "Tidak menyukai dan menolak perubahan. Cenderung menggunakan pendekatan tradisional";
      if (score <= 4) return "Tidak suka akan perubahan jika dipaksakan kepadanya";
      if (score <= 6) return "Mudah menyesuaikan diri";
      if (score <= 7) return "Pembuat perubahan yang selektif. Berpikir jauh ke depan";
      return "Mudah gelisah, mudah frustrasi karena segala sesuatu bergerak tidak cukup cepat";
    case "E":
      if (score <= 1) return "Terbuka, cepat bereaksi, tidak memikirkan nilai dalam pengendalian diri";
      if (score <= 3) return "Terbuka";
      if (score <= 6) return "Memiliki pendekatan emosional yang seimbang. Mampu mengendalikan perasaannya";
      return "Sangat menempatkan nilai-nilai dalam aktivitasnya dan memiliki kebutuhan pengendalian diri berlebih";
    case "K":
      if (score <= 2) return "Menghindari masalah dan cenderung menolak mengenali sesuatu sebagai masalah";
      if (score <= 4) return "Lebih menyukai lingkungan yang tenang, menghindari konflik, cenderung menunda masalah";
      if (score <= 5) return "Kukuh pendirian, cenderung keras kepala";
      if (score <= 7) return "Agresi pribadi yang berkaitan dengan pekerjaan, dorongan dan semangat bersaing";
      return "Agresif, cenderung defensif";
    case "F":
      if (score <= 1) return "Cenderung egois, kemungkinan bisa bersikap memberontak";
      if (score <= 3) return "Mengurus kepentingan diri sendiri";
      if (score <= 5) return "Setia terhadap perusahaan";
      return "Bersikap setia dan membantu secara pribadi, ada kemungkinan bantuannya bermotivasi politis";
    case "W":
      if (score <= 3) return "Berorientasi pada tujuan, mandiri";
      if (score <= 5) return "Kebutuhan akan pengarahan dan harapan yang dirumuskan untuknya";
      return "Meningkatnya orientasi terhadap tugas dan membutuhkan instruksi yang jelas";
  }
}

export function calculatePapiScores(answers: PapiAnswers) {
  const scores = Object.fromEntries(PAPI_FACTORS.map((factor) => [factor.code, 0])) as Record<PapiFactorCode, number>;

  for (const question of PAPI_QUESTIONS) {
    const answer = answers[question.id];
    if (answer === "A") scores[question.factorA] += 1;
    if (answer === "B") scores[question.factorB] += 1;
  }

  const analyses = Object.fromEntries(
    PAPI_FACTORS.map((factor) => [
      factor.code,
      {
        ...factor,
        score: scores[factor.code],
        analysis: getPapiAnalysis(factor.code, scores[factor.code]),
      },
    ]),
  );
  const totalTop = TOP_TOTAL_FACTORS.reduce((sum, code) => sum + scores[code], 0);
  const totalBottom = BOTTOM_TOTAL_FACTORS.reduce((sum, code) => sum + scores[code], 0);

  return {
    scores,
    analyses,
    totalTop,
    totalBottom,
    totalAll: totalTop + totalBottom,
    isCompletePattern: totalTop === 45 && totalBottom === 45,
  };
}
