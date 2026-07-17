import { useMemo } from "react";

interface Petal {
  id: number;
  x: number;
  size: number;
  delay: number;
  duration: number;
  drift: number;
  rotation: number;
}

interface SakuraFieldProps {
  count?: number;
  className?: string;
}

export function SakuraField({ count = 16, className = "" }: SakuraFieldProps) {
  const petals = useMemo<Petal[]>(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        size: Math.random() * 8 + 6,
        delay: Math.random() * 14,
        duration: Math.random() * 12 + 16,
        drift: Math.random() * 50 - 25,
        rotation: Math.random() * 360,
      })),
    [count]
  );

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {petals.map((petal) => (
        <div
          key={petal.id}
          className="absolute rounded-full animate-drift"
          style={{
            left: `${petal.x}%`,
            top: `${-10}%`,
            width: `${petal.size}px`,
            height: `${petal.size * 1.15}px`,
            background: "linear-gradient(135deg, #FFE5EC, #FFB3C6)",
            borderRadius: "50% 0% 50% 50%",
            filter: "blur(0.4px)",
            animationDuration: `${petal.duration}s`,
            animationDelay: `${petal.delay}s`,
            transform: `rotate(${petal.rotation}deg)`,
            "--drift-x": `${petal.drift}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
