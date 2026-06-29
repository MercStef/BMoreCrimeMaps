import Chart from "chart.js/auto";
import {
  CHART_TICK_COLOR,
  CHART_GRID_COLOR,
} from "../../config/constants/ui";

const CHART_STYLE = {
  tickColor: CHART_TICK_COLOR,
  gridColor: CHART_GRID_COLOR,
} as const;

export class TrendChart {
  private chartInstance: Chart | null = null;
  private ctx: HTMLCanvasElement;

  constructor(canvasId: string) {
    this.ctx = document.getElementById(
      canvasId,
    ) as HTMLCanvasElement;
  }

  public update(
    features: any[],
    accentColor: string,
  ): void {
    const counts = new Map<string, number>();

    for (const f of features) {
      const ms =
        f._cachedTime ??
        new Date(
          f.attributes?.CrimeDateTime,
        ).getTime();

      if (isNaN(ms)) continue;

      const dateKey = new Date(ms)
        .toISOString()
        .slice(0, 10);

      counts.set(
        dateKey,
        (counts.get(dateKey) ?? 0) + 1,
      );
    }

    const labels = [...counts.keys()].sort();

    const data = labels.map(
      (l) => counts.get(l) ?? 0,
    );

    this.chartInstance?.destroy();

    this.chartInstance = new Chart(this.ctx, {
      type: "line",

      data: {
        labels: labels.map((label) =>
          new Date(label).toLocaleDateString(
            undefined,
            {
              month: "short",
              day: "numeric",
            },
          ),
        ),

        datasets: [
          {
            label: "Incidents per Day",
            data,

            borderColor: accentColor,
            backgroundColor: `${accentColor}33`,

            fill: true,
            pointRadius: 2,
            borderWidth: 2,

            tension: 0.25,
          },
        ],
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,

        layout: {
          padding: {
            bottom: 12,
            left: 8,
            right: 8,
          },
        },

        plugins: {
          legend: {
            display: false,
          },

          title: {
            display: true,
            text: "Incidents per Day",
            color: CHART_TICK_COLOR,
            font: {
              size: 14,
            },
          },
        },

        scales: {
          x: {
            ticks: {
              color: CHART_STYLE.tickColor,

              autoSkip: true,
              maxTicksLimit: 8,

              maxRotation: 45,
              minRotation: 45,
            },

            grid: {
              color: CHART_STYLE.gridColor,
            },
          },

          y: {
            beginAtZero: true,

            ticks: {
              color: CHART_STYLE.tickColor,
            },

            grid: {
              color: CHART_STYLE.gridColor,
            },
          },
        },
      },
    });
  }
}