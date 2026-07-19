// Mirrors the color/icon choices in components/builder/QuestionTypeModal.tsx
// so a question's badge looks identical in the Builder and in Results.
// "checkbox" isn't buildable yet (it's in QuestionTypeModal's disabled list)
// but the Summary renderer supports it ahead of time, using the same
// disabled-state color QuestionTypeModal already reserves for it.
export type QuestionTypeKey =
  | "short_text"
  | "long_text"
  | "email"
  | "multiple_choice"
  | "dropdown"
  | "checkbox"
  | "yes_no"
  | "number"
  | "rating";

export const QUESTION_TYPE_BADGE: Record<QuestionTypeKey, { icon: string; color: string; label: string }> = {
  short_text: { icon: "T", color: "bg-blue-100 text-blue-600", label: "Short Text" },
  long_text: { icon: "T", color: "bg-blue-100 text-blue-600", label: "Long Text" },
  email: { icon: "✉", color: "bg-pink-100 text-pink-800", label: "Email" },
  multiple_choice: { icon: "●", color: "bg-purple-100 text-purple-600", label: "Multiple Choice" },
  dropdown: { icon: "▼", color: "bg-purple-100 text-purple-600", label: "Dropdown" },
  checkbox: { icon: "☐", color: "bg-blue-100 text-blue-600", label: "Checkbox" },
  yes_no: { icon: "✓", color: "bg-purple-100 text-purple-600", label: "Yes/No" },
  number: { icon: "#", color: "bg-amber-100 text-amber-600", label: "Number" },
  rating: { icon: "★", color: "bg-green-100 text-green-600", label: "Rating" },
};

// Fallback badge for any question type the Summary renderer doesn't have a
// dedicated card for yet (phone, date, opinion_scale, statement, ...).
export const FALLBACK_BADGE = { icon: "?", color: "bg-gray-100 text-gray-500", label: "Question" };
