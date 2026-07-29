import { PAPI_FACTORS, type PapiFactorCode } from "../data/papikostikQuestions";

type PapiProfileChartProps = {
  scores: Partial<Record<PapiFactorCode, number>>;
};

const ASPECT_COLORS: Record<string, string> = {
  "Arah kerja": "#c53030",
  Kepemimpinan: "#b7791f",
  Aktivitas: "#2f855a",
  Pergaulan: "#2b6cb0",
  "Gaya kerja": "#6b46c1",
  Sifat: "#c05621",
  Ketaatan: "#2c7a7b",
};

const SIZE = 520;
const CENTER = SIZE / 2;
const RADIUS = 176;
const LABEL_RADIUS = 211;
const MAX_SCORE = 9;

function polarPoint(radius: number, index: number) {
  const angle = -Math.PI / 2 + (index / PAPI_FACTORS.length) * Math.PI * 2;
  return {
    x: CENTER + Math.cos(angle) * radius,
    y: CENTER + Math.sin(angle) * radius,
  };
}

function pointsForRadius(radius: number) {
  return PAPI_FACTORS.map((_, index) => {
    const point = polarPoint(radius, index);
    return `${point.x},${point.y}`;
  }).join(" ");
}

export function PapiProfileChart({ scores }: PapiProfileChartProps) {
  const profilePoints = PAPI_FACTORS.map((factor, index) => {
    const score = Math.max(0, Math.min(MAX_SCORE, scores[factor.code] ?? 0));
    return polarPoint((score / MAX_SCORE) * RADIUS, index);
  });

  return (
    <section className="rounded-2xl border border-brand-navy/8 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-brand-navy">Profil PAPI Kostick</h2>
          <p className="mt-1 text-sm text-brand-navy/50">20 faktor · skala 0–9</p>
        </div>
        <div className="rounded-full bg-brand-bg px-3 py-1.5 text-xs font-semibold text-brand-navy/55">
          Bantuan pembacaan pola
        </div>
      </div>

      <div className="mt-5 grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="mx-auto w-full max-w-[560px]">
          <svg
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="h-auto w-full"
            role="img"
            aria-label="Grafik profil 20 faktor PAPI Kostick"
          >
            {[3, 6, 9].map((level) => (
              <polygon
                key={level}
                points={pointsForRadius((level / MAX_SCORE) * RADIUS)}
                fill="none"
                stroke="#d9e0e7"
                strokeWidth="1"
              />
            ))}

            {PAPI_FACTORS.map((factor, index) => {
              const edge = polarPoint(RADIUS, index);
              return (
                <line
                  key={factor.code}
                  x1={CENTER}
                  y1={CENTER}
                  x2={edge.x}
                  y2={edge.y}
                  stroke="#e7ebef"
                  strokeWidth="1"
                />
              );
            })}

            <polygon
              points={profilePoints.map((point) => `${point.x},${point.y}`).join(" ")}
              fill="#c5303020"
              stroke="#c53030"
              strokeWidth="3"
              strokeLinejoin="round"
            />

            {PAPI_FACTORS.map((factor, index) => {
              const score = scores[factor.code] ?? 0;
              const point = profilePoints[index];
              const label = polarPoint(LABEL_RADIUS, index);
              const anchor = label.x < CENTER - 8 ? "end" : label.x > CENTER + 8 ? "start" : "middle";
              return (
                <g key={factor.code}>
                  <circle cx={point.x} cy={point.y} r="4" fill="#c53030" stroke="white" strokeWidth="2" />
                  <text
                    x={label.x}
                    y={label.y - 2}
                    textAnchor={anchor}
                    fill={ASPECT_COLORS[factor.aspect]}
                    fontSize="14"
                    fontWeight="800"
                  >
                    {factor.code}
                  </text>
                  <text
                    x={label.x}
                    y={label.y + 13}
                    textAnchor={anchor}
                    fill="#64748b"
                    fontSize="11"
                    fontWeight="700"
                  >
                    {score}
                  </text>
                </g>
              );
            })}

            {[0, 3, 6, 9].map((level) => {
              const point = polarPoint((level / MAX_SCORE) * RADIUS, 0);
              return (
                <text key={level} x={point.x + 5} y={point.y - 3} fill="#94a3b8" fontSize="10">
                  {level}
                </text>
              );
            })}
          </svg>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          {Object.entries(ASPECT_COLORS).map(([aspect, color]) => (
            <div key={aspect} className="flex items-center gap-2 text-xs text-brand-navy/65">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span>{aspect}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
