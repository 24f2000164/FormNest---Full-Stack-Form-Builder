import SummaryHeader from "@/components/results/SummaryHeader";
import SummaryToolbar from "@/components/results/SummaryToolbar";
import SummaryQuestionList from "@/components/results/SummaryQuestionList";

// Page container + question rendering architecture, per spec: iterates the
// form's questions in builder order and renders the matching Summary card
// for each type. Still no charts, stats, calculations, or response data -
// every card body is a placeholder until analytics land in a later phase.
export default function SummaryPage() {
  return (
    <div>
      <SummaryHeader />
      <SummaryToolbar />
      <SummaryQuestionList />
    </div>
  );
}
