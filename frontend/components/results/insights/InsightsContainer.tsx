"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import FilterBar, { FilterState } from "./FilterBar";
import BigPictureCards from "./BigPictureCards";
import InsightsCharts from "./InsightsCharts";
import QuestionInsightsList from "./QuestionInsightsList";
import InsightsSkeleton from "./InsightsSkeleton";
import InsightsEmptyState from "./InsightsEmptyState";
import { getFormInsights, generateTestResponse, InsightsData } from "@/lib/api";

interface InsightsContainerProps {
  formId: string;
}

export default function InsightsContainer({ formId }: InsightsContainerProps) {
  const [filters, setFilters] = useState<FilterState>({
    dateRange: "all_time",
    device: "all",
  });
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchInsights = useCallback(async () => {
    // Avoid hitting the API for custom dates until both start and end dates are specified
    if (filters.dateRange === "custom" && (!filters.startDate || !filters.endDate)) {
      return;
    }

    setLoading(true);
    setError(false);
    try {
      const data = await getFormInsights(Number(formId), {
        device: filters.device,
        dateRange: filters.dateRange,
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
      setInsights(data);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [formId, filters]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const handleGenerateRequest = useCallback(async () => {
    await generateTestResponse(Number(formId));
  }, [formId]);

  // Memoized Chart Props to prevent unnecessary child re-renders
  const memoizedChartProps = useMemo(() => {
    if (!insights) return null;
    return {
      responsesOverTime: insights.responsesOverTime,
      deviceDistribution: insights.deviceDistribution,
      completionFunnel: insights.completionFunnel,
      responseTrend: insights.responseTrend,
    };
  }, [insights]);

  // Memoized Question Insights to prevent unnecessary list re-renders
  const memoizedQuestionInsights = useMemo(() => {
    return insights?.questionInsights || [];
  }, [insights]);

  // Main UI States
  if (loading && !insights) {
    return <InsightsSkeleton />;
  }

  if (error) {
    return (
      <div className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/30 p-8 text-center">
        <span className="text-3xl mb-3">⚠️</span>
        <h3 className="text-base font-bold text-gray-800">Failed to load analytics</h3>
        <p className="mt-1 text-sm text-gray-500 max-w-xs">
          An error occurred while communicating with the server. Please try again.
        </p>
        <button
          onClick={fetchInsights}
          className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // If there are absolutely no views, show empty state
  // Wait, what if we have active filters but no data matched? We should still show the FilterBar,
  // but if the base view count (unfiltered or even filtered) is 0, we can display empty state.
  // To handle empty state correctly: if the form has 0 total views (All Time, All Devices), show the main Empty State.
  const hasNoData = !insights || insights.views === 0;

  if (hasNoData && filters.dateRange === "all_time" && filters.device === "all") {
    return (
      <InsightsEmptyState
        formId={formId}
        onGenerateSuccess={fetchInsights}
        onGenerateRequest={handleGenerateRequest}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. Top Filters */}
      <FilterBar filters={filters} onChange={setFilters} />

      {loading ? (
        <div className="space-y-8 opacity-60">
          <BigPictureCards
            views={insights?.views || 0}
            starts={insights?.starts || 0}
            submissions={insights?.submissions || 0}
            completionRate={insights?.completionRate || 0}
            averageCompletionTime={insights?.averageCompletionTime || 0}
          />
          <div className="h-96 rounded-2xl bg-white border border-gray-100 flex items-center justify-center">
            <span className="text-sm font-medium text-gray-400">Loading charts...</span>
          </div>
        </div>
      ) : (
        <>
          {/* 2. Big Picture Cards */}
          <BigPictureCards
            views={insights?.views || 0}
            starts={insights?.starts || 0}
            submissions={insights?.submissions || 0}
            completionRate={insights?.completionRate || 0}
            averageCompletionTime={insights?.averageCompletionTime || 0}
          />

          {/* 3. Charts Section */}
          {memoizedChartProps && (
            <div>
              <div className="border-b border-gray-100 pb-3 mb-6">
                <h3 className="text-lg font-bold text-gray-800">Analytics Dashboard</h3>
              </div>
              <InsightsCharts {...memoizedChartProps} />
            </div>
          )}

          {/* 4. Question Insights Section */}
          {memoizedQuestionInsights.length > 0 ? (
            <QuestionInsightsList insights={memoizedQuestionInsights} />
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-400">
              No questions found in this form. Go to Builder to add questions.
            </div>
          )}
        </>
      )}
    </div>
  );
}
