"use client";

import { useState } from "react";
import { GridTableIcon, RowsListIcon, ColumnChartIcon, TagIcon } from "../icons";
import { ChoiceAggregation } from "./choiceAggregation";
import ChoiceColumnChart from "./ChoiceColumnChart";
import ChoiceBarList from "./ChoiceBarList";
import ChoiceTable from "./ChoiceTable";
import ChoiceEmptyState from "./ChoiceEmptyState";
import ChoiceChartSkeleton from "./ChoiceChartSkeleton";
import ChoiceErrorState from "./ChoiceErrorState";

type View = "grid" | "list" | "chart";

export default function ChoiceAnalytics({
  aggregation,
  answeredCount,
  loading = false,
  error = false,
  onRetry,
  emptyState,
  errorMessage,
}: {
  aggregation: ChoiceAggregation;
  answeredCount: number;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  /** Custom empty-state content; defaults to the standard ChoiceEmptyState
   *  so existing callers (Multiple Choice, Dropdown, Checkbox, Yes/No) are
   *  unaffected. Number/Rating pass their own copy. */
  emptyState?: React.ReactNode;
  errorMessage?: string;
}) {
  const [view, setView] = useState<View>("chart");

  if (loading) return <ChoiceChartSkeleton />;
  if (error) return <ChoiceErrorState onRetry={onRetry ?? (() => {})} message={errorMessage} />;
  if (answeredCount === 0) return <>{emptyState ?? <ChoiceEmptyState />}</>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center overflow-hidden rounded-md border border-gray-200 bg-white">
          <button
            type="button"
            className="flex h-8 items-center gap-1.5 border-r border-gray-200 bg-gray-100 px-3 text-sm font-medium text-gray-900"
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => onComingSoon()}
            className="flex h-8 items-center gap-1.5 px-3 text-sm text-gray-500 transition-colors duration-150 hover:bg-gray-50"
          >
            <TagIcon className="h-3.5 w-3.5" />
            Trends
          </button>
        </div>

        <div className="flex items-center overflow-hidden rounded-md border border-gray-200 bg-white">
          <ViewButton icon={GridTableIcon} label="Table view" active={view === "grid"} onClick={() => setView("grid")} />
          <div className="h-5 w-px bg-gray-200" />
          <ViewButton icon={RowsListIcon} label="List view" active={view === "list"} onClick={() => setView("list")} />
          <div className="h-5 w-px bg-gray-200" />
          <ViewButton icon={ColumnChartIcon} label="Chart view" active={view === "chart"} onClick={() => setView("chart")} />
        </div>
      </div>

      <div className="mt-5">
        {view === "chart" && <ChoiceColumnChart options={aggregation.options} maxCount={aggregation.maxCount} />}
        {view === "list" && <ChoiceBarList options={aggregation.options} maxCount={aggregation.maxCount} />}
        {view === "grid" && <ChoiceTable options={aggregation.options} />}
      </div>
    </div>
  );
}

function onComingSoon() {
  alert("Coming soon!");
}

function ViewButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`flex h-8 w-9 items-center justify-center transition-colors duration-150 ${
        active ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
      }`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
