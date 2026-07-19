"use client";

import { useState } from "react";
import Link from "next/link";

interface InsightsEmptyStateProps {
  formId: string;
  onGenerateSuccess: () => void;
  onGenerateRequest: () => Promise<void>;
}

export default function InsightsEmptyState({
  formId,
  onGenerateSuccess,
  onGenerateRequest,
}: InsightsEmptyStateProps) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      // Let's generate a batch of 5-10 responses to make the charts look super impressive at once!
      // We can run a loop of 10 requests, or make 10 requests concurrently.
      const promises = Array.from({ length: 8 }).map(() => onGenerateRequest());
      await Promise.all(promises);
      onGenerateSuccess();
    } catch (err: any) {
      setError("Failed to generate test responses. Please try again.");
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex min-h-[450px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center shadow-sm">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-3xl mb-4">
        📊
      </div>
      <h3 className="text-lg font-bold text-gray-800">No insights available yet</h3>
      <p className="mt-2 text-sm text-gray-500 max-w-sm">
        Share your form with your audience to start collecting responses and view analytics.
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-4">
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {generating ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generating...
            </>
          ) : (
            "Generate Test Response"
          )}
        </button>

        <Link
          href={`/forms/${formId}/share`}
          className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Go to Share
        </Link>
      </div>

      {error && <p className="mt-3 text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
}
