// Renders "{answeredCount} out of {totalResponses} people answered this
// question." Both default to 0 so any card that doesn't wire up response
// data yet still renders the same placeholder text as before.
export default function QuestionStatus({
  answeredCount = 0,
  totalResponses = 0,
}: {
  answeredCount?: number;
  totalResponses?: number;
}) {
  return (
    <p className="mt-2 text-sm text-gray-500">
      {answeredCount} out of {totalResponses} people answered this question.
    </p>
  );
}
