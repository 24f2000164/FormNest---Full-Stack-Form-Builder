import { pct, ChoiceAggregation } from "./choiceAggregation";
import { calculateHistogram, calculateNumericStats, toFiniteNumber, NumericStats } from "./statistics";

export type NumberAnswer = { value: unknown };

export type NumberAggregation = {
  stats: NumericStats;
  /** Histogram reshaped into the same {options, percentBase, maxCount}
   *  contract ChoiceColumnChart / ChoiceBarList / ChoiceTable already
   *  render, so Number gets chart + list + table views for free instead of
   *  a parallel implementation. */
  histogram: ChoiceAggregation;
};

export function aggregateNumberAnswers(answers: NumberAnswer[]): NumberAggregation {
  const values = answers.map((a) => toFiniteNumber(a.value)).filter((v): v is number => v !== null);
  const stats = calculateNumericStats(values);
  const bins = calculateHistogram(values);

  const maxCount = bins.reduce((m, b) => Math.max(m, b.count), 0);
  const histogram: ChoiceAggregation = {
    options: bins.map((b) => ({ label: b.label, count: b.count, percentage: pct(b.count, values.length) })),
    percentBase: values.length,
    maxCount,
  };

  return { stats, histogram };
}
