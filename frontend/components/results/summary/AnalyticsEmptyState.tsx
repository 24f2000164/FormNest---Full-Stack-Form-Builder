import { ChartPlaceholderIcon } from "../icons";

// Same visual treatment as ChoiceEmptyState, with the copy specified for
// the Number/Rating analytics charts.
export default function AnalyticsEmptyState() {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 text-center">
      <ChartPlaceholderIcon className="h-6 w-6 text-gray-300" />
      <p className="text-base text-gray-700">Waiting for responses</p>
      <p className="text-sm text-gray-400">Your analytics will automatically appear once respondents begin submitting answers.</p>
    </div>
  );
}
