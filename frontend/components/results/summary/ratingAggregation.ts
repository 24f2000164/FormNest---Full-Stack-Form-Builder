import { pct, ChoiceAggregation } from "./choiceAggregation";
import { calculateDistribution, calculateNumericStats, toFiniteNumber, NumericStats } from "./statistics";

export type RatingAnswer = { value: unknown };

export type RatingAggregation = {
  stats: NumericStats;
  /** The scale actually used (1..maxRating), so a bar always renders for
   *  every point on the scale even if nobody picked it. */
  maxRating: number;
  /** Distribution reshaped into the same {options, percentBase, maxCount}
   *  contract the choice-based cards already render (chart / list with
   *  animated progress bars / table). */
  distribution: ChoiceAggregation;
};

// Mirrors the same settings fallback chain the Builder canvas and
// respondent field already use, so a question's scale reads identically
// everywhere: settings.rating_count ?? settings.max_rating ?? 5.
export function getRatingScale(settings: Record<string, unknown> | null | undefined): number {
  const raw = (settings?.rating_count ?? settings?.max_rating ?? 5) as unknown;
  const n = toFiniteNumber(raw);
  return n && n > 0 ? Math.round(n) : 5;
}

export function aggregateRatingAnswers(answers: RatingAnswer[], maxRating: number): RatingAggregation {
  const values = answers
    .map((a) => toFiniteNumber(a.value))
    .filter((v): v is number => v !== null && v >= 1 && v <= maxRating);

  const stats = calculateNumericStats(values);
  const entries = calculateDistribution(values, 1, maxRating);

  const maxCount = entries.reduce((m, e) => Math.max(m, e.count), 0);
  const distribution: ChoiceAggregation = {
    options: entries.map((e) => ({ label: String(e.value), count: e.count, percentage: pct(e.count, values.length) })),
    percentBase: values.length,
    maxCount,
  };

  return { stats, maxRating, distribution };
}
