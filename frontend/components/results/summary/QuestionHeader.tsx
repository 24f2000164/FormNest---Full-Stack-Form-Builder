import QuestionBadge from "./QuestionBadge";
import QuestionMenu from "./QuestionMenu";
import { QuestionTypeKey } from "./questionTypeBadge";

export default function QuestionHeader({
  type,
  number,
  title,
  description,
}: {
  type: QuestionTypeKey | string;
  number: number;
  title?: string | null;
  /** Opt-in only: existing cards that don't pass this see no change. */
  description?: string | null;
}) {
  return (
    <div>
      <div className="flex items-center gap-2.5">
        <QuestionBadge type={type} number={number} />
        {title ? (
          <h3 className="min-w-0 flex-1 truncate text-base text-gray-900">{title}</h3>
        ) : (
          <div className="flex-1" />
        )}
        <QuestionMenu />
      </div>
      {description && <p className="mt-1 pl-[calc(1.5rem+0.625rem)] text-sm text-gray-500">{description}</p>}
    </div>
  );
}
