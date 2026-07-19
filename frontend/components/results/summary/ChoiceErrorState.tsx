import { RetryIcon } from "../icons";

export default function ChoiceErrorState({
  onRetry,
  message = "Couldn't load analytics for this question.",
}: {
  onRetry: () => void;
  message?: string;
}) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-red-200 bg-red-50/40 text-center">
      <p className="text-sm font-medium text-gray-700">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-gray-50"
      >
        <RetryIcon className="h-4 w-4" />
        Retry
      </button>
    </div>
  );
}
