"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

// Background, width, and spacing rules from the spec live here so every
// Results sub-page (Summary, Smart Insights, Insights, Responses) gets the
// same canvas for free. Switching tabs re-keys the motion.div by pathname,
// producing the "soft fade transition" between tabs.
export default function ResultsContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // The Responses table manages its own sticky header/column and internal
  // scroll box (so the toolbar above it never moves, only the table body
  // scrolls). That needs a fixed-height, edge-to-edge canvas instead of the
  // centered max-w-5xl one every other Results tab uses - so it's the only
  // tab opted out of the shared padding/width/scroll wrapper below.
  const isResponses = pathname?.endsWith("/results/responses") ?? false;

  if (isResponses) {
    return (
      <div className="h-[calc(100vh-6.5rem)] w-full overflow-hidden bg-[#F7F7F7]">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="h-full w-full bg-white"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-6.5rem)] w-full overflow-y-auto bg-[#F7F7F7]">
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="mx-auto max-w-5xl px-6 py-12"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
