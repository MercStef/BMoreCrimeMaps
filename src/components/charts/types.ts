import Chart from "chart.js/auto";
import { computeChartData } from "../../utils/dataFilters";

import {
  buildCategoryColorMap,
  type ColorMap,
} from "../../utils/colorScales";

export class TypesChart {
  private chartInstance: Chart | null = null;

  private ctx: HTMLCanvasElement;

  public colorMap: ColorMap = {};

  constructor(canvasId: string) {
    this.ctx = document.getElementById(
      canvasId,
    ) as HTMLCanvasElement;
  }

  public update(
    features: any[],
    accentColor: string,
    allDescriptions: string[],
  ): void {
    this.colorMap = buildCategoryColorMap(
      allDescriptions,
      accentColor,
    );

    const sortedData =
      computeChartData(features);

    const barColors = sortedData.map(
      ([desc]) =>
        this.colorMap[desc] ??
        accentColor,
    );

    this.chartInstance?.destroy();

    this.chartInstance = new Chart(this.ctx, {
      type: "bar",

      data: {
        labels: sortedData.map(
          ([desc]) => desc,
        ),

        datasets: [
          {
            label: "Incidents",

            data: sortedData.map(
              ([, count]) => count,
            ),

            backgroundColor: barColors,
            borderRadius: 4,
          },
        ],
      },

      options: {
        indexAxis: "y",

        responsive: true,
        maintainAspectRatio: false,

        layout: {
          padding: {
            top: 10,
            bottom: 10,
            left: 10,
            right: 10,
          },
        },

        plugins: {
          legend: {
            display: false,
          },
        },

        scales: {
          x: {
            beginAtZero: true,

            ticks: {
              color: "#aaa",
            },

            grid: {
              color: "rgba(255,255,255,0.08)",
            },
          },

          y: {
            ticks: {
              color: "#ddd",

              autoSkip: false,
            },

            grid: {
              display: false,
            },
          },
        },
      },
    });
  }
}