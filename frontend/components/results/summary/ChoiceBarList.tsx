"use client";

import { motion } from "framer-motion";
import { ChoiceOptionStat } from "./choiceAggregation";

// "List" view: each option as Option Name / Count / Percentage plus a
// horizontal progress bar, animating from 0% to its final width.
export default function ChoiceBarList({ options, maxCount }: { options: ChoiceOptionStat[]; maxCount: number }) {
  const axisMax = Math.max(maxCount, 1);

  return (
    <div className="flex flex-col gap-4">
      {options.map((opt, i) => {
        const widthPct = axisMax > 0 ? (opt.count / axisMax) * 100 : 0;
        return (
          <div key={opt.label + i} className="group">
            <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 flex-1 truncate text-gray-800" title={opt.label}>
                {opt.label}
              </span>
              <span className="shrink-0 text-gray-500">
                {opt.count} · {opt.percentage}%
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${widthPct}%` }}
                transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.05 }}
                className="h-full rounded-full bg-purple-300 transition-colors duration-150 group-hover:bg-purple-400"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
