import { useEffect, useMemo, useRef, useState } from "react";
import { useInView } from "framer-motion";

interface CountUpStatProps {
  value: string;
  className?: string;
}

export function CountUpStat({ value, className = "" }: CountUpStatProps) {
  const match = useMemo(() => value.match(/^(\d+)(.*)$/), [value]);
  const ref = useRef<HTMLSpanElement>(null);
  // margin 0 + amount kecil: di mobile hero stats sering gagal "in view" dengan margin negatif
  const isInView = useInView(ref, { once: true, amount: 0.2, margin: "0px" });
  const [display, setDisplay] = useState(match ? "0" + match[2] : value);

  useEffect(() => {
    if (!match) {
      setDisplay(value);
      return;
    }

    const target = parseInt(match[1], 10);
    const suffix = match[2];
    const finish = () => setDisplay(String(target) + suffix);

    // Fallback jika IntersectionObserver tidak fire (sering di mobile)
    const fallback = window.setTimeout(finish, 1400);

    if (!isInView) {
      return () => window.clearTimeout(fallback);
    }

    const duration = 900;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(String(Math.round(eased * target)) + suffix);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        window.clearTimeout(fallback);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => {
      window.clearTimeout(fallback);
      cancelAnimationFrame(frame);
    };
  }, [isInView, match, value]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
