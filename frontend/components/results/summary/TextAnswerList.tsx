"use client";

import { useMemo, useState } from "react";
import { QuoteIcon, ResizeIcon, SearchIcon } from "../icons";
import { formatRelativeTime } from "@/lib/relativeTime";

export type TextAnswer = {
  value: unknown;
  submittedAt: string;
};

// Shared body for Short Text / Long Text summary cards: a search box over
// the individual quoted responses, a toggle to switch between a stacked
// (vertical) and side-by-side (horizontal) layout, and a relative
// timestamp on each response. Falls back to a "waiting for responses"
// empty state when nothing has been submitted yet.
export default function TextAnswerList({ answers }: { answers: TextAnswer[] }) {
  const [query, setQuery] = useState("");
  const [layout, setLayout] = useState<"vertical" | "horizontal">("vertical");

  const textAnswers = useMemo(
    () => answers.filter((a): a is TextAnswer & { value: string } => typeof a.value === "string" && a.value.trim().length > 0),
    [answers]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return textAnswers;
    return textAnswers.filter((a) => a.value.toLowerCase().includes(q));
  }, [textAnswers, query]);

  if (textAnswers.length === 0) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center gap-1 text-center">
        <p className="text-base text-gray-700">Waiting for responses</p>
        <p className="text-sm text-gray-400">Your data will appear here.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search responses"
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none"
          />
        </div>
        <span className="whitespace-nowrap text-sm font-medium text-gray-700">
          {filtered.length} result{filtered.length === 1 ? "" : "s"}
        </span>
        <button
          type="button"
          onClick={() => setLayout((l) => (l === "vertical" ? "horizontal" : "vertical"))}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-50 hover:text-gray-600"
          aria-label={layout === "vertical" ? "Show responses side by side" : "Stack responses vertically"}
          title={layout === "vertical" ? "Show responses side by side" : "Stack responses vertically"}
        >
          <ResizeIcon />
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-6 text-center text-sm text-gray-400">No responses match your search.</p>
      ) : (
        <div className={layout === "horizontal" ? "mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2" : "mt-4 flex flex-col gap-3"}>
          {filtered.map((answer, index) => (
            <div key={index} className="rounded-xl border border-gray-100 bg-white p-4">
              <QuoteIcon className="h-3.5 w-3.5 text-gray-300" />
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800">{answer.value}</p>
              <p className="mt-3 text-xs text-gray-400">{formatRelativeTime(answer.submittedAt)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
