"use client";

import { useState } from "react";
import { motion as motionFramer } from "framer-motion";
import { RatingIcon } from "@/components/builder/ratingIcons";

interface QuestionInsightItem {
  question_id: number;
  title: string;
  type: string;
  views: number;
  answered: number;
  skipped: number;
  dropoffs: number;
  completionRate: number;
  dropoffRate: number;
  averageRating: number | null;
  averageNumber: number | null;
  averageLength: number | null;
  recentAnswers: string[];
  distribution: { option: string; count: number; percentage: number }[];
  mostCommonAnswer: string | null;
}

interface QuestionInsightsListProps {
  insights: QuestionInsightItem[];
}

const QUESTION_TYPE_LABELS: Record<string, string> = {
  short_text: "Short Text",
  long_text: "Long Text",
  email: "Email",
  phone: "Phone",
  number: "Number",
  rating: "Rating",
  yes_no: "Yes / No",
  dropdown: "Dropdown",
  multiple_choice: "Multiple Choice",
  checkbox: "Checkbox",
};

export default function QuestionInsightsList({ insights }: QuestionInsightsListProps) {
  return (
    <div className="space-y-8 mt-12">
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-lg font-bold text-gray-800">Question-by-Question Insights</h3>
        <p className="text-sm text-gray-500 mt-1">Detailed analysis of completion rates, drop-offs, and responses for every question.</p>
      </div>

      <div className="space-y-6">
        {insights.map((item, idx) => (
          <QuestionCard key={item.question_id} item={item} index={idx + 1} />
        ))}
      </div>
    </div>
  );
}

function QuestionCard({ item, index }: { item: QuestionInsightItem; index: number }) {
  const [showRecent, setShowRecent] = useState(false);

  const answeredPct = item.views > 0 ? (item.answered / item.views) * 100 : 0;
  const skippedPct = item.views > 0 ? (item.skipped / item.views) * 100 : 0;
  const dropoffPct = item.views > 0 ? (item.dropoffs / item.views) * 100 : 0;

  const isTextType = ["short_text", "long_text", "email", "phone"].includes(item.type);
  const isChoiceType = ["multiple_choice", "checkbox", "dropdown", "yes_no"].includes(item.type);

  return (
    <motionFramer.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-50 pb-4">
        <div className="flex items-start gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600 mt-0.5">
            {index}
          </span>
          <div>
            <h4 className="text-base font-bold text-gray-800">{item.title || "(Untitled Question)"}</h4>
            <span className="inline-block mt-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
              {QUESTION_TYPE_LABELS[item.type] || item.type}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mt-6 sm:grid-cols-6 text-center">
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="text-xs font-semibold text-gray-400 uppercase">Views</div>
          <div className="text-lg font-bold text-gray-800 mt-1">{item.views}</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="text-xs font-semibold text-gray-400 uppercase">Answered</div>
          <div className="text-lg font-bold text-[#0f6b52] mt-1">{item.answered}</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="text-xs font-semibold text-gray-400 uppercase">Skipped</div>
          <div className="text-lg font-bold text-amber-500 mt-1">{item.skipped}</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="text-xs font-semibold text-gray-400 uppercase">Drop-offs</div>
          <div className="text-lg font-bold text-red-500 mt-1">{item.dropoffs}</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="text-xs font-semibold text-gray-400 uppercase">Completion %</div>
          <div className="text-lg font-bold text-gray-800 mt-1">{item.completionRate}%</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="text-xs font-semibold text-gray-400 uppercase">Drop-off %</div>
          <div className="text-lg font-bold text-gray-800 mt-1">{item.dropoffRate}%</div>
        </div>
      </div>

      {/* Stacked Progress Bar */}
      <div className="mt-6">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Breakdown of Views</div>
        {item.views === 0 ? (
          <div className="h-3 w-full rounded-full bg-gray-100" />
        ) : (
          <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-gray-100 font-semibold text-[10px] text-white">
            {item.answered > 0 && (
              <div
                className="bg-[#0f6b52] h-full flex items-center justify-center transition-all duration-300"
                style={{ width: `${answeredPct}%` }}
                title={`Answered: ${item.answered} (${Math.round(answeredPct)}%)`}
              />
            )}
            {item.skipped > 0 && (
              <div
                className="bg-amber-400 h-full flex items-center justify-center transition-all duration-300"
                style={{ width: `${skippedPct}%` }}
                title={`Skipped: ${item.skipped} (${Math.round(skippedPct)}%)`}
              />
            )}
            {item.dropoffs > 0 && (
              <div
                className="bg-red-400 h-full flex items-center justify-center transition-all duration-300"
                style={{ width: `${dropoffPct}%` }}
                title={`Drop-offs: ${item.dropoffs} (${Math.round(dropoffPct)}%)`}
              />
            )}
          </div>
        )}
        <div className="flex gap-4 mt-2 justify-center sm:justify-start">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold">
            <div className="h-2.5 w-2.5 rounded-full bg-[#0f6b52]" />
            <span>Answered ({Math.round(answeredPct)}%)</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold">
            <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span>Skipped ({Math.round(skippedPct)}%)</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span>Drop-offs ({Math.round(dropoffPct)}%)</span>
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="mt-6 border-t border-gray-50 pt-5">
        {/* Rating Question */}
        {item.type === "rating" && item.averageRating !== null && (
          <div className="flex items-center gap-4">
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase">Average Rating</div>
              <div className="text-2xl font-bold text-gray-800 mt-1">{item.averageRating}</div>
            </div>
            <div className="flex gap-1 mt-5">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = (item.averageRating || 0) >= star;
                return (
                  <svg
                    key={star}
                    viewBox="0 0 24 24"
                    className={`h-6 w-6 ${filled ? "fill-amber-400 text-amber-400" : "fill-gray-100 text-gray-300"}`}
                  >
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                );
              })}
            </div>
          </div>
        )}

        {/* Number Question */}
        {item.type === "number" && item.averageNumber !== null && (
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase">Average Value</div>
            <div className="text-2xl font-bold text-gray-800 mt-1">{item.averageNumber}</div>
          </div>
        )}

        {/* Text Question */}
        {isTextType && item.answered > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase">Average Length</span>
                <span className="ml-2 font-bold text-gray-700">{item.averageLength} characters</span>
              </div>
              <button
                onClick={() => setShowRecent(!showRecent)}
                className="text-xs font-bold text-[#0f6b52] hover:text-[#0c5943] focus:outline-none"
              >
                {showRecent ? "Hide Recent Answers" : "Show Recent Answers"}
              </button>
            </div>

            {showRecent && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2 max-h-48 overflow-y-auto">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Recent Submissions</div>
                {item.recentAnswers.length === 0 ? (
                  <div className="text-sm text-gray-400">No text responses collected yet.</div>
                ) : (
                  item.recentAnswers.map((ans, i) => (
                    <div key={i} className="text-sm text-gray-700 bg-white px-3 py-2 rounded-lg border border-gray-200">
                      "{ans}"
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Choice Question */}
        {isChoiceType && item.answered > 0 && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="text-xs font-semibold text-gray-400 uppercase">Options Distribution</span>
              {item.mostCommonAnswer && (
                <div className="text-xs font-semibold text-gray-500">
                  Most Common: <span className="font-bold text-[#0f6b52]">{item.mostCommonAnswer}</span>
                </div>
              )}
            </div>

            <div className="space-y-2.5 max-w-xl">
              {item.distribution.map((dist, i) => {
                const maxCount = Math.max(...item.distribution.map((d) => d.count), 1);
                const widthPercent = (dist.count / maxCount) * 100;
                return (
                  <div key={dist.option + i}>
                    <div className="flex justify-between items-center text-xs font-semibold text-gray-700 mb-1">
                      <span className="truncate pr-4">{dist.option}</span>
                      <span className="text-gray-500 shrink-0">{dist.count} ({dist.percentage}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-50 overflow-hidden border border-gray-100">
                      <div
                        className="bg-[#0f6b52] h-full rounded-full opacity-80 hover:opacity-100 transition-all duration-300"
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </motionFramer.div>
  );
}
