"use client";

import { useEffect, useRef } from "react";
import type { ResponseColumn } from "./columns";
import { CheckIcon } from "./icons";

export default function ColumnsMenu({
  isOpen,
  onClose,
  columns,
  hiddenKeys,
  onToggle,
}: {
  isOpen: boolean;
  onClose: () => void;
  columns: ResponseColumn[];
  hiddenKeys: Set<string>;
  onToggle: (key: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      className="absolute right-0 top-11 z-40 w-64 rounded-xl border border-gray-100 bg-white p-2 shadow-lg"
    >
      <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Show columns</p>
      <div className="max-h-72 overflow-y-auto">
        {columns.map((col) => {
          const hidden = hiddenKeys.has(col.key);
          return (
            <button
              key={col.key}
              onClick={() => onToggle(col.key)}
              className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                  hidden ? "border-gray-300 bg-white" : "border-gray-800 bg-gray-800"
                }`}
              >
                {!hidden && <CheckIcon className="h-2.5 w-2.5 text-white" />}
              </span>
              <span className="truncate">{col.question.title || "Untitled question"}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
