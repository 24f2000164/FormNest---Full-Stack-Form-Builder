"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getFormById, getFormResponses, FormResponse } from "@/lib/api";
import SummaryQuestionRenderer, { SummaryQuestion } from "./summary/SummaryQuestionRenderer";
import { TextAnswer } from "./summary/TextAnswerList";
import EmptySummaryContainer from "./EmptySummaryContainer";

type ResponsesState =
  | { status: "loading"; data: FormResponse[] }
  | { status: "loaded"; data: FormResponse[] }
  | { status: "error"; data: FormResponse[] };

export default function SummaryQuestionList() {
  const params = useParams<{ formId: string }>();
  const formId = params.formId;

  const [questions, setQuestions] = useState<SummaryQuestion[] | null>(null);
  const [responsesState, setResponsesState] = useState<ResponsesState>({ status: "loading", data: [] });

  const loadResponses = useCallback(() => {
    if (!formId) return;
    setResponsesState((s) => ({ status: "loading", data: s.data }));
    getFormResponses(Number(formId))
      .then((data) => setResponsesState({ status: "loaded", data: Array.isArray(data) ? data : [] }))
      .catch(() => setResponsesState((s) => ({ status: "error", data: s.data })));
  }, [formId]);

  useEffect(() => {
    if (!formId) return;
    getFormById(Number(formId))
      .then((form) => setQuestions([...form.questions].sort((a, b) => a.order_index - b.order_index)))
      .catch(() => setQuestions([]));
    loadResponses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId]);

  if (questions === null) return null;

  if (questions.length === 0) return <EmptySummaryContainer />;

  const responses = responsesState.data;
  const totalResponses = responses.length;

  // Group answers by question_id, most recent response first (the backend
  // already orders `responses` by submitted_at desc).
  const answersByQuestion = new Map<number, TextAnswer[]>();
  for (const response of responses) {
    for (const answer of response.answers) {
      const list = answersByQuestion.get(answer.question_id) ?? [];
      list.push({ value: answer.value, submittedAt: response.submitted_at });
      answersByQuestion.set(answer.question_id, list);
    }
  }

  return (
    <div className="space-y-6">
      {questions.map((question, index) => (
        <SummaryQuestionRenderer
          key={question.id}
          question={question}
          number={index + 1}
          answers={answersByQuestion.get(question.id) ?? []}
          totalResponses={totalResponses}
          loading={responsesState.status === "loading"}
          error={responsesState.status === "error"}
          onRetry={loadResponses}
        />
      ))}
    </div>
  );
}
