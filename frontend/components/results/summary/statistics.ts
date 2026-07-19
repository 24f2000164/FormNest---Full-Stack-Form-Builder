// Pure, framework-free statistics engine shared by the Number and Rating
// Summary cards (Phase 6). Kept independent of React/aggregation-specific
// concerns (option labels, etc.) so it can be unit tested and reused for
// any future numeric question type without duplicating math.

/** Coerces a raw answer value (may be a string from an <input type="number">,
 *  a number, null, or garbage) into a finite number, or null if it isn't one. */
export function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function calculateMinimum(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.min(...values);
}

export function calculateMaximum(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.max(...values);
}

export function calculateRange(values: number[]): number {
  if (values.length === 0) return 0;
  return calculateMaximum(values) - calculateMinimum(values);
}

// Population variance/stddev (divide by n, not n-1): with a single response
// this correctly yields 0 rather than being undefined, matching Typeform's
// own display of "Standard deviation: 0" for a lone answer.
export function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = calculateMean(values);
  return values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
}

export function calculateStandardDeviation(values: number[]): number {
  return Math.sqrt(calculateVariance(values));
}

/** Rounding rules: whole numbers show with no decimals; otherwise round to
 *  2 decimal places and drop trailing zeros (3.10 -> "3.1", 3.00 -> "3"). */
export function formatStatValue(n: number): string {
  if (!Number.isFinite(n)) return "0";
  if (Number.isInteger(n)) return String(n);
  const rounded = Math.round(n * 100) / 100;
  return String(rounded);
}

export type HistogramBin = {
  /** Display label: a single value ("5") when there are few distinct
   *  values, or a range ("10 - 20") once values are binned. */
  label: string;
  count: number;
  rangeMin: number;
  rangeMax: number;
};

/** Builds a histogram that automatically chooses its bin count:
 *  - Few distinct values (<=10, the common case for real forms) get one
 *    bar per exact value, so a handful of responses reads as precise
 *    counts rather than a coarse, mostly-empty range chart.
 *  - Larger/continuous datasets get grouped into ~5-10 equal-width range
 *    bins (Sturges'-style sizing), which shrinks automatically for small
 *    sample sizes and grows (up to maxBins) for large ones. */
export function calculateHistogram(values: number[], maxBins = 10): HistogramBin[] {
  if (values.length === 0) return [];

  const unique = Array.from(new Set(values)).sort((a, b) => a - b);

  if (unique.length <= 10) {
    return unique.map((v) => ({
      label: formatStatValue(v),
      count: values.filter((x) => x === v).length,
      rangeMin: v,
      rangeMax: v,
    }));
  }

  const min = unique[0];
  const max = unique[unique.length - 1];
  const binCount = Math.min(maxBins, Math.max(5, Math.ceil(Math.sqrt(values.length))));
  const width = (max - min) / binCount || 1;

  const bins: HistogramBin[] = Array.from({ length: binCount }, (_, i) => {
    const rangeMin = min + i * width;
    const rangeMax = i === binCount - 1 ? max : min + (i + 1) * width;
    return { label: `${formatStatValue(rangeMin)} - ${formatStatValue(rangeMax)}`, count: 0, rangeMin, rangeMax };
  });

  for (const v of values) {
    let idx = width > 0 ? Math.floor((v - min) / width) : 0;
    if (idx >= binCount) idx = binCount - 1;
    if (idx < 0) idx = 0;
    bins[idx].count += 1;
  }

  return bins;
}

export type DistributionEntry = {
  value: number;
  count: number;
};

/** One entry per integer from `min` to `max` inclusive (e.g. every rating
 *  value on the scale), even values with zero responses - unlike
 *  calculateHistogram, the bin set is fixed by the scale, not the data, so
 *  the chart shape only changes when the question's scale does. */
export function calculateDistribution(values: number[], min: number, max: number): DistributionEntry[] {
  const entries: DistributionEntry[] = [];
  for (let v = min; v <= max; v++) {
    entries.push({ value: v, count: values.filter((x) => x === v).length });
  }
  return entries;
}

export type NumericStats = {
  count: number;
  mean: number;
  median: number;
  minimum: number;
  maximum: number;
  range: number;
  variance: number;
  standardDeviation: number;
};

export function calculateNumericStats(values: number[]): NumericStats {
  return {
    count: values.length,
    mean: calculateMean(values),
    median: calculateMedian(values),
    minimum: calculateMinimum(values),
    maximum: calculateMaximum(values),
    range: calculateRange(values),
    variance: calculateVariance(values),
    standardDeviation: calculateStandardDeviation(values),
  };
}
