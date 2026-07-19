import BaseSummaryCard from "./BaseSummaryCard";
import ChoiceAnalytics from "./ChoiceAnalytics";
import { aggregateYesNo, ChoiceAnswer } from "./choiceAggregation";

export default function YesNoSummaryCard({
  number,
  title,
  answers = [],
  totalResponses = 0,
  loading = false,
  error = false,
  onRetry,
}: {
  number: number;
  title?: string | null;
  answers?: ChoiceAnswer[];
  totalResponses?: number;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}) {
  const aggregation = aggregateYesNo(answers);

  return (
    <BaseSummaryCard
      type="yes_no"
      number={number}
      title={title}
      answeredCount={answers.length}
      totalResponses={totalResponses}
    >
      <ChoiceAnalytics aggregation={aggregation} answeredCount={answers.length} loading={loading} error={error} onRetry={onRetry} />
    </BaseSummaryCard>
  );
}
