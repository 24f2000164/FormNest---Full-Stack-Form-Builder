import { QUESTION_TYPE_BADGE, FALLBACK_BADGE, QuestionTypeKey } from "./questionTypeBadge";

export default function QuestionBadge({ type, number }: { type: QuestionTypeKey | string; number: number }) {
  const badge = QUESTION_TYPE_BADGE[type as QuestionTypeKey] ?? FALLBACK_BADGE;

  return (
    <span className={`flex h-6 items-center gap-1 rounded px-1.5 text-xs font-semibold ${badge.color}`}>
      <span aria-hidden>{badge.icon}</span>
      {number}
    </span>
  );
}
