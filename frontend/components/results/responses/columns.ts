import type { FormResponse, ResponseAnswer } from "@/lib/api";

export type ResponseQuestion = {
  id: number;
  type: string;
  title: string;
  order_index: number;
};

export type ResponseColumn = {
  key: string;
  question: ResponseQuestion;
  width: number;
};

// Default pixel widths per question type, tuned to match Typeform's
// Responses table. A handful of common field titles (phone/name) get a
// narrower width since they hold short values.
function widthForQuestion(question: ResponseQuestion, isIdentity: boolean): number {
  const title = (question.title || "").toLowerCase();
  if (isIdentity) return 280;
  if (title.includes("phone")) return 180;
  if (title.includes("name")) return 200;
  switch (question.type) {
    case "long_text":
      return 260;
    case "number":
    case "rating":
      return 160;
    case "yes_no":
      return 150;
    default:
      return 230;
  }
}

// Builds the ordered list of table columns from the form's questions:
// the "identity" column (first email-type question, falling back to the
// first question overall) is pulled out and rendered sticky by the table;
// everything else keeps its original order_index order.
export function buildColumns(questions: ResponseQuestion[]): {
  identity: ResponseColumn | null;
  rest: ResponseColumn[];
} {
  if (questions.length === 0) return { identity: null, rest: [] };

  const sorted = [...questions].sort((a, b) => a.order_index - b.order_index);
  const identityQuestion = sorted.find((q) => q.type === "email") ?? sorted[0];
  const rest = sorted.filter((q) => q.id !== identityQuestion.id);

  return {
    identity: { key: `q-${identityQuestion.id}`, question: identityQuestion, width: widthForQuestion(identityQuestion, true) },
    rest: rest.map((q) => ({ key: `q-${q.id}`, question: q, width: widthForQuestion(q, false) })),
  };
}

export function findAnswer(response: FormResponse, questionId: number): ResponseAnswer | undefined {
  return response.answers.find((a) => a.question_id === questionId);
}

// Question types that render as rounded "pill" tags instead of plain text.
export const PILL_TYPES = new Set(["yes_no", "dropdown", "multiple_choice", "checkbox"]);

// Normalizes an answer's raw value into a list of display strings. Most
// types produce a single string; checkbox (multi-select) can produce
// several, each rendered as its own pill.
export function answerToPillLabels(type: string, value: unknown): string[] {
  if (value === null || value === undefined || value === "") return [];

  if (type === "yes_no") {
    if (value === true) return ["Yes"];
    if (value === false) return ["No"];
    const normalized = String(value).trim().toLowerCase();
    if (normalized === "yes" || normalized === "true") return ["Yes"];
    if (normalized === "no" || normalized === "false") return ["No"];
    return [String(value)];
  }

  if (Array.isArray(value)) {
    return value.map((v) => String(v)).filter(Boolean);
  }

  return [String(value)];
}

export function answerToPlainText(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") {
    const fields = value as Record<string, any>;
    const parts = [];
    const nameParts = [];
    if (fields.firstName) nameParts.push(fields.firstName);
    if (fields.lastName) nameParts.push(fields.lastName);
    if (nameParts.length > 0) parts.push(nameParts.join(" "));
    if (fields.phone) parts.push(fields.phone);
    if (fields.email) parts.push(fields.email);
    if (fields.company) parts.push(fields.company);
    return parts.join(", ");
  }
  return String(value);
}

// Formats an ISO timestamp as "18 Jul 2026, 20:07", matching the Response
// time column in Typeform. Mirrors the UTC-safety fix already used by
// lib/relativeTime.ts (naive timestamps from the backend have no "Z").
export function formatResponseTime(isoString: string): string {
  const hasTimezone = /[zZ]|[+-]\d\d:?\d\d$/.test(isoString);
  const date = new Date(hasTimezone ? isoString : `${isoString}Z`);
  if (Number.isNaN(date.getTime())) return "";

  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day} ${month} ${year}\n${hours}:${minutes}`;
}
