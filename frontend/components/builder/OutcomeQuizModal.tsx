"use client";

import { useState, useEffect } from "react";
import { OutcomeRule } from "@/lib/logicEngine";

type Question = {
  id: number;
  type: string;
  title: string;
  description: string | null;
  required: boolean;
  options: string[] | null;
  settings: Record<string, any> | null;
};

export default function OutcomeQuizModal({
  isOpen,
  onClose,
  formSettings,
  questions,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  formSettings: any;
  questions: Question[];
  onSave: (settings: any) => Promise<void>;
}) {
  const [rules, setRules] = useState<OutcomeRule[]>([]);
  const [saving, setSaving] = useState(false);

  // Initialize rules from formSettings
  useEffect(() => {
    if (isOpen) {
      const savedRules = formSettings?.outcomeQuiz?.rules || [];
      setRules(JSON.parse(JSON.stringify(savedRules)));
    }
  }, [isOpen, formSettings]);

  if (!isOpen) return null;

  // Filter ending screens and scorable questions
  const endingScreens = questions.filter((q) => q.type === "ending_screen");
  const scorableQuestions = questions.filter((q) =>
    ["multiple_choice", "dropdown", "yes_no"].includes(q.type)
  );

  const handleAddRule = (endingId: number) => {
    const firstQ = scorableQuestions[0];
    if (!firstQ) return;
    const firstOption = firstQ.options?.[0] || (firstQ.type === "yes_no" ? "Yes" : "");

    const newRule: OutcomeRule = {
      questionId: firstQ.id,
      choice: firstOption,
      endingId,
    };
    setRules((prev) => [...prev, newRule]);
  };

  const handleRemoveRule = (ruleIdx: number) => {
    setRules((prev) => prev.filter((_, idx) => idx !== ruleIdx));
  };

  const handleUpdateRule = (ruleIdx: number, patch: Partial<OutcomeRule>) => {
    setRules((prev) =>
      prev.map((rule, idx) => (idx === ruleIdx ? { ...rule, ...patch } : rule))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const nextSettings = {
        ...(formSettings || {}),
        outcomeQuiz: {
          rules,
        },
      };
      await onSave(nextSettings);
      onClose();
    } catch (e) {
      console.error(e);
      alert("Failed to save outcome quiz mappings");
    } finally {
      setSaving(false);
    }
  };

  const getQuestionLabel = (q: Question) => {
    const idx = questions.findIndex((o) => o.id === q.id);
    return `${idx + 1}. ${q.title || "Untitled question"}`;
  };

  const getQuestionChoices = (q: Question) => {
    if (q.type === "yes_no") return ["Yes", "No"];
    return q.options || [];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex h-[80vh] w-full max-w-4xl flex-col rounded-3xl bg-[#fafafa] shadow-2xl overflow-hidden text-[#26212e]">
        {/* Header */}
        <div className="border-b bg-white px-8 py-5">
          <h2 className="text-xl font-bold">Outcome Quiz</h2>
          <p className="text-sm text-gray-500">Map multiple choice answers to ending screens to build personality quizzes</p>
        </div>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {endingScreens.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="font-semibold">No Ending Screens found</p>
              <p className="text-xs mt-1">Please add at least one Ending Screen page to configure outcomes.</p>
            </div>
          ) : scorableQuestions.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="font-semibold">No Choice-based Questions found</p>
              <p className="text-xs mt-1">Add Multiple Choice, Dropdown, or Yes/No questions to enable quiz outcomes.</p>
            </div>
          ) : (
            endingScreens.map((es, esIdx) => {
              // Get rules pointing to this ending screen
              const esRules = rules.map((r, idx) => ({ rule: r, originalIdx: idx })).filter(
                (item) => item.rule.endingId === es.id
              );

              return (
                <div key={es.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
                  {/* Ending Screen Title */}
                  <div className="flex items-center gap-2 border-b pb-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs font-semibold">
                      🏁
                    </span>
                    <span className="font-bold text-gray-800">
                      {es.title || `Ending Screen ${esIdx + 1}`}
                    </span>
                  </div>

                  {/* Rules list pointing to this ending */}
                  <div className="space-y-3">
                    {esRules.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No answers are currently mapped to this ending screen.</p>
                    ) : (
                      esRules.map(({ rule, originalIdx }) => {
                        const activeQ = scorableQuestions.find((sq) => sq.id === rule.questionId);
                        const choices = activeQ ? getQuestionChoices(activeQ) : [];

                        return (
                          <div key={originalIdx} className="flex items-center gap-3 bg-gray-50/50 p-3 rounded-xl border border-gray-150">
                            <span className="text-xs font-semibold text-gray-500">When answer to</span>
                            
                            {/* Question Select */}
                            <select
                              value={rule.questionId}
                              onChange={(e) => {
                                const qId = Number(e.target.value);
                                const qObj = scorableQuestions.find((sq) => sq.id === qId);
                                const firstChoice = qObj ? getQuestionChoices(qObj)[0] || "" : "";
                                handleUpdateRule(originalIdx, {
                                  questionId: qId,
                                  choice: firstChoice,
                                });
                              }}
                              className="w-56 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-gray-400"
                            >
                              {scorableQuestions.map((sq) => (
                                <option key={sq.id} value={sq.id}>
                                  {getQuestionLabel(sq)}
                                </option>
                              ))}
                            </select>

                            <span className="text-xs font-semibold text-gray-500">is</span>

                            {/* Choice Select */}
                            <select
                              value={rule.choice}
                              onChange={(e) => handleUpdateRule(originalIdx, { choice: e.target.value })}
                              className="w-48 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-gray-400"
                            >
                              {choices.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>

                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveRule(originalIdx)}
                              className="ml-auto text-gray-400 hover:text-red-500 text-xs"
                            >
                              ✕ Remove
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Add Mapping Trigger */}
                  <button
                    type="button"
                    onClick={() => handleAddRule(es.id)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold self-start"
                  >
                    + Map a choice to this ending
                  </button>
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
