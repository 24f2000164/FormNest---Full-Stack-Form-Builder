import BaseSummaryCard from "./BaseSummaryCard";
import TextAnswerList, { TextAnswer } from "./TextAnswerList";

export default function LongTextSummaryCard({
  number,
  title,
  answers = [],
  totalResponses = 0,
}: {
  number: number;
  title?: string | null;
  answers?: TextAnswer[];
  totalResponses?: number;
}) {
  return (
    <BaseSummaryCard type="long_text" number={number} title={title} answeredCount={answers.length} totalResponses={totalResponses}>
      <TextAnswerList answers={answers} />
    </BaseSummaryCard>
  );
}
