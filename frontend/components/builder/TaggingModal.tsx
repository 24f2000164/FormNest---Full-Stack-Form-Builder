"use client";

import { useState, useEffect } from "react";
import { TagGroup, TagRule } from "@/lib/logicEngine";

type Question = {
  id: number;
  type: string;
  title: string;
  description: string | null;
  required: boolean;
  options: string[] | null;
  settings: Record<string, any> | null;
};

export default function TaggingModal({
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
  const [tagGroups, setTagGroups] = useState<TagGroup[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [contextMenuGroupId, setContextMenuGroupId] = useState<string | null>(null);

  // Initialize from formSettings
  useEffect(() => {
    if (isOpen) {
      const groups = formSettings?.tagging?.tagGroups || [];
      setTagGroups(JSON.parse(JSON.stringify(groups))); // deep clone
      if (groups.length > 0) {
        setActiveGroupId(groups[0].id);
      } else {
        setActiveGroupId(null);
      }
    }
  }, [isOpen, formSettings]);

  if (!isOpen) return null;

  const activeGroup = tagGroups.find((g) => g.id === activeGroupId) || null;

  const handleAddGroup = () => {
    const newGroup: TagGroup = {
      id: Math.random().toString(36).substr(2, 9),
      name: "Tag group",
      rules: [],
      fallback: "",
    };
    setTagGroups((prev) => [...prev, newGroup]);
    setActiveGroupId(newGroup.id);
  };

  const handleRenameGroup = (id: string, name: string) => {
    setTagGroups((prev) =>
      prev.map((g) => (g.id === id ? { ...g, name } : g))
    );
  };

  const handleDuplicateGroup = (group: TagGroup) => {
    const duplicated: TagGroup = {
      ...JSON.parse(JSON.stringify(group)),
      id: Math.random().toString(36).substr(2, 9),
      name: `${group.name} (Copy)`,
    };
    setTagGroups((prev) => [...prev, duplicated]);
    setActiveGroupId(duplicated.id);
    setContextMenuGroupId(null);
  };

  const handleDeleteGroup = (id: string) => {
    if (confirm("Are you sure you want to delete this tag group?")) {
      setTagGroups((prev) => prev.filter((g) => g.id !== id));
      if (activeGroupId === id) {
        const remaining = tagGroups.filter((g) => g.id !== id);
        setActiveGroupId(remaining.length > 0 ? remaining[0].id : null);
      }
      setContextMenuGroupId(null);
    }
  };

  const handleAddRule = () => {
    if (!activeGroupId) return;
    const defaultQ = questions[0]?.id || 0;
    const newRule: TagRule = {
      tag: "",
      questionId: defaultQ,
      op: "is",
      value: "",
    };
    setTagGroups((prev) =>
      prev.map((g) =>
        g.id === activeGroupId
          ? { ...g, rules: [...g.rules, newRule] }
          : g
      )
    );
  };

  const handleRemoveRule = (ruleIdx: number) => {
    if (!activeGroupId) return;
    setTagGroups((prev) =>
      prev.map((g) =>
        g.id === activeGroupId
          ? { ...g, rules: g.rules.filter((_, idx) => idx !== ruleIdx) }
          : g
      )
    );
  };

  const handleUpdateRule = (ruleIdx: number, patch: Partial<TagRule>) => {
    if (!activeGroupId) return;
    setTagGroups((prev) =>
      prev.map((g) =>
        g.id === activeGroupId
          ? {
              ...g,
              rules: g.rules.map((rule, idx) =>
                idx === ruleIdx ? { ...rule, ...patch } : rule
              ),
            }
          : g
      )
    );
  };

  const handleUpdateFallback = (fallback: string) => {
    if (!activeGroupId) return;
    setTagGroups((prev) =>
      prev.map((g) => (g.id === activeGroupId ? { ...g, fallback } : g))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const nextSettings = {
        ...(formSettings || {}),
        tagging: {
          tagGroups,
        },
      };
      await onSave(nextSettings);
      onClose();
    } catch (e) {
      console.error(e);
      alert("Failed to save tagging configurations");
    } finally {
      setSaving(false);
    }
  };

  const getQuestionLabel = (q: Question, idx: number) => {
    return `${idx + 1}. ${q.title || "Untitled question"}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex h-[85vh] w-full max-w-5xl rounded-3xl bg-[#fafafa] shadow-2xl overflow-hidden text-[#26212e]">
        {/* Left Sidebar: Tag groups list */}
        <div className="w-80 shrink-0 border-r bg-white flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 border-b flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold">Tagging</h2>
              <p className="text-xs text-gray-400">Create groups of tags to segment respondents</p>
            </div>
            <div className="relative group">
              <button
                onClick={handleAddGroup}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 transition-colors"
                title="Add new tag group"
              >
                <span className="text-base font-bold">+</span>
              </button>
              {/* Tooltip */}
              <div className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 rounded-md bg-[#26212e] px-2 py-1 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 whitespace-nowrap z-30">
                Add new tag group
              </div>
            </div>
          </div>

          {/* Groups list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 px-3 mb-2">Tag groups</span>
            {tagGroups.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs">
                No tag groups. Click + to add.
              </div>
            ) : (
              tagGroups.map((g) => (
                <div
                  key={g.id}
                  onClick={() => setActiveGroupId(g.id)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors relative ${
                    activeGroupId === g.id
                      ? "bg-gray-100 text-gray-900 font-semibold"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-750"
                  }`}
                >
                  <span className="truncate flex-1">{g.name || "Untitled tag group"}</span>
                  
                  {/* Options Menu Trigger */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setContextMenuGroupId(contextMenuGroupId === g.id ? null : g.id);
                    }}
                    className="p-1 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-gray-700"
                  >
                    ⋮
                  </button>

                  {/* Context menu drop down */}
                  {contextMenuGroupId === g.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-2 mt-32 w-36 rounded-xl border border-gray-150 bg-white py-1 shadow-lg ring-1 ring-black/5 z-40 text-xs font-medium text-gray-700"
                    >
                      <button
                        onClick={() => {
                          const newName = prompt("Rename tag group to:", g.name);
                          if (newName) handleRenameGroup(g.id, newName);
                          setContextMenuGroupId(null);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-50"
                      >
                        ✍ Rename
                      </button>
                      <button
                        onClick={() => handleDuplicateGroup(g)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-50"
                      >
                        👥 Duplicate
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(g.id)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-red-650 hover:bg-red-50"
                      >
                        🗑 Delete
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel: Rule editor for selected tag group */}
        <div className="flex-1 flex flex-col bg-[#fafafa]">
          {activeGroup ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Active Group Header */}
              <div className="bg-white px-8 py-5 border-b">
                <input
                  type="text"
                  value={activeGroup.name}
                  onChange={(e) => handleRenameGroup(activeGroup.id, e.target.value)}
                  className="text-lg font-bold bg-transparent border-b border-transparent hover:border-gray-200 focus:border-gray-900 outline-none w-72 pb-0.5"
                  placeholder="Tag group name"
                />
              </div>

              {/* Rules List Area */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="space-y-4">
                  {(activeGroup.rules || []).map((rule, ruleIdx) => {
                    const targetQ = questions.find((o) => o.id === rule.questionId);
                    const isChoice = targetQ?.type === "multiple_choice" || targetQ?.type === "dropdown" || targetQ?.type === "yes_no";
                    const fieldOptions = targetQ?.options || (targetQ?.type === "yes_no" ? ["Yes", "No"] : []);

                    return (
                      <div
                        key={ruleIdx}
                        className="rounded-2xl border border-gray-150 bg-white p-5 shadow-sm space-y-4 relative"
                      >
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-xs font-semibold text-gray-500 w-12 text-right">Tag as</span>
                          <input
                            type="text"
                            value={rule.tag}
                            onChange={(e) => handleUpdateRule(ruleIdx, { tag: e.target.value })}
                            placeholder="e.g. High"
                            className="w-48 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-gray-400"
                          />

                          <span className="text-xs font-semibold text-gray-500">when</span>

                          {/* Question Selection */}
                          <select
                            value={rule.questionId}
                            onChange={(e) =>
                              handleUpdateRule(ruleIdx, {
                                questionId: Number(e.target.value),
                                value: "",
                              })
                            }
                            className="w-64 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-gray-400"
                          >
                            {questions.map((o, oIdx) => (
                              <option key={o.id} value={o.id}>
                                {getQuestionLabel(o, oIdx)}
                              </option>
                            ))}
                          </select>

                          {/* Operator */}
                          <select
                            value={rule.op}
                            onChange={(e) => handleUpdateRule(ruleIdx, { op: e.target.value })}
                            className="w-24 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-gray-400"
                          >
                            <option value="is">is</option>
                            <option value="is_not">is not</option>
                            <option value="contains">contains</option>
                            <option value="greater_than">&gt;</option>
                            <option value="less_than">&lt;</option>
                          </select>

                          {/* Value selection */}
                          {isChoice ? (
                            <select
                              value={rule.value}
                              onChange={(e) => handleUpdateRule(ruleIdx, { value: e.target.value })}
                              className="w-48 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-gray-400"
                            >
                              <option value="">Select option...</option>
                              {fieldOptions.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={rule.value}
                              onChange={(e) => handleUpdateRule(ruleIdx, { value: e.target.value })}
                              placeholder="Type a value..."
                              className="w-48 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-gray-400"
                            />
                          )}

                          {/* Delete rule */}
                          <button
                            type="button"
                            onClick={() => handleRemoveRule(ruleIdx)}
                            className="ml-auto text-xs text-red-500 hover:text-red-600 font-semibold"
                          >
                            Delete rule
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* All other cases fallback */}
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-gray-500 w-32 shrink-0">All other cases tag as</span>
                    <input
                      type="text"
                      value={activeGroup.fallback}
                      onChange={(e) => handleUpdateFallback(e.target.value)}
                      placeholder="e.g. Low"
                      className="w-64 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-gray-400"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddRule}
                  className="w-full py-3 rounded-2xl border border-dashed border-gray-300 text-gray-500 hover:bg-gray-100 text-xs font-semibold"
                >
                  + Add rule
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-gray-400">
              <span className="text-3xl mb-2">🏷</span>
              <p className="font-semibold text-sm">Select or create a tag group</p>
              <p className="text-xs mt-1">Tag groups help segment your respondents dynamically.</p>
            </div>
          )}

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
    </div>
  );
}
