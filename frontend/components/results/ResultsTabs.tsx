"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { BadgeIcon } from "./icons";

type ResultsTab = "smart-insights" | "insights" | "summary" | "responses";

const TABS: { key: ResultsTab; label: string; withBadge?: boolean }[] = [
  { key: "smart-insights", label: "Smart Insights", withBadge: true },
  { key: "insights", label: "Insights" },
  { key: "summary", label: "Summary" },
  { key: "responses", label: "Responses" },
];

export default function ResultsTabs({ formId, responseCount }: { formId: string; responseCount: number | null }) {
  const pathname = usePathname();
  const active = (TABS.find((t) => pathname?.endsWith(`/results/${t.key}`))?.key ?? "summary") as ResultsTab;

  return (
    <nav className="border-b border-gray-200 bg-white px-6">
      <div className="mx-auto flex max-w-5xl gap-8 text-sm">
        {TABS.map((tab) => {
          const isActive = tab.key === active;
          const label = tab.key === "responses" ? `Responses${responseCount !== null ? ` [${responseCount}]` : ""}` : tab.label;
          return (
            <Link
              key={tab.key}
              href={`/forms/${formId}/results/${tab.key}`}
              className={`relative flex items-center gap-1.5 py-3.5 font-medium transition-colors duration-150 ${
                isActive ? "text-gray-900" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.withBadge && <BadgeIcon className="h-3.5 w-3.5 text-[#0f6b52]" />}
              {label}
              {isActive && (
                <motion.div
                  layoutId="resultsTabUnderline"
                  className="absolute inset-x-0 -bottom-px h-[2px] bg-gray-900"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
