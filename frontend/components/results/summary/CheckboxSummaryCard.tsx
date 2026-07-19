import BaseSummaryCard from "./BaseSummaryCard";
import ChoiceAnalytics from "./ChoiceAnalytics";
import { aggregateCheckbox, ChoiceAnswer } from "./choiceAggregation";

export default function CheckboxSummaryCard({
  number,
  title,
  description,
  options = [],
  answers = [],
  totalResponses = 0,
  loading = false,
  error = false,
  onRetry,
}: {
  number: number;
  title?: string | null;
  description?: string | null;
  options?: string[];
  answers?: ChoiceAnswer[];
  totalResponses?: number;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}) {
  const aggregation = aggregateCheckbox(options, description, title, answers);

  return (
    <BaseSummaryCard
      type="checkbox"
      number={number}
      title={title}
      answeredCount={answers.length}
      totalResponses={totalResponses}
    >
      <ChoiceAnalytics aggregation={aggregation} answeredCount={answers.length} loading={loading} error={error} onRetry={onRetry} />
    </BaseSummaryCard>
  );
}
