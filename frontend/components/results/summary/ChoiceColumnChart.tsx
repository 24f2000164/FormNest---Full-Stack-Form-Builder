"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChoiceOptionStat } from "./choiceAggregation";

// Vertical column chart - the default "bar chart" view, matching the
// screenshots: numeric y-axis gridlines, a count label above every bar,
// the option name below, and bars animating from 0 up to their final
// height on load.
export default function ChoiceColumnChart({ options, maxCount }: { options: ChoiceOptionStat[]; maxCount: number }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const axisMax = Math.max(maxCount, 1);
  // Round the axis top up to a "nice" number so gridline labels look clean
  // (matches the screenshots, which top out at the next whole number).
  const ticks = [0, Math.ceil(axisMax / 2), axisMax];

  return (
    <div>
      <div className="relative h-[220px] pl-8">
        {/* Y-axis gridlines */}
        <div className="pointer-events-none absolute inset-0 flex flex-col-reverse justify-between">
          {ticks.map((t) => (
            <div key={t} className="flex items-center gap-2">
              <span className="w-5 -translate-x-6 text-right text-xs text-gray-400">{t}</span>
              <div className="h-px flex-1 bg-gray-100" />
            </div>
          ))}
        </div>

        {/* Bars */}
        <div className="relative flex h-full items-end gap-4">
          {options.map((opt, i) => {
            const heightPct = axisMax > 0 ? (opt.count / axisMax) * 100 : 0;
            return (
              <div
                key={opt.label + i}
                className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
              >
                <span className="text-xs font-medium text-purple-600">{opt.count}</span>
                <div className="relative w-full max-w-[90px] flex-1 flex items-end">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPct}%` }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.05 }}
                    className={`w-full rounded-t-[2px] transition-colors duration-150 ${
                      hovered === i ? "bg-purple-400" : "bg-purple-300"
                    }`}
                  />
                  {hovered === i && (
                    <div className="pointer-events-none absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white">
                      {opt.count} · {opt.percentage}%
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* X-axis labels */}
      <div className="mt-2 flex gap-4 pl-8">
        {options.map((opt, i) => (
          <div key={opt.label + i} className="flex-1 truncate text-center text-xs text-gray-600" title={opt.label}>
            {opt.label}
          </div>
        ))}
      </div>
    </div>
  );
}
