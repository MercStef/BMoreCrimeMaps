// src/components/CrimeChart.ts
import Chart from 'chart.js/auto';
import { computeChartData } from '../utils/dataFilters';
import chroma from 'chroma-js';

export class CrimeChart {
  private chartInstance: Chart | null = null;
  private ctx: HTMLCanvasElement;
  // The chart stores a shared color map so the map layer can reuse the same category colors.
  public colorMap: Record<string, string> = {};

  constructor(canvasId: string) {
    this.ctx = document.getElementById(canvasId) as HTMLCanvasElement;
  }

  /**
   * Build a predictable palette based on the accent color.
   * We want the same description to always get the same color,
   * and we spread the hues evenly so related categories don't all look the same.
   */
  private generateColorMap(allDescriptions: string[], baseAccentColor: string) {
    const uniqueTypes = Array.from(new Set(allDescriptions)).sort();
    const count = uniqueTypes.length;

    this.colorMap = {};
    if (count === 0) return;

    const accentHsl = chroma(baseAccentColor).hsl();
    const baseHue = Number.isFinite(accentHsl[0]) ? accentHsl[0] : 180;
    const saturation = count <= 8 ? 0.78 : 0.68;
    const lightness = count <= 8 ? 0.52 : 0.60;
    const hueStep = 360 / Math.max(count, 1);

    uniqueTypes.forEach((type, index) => {
      const hue = (baseHue + index * hueStep) % 360;
      this.colorMap[type] = chroma.hsl(hue, saturation, lightness).hex();
    });
  }

  public update(features: any[], baseAccentColor: string, allPossibleDescriptions: string[]) {
    // Recompute the full palette every time the available categories change.
    // This gives a stable color assignment that can be shared with the map.
    this.generateColorMap(allPossibleDescriptions, baseAccentColor);

    const sortedData = computeChartData(features);

    // Destroy the old chart before drawing a new one to avoid duplicates.
    if (this.chartInstance) this.chartInstance.destroy();

    // Map colors strictly by matching the category name, NOT by index loop rankings
    const barColors = sortedData.map(([desc]) => this.colorMap[desc] || baseAccentColor);

    this.chartInstance = new Chart(this.ctx, {
      type: 'bar',
      options: { 
        indexAxis: 'y', 
        plugins: { legend: { display: false } },
        responsive: true,
        maintainAspectRatio: false
      },
      data: {
        labels: sortedData.map(([desc]) => desc),
        datasets: [{ 
          label: 'Incidents', 
          data: sortedData.map(([, c]) => c), 
          backgroundColor: barColors
        }]
      }
    });
  }
}