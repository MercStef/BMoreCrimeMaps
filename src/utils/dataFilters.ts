// src/utils/dataFilters.ts

export function filterFeaturesByTime(features: any[], minTime: number, maxTime: number) {
  return features.filter(f => {
    const time = new Date(f.attributes.CrimeDateTime).getTime();
    return !isNaN(time) && time >= minTime && time <= maxTime;
  });
}

export function computeChartData(features: any[], limit = 8) {
  const counts: Record<string, number> = {};
  for (const f of features) {
    const desc = f.attributes.Description || 'UNKNOWN';
    counts[desc] = (counts[desc] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}