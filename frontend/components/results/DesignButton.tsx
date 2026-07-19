"use client";

import { PaletteIcon } from "./icons";

// Visual only - no design/theme logic yet.
export default function DesignButton() {
  return (
    <button
      type="button"
      className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-gray-50"
    >
      <PaletteIcon className="h-4 w-4 text-gray-500" />
      Design
    </button>
  );
}
