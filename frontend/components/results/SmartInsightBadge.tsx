"use client";

import { BadgeIcon } from "./icons";

// Static badge only - mirrors the small teal shield shown next to Filters
// on Typeform's Summary toolbar (upsell indicator, no functionality yet).
export default function SmartInsightBadge() {
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#0f6b52]/30 bg-[#0f6b52]/5 text-[#0f6b52]">
      <BadgeIcon className="h-4 w-4" />
    </span>
  );
}
