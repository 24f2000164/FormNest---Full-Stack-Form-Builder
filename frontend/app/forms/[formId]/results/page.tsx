import { redirect } from "next/navigation";

export default function ResultsIndexPage({ params }: { params: { formId: string } }) {
  redirect(`/forms/${params.formId}/results/summary`);
}
