import BaseSummaryCard from "./BaseSummaryCard";
import SummaryPlaceholder from "./SummaryPlaceholder";

export default function EmailSummaryCard({
  number,
  title,
  answeredCount = 0,
  totalResponses = 0,
}: {
  number: number;
  title?: string | null;
  answeredCount?: number;
  totalResponses?: number;
}) {
  return (
    <BaseSummaryCard type="email" number={number} title={title} answeredCount={answeredCount} totalResponses={totalResponses}>
      <SummaryPlaceholder variant="text" label="Responses coming soon" />
    </BaseSummaryCard>
  );
}
