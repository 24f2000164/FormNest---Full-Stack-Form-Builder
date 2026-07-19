"use client";

import TimeFilterButton from "./TimeFilterButton";
import FilterButton from "./FilterButton";
import SmartInsightBadge from "./SmartInsightBadge";
import DisplayModeToolbar from "./DisplayModeToolbar";

export default function SummaryToolbar() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-4">
      <div className="flex items-center gap-2">
        <TimeFilterButton />
        <FilterButton />
        <SmartInsightBadge />
      </div>
      <DisplayModeToolbar />
    </div>
  );
}
