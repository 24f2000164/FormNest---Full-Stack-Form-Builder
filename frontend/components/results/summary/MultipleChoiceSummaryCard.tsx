import BaseSummaryCard from "./BaseSummaryCard";
import ChoiceAnalytics from "./ChoiceAnalytics";
import { aggregateSingleSelect, ChoiceAnswer } from "./choiceAggregation";

export default function MultipleChoiceSummaryCard({
  number,
  title,
  options = [],
  answers = [],
  totalResponses = 0,
  loading = false,
  error = false,
  onRetry,
}: {
  number: number;
  title?: string | null;
  options?: string[];
  answers?: ChoiceAnswer[];
  totalResponses?: number;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}) {
  const aggregation = aggregateSingleSelect(options, answers);

  return (
    <BaseSummaryCard
      type="multiple_choice"
      number={number}
      title={title}
      answeredCount={answers.length}
      totalResponses={totalResponses}
    >
      <ChoiceAnalytics aggregation={aggregation} answeredCount={answers.length} loading={loading} error={error} onRetry={onRetry} />
    </BaseSummaryCard>
  );
}
