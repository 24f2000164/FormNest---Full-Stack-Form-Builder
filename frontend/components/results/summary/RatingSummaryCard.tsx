"use client";

import { useMemo } from "react";
import BaseSummaryCard from "./BaseSummaryCard";
import ChoiceAnalytics from "./ChoiceAnalytics";
import ChoiceChartSkeleton from "./ChoiceChartSkeleton";
import ChoiceErrorState from "./ChoiceErrorState";
import AnalyticsEmptyState from "./AnalyticsEmptyState";
import StatisticsGrid, { StatisticsGridSkeleton } from "./StatisticsGrid";
import { Statistic } from "./StatisticCard";
import { aggregateRatingAnswers, getRatingScale, RatingAnswer } from "./ratingAggregation";

export default function RatingSummaryCard({
  number,
  title,
  description,
  answers = [],
  totalResponses = 0,
  settings,
  loading = false,
  error = false,
  onRetry,
}: {
  number: number;
  title?: string | null;
  description?: string | null;
  answers?: RatingAnswer[];
  totalResponses?: number;
  settings?: Record<string, unknown> | null;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}) {
  const maxRating = useMemo(() => getRatingScale(settings), [settings]);
  // Recompute only when the answers or the scale change.
  const aggregation = useMemo(() => aggregateRatingAnswers(answers, maxRating), [answers, maxRating]);
  const { stats } = aggregation;

  const statList: Statistic[] = [
    { key: "mean", label: "Mean", value: stats.mean, tooltip: "The average rating across all responses." },
    { key: "median", label: "Median", value: stats.median, tooltip: "The middle rating when all answers are sorted." },
    {
      key: "stddev",
      label: "Standard deviation",
      value: stats.standardDeviation,
      tooltip: "How spread out the ratings are from the mean.",
    },
  ];

  return (
    <BaseSummaryCard
      type="rating"
      number={number}
      title={title}
      description={description}
      answeredCount={answers.length}
      totalResponses={totalResponses}
    >
      {loading ? (
        <>
          <StatisticsGridSkeleton count={3} />
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
              aggregation={aggregation.distribution}
              answeredCount={answers.length}
              emptyState={<AnalyticsEmptyState />}
            />
          </div>
        </>
      )}
    </BaseSummaryCard>
  );
}
