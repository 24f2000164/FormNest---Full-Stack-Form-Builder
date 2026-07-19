import { PILL_TYPES, answerToPillLabels, answerToPlainText } from "./columns";

export default function AnswerCell({ type, value }: { type: string; value: unknown }) {
  if (PILL_TYPES.has(type)) {
    const labels = answerToPillLabels(type, value);
    if (labels.length === 0) {
      return <span className="text-gray-300">—</span>;
    }
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {labels.map((label, i) => (
          <span
            key={`${label}-${i}`}
            className="inline-flex items-center rounded-full border border-gray-300 bg-white px-2.5 py-0.5 text-[13px] font-medium text-gray-700"
          >
            {label}
          </span>
        ))}
      </div>
    );
  }

  const text = answerToPlainText(value);
  if (!text) return <span className="text-gray-300">—</span>;
  return <span className="truncate text-[13px] text-gray-700">{text}</span>;
}
