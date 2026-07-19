import type { FormResponse } from "@/lib/api";
import type { ResponseColumn } from "./columns";
import { answerToPlainText, findAnswer } from "./columns";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// Builds a CSV from whatever rows/columns are currently visible in the
// table (already filtered by the search box) and triggers a browser
// download. Purely a frontend convenience - it doesn't call any API.
export function exportResponsesCsv(formTitle: string, columns: ResponseColumn[], responses: FormResponse[]) {
  const header = ["Response time", "Response type", ...columns.map((c) => c.question.title || "Untitled question")];
  const rows = responses.map((r) => {
    const time = new Date(r.submitted_at.endsWith("Z") ? r.submitted_at : `${r.submitted_at}Z`).toISOString();
    const type = r.completed ? "Completed" : "Partial";
    const answers = columns.map((c) => {
      const answer = findAnswer(r, c.question.id);
      return answerToPlainText(answer?.value);
    });
    return [time, type, ...answers];
  });

  const csv = [header, ...rows].map((row) => row.map((cell) => csvEscape(String(cell ?? ""))).join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${(formTitle || "responses").replace(/\s+/g, "-").toLowerCase()}-responses.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
