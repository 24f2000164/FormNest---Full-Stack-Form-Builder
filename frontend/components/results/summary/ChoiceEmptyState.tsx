import { ChartPlaceholderIcon } from "../icons";

// Shown instead of any chart when a choice question has zero answers -
// never render an empty/zeroed-out chart per spec.
export default function ChoiceEmptyState() {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 text-center">
      <ChartPlaceholderIcon className="h-6 w-6 text-gray-300" />
      <p className="text-base text-gray-700">Waiting for responses</p>
      <p className="text-sm text-gray-400">Responses will appear here after your form receives submissions.</p>
    </div>
  );
}
