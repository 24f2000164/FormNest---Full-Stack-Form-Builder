"use client";

import { useMemo, useState } from "react";
import type { FormResponse } from "@/lib/api";
import { buildColumns, findAnswer, formatResponseTime, type ResponseColumn, type ResponseQuestion } from "./columns";
import AnswerCell from "./AnswerCell";
import StatusBadge from "./StatusBadge";
import { CheckIcon } from "./icons";
import { ChevronDownIcon } from "@/components/share/icons";

const CHECKBOX_COL_WIDTH = 44;

export default function ResponsesTable({
  questions,
  responses,
  hiddenKeys,
}: {
  questions: ResponseQuestion[];
  responses: FormResponse[];
  hiddenKeys: Set<string>;
}) {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const { identity, rest } = useMemo(() => buildColumns(questions), [questions]);
  const visibleRest = rest.filter((c) => !hiddenKeys.has(c.key));

  const allSelected = responses.length > 0 && selected.size === responses.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(responses.map((r) => r.id)));
  }

  function toggleOne(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const identityWidth = identity?.width ?? 280;
  const stickyLeftWidth = CHECKBOX_COL_WIDTH + identityWidth;

  return (
    <div className="h-full w-full overflow-auto">
      <table className="min-w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <th
              className="sticky top-0 z-30 border-b border-r border-gray-200 bg-white"
              style={{ left: 0, width: CHECKBOX_COL_WIDTH, minWidth: CHECKBOX_COL_WIDTH }}
            >
              <div className="flex h-11 items-center justify-center">
                <Checkbox checked={allSelected} onChange={toggleAll} />
              </div>
            </th>
            {identity && (
              <th
                className="sticky top-0 z-30 border-b border-r border-gray-200 bg-white text-left"
                style={{ left: CHECKBOX_COL_WIDTH, width: identityWidth, minWidth: identityWidth }}
              >
                <ColumnHeaderContent title={identity.question.title} type={identity.question.type} />
              </th>
            )}
            <th
              className="sticky top-0 z-20 border-b border-r border-gray-100 bg-white text-left"
              style={{ width: 130, minWidth: 130 }}
            >
              <ColumnHeaderContent title="Response time" type="__time" />
            </th>
            <th
              className="sticky top-0 z-20 border-b border-r border-gray-100 bg-white text-left"
              style={{ width: 140, minWidth: 140 }}
            >
              <ColumnHeaderContent title="Response type" type="__status" />
            </th>
            {visibleRest.map((col) => (
              <th
                key={col.key}
                className="sticky top-0 z-20 border-b border-r border-gray-100 bg-white text-left"
                style={{ width: col.width, minWidth: col.width }}
              >
                <ColumnHeaderContent title={col.question.title} type={col.question.type} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {responses.map((response) => {
            const isSelected = selected.has(response.id);
            const timeParts = formatResponseTime(response.submitted_at).split("\n");
            return (
              <tr key={response.id} className="group">
                <td
                  className={`sticky z-10 border-b border-r border-gray-100 transition-colors duration-150 ${
                    isSelected ? "bg-gray-100" : "bg-[#fafafa] group-hover:bg-gray-100"
                  }`}
                  style={{ left: 0, width: CHECKBOX_COL_WIDTH, minWidth: CHECKBOX_COL_WIDTH }}
                >
                  <div className="flex h-14 items-center justify-center">
                    <Checkbox checked={isSelected} onChange={() => toggleOne(response.id)} />
                  </div>
                </td>
                {identity && (
                  <td
                    className={`sticky z-10 border-b border-r border-gray-100 px-4 transition-colors duration-150 ${
                      isSelected ? "bg-gray-100" : "bg-[#fafafa] group-hover:bg-gray-100"
                    }`}
                    style={{ left: CHECKBOX_COL_WIDTH, width: identityWidth, minWidth: identityWidth }}
                  >
                    <div className="flex h-14 items-center">
                      <AnswerCell type={identity.question.type} value={findAnswer(response, identity.question.id)?.value} />
                    </div>
                  </td>
                )}
                <td
                  className={`border-b border-r border-gray-100 px-4 transition-colors duration-150 group-hover:bg-gray-100 ${
                    isSelected ? "bg-gray-100" : ""
                  }`}
                >
                  <div className="flex h-14 flex-col justify-center whitespace-pre text-[13px] leading-tight text-gray-600">
                    {timeParts[0]}
                    <span className="text-gray-400">{timeParts[1]}</span>
                  </div>
                </td>
                <td
                  className={`border-b border-r border-gray-100 px-4 transition-colors duration-150 group-hover:bg-gray-100 ${
                    isSelected ? "bg-gray-100" : ""
                  }`}
                >
                  <div className="flex h-14 items-center">
                    <StatusBadge completed={response.completed} />
                  </div>
                </td>
                {visibleRest.map((col) => (
                  <td
                    key={col.key}
                    className={`border-b border-r border-gray-100 px-4 transition-colors duration-150 group-hover:bg-gray-100 ${
                      isSelected ? "bg-gray-100" : ""
                    }`}
                  >
                    <div className="flex h-14 items-center overflow-hidden">
                      <AnswerCell type={col.question.type} value={findAnswer(response, col.question.id)?.value} />
                    </div>
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border transition-colors duration-150 ${
        checked ? "border-gray-900 bg-gray-900" : "border-gray-300 bg-white hover:border-gray-400"
      }`}
      aria-pressed={checked}
    >
      {checked && <CheckIcon className="h-3 w-3 text-white" />}
    </button>
  );
}

function ColumnHeaderContent({ title, type }: { title: string; type: string }) {
  return (
    <div className="flex h-11 items-center gap-2 px-4">
      <QuestionTypeGlyph type={type} />
      <span className="truncate text-[13px] font-medium text-gray-700">{title || "…"}</span>
      {type !== "__time" && type !== "__status" && <ChevronDownIcon className="ml-auto h-3.5 w-3.5 shrink-0 text-gray-400" />}
    </div>
  );
}

const TYPE_GLYPH: Record<string, { icon: string; className: string }> = {
  short_text: { icon: "T", className: "bg-blue-100 text-blue-600" },
  long_text: { icon: "≡", className: "bg-blue-100 text-blue-600" },
  email: { icon: "✉", className: "bg-pink-100 text-pink-700" },
  multiple_choice: { icon: "●", className: "bg-purple-100 text-purple-600" },
  dropdown: { icon: "▼", className: "bg-purple-100 text-purple-600" },
  checkbox: { icon: "☐", className: "bg-blue-100 text-blue-600" },
  yes_no: { icon: "✓", className: "bg-purple-100 text-purple-600" },
  number: { icon: "#", className: "bg-amber-100 text-amber-600" },
  rating: { icon: "★", className: "bg-green-100 text-green-600" },
  __time: { icon: "◷", className: "bg-gray-100 text-gray-500" },
  __status: { icon: "▽", className: "bg-gray-100 text-gray-500" },
};

function QuestionTypeGlyph({ type }: { type: string }) {
  const glyph = TYPE_GLYPH[type] ?? { icon: "?", className: "bg-gray-100 text-gray-500" };
  return (
    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold ${glyph.className}`}>
      {glyph.icon}
    </span>
  );
}
