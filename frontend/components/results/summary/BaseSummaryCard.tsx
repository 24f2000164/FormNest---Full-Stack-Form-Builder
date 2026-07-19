"use client";

import { motion } from "framer-motion";
import QuestionHeader from "./QuestionHeader";
import QuestionStatus from "./QuestionStatus";
import { QuestionTypeKey } from "./questionTypeBadge";

export default function BaseSummaryCard({
  type,
  number,
  title,
  description,
  answeredCount,
  totalResponses,
  children,
}: {
  type: QuestionTypeKey | string;
  number: number;
  title?: string | null;
  /** Opt-in only: existing cards that don't pass this see no change. */
  description?: string | null;
  answeredCount?: number;
  totalResponses?: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="rounded-2xl bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-md sm:p-8"
    >
      <QuestionHeader type={type} number={number} title={title} description={description} />
      <QuestionStatus answeredCount={answeredCount} totalResponses={totalResponses} />
      <div className="mt-6">{children}</div>
    </motion.div>
  );
}
