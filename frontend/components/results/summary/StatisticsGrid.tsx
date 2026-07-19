import StatisticCard, { Statistic } from "./StatisticCard";

// Desktop: all cards in a row. Tablet: wraps naturally (flex-wrap).
// Mobile: stacks vertically (grid-cols-1 below sm).
export default function StatisticsGrid({ stats }: { stats: Statistic[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap">
      {stats.map((s) => {
        const { key, ...rest } = s;
        return <StatisticCard key={key} {...rest} />;
      })}
    </div>
  );
}

export function StatisticsGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid animate-pulse grid-cols-1 gap-3 sm:flex sm:flex-wrap" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-2 rounded-xl bg-gray-50 px-4 py-5">
          <div className="h-7 w-10 rounded bg-gray-200" />
          <div className="h-3 w-16 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}
