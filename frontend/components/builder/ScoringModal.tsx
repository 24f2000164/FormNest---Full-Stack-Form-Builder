"use client";

import { useState } from "react";

type Question = {
  id: number;
  type: string;
  title: string;
  description: string | null;
  required: boolean;
  options: string[] | null;
  settings: Record<string, any> | null;
};

type QuestionScore = {
  options?: Record<string, number>; // Maps choice label to points
};

export default function ScoringModal({
  isOpen,
  onClose,
  questions,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  onSave: (questionId: number, scoreConfig: QuestionScore) => Promise<void>;
}) {
  // Local state holding the scores configuration for each question
  const [scoresMap, setScoresMap] = useState<Record<number, QuestionScore>>(() => {
    const map: Record<number, QuestionScore> = {};
    questions.forEach((q) => {
      map[q.id] = q.settings?.score || { options: {} };
    });
    return map;
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const q of questions) {
        await onSave(q.id, scoresMap[q.id] || { options: {} });
      }
      onClose();
    } catch (e) {
      console.error(e);
      alert("Failed to save scoring configuration");
    } finally {
      setSaving(false);
    }
  };

  const updateScoreValue = (qId: number, key: string, value: number) => {
    setScoresMap((prev) => {
      const qScore = prev[qId] || { options: {} };
      return {
        ...prev,
        [qId]: {
          ...qScore,
          options: {
            ...(qScore.options || {}),
            [key]: value,
          },
        },
      };
    });
  };

  const getQuestionOptions = (q: Question) => {
    if (q.type === "multiple_choice" || q.type === "dropdown") {
      return q.options || [];
    }
    if (q.type === "yes_no") {
      return ["Yes", "No"];
    }
    if (q.type === "rating") {
      const count = q.settings?.rating_count ?? q.settings?.max_rating ?? 5;
      return Array.from({ length: count }, (_, idx) => String(idx + 1));
    }
    if (q.type === "opinion_scale") {
      return Array.from({ length: 11 }, (_, idx) => String(idx));
    }
    return [];
  };

  const getQuestionLabel = (q: Question, idx: number) => {
    return `${idx + 1}. ${q.title || "Untitled question"}`;
  };

  if (!isOpen) return null;

  // Filter only questions that have options or rating values that can be scored
  const scorableQuestions = questions.filter((q) =>
    ["multiple_choice", "dropdown", "yes_no", "rating", "opinion_scale"].includes(q.type)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex h-[80vh] w-full max-w-3xl flex-col rounded-3xl bg-[#fafafa] shadow-2xl overflow-hidden text-[#26212e]">
        {/* Header */}
        <div className="border-b bg-white px-8 py-5">
          <h2 className="text-xl font-bold">Scoring</h2>
          <p className="text-sm text-gray-500">Assign points to answers to build quizzes or calculations</p>
        </div>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {scorableQuestions.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="font-semibold">No scorable questions found</p>
              <p className="text-xs mt-1">Add choice-based, rating, or opinion scale questions to enable scoring.</p>
            </div>
          ) : (
            scorableQuestions.map((q) => {
              const qIndex = questions.findIndex((o) => o.id === q.id);
              const qScore = scoresMap[q.id] || { options: {} };
              const options = getQuestionOptions(q);

              return (
                <div key={q.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
                  {/* Question Info */}
                  <div className="flex items-center gap-2 border-b pb-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-150 text-xs font-semibold text-gray-600">
                      {qIndex + 1}
                    </span>
                    <span className="font-semibold text-gray-800">{q.title || "Untitled question"}</span>
                  </div>

                  {/* Options List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {options.map((opt) => {
                      const scoreValue = qScore.options?.[opt] ?? 0;
                      return (
                        <div key={opt} className="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-2 bg-gray-50/30">
                          <span className="text-sm text-gray-600 truncate mr-3">{opt}</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={scoreValue}
                              onChange={(e) => updateScoreValue(q.id, opt, parseInt(e.target.value) || 0)}
                              className="w-20 rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm text-center outline-none focus:border-gray-400"
                            />
                            <span className="text-xs text-gray-400 font-semibold">pts</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t bg-white px-8 py-5 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border px-5 py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-50"
          >
            Cancel
            </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
