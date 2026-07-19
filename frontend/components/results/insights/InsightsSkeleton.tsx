"use client";

export default function InsightsSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Filters Skeleton */}
      <div className="flex gap-3">
        <div className="h-9 w-28 rounded-md bg-gray-200" />
        <div className="h-9 w-32 rounded-md bg-gray-200" />
      </div>

      {/* Big Picture Cards Skeleton */}
      <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-2 rounded-xl bg-white p-5 border border-gray-100">
            <div className="h-8 w-12 rounded bg-gray-200" />
            <div className="h-3 w-20 rounded bg-gray-200" />
          </div>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="h-72 rounded-2xl bg-white p-6 border border-gray-100 flex flex-col gap-3">
          <div className="h-5 w-40 rounded bg-gray-200" />
          <div className="flex-1 rounded bg-gray-100" />
        </div>
        <div className="h-72 rounded-2xl bg-white p-6 border border-gray-100 flex flex-col gap-3">
          <div className="h-5 w-40 rounded bg-gray-200" />
          <div className="flex-1 rounded bg-gray-100" />
        </div>
        <div className="h-72 rounded-2xl bg-white p-6 border border-gray-100 flex flex-col gap-3">
          <div className="h-5 w-40 rounded bg-gray-200" />
          <div className="flex-1 rounded bg-gray-100" />
        </div>
        <div className="h-72 rounded-2xl bg-white p-6 border border-gray-100 flex flex-col gap-3">
          <div className="h-5 w-40 rounded bg-gray-200" />
          <div className="flex-1 rounded bg-gray-100" />
        </div>
      </div>

      {/* Question Insights List Skeleton */}
      <div className="space-y-6">
        <div className="h-6 w-48 rounded bg-gray-200" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-white p-6 border border-gray-100 space-y-4">
            <div className="flex justify-between">
              <div className="h-5 w-1/3 rounded bg-gray-200" />
              <div className="h-5 w-16 rounded bg-gray-200" />
            </div>
            <div className="grid grid-cols-2 gap-4 sm:flex sm:flex-wrap">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="flex-1 h-12 rounded bg-gray-50" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
