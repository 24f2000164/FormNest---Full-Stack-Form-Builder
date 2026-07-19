"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getFormById, getFormResponses } from "@/lib/api";
import ResultsHeader from "./ResultsHeader";
import ResultsTabs from "./ResultsTabs";
import ResultsContent from "./ResultsContent";

// This is the shell only: it fetches the form title (for the breadcrumb)
// and a response count (only used to label the "Responses [n]" tab, same
// as the count shown next to a form on the dashboard). No analytics,
// charts, or per-tab data live here - that's for a later phase.
export default function ResultsLayout({ formId, children }: { formId: string; children: React.ReactNode }) {
  const [title, setTitle] = useState("");
  const [responseCount, setResponseCount] = useState<number | null>(null);

  useEffect(() => {
    if (!formId) return;
    getFormById(Number(formId))
      .then((form) => setTitle(form.title))
      .catch(() => {});
    getFormResponses(Number(formId))
      .then((responses) => setResponseCount(Array.isArray(responses) ? responses.length : null))
      .catch(() => setResponseCount(null));
  }, [formId]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex min-h-screen flex-col bg-[#F7F7F7]"
    >
      <ResultsHeader formId={formId} title={title} />
      <ResultsTabs formId={formId} responseCount={responseCount} />
      <ResultsContent>{children}</ResultsContent>
    </motion.div>
  );
}
