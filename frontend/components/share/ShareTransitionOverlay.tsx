"use client";

import { motion } from "framer-motion";
import { ShareArrowIcon } from "./icons";

// Full-page dark purple overlay with a centered circular icon that starts
// as a "share" glyph and animates off to the right while the Share page
// fades in behind it. Mounted for ~650ms total (see share/page.tsx), which
// sits inside the requested 500-700ms window.
export default function ShareTransitionOverlay() {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#2b1338]"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <motion.div
        className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-400 to-purple-500 text-white shadow-2xl"
        initial={{ x: 0, scale: 0.7, opacity: 0 }}
        animate={{ x: [0, 0, 180], scale: [0.7, 1, 0.85], opacity: [0, 1, 0] }}
        transition={{ duration: 0.65, times: [0, 0.4, 1], ease: "easeInOut" }}
      >
        <ShareArrowIcon className="h-9 w-9" />
      </motion.div>
    </motion.div>
  );
}
