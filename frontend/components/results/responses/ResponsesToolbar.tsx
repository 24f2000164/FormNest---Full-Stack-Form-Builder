"use client";

import { useState } from "react";
import { CalendarIcon, FilterIcon, SearchIcon } from "@/components/results/icons";
import { DownloadIcon, InboxIcon, SlidersIcon, WarningIcon, ColumnsIcon } from "./icons";
import type { ResponseColumn } from "./columns";
import ColumnsMenu from "./ColumnsMenu";
import TimeFilterButton, { DateFilterValue } from "../TimeFilterButton";

export default function ResponsesToolbar({
  search,
  onSearchChange,
  onOpenFilters,
  columns,
  hiddenKeys,
  onToggleColumn,
  onExport,
  onGenerateTestResponse,
  generating,
  onDateFilterChange,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  onOpenFilters: () => void;
  columns: ResponseColumn[];
  hiddenKeys: Set<string>;
  onToggleColumn: (key: string) => void;
  onExport: () => void;
  onGenerateTestResponse: () => void;
  generating: boolean;
  onDateFilterChange: (val: DateFilterValue) => void;
}) {
  const [columnsMenuOpen, setColumnsMenuOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2.5 border-b border-gray-200 bg-white px-6 py-3.5">
      <div className="group relative">
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
          aria-label="Inbox view"
        >
          <InboxIcon />
        </button>
        <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full z-10 mb-2 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          Responses
        </span>
      </div>
      <div className="group relative">
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
          aria-label="Flagged responses"
        >
          <WarningIcon />
        </button>
        <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full z-10 mb-2 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          Coming soon: spam responses
        </span>
      </div>

      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search responses"
          className="h-9 w-60 rounded-lg border border-gray-200 pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"
        />
      </div>

      <TimeFilterButton onChange={onDateFilterChange} />

      <button
        onClick={onOpenFilters}
        className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <FilterIcon className="h-4 w-4 text-gray-500" />
        Filters
      </button>

      <div className="ml-auto flex items-center gap-2.5">
        <div className="relative">
          <button
            onClick={() => setColumnsMenuOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
            aria-label="Choose columns"
          >
            <ColumnsIcon />
          </button>
          <ColumnsMenu
            isOpen={columnsMenuOpen}
            onClose={() => setColumnsMenuOpen(false)}
            columns={columns}
            hiddenKeys={hiddenKeys}
            onToggle={onToggleColumn}
          />
        </div>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
          aria-label="Table settings"
          onClick={() => alert("Coming soon!")}
        >
          <SlidersIcon />
        </button>
        <button
          onClick={onExport}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
          aria-label="Export as CSV"
        >
          <DownloadIcon />
        </button>
        <button
          onClick={onGenerateTestResponse}
          disabled={generating}
          className="h-9 whitespace-nowrap rounded-lg border border-gray-300 px-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {generating ? "Generating…" : "Generate test response"}
        </button>
      </div>
    </div>
  );
}
