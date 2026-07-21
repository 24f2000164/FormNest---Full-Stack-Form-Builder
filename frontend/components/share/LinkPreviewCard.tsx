"use client";

import { ChevronDownIcon, ShieldIcon } from "./icons";

export default function LinkPreviewCard({
  title,
  description,
  origin,
}: {
  title: string;
  description: string | null;
  origin: string;
}) {
  const host = origin.replace(/^https?:\/\//, "");

  return (
    <div className="mt-6 border-t pt-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Link preview</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => alert("Coming soon!")}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
          >
            Customize
            <ChevronDownIcon />
          </button>
          <ShieldIcon className="h-4 w-4 text-gray-400" />
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-lg border bg-gray-50 p-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-white text-gray-900 shadow-sm">
          <span className="text-lg font-bold">T</span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">{title || "New form"}</p>
          <p className="truncate text-sm text-gray-500">
            {description ||
              "Turn data collection into an experience with FormNest. Create beautiful online forms, surveys, quizzes, and so much more."}
          </p>
          <p className="truncate text-xs text-gray-400">{host}</p>
        </div>
      </div>
    </div>
  );
}
