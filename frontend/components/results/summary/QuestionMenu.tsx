"use client";

import { MoreIcon } from "../icons";

// Visual only, same "Coming soon!" convention already used elsewhere in the
// builder (Workflow/Connect/etc.) for controls that aren't wired up yet.
export default function QuestionMenu() {
  return (
    <button
      type="button"
      aria-label="More options"
      onClick={() => alert("Coming soon!")}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-gray-400 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-600"
    >
      <MoreIcon />
    </button>
  );
}
