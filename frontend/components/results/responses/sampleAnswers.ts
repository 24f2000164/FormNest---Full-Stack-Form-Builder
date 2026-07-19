import type { ResponseQuestion } from "./columns";

const FIRST_NAMES = ["Aarav", "Priya", "Rohan", "Ananya", "Vikram", "Sahil", "Meera", "Karan"];
const LAST_NAMES = ["Sharma", "Kumar", "Patel", "Singh", "Gupta", "Nair", "Reddy"];
const SENTENCES = ["Really enjoyed this!", "Not sure yet.", "Looking forward to it.", "Great experience overall."];
const LONG_SENTENCES = [
  "This was a smooth process from start to finish, thanks for asking.",
  "I think there's room for improvement but overall it was fine.",
  "Honestly one of the better forms I've filled out recently.",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Builds one random-but-plausible answer per question, matching the shape
// the backend expects for POST /forms/{id}/respond: { question_id, value }.
// This only calls the existing submit-response endpoint - no backend
// changes - so it obeys the same validation and completion rules any real
// submission would.
export function buildSampleAnswers(questions: ResponseQuestion[] & { options?: string[] | null }[]): { question_id: number; value: any }[] {
  return questions.map((q: any) => {
    const options: string[] | null = q.options ?? null;
    switch (q.type) {
      case "short_text":
        return { question_id: q.id, value: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`.split(" ")[0] };
      case "long_text":
        return { question_id: q.id, value: pick(LONG_SENTENCES) };
      case "email": {
        const name = pick(FIRST_NAMES).toLowerCase();
        return { question_id: q.id, value: `${name}${Math.floor(Math.random() * 1000)}@example.com` };
      }
      case "number":
        return { question_id: q.id, value: Math.floor(Math.random() * 100) };
      case "rating": {
        const max = (q.settings && q.settings.max_rating) || 5;
        return { question_id: q.id, value: Math.ceil(Math.random() * max) };
      }
      case "yes_no":
        return { question_id: q.id, value: Math.random() > 0.5 ? "Yes" : "No" };
      case "multiple_choice":
      case "dropdown":
        return { question_id: q.id, value: options && options.length ? pick(options) : "Option 1" };
      case "checkbox": {
        if (!options || options.length === 0) return { question_id: q.id, value: [] };
        const count = Math.max(1, Math.floor(Math.random() * options.length));
        const shuffled = [...options].sort(() => Math.random() - 0.5);
        return { question_id: q.id, value: shuffled.slice(0, count) };
      }
      default:
        return { question_id: q.id, value: pick(SENTENCES) };
    }
  });
}
