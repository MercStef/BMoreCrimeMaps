// dataFilters.ts

// ----------------------------------------------------
// 1. ENRICHMENT (MUST RUN ONCE AFTER LOADING DATA)
// ----------------------------------------------------
export function enrichFeatures(features: any[]): any[] {
  for (const f of features) {
    const t = new Date(f.attributes?.CrimeDateTime).getTime();
    f._time = Number.isFinite(t) ? t : NaN;
  }
  return features;
}

// ----------------------------------------------------
// 2. TIME ACCESSOR
// ----------------------------------------------------
export function getTime(f: any): number {
  return f._time;
}

// ----------------------------------------------------
// 3. TIME FILTER
// ----------------------------------------------------
export function filterFeaturesByTime(
  features: any[],
  minTime: number,
  maxTime: number,
): any[] {
  return features.filter((f) => {
    const time = getTime(f);
    return Number.isFinite(time) && time >= minTime && time <= maxTime;
  });
}

// ----------------------------------------------------
// 4. CHART AGGREGATION
// ----------------------------------------------------
export function computeChartData(
  features: any[],
  limit = 8,
): [string, number][] {
  const counts = new Map<string, number>();

  for (const f of features) {
    const desc: string = norm(f.attributes?.Description) || "UNKNOWN";
    counts.set(desc, (counts.get(desc) ?? 0) + 1);
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
}

// ----------------------------------------------------
// 5. STRING NORMALIZER
// ----------------------------------------------------
export function norm(s?: string): string {
  return s?.trim().toUpperCase() ?? "";
}
