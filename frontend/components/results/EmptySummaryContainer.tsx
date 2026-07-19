"use client";

import { motion } from "framer-motion";

// Purely structural: reserves the space where Summary cards will be
// rendered in a later phase. No data, no per-question logic, no empty-state
// branching - just a static placeholder container.
export default function EmptySummaryContainer() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: "easeOut", delay: 0.1 }}
      className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white"
    >
      <p className="text-sm text-gray-300">Summary cards will render here</p>
    </motion.div>
  );
}
