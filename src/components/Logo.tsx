interface LogoProps {
  size?: number;
  layout?: "horizontal" | "vertical" | "emblem";
  theme?: "default" | "light-text";
  className?: string;
}

export function Logo({ size = 40, layout = "horizontal", theme = "default", className = "" }: LogoProps) {
  const navyColor = theme === "default" ? "#0F2240" : "#FFFFFF";
  const redColor = "#E61935";
  const textClass = theme === "default" ? "text-brand-navy" : "text-white";

  const emblem = (
    <svg viewBox="0 0 100 100" width={size} height={size} fill="none" className="shrink-0">
      <circle cx="58" cy="42" r="34" fill={redColor} />
      <circle cx="42" cy="58" r="34" stroke={navyColor} strokeWidth="4.5" fill="none" />
      <path
        d="M33,40 C33,35 48,22 62,35 C70,42.5 86,30 84,48 C82,62 60,65 42,58 C32.5,54.3 33,44 33,40"
        fill="white"
        stroke={redColor}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M66,48 C69,48 72,52 70,55 C67.5,58.5 61,54 62,50 C63,46 68,44 71,46"
        stroke={redColor}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path d="M35,32 Q45,21 55,27" stroke={navyColor} strokeWidth="3" strokeLinecap="round" />
      <path d="M32,45 Q42,32 52,38" stroke={navyColor} strokeWidth="3" strokeLinecap="round" />
      <path d="M58,58 Q66,66 74,60" stroke={navyColor} strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );

  if (layout === "emblem") {
    return <div className={className}>{emblem}</div>;
  }

  if (layout === "vertical") {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        {emblem}
        <h3 className="font-display font-extrabold text-3xl tracking-widest mt-4 mb-1 flex items-center justify-center">
          <span style={{ color: navyColor }}>春</span>
          <span style={{ color: redColor }} className="mx-1">
            の
          </span>
          <span style={{ color: navyColor }}>風</span>
        </h3>
        <p className="text-xs tracking-[0.25em] font-extrabold flex items-center justify-center uppercase">
          <span style={{ color: navyColor }}>HARU</span>
          <span style={{ color: redColor }} className="mx-1.5">
            NO
          </span>
          <span style={{ color: navyColor }}>KAZE</span>
        </p>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {emblem}
      <span className={`font-display font-extrabold text-xl tracking-tight ${textClass}`}>Harunokaze</span>
    </div>
  );
}
