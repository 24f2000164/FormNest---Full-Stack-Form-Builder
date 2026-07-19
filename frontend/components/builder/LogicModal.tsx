"use client";

import { useState, useRef, useEffect } from "react";

type Question = {
  id: number;
  type: string;
  title: string;
  description: string | null;
  required: boolean;
  options: string[] | null;
  settings: Record<string, any> | null;
};

type Condition = {
  fieldId: number;
  op: string;
  value: string;
  connector: "and" | "or";
};

type LogicRule = {
  id: string;
  conditions: Condition[];
  action: "go_to" | "add" | "subtract" | "multiply" | "divide";
  target: string;
};

type QuestionLogic = {
  alwaysGoTo?: string;
  rules?: LogicRule[];
  otherwise?: string;
};

// ─── Icon helpers ────────────────────────────────────────────────────────────

const TYPE_META: Record<string, { icon: string; bg: string; text: string; border: string }> = {
  short_text:    { icon: "T",  bg: "bg-blue-100",   text: "text-blue-700",   border: "border-blue-200" },
  long_text:     { icon: "T",  bg: "bg-blue-100",   text: "text-blue-700",   border: "border-blue-200" },
  number:        { icon: "#",  bg: "bg-amber-100",  text: "text-amber-700",  border: "border-amber-200" },
  email:         { icon: "✉",  bg: "bg-pink-100",   text: "text-pink-700",   border: "border-pink-200" },
  phone:         { icon: "☎",  bg: "bg-green-100",  text: "text-green-700",  border: "border-green-200" },
  date:          { icon: "📅", bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-200" },
  multiple_choice:{ icon: "●", bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
  dropdown:      { icon: "▼",  bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
  yes_no:        { icon: "✓",  bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
  rating:        { icon: "★",  bg: "bg-green-100",  text: "text-green-700",  border: "border-green-200" },
  opinion_scale: { icon: "◯",  bg: "bg-teal-100",   text: "text-teal-700",   border: "border-teal-200" },
  statement:     { icon: "‖",  bg: "bg-gray-100",   text: "text-gray-600",   border: "border-gray-200" },
  contact_info:  { icon: "👤", bg: "bg-pink-100",   text: "text-pink-700",   border: "border-pink-200" },
  welcome_screen:{ icon: "👋", bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-200" },
  ending_screen: { icon: "🏁", bg: "bg-emerald-100",text: "text-emerald-700",border: "border-emerald-200" },
};

function QuestionPill({ q, idx }: { q: Question; idx: number }) {
  const meta = TYPE_META[q.type] ?? { icon: "•", bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200" };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs font-semibold border ${meta.bg} ${meta.text} ${meta.border}`}
    >
      <span className="text-[10px]">{meta.icon}</span>
      <span>{idx + 1}</span>
    </span>
  );
}

// ─── Searchable Question Dropdown ────────────────────────────────────────────

function QuestionDropdown({
  value,
  questions,
  placeholder = "Select...",
  onChange,
  excludeId,
}: {
  value: string;
  questions: Question[];
  placeholder?: string;
  onChange: (val: string) => void;
  excludeId?: number;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = questions.filter((q) => {
    if (excludeId !== undefined && q.id === excludeId) return false;
    const label = q.title || "Untitled question";
    return label.toLowerCase().includes(search.toLowerCase());
  });

  const selected = questions.find((q) => String(q.id) === value);
  const selectedIdx = selected ? questions.findIndex((q) => q.id === selected.id) : -1;

  return (
    <div ref={ref} className="relative flex-1 min-w-0">
      <button
        type="button"
        onClick={() => { setOpen(!open); setSearch(""); }}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:border-gray-300 hover:bg-gray-50 transition-colors"
      >
        <span className="flex items-center gap-2 min-w-0 flex-1">
          {selected ? (
            <>
              <QuestionPill q={selected} idx={selectedIdx} />
              <span className="truncate text-xs text-gray-700">{selected.title || "Untitled question"}</span>
            </>
          ) : (
            <span className="text-xs text-gray-400">{placeholder}</span>
          )}
        </span>
        <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-full min-w-[260px] rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden">
          {/* Search */}
          <div className="border-b px-3 py-2">
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                className="flex-1 text-sm outline-none text-gray-700 placeholder:text-gray-400"
              />
            </div>
          </div>
          {/* Options */}
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <div className="px-4 py-3 text-xs text-gray-400 text-center">No questions found</div>
            )}
            {filtered.map((q) => {
              const idx = questions.findIndex((o) => o.id === q.id);
              const isSelected = String(q.id) === value;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => { onChange(String(q.id)); setOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-gray-50 transition-colors ${isSelected ? "bg-indigo-50" : ""}`}
                >
                  <QuestionPill q={q} idx={idx} />
                  <span className="text-xs text-gray-700 truncate flex-1">{q.title || "Untitled question"}</span>
                  {isSelected && (
                    <svg className="w-3.5 h-3.5 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Then Action Dropdown ─────────────────────────────────────────────────────

function ThenActionDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const ACTIONS = [
    { group: "Logic", items: [{ value: "go_to", label: "Go to" }] },
    {
      group: "Calculations",
      items: [
        { value: "add", label: "Add" },
        { value: "divide", label: "Divide" },
        { value: "subtract", label: "Subtract" },
        { value: "multiply", label: "Multiply" },
      ],
    },
  ];

  const CALC_ICONS: Record<string, string> = {
    add: "+",
    divide: "÷",
    subtract: "−",
    multiply: "×",
  };

  const labelForValue = (v: string) => {
    if (v === "go_to") return "Go to";
    if (v === "add") return "Add";
    if (v === "subtract") return "Subtract";
    if (v === "multiply") return "Multiply";
    if (v === "divide") return "Divide";
    return "Go to";
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
      >
        {labelForValue(value)}
        <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-44 rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden py-2">
          {ACTIONS.map((group) => (
            <div key={group.group}>
              <p className="px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {group.group}
              </p>
              {group.items.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => { onChange(item.value); setOpen(false); }}
                  className={`flex w-full items-center gap-2.5 px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${value === item.value ? "text-indigo-600 font-semibold" : "text-gray-700"}`}
                >
                  {CALC_ICONS[item.value] && (
                    <span className="w-4 text-center font-bold text-gray-500">{CALC_ICONS[item.value]}</span>
                  )}
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Operator Dropdown ────────────────────────────────────────────────────────

function OpDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ops = [
    { value: "is", label: "is" },
    { value: "is_not", label: "is not" },
    { value: "contains", label: "contains" },
    { value: "not_contains", label: "not contains" },
    { value: "greater_than", label: "greater than" },
    { value: "less_than", label: "less than" },
  ];
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl border border-gray-200 bg-white px-2.5 py-2 text-xs text-gray-700 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100 transition-colors"
    >
      {ops.map((op) => (
        <option key={op.value} value={op.value}>{op.label}</option>
      ))}
    </select>
  );
}

// ─── Connector Dropdown (And / Or) ────────────────────────────────────────────

function ConnectorDropdown({
  value,
  onChange,
}: {
  value: "and" | "or";
  onChange: (v: "and" | "or") => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
      >
        {value}
        <svg className="w-2.5 h-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-20 rounded-xl border border-gray-200 bg-white shadow-lg py-1 overflow-hidden">
          {(["and", "or"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => { onChange(v); setOpen(false); }}
              className={`w-full px-3 py-1.5 text-left text-xs font-semibold hover:bg-gray-50 transition-colors ${value === v ? "text-indigo-600" : "text-gray-700"}`}
            >
              {v}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Value Input / Dropdown ───────────────────────────────────────────────────

function ValueField({
  cond,
  targetQ,
  onChange,
}: {
  cond: Condition;
  targetQ?: Question;
  onChange: (v: string) => void;
}) {
  const isChoice =
    targetQ?.type === "multiple_choice" ||
    targetQ?.type === "dropdown" ||
    targetQ?.type === "yes_no";

  const opts =
    targetQ?.type === "yes_no"
      ? ["Yes", "No"]
      : targetQ?.options || [];

  if (isChoice && opts.length > 0) {
    return (
      <div className="relative min-w-0 flex-1">
        <select
          value={cond.value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none focus:border-indigo-300 transition-colors appearance-none"
        >
          <option value="">Select…</option>
          {opts.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
          {/* Show value type letter — A for answer */}
          <span className="flex h-4 w-4 items-center justify-center rounded bg-gray-200 text-[9px] font-bold text-gray-500">A</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-w-0 flex-1">
      <input
        type={targetQ?.type === "number" ? "number" : "text"}
        value={cond.value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type a value…"
        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none focus:border-indigo-300 placeholder:text-gray-400 transition-colors"
      />
    </div>
  );
}

// ─── Main LogicModal ──────────────────────────────────────────────────────────

export default function LogicModal({
  isOpen,
  onClose,
  questions,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  onSave: (questionId: number, logic: QuestionLogic) => Promise<void>;
}) {
  const [logicMap, setLogicMap] = useState<Record<number, QuestionLogic>>(() => {
    const map: Record<number, QuestionLogic> = {};
    questions.forEach((q) => {
      const qLogic = q.settings?.logic || {};
      map[q.id] = {
        alwaysGoTo: qLogic.alwaysGoTo ? String(qLogic.alwaysGoTo) : "",
        otherwise: qLogic.otherwise ? String(qLogic.otherwise) : "",
        rules: (qLogic.rules || []).map((r: any, idx: number) => ({
          id: r.id || String(idx),
          conditions: (r.conditions || []).map((c: any) => ({
            fieldId: c.fieldId ?? q.id,
            op: c.op || "is",
            value: c.value || "",
            connector: c.connector || "and",
          })),
          action: r.action || "go_to",
          target: r.target ? String(r.target) : "",
        })),
      };
    });
    return map;
  });

  const [saving, setSaving] = useState(false);

  // Re-sync when questions list changes (e.g. new question added)
  useEffect(() => {
    setLogicMap((prev) => {
      const next = { ...prev };
      questions.forEach((q) => {
        if (!next[q.id]) {
          const qLogic = q.settings?.logic || {};
          next[q.id] = {
            alwaysGoTo: qLogic.alwaysGoTo ? String(qLogic.alwaysGoTo) : "",
            otherwise: qLogic.otherwise ? String(qLogic.otherwise) : "",
            rules: [],
          };
        }
      });
      return next;
    });
  }, [questions]);

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const q of questions) {
        await onSave(q.id, logicMap[q.id] || {});
      }
      onClose();
    } catch {
      alert("Failed to save rules");
    } finally {
      setSaving(false);
    }
  };

  const updateQL = (qId: number, patch: Partial<QuestionLogic>) =>
    setLogicMap((prev) => ({ ...prev, [qId]: { ...prev[qId], ...patch } }));

  const addRule = (qId: number) => {
    const cur = logicMap[qId] || {};
    updateQL(qId, {
      rules: [
        ...(cur.rules || []),
        {
          id: Math.random().toString(36).substr(2, 9),
          conditions: [{ fieldId: qId, op: "is", value: "", connector: "and" }],
          action: "go_to",
          target: "",
        },
      ],
      alwaysGoTo: "",
    });
  };

  const removeRule = (qId: number, rId: string) => {
    const cur = logicMap[qId] || {};
    updateQL(qId, { rules: (cur.rules || []).filter((r) => r.id !== rId) });
  };

  const updateRule = (qId: number, rId: string, patch: Partial<LogicRule>) => {
    const cur = logicMap[qId] || {};
    updateQL(qId, {
      rules: (cur.rules || []).map((r) => (r.id === rId ? { ...r, ...patch } : r)),
    });
  };

  const addCondition = (qId: number, rId: string) => {
    const cur = logicMap[qId] || {};
    const rule = (cur.rules || []).find((r) => r.id === rId);
    if (!rule) return;
    updateRule(qId, rId, {
      conditions: [...rule.conditions, { fieldId: qId, op: "is", value: "", connector: "and" }],
    });
  };

  const removeCondition = (qId: number, rId: string, idx: number) => {
    const cur = logicMap[qId] || {};
    const rule = (cur.rules || []).find((r) => r.id === rId);
    if (!rule) return;
    updateRule(qId, rId, { conditions: rule.conditions.filter((_, i) => i !== idx) });
  };

  const updateCondition = (qId: number, rId: string, idx: number, patch: Partial<Condition>) => {
    const cur = logicMap[qId] || {};
    const rule = (cur.rules || []).find((r) => r.id === rId);
    if (!rule) return;
    updateRule(qId, rId, {
      conditions: rule.conditions.map((c, i) => (i === idx ? { ...c, ...patch } : c)),
    });
  };

  const deleteAllRules = () => {
    if (!confirm("Delete all rules for all questions?")) return;
    const reset: Record<number, QuestionLogic> = {};
    questions.forEach((q) => { reset[q.id] = { alwaysGoTo: "", otherwise: "", rules: [] }; });
    setLogicMap(reset);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="flex h-[90vh] w-full max-w-3xl flex-col rounded-3xl bg-[#fafafa] shadow-2xl overflow-hidden text-[#26212e]">

        {/* Header */}
        <div className="shrink-0 bg-white px-8 py-5 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Branching</h2>
          <p className="mt-0.5 text-sm text-gray-500">Create rules to branch flows or calculate prices</p>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {questions.map((q, qIdx) => {
            const ql = logicMap[q.id] || {};
            const rules = ql.rules || [];
            const hasRules = rules.length > 0;
            const meta = TYPE_META[q.type] ?? { icon: "•", bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200" };

            return (
              <div
                key={q.id}
                className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden"
              >
                {/* Question header bar */}
                <div className="flex items-center gap-2.5 px-5 py-3.5 bg-gray-50/60 border-b border-gray-100">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs font-bold border ${meta.bg} ${meta.text} ${meta.border}`}
                  >
                    <span>{meta.icon}</span>
                    <span>{qIdx + 1}</span>
                  </span>
                  <span className="text-[13px] font-semibold text-gray-800 truncate">
                    {q.title || "Untitled question"}
                  </span>
                  <button
                    type="button"
                    className="ml-auto text-gray-400 hover:text-gray-600 transition-colors"
                    title="Options"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  {!hasRules ? (
                    /* ── Always-go-to mode ── */
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-500 w-28 shrink-0">Always go to</span>
                        <QuestionDropdown
                          value={ql.alwaysGoTo || ""}
                          questions={questions}
                          excludeId={q.id}
                          onChange={(val) => updateQL(q.id, { alwaysGoTo: val })}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => addRule(q.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-[#4f46e5] hover:text-indigo-700 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Add rule
                      </button>
                    </div>
                  ) : (
                    /* ── Rules mode ── */
                    <div className="space-y-5">
                      {rules.map((rule, ruleIdx) => (
                        <div
                          key={rule.id}
                          className="rounded-xl border border-gray-150 bg-gray-50/50 overflow-hidden"
                        >
                          {/* Conditions */}
                          <div className="p-4 space-y-3">
                            {rule.conditions.map((cond, condIdx) => {
                              const targetQ = questions.find((o) => o.id === cond.fieldId);
                              return (
                                <div key={condIdx} className="space-y-2">
                                  {/* Connector (and/or) between conditions */}
                                  {condIdx > 0 && (
                                    <div className="flex items-center gap-2 pl-14">
                                      <ConnectorDropdown
                                        value={cond.connector || "and"}
                                        onChange={(v) => updateCondition(q.id, rule.id, condIdx, { connector: v })}
                                      />
                                    </div>
                                  )}

                                  <div className="flex flex-wrap items-center gap-2">
                                    {/* If / label */}
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400 w-8 text-right shrink-0">
                                      {condIdx === 0 ? "If" : ""}
                                    </span>

                                    {/* Question selector */}
                                    <div className="flex-1 min-w-[180px]">
                                      <QuestionDropdown
                                        value={String(cond.fieldId)}
                                        questions={questions}
                                        onChange={(val) =>
                                          updateCondition(q.id, rule.id, condIdx, {
                                            fieldId: Number(val),
                                            value: "",
                                          })
                                        }
                                      />
                                    </div>

                                    {/* Remove condition */}
                                    {rule.conditions.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => removeCondition(q.id, rule.id, condIdx)}
                                        className="ml-auto shrink-0 flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    )}
                                  </div>

                                  {/* Operator + Value row */}
                                  <div className="flex flex-wrap items-center gap-2 pl-10">
                                    <OpDropdown
                                      value={cond.op}
                                      onChange={(v) => updateCondition(q.id, rule.id, condIdx, { op: v })}
                                    />
                                    <ValueField
                                      cond={cond}
                                      targetQ={targetQ}
                                      onChange={(v) => updateCondition(q.id, rule.id, condIdx, { value: v })}
                                    />
                                  </div>
                                </div>
                              );
                            })}

                            {/* Add condition */}
                            <div className="flex justify-end pt-1">
                              <button
                                type="button"
                                onClick={() => addCondition(q.id, rule.id)}
                                className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                Add condition
                              </button>
                            </div>
                          </div>

                          {/* Then divider */}
                          <div className="flex items-center gap-2 px-4 py-1 bg-gray-100/60">
                            <svg className="w-3.5 h-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>

                          {/* Then action */}
                          <div className="flex flex-wrap items-center gap-3 p-4 bg-white border-t border-gray-100">
                            <span className="text-sm font-bold text-gray-600 w-8">Then</span>

                            <ThenActionDropdown
                              value={rule.action}
                              onChange={(val) => updateRule(q.id, rule.id, { action: val as any, target: "" })}
                            />

                            {rule.action === "go_to" ? (
                              <div className="flex-1 min-w-0">
                                <QuestionDropdown
                                  value={rule.target}
                                  questions={questions}
                                  excludeId={q.id}
                                  onChange={(val) => updateRule(q.id, rule.id, { target: val })}
                                />
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 flex-1">
                                <input
                                  type="number"
                                  value={rule.target}
                                  onChange={(e) => updateRule(q.id, rule.id, { target: e.target.value })}
                                  placeholder="Value (e.g. 5)"
                                  className="w-32 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100"
                                />
                                <span className="text-xs text-gray-500 font-semibold">to Score variable</span>
                              </div>
                            )}

                            {/* Delete rule button */}
                            <button
                              type="button"
                              onClick={() => removeRule(q.id, rule.id)}
                              className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600 transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete rule
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* All other cases go to + Add rule */}
                      <div className="space-y-3 pt-1">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-gray-500 w-28 shrink-0">All other cases go to</span>
                          <QuestionDropdown
                            value={ql.otherwise || ""}
                            questions={questions}
                            excludeId={q.id}
                            onChange={(val) => updateQL(q.id, { otherwise: val })}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => addRule(q.id)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-[#4f46e5] hover:text-indigo-700 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                          Add rule
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-between border-t border-gray-100 bg-white px-8 py-4">
          <button
            type="button"
            onClick={deleteAllRules}
            className="flex items-center gap-1.5 text-sm font-semibold text-red-500 hover:text-red-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete all rules
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
