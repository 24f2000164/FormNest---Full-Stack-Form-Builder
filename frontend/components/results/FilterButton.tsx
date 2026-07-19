"use client";

import { FilterIcon } from "./icons";

// Visual only - no filtering logic yet.
export default function FilterButton() {
  return (
    <button
      type="button"
      className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-gray-50"
    >
      <FilterIcon className="h-4 w-4 text-gray-500" />
      Filters
    </button>
  );
}
