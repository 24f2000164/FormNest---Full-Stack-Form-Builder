"use client";

import { useMemo } from "react";
import BaseSummaryCard from "./BaseSummaryCard";
import ChoiceAnalytics from "./ChoiceAnalytics";
import ChoiceChartSkeleton from "./ChoiceChartSkeleton";
import ChoiceErrorState from "./ChoiceErrorState";
import AnalyticsEmptyState from "./AnalyticsEmptyState";
import StatisticsGrid, { StatisticsGridSkeleton } from "./StatisticsGrid";
import { Statistic } from "./StatisticCard";
import { aggregateNumberAnswers, NumberAnswer } from "./numberAggregation";
import { formatStatValue } from "./statistics";

export default function NumberSummaryCard({
  number,
  title,
  description,
  answers = [],
  totalResponses = 0,
  loading = false,
  error = false,
  onRetry,
}: {
  number: number;
  title?: string | null;
  description?: string | null;
  answers?: NumberAnswer[];
  totalResponses?: number;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}) {
  // Recompute only when the underlying answers actually change - avoids
  // re-running stats/histogram math on every unrelated re-render (e.g. a
  // sibling card's hover state), which matters once a form has hundreds or
  // thousands of responses.
  const aggregation = useMemo(() => aggregateNumberAnswers(answers), [answers]);
  const { stats } = aggregation;

  const statList: Statistic[] = [
    { key: "mean", label: "Mean", value: stats.mean, tooltip: "The average of all submitted numbers." },
    { key: "median", label: "Median", value: stats.median, tooltip: "The middle value when all answers are sorted." },
    {
      key: "minmax",
      label: "Min–Max",
      display: `${formatStatValue(stats.minimum)} - ${formatStatValue(stats.maximum)}`,
      tooltip: "The lowest and highest submitted numbers.",
    },
    {
      key: "stddev",
      label: "Standard deviation",
      value: stats.standardDeviation,
      tooltip: "How spread out the answers are from the mean.",
    },
  ];

  return (
    <BaseSummaryCard
      type="number"
      number={number}
      title={title}
      description={description}
      answeredCount={answers.length}
      totalResponses={totalResponses}
    >
      {loading ? (
        <>
          <StatisticsGridSkeleton count={4} />
          <div className="mt-5">
            <ChoiceChartSkeleton />
          </div>
        </>
      ) : error ? (
        <ChoiceErrorState onRetry={onRetry ?? (() => {})} message="Unable to load analytics." />
      ) : (
        <>
          <StatisticsGrid stats={statList} />
          <div className="mt-5">
            <ChoiceAnalytics
              aggregation={aggregation.histogram}
              answeredCount={answers.length}
              emptyState={<AnalyticsEmptyState />}
            />
          </div>
        </>
      )}
    </BaseSummaryCard>
  );
}
