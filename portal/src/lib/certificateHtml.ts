export function buildCertificateHtml(params: {
  fullName: string;
  certificateCode: string;
  score: number;
  recommendation: string;
  issuedAt: string;
  programInterest?: string | null;
}): string {
  const { fullName, certificateCode, score, recommendation, issuedAt, programInterest } = params;
  const dateStr = new Date(issuedAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const scoreLabel =
    score >= 80 ? "Sangat Baik" : score >= 60 ? "Cukup Baik" : "Perlu Peningkatan";

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>Sertifikat Pemetaan — ${fullName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: #f8f9fa;
      padding: 32px;
      color: #0f2240;
    }
    .cert {
      max-width: 820px;
      margin: 0 auto;
      background: #fff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(15, 34, 64, 0.12);
      border: 1px solid rgba(15, 34, 64, 0.08);
    }
    .header {
      background: linear-gradient(135deg, #0f2240 0%, #1e355a 55%, #0f2240 100%);
      padding: 36px 40px 32px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .header::before {
      content: '';
      position: absolute;
      top: -40px; right: -40px;
      width: 160px; height: 160px;
      background: rgba(255, 179, 198, 0.15);
      border-radius: 50%;
    }
    .header::after {
      content: '';
      position: absolute;
      bottom: -30px; left: -30px;
      width: 120px; height: 120px;
      background: rgba(230, 25, 53, 0.12);
      border-radius: 50%;
    }
    .brand {
      font-family: 'Outfit', sans-serif;
      font-size: 32px;
      font-weight: 800;
      color: #fff;
      letter-spacing: -0.02em;
      position: relative;
    }
    .brand span { color: #e61935; }
    .subtitle {
      margin-top: 6px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.55);
      position: relative;
    }
    .accent-bar {
      height: 4px;
      background: linear-gradient(90deg, #e61935, #ffb3c6, #e61935);
    }
    .body { padding: 40px 48px 36px; text-align: center; }
    .label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #e61935;
    }
    .title {
      font-family: 'Outfit', sans-serif;
      font-size: 22px;
      font-weight: 700;
      color: #0f2240;
      margin-top: 8px;
    }
    .code {
      margin-top: 12px;
      font-family: monospace;
      font-size: 12px;
      color: rgba(15, 34, 64, 0.45);
      background: #f8f9fa;
      display: inline-block;
      padding: 4px 12px;
      border-radius: 99px;
    }
    .name {
      font-family: 'Outfit', sans-serif;
      font-size: 36px;
      font-weight: 800;
      color: #0f2240;
      margin: 28px 0 8px;
      line-height: 1.2;
    }
    .program {
      font-size: 13px;
      color: rgba(15, 34, 64, 0.5);
      margin-bottom: 28px;
    }
    .score-box {
      display: inline-flex;
      align-items: center;
      gap: 24px;
      background: linear-gradient(135deg, #fdeaec 0%, #fff 100%);
      border: 1px solid rgba(230, 25, 53, 0.15);
      border-radius: 16px;
      padding: 20px 36px;
      margin-bottom: 28px;
    }
    .score-num {
      font-family: 'Outfit', sans-serif;
      font-size: 48px;
      font-weight: 800;
      color: #e61935;
      line-height: 1;
    }
    .score-meta { text-align: left; }
    .score-meta .sl { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(15,34,64,0.45); }
    .score-meta .sv { font-size: 16px; font-weight: 700; color: #0f2240; margin-top: 2px; }
    .rec-box {
      text-align: left;
      background: #f8f9fa;
      border-left: 4px solid #e61935;
      border-radius: 0 12px 12px 0;
      padding: 20px 24px;
      margin-top: 8px;
    }
    .rec-box strong {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #0f2240;
    }
    .rec-box p {
      margin-top: 8px;
      font-size: 14px;
      line-height: 1.7;
      color: rgba(15, 34, 64, 0.7);
    }
    .footer {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid rgba(15, 34, 64, 0.08);
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .footer .date { font-size: 12px; color: rgba(15,34,64,0.45); text-align: left; }
    .footer .seal {
      width: 72px; height: 72px;
      border: 3px solid #e61935;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Outfit', sans-serif;
      font-size: 9px;
      font-weight: 800;
      color: #e61935;
      text-align: center;
      line-height: 1.3;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .tagline {
      font-size: 11px;
      color: rgba(15,34,64,0.35);
      margin-top: 4px;
    }
    @media print {
      body { padding: 0; background: #fff; }
      .cert { box-shadow: none; border: none; }
    }
  </style>
</head>
<body>
  <div class="cert">
    <div class="header">
      <div class="brand">Haru<span>No</span>Kaze</div>
      <div class="subtitle">Portal Pemetaan Potensi</div>
    </div>
    <div class="accent-bar"></div>
    <div class="body">
      <p class="label">Sertifikat</p>
      <h1 class="title">Pemetaan Potensi Karier Jepang</h1>
      <p class="code">${certificateCode}</p>
      <p class="name">${fullName}</p>
      ${programInterest ? `<p class="program">Program minat: ${programInterest}</p>` : ""}
      <div class="score-box">
        <div class="score-num">${score}</div>
        <div class="score-meta">
          <div class="sl">Skor Tes Bahasa</div>
          <div class="sv">${scoreLabel} · /100</div>
        </div>
      </div>
      <div class="rec-box">
        <strong>Rekomendasi Jalur</strong>
        <p>${recommendation}</p>
      </div>
      <div class="footer">
        <div>
          <div class="date">Diterbitkan: ${dateStr}</div>
          <div class="tagline">harunokaze.id · Ekosistem Karier Jepang</div>
        </div>
        <div class="seal">HNZ<br/>Verified</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}
