// Pure aggregation logic for the four choice-based Summary cards
// (Multiple Choice, Dropdown, Checkbox, Yes/No). Kept framework-free so it
// can be unit tested without React.
//
// Everything reads from data the app already fetches (`getFormById` for
// `question.options` / `question.description`, `getFormResponses` for each
// answer's raw `value`) - no backend changes are required for Phase 5.

export type ChoiceAnswer = { value: unknown };

export type ChoiceOptionStat = {
  label: string;
  count: number;
  percentage: number;
};

export type ChoiceAggregation = {
  options: ChoiceOptionStat[];
  /** Denominator used for percentages: total respondents for single-select
   *  types, total selections for Checkbox (per spec). */
  percentBase: number;
  maxCount: number;
};

export function pct(count: number, base: number): number {
  if (base <= 0) return 0;
  return Math.round((count / base) * 1000) / 10; // one decimal place
}

function buildFromCounts(order: string[], counts: Map<string, number>, percentBase: number): ChoiceAggregation {
  const options: ChoiceOptionStat[] = order.map((label) => {
    const count = counts.get(label) ?? 0;
    return { label, count, percentage: pct(count, percentBase) };
  });
  const maxCount = options.reduce((m, o) => Math.max(m, o.count), 0);
  return { options, percentBase, maxCount };
}

// Multiple Choice / Dropdown: exactly one answer per respondent (a string
// matching one of `question.options`). Defensively also handles the
// Builder's optional multi-select mode (value is an array) by contributing
// every selected option, since the underlying data shape is shared with
// Multiple Choice's `allowMultiple` setting.
export function aggregateSingleSelect(options: string[], answers: ChoiceAnswer[]): ChoiceAggregation {
  const counts = new Map<string, number>();
  const order = [...options];

  for (const { value } of answers) {
    const values = Array.isArray(value) ? value : [value];
    for (const v of values) {
      if (typeof v !== "string" || v.trim() === "") continue;
      if (!order.includes(v)) order.push(v); // e.g. a free-typed "Other" answer
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
  }

  return buildFromCounts(order, counts, answers.length);
}

// Yes / No: two fixed options, not driven by `question.options`.
export function aggregateYesNo(answers: ChoiceAnswer[]): ChoiceAggregation {
  const counts = new Map<string, number>([["Yes", 0], ["No", 0]]);

  for (const { value } of answers) {
    if (value === "Yes" || value === true) counts.set("Yes", (counts.get("Yes") ?? 0) + 1);
    else if (value === "No" || value === false) counts.set("No", (counts.get("No") ?? 0) + 1);
  }

  return buildFromCounts(["Yes", "No"], counts, answers.length);
}

// Checkbox: multiple answers per respondent - every selected option
// contributes independently, so percentages are computed against the total
// number of selections (not the number of respondents).
//
// This app's Checkbox questions don't have a Builder UI yet, so a question
// may carry no `options` at all - a single standalone checkbox (e.g. a
// consent/legal checkbox) whose label is its description/title. That case
// renders as one bar, counting how many respondents checked it.
export function aggregateCheckbox(
  options: string[],
  description: string | null | undefined,
  title: string | null | undefined,
  answers: ChoiceAnswer[]
): ChoiceAggregation {
  if (options.length === 0) {
    const label = (description && description.trim()) || (title && title.trim()) || "Checked";
    let count = 0;
    for (const { value } of answers) {
      if (value === true || value === "true" || value === "Yes" || value === "checked") count += 1;
      else if (Array.isArray(value) && value.length > 0) count += 1;
      else if (typeof value === "string" && value.trim() !== "") count += 1;
    }
    return buildFromCounts([label], new Map([[label, count]]), count);
  }

  const counts = new Map<string, number>();
  const order = [...options];
  let totalSelections = 0;

  for (const { value } of answers) {
    const values = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
    for (const v of values) {
      if (typeof v !== "string" || v.trim() === "") continue;
      if (!order.includes(v)) order.push(v);
      counts.set(v, (counts.get(v) ?? 0) + 1);
      totalSelections += 1;
    }
  }

  return buildFromCounts(order, counts, totalSelections);
}
