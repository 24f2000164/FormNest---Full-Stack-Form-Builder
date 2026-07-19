"use client";

import { ListIcon, ArrowUpIcon, ArrowDownIcon, HashIcon, PercentIcon } from "./icons";

// Two grouped icon-button clusters shown on the right of the Summary
// toolbar. Purely presentational per spec: "#" is statically shown as the
// selected default and nothing here is wired to real sorting or number
// formatting or view switching.
export default function DisplayModeToolbar() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center overflow-hidden rounded-md border border-gray-300 bg-white">
        <button
          type="button"
          aria-label="List view"
          className="flex h-9 w-9 items-center justify-center text-gray-500 transition-colors duration-150 hover:bg-gray-50"
        >
          <ListIcon />
        </button>
        <div className="h-5 w-px bg-gray-200" />
        <button
          type="button"
          aria-label="Sort ascending"
          className="flex h-9 w-9 items-center justify-center text-gray-500 transition-colors duration-150 hover:bg-gray-50"
        >
          <ArrowUpIcon />
        </button>
        <div className="h-5 w-px bg-gray-200" />
        <button
          type="button"
          aria-label="Sort descending"
          className="flex h-9 w-9 items-center justify-center bg-gray-100 text-gray-700 transition-colors duration-150 hover:bg-gray-200"
        >
          <ArrowDownIcon />
        </button>
      </div>

      <div className="flex items-center overflow-hidden rounded-md border border-gray-300 bg-white">
        <button
          type="button"
          aria-label="Counts (selected)"
          className="flex h-9 w-9 items-center justify-center bg-gray-100 text-gray-900"
        >
          <HashIcon />
        </button>
        <div className="h-5 w-px bg-gray-200" />
        <div className="group relative">
          <button
            type="button"
            aria-label="Show percentages"
            className="flex h-9 w-9 items-center justify-center text-gray-500 transition-colors duration-150 hover:bg-gray-900 hover:text-white"
          >
            <PercentIcon />
          </button>
          <span className="pointer-events-none absolute right-0 top-full z-10 mt-2 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            Show percentages
          </span>
        </div>
      </div>
    </div>
  );
}
