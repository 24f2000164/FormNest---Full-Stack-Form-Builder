"use client";

import { useEffect, useState } from "react";
import { animate } from "framer-motion";
import { HelpIcon } from "../icons";
import { formatStatValue } from "./statistics";

export type Statistic = {
  key: string;
  label: string;
  /** Numeric cards animate-count up to this value. Omit in favor of
   *  `display` for non-numeric stats like a "5 - 5" min-max range. */
  value?: number;
  /** Pre-formatted text, used as-is instead of the animated number
   *  (e.g. a "min - max" range spanning two numbers). */
  display?: string;
  tooltip?: string;
};

// Ticks `value` up from 0 on mount over ~200ms (within the 150-250ms spec)
// rather than jumping straight to the final number.
function AnimatedStatValue({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 0.2,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <>{formatStatValue(display)}</>;
}

export default function StatisticCard({ label, value, display, tooltip }: Statistic) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1.5 rounded-xl bg-gray-50 px-4 py-5 text-center">
      <span className="text-2xl font-medium text-gray-900 tabular-nums sm:text-[26px]">
        {display ?? (value !== undefined ? <AnimatedStatValue value={value} /> : "0")}
      </span>
      <span className="flex items-center gap-1 text-sm text-gray-500">
        {label}
        {tooltip && (
          <span
            title={tooltip}
            aria-label={tooltip}
            className="flex h-3.5 w-3.5 items-center justify-center text-gray-400"
          >
            <HelpIcon />
          </span>
        )}
      </span>
    </div>
  );
}
