import BaseSummaryCard from "./BaseSummaryCard";
import SummaryPlaceholder from "./SummaryPlaceholder";
import ShortTextSummaryCard from "./ShortTextSummaryCard";
import LongTextSummaryCard from "./LongTextSummaryCard";
import EmailSummaryCard from "./EmailSummaryCard";
import MultipleChoiceSummaryCard from "./MultipleChoiceSummaryCard";
import DropdownSummaryCard from "./DropdownSummaryCard";
import CheckboxSummaryCard from "./CheckboxSummaryCard";
import YesNoSummaryCard from "./YesNoSummaryCard";
import NumberSummaryCard from "./NumberSummaryCard";
import RatingSummaryCard from "./RatingSummaryCard";
import { TextAnswer } from "./TextAnswerList";

export type SummaryQuestion = {
  id: number;
  type: string;
  title: string;
  description?: string | null;
  options?: string[] | null;
  settings?: Record<string, unknown> | null;
  order_index: number;
};

// Single source of truth for "question type -> Summary card". Adding a new
// question type later only means adding one more case here plus its card
// component - the rest of the page (ordering, numbering, layout) stays
// untouched.
//
// `answers` holds this question's individual answers (already filtered to
// this question_id, most recent first) and `totalResponses` is the total
// number of people who responded to the form - together they drive the
// "X out of Y answered" line on every card, and the quoted response list
// on the text-type cards.
export default function SummaryQuestionRenderer({
  question,
  number,
  answers,
  totalResponses,
  loading = false,
  error = false,
  onRetry,
}: {
  question: SummaryQuestion;
  number: number;
  answers: TextAnswer[];
  totalResponses: number;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}) {
  const answeredCount = answers.length;
  const props = { number, title: question.title, answeredCount, totalResponses };
  const choiceProps = { number, title: question.title, totalResponses, answers, loading, error, onRetry };

  switch (question.type) {
    case "short_text":
      return <ShortTextSummaryCard {...props} answers={answers} />;
    case "long_text":
      return <LongTextSummaryCard {...props} answers={answers} />;
    case "email":
      return <EmailSummaryCard {...props} />;
    case "multiple_choice":
      return <MultipleChoiceSummaryCard {...choiceProps} options={question.options ?? []} />;
    case "dropdown":
      return <DropdownSummaryCard {...choiceProps} options={question.options ?? []} />;
    case "checkbox":
      return (
        <CheckboxSummaryCard {...choiceProps} options={question.options ?? []} description={question.description} />
      );
    case "yes_no":
      return <YesNoSummaryCard {...choiceProps} />;
    case "number":
      return <NumberSummaryCard {...choiceProps} description={question.description} />;
    case "rating":
      return <RatingSummaryCard {...choiceProps} description={question.description} settings={question.settings} />;
    default:
      // Any type without a dedicated card yet (phone, date, opinion_scale,
      // statement, welcome/ending screens, ...) still renders safely.
      return (
        <BaseSummaryCard
          type={question.type}
          number={number}
          title={question.title}
          answeredCount={answeredCount}
          totalResponses={totalResponses}
        >
          <SummaryPlaceholder variant="text" label="Analytics coming soon" />
        </BaseSummaryCard>
      );
  }
}
