import Chart from "chart.js/auto";
import { CHART_TICK_COLOR, CHART_GRID_COLOR } from "../config/constants/ui";

const CHART_STYLE = {
  tickColor: CHART_TICK_COLOR,
  gridColor: CHART_GRID_COLOR,
} as const;

export class TrendChart {
  private chartInstance: Chart | null = null;
  private ctx: HTMLCanvasElement;

  constructor(canvasId: string) {
    this.ctx = document.getElementById(canvasId) as HTMLCanvasElement;
  }

  public update(features: any[], accentColor: string): void {
    const counts = new Map<string, number>();

    for (const f of features) {
      // Use cached timestamp — avoids repeated Date construction on every render
      const ms: number =
        f._cachedTime ?? new Date(f.attributes?.CrimeDateTime).getTime();
      if (isNaN(ms)) continue;
      const dateKey = new Date(ms).toISOString().slice(0, 10);
      counts.set(dateKey, (counts.get(dateKey) ?? 0) + 1);
    }

    const labels = [...counts.keys()].sort();
    const data = labels.map((l) => counts.get(l) ?? 0);

    this.chartInstance?.destroy();

    this.chartInstance = new Chart(this.ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Incidents per day",
            data,
            borderColor: accentColor,
            backgroundColor: `${accentColor}33`,
            fill: true,
            pointRadius: 2,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            ticks: { color: CHART_STYLE.tickColor },
            grid: { color: CHART_STYLE.gridColor },
          },
          y: {
            ticks: { color: CHART_STYLE.tickColor },
            grid: { color: CHART_STYLE.gridColor },
            beginAtZero: true,
          },
        },
      },
    });
  }
}
