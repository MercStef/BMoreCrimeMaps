import Chart from "chart.js/auto";
import { computeChartData } from "../utils/dataFilters";
import { buildCategoryColorMap, type ColorMap } from "../utils/colorScales";

export class CrimeChart {
  private chartInstance: Chart | null = null;
  private ctx: HTMLCanvasElement;
  public colorMap: ColorMap = {}; // typed from colorScales

  constructor(canvasId: string) {
    this.ctx = document.getElementById(canvasId) as HTMLCanvasElement;
  }

  public update(
    features: any[],
    accentColor: string,
    allDescriptions: string[],
  ): void {
    this.colorMap = buildCategoryColorMap(allDescriptions, accentColor);

    const sortedData = computeChartData(features);
    const barColors = sortedData.map(
      ([desc]) => this.colorMap[desc] ?? accentColor,
    );

    this.chartInstance?.destroy();

    this.chartInstance = new Chart(this.ctx, {
      type: "bar",
      data: {
        labels: sortedData.map(([desc]) => desc),
        datasets: [
          {
            label: "Incidents",
            data: sortedData.map(([, c]) => c),
            backgroundColor: barColors,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
      },
    });
  }
}
