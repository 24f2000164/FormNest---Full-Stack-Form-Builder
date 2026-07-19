"use client";

import { motion } from "framer-motion";
import { ComingSoonIcon } from "./icons";

// Reusable "nothing here yet" state. Used by every Results sub-page that
// doesn't have real content in this phase (everything except Summary).
// Deliberately has zero data-fetching or logic - purely presentational.
export default function ComingSoon() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex min-h-[420px] flex-col items-center justify-center text-center"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        <ComingSoonIcon />
      </div>
      <h2 className="text-base font-semibold text-gray-900">Coming Soon</h2>
      <p className="mt-1 text-sm text-gray-400">This section will be implemented in a later phase.</p>
    </motion.div>
  );
}
