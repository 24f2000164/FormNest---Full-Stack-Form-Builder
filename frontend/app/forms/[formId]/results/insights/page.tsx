"use client";

import { useParams } from "next/navigation";
import InsightsContainer from "@/components/results/insights/InsightsContainer";

export default function InsightsPage() {
  const params = useParams<{ formId: string }>();
  const formId = params.formId;

  return <InsightsContainer formId={formId} />;
}
