"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function EmptyResponsesState({
  formId,
  onGenerateTestResponse,
  generating,
}: {
  formId: string;
  onGenerateTestResponse: () => void;
  generating: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex min-h-[520px] flex-col items-center justify-center text-center"
    >
      <h2 className="text-lg font-semibold text-gray-900">No responses</h2>
      <p className="mt-2 max-w-sm text-sm text-gray-500">
        Share your form to start collecting data, or generate sample responses to test your workflow
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Link
          href={`/forms/${formId}/share`}
          className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          Share your form
        </Link>
        <button
          onClick={onGenerateTestResponse}
          disabled={generating}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {generating ? "Generating…" : "Generate test response"}
        </button>
      </div>
    </motion.div>
  );
}
