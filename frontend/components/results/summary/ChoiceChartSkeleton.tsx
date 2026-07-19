// Shown in place of a choice chart while responses are still loading.
// Bar heights are fixed (not randomized) so the skeleton doesn't jitter
// between re-renders.
const BAR_HEIGHTS = [55, 85, 40, 70, 30];

export default function ChoiceChartSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex h-[220px] items-end gap-4 pl-8">
        {BAR_HEIGHTS.map((h, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            <div className="w-full max-w-[80px] rounded-t-sm bg-gray-100" style={{ height: `${h}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-4 pl-8">
        {BAR_HEIGHTS.map((_, i) => (
          <div key={i} className="h-3 flex-1 rounded bg-gray-100" />
        ))}
      </div>
    </div>
  );
}
