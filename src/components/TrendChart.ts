import Chart from 'chart.js/auto';

export class TrendChart {
  private chartInstance: Chart | null = null;
  private ctx: HTMLCanvasElement;

  constructor(canvasId: string) {
    this.ctx = document.getElementById(canvasId) as HTMLCanvasElement;
  }

  public update(features: any[], accentColor: string) {
    const counts = new Map<string, number>();

    for (const f of features) {
      const time = new Date(f.attributes?.CrimeDateTime);
      if (Number.isNaN(time.getTime())) continue;
      const dateKey = time.toISOString().slice(0, 10);
      counts.set(dateKey, (counts.get(dateKey) ?? 0) + 1);
    }

    const labels = Array.from(counts.keys()).sort();
    const data = labels.map((label) => counts.get(label) ?? 0);

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    this.chartInstance = new Chart(this.ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Incidents per day',
            data,
            borderColor: accentColor,
            backgroundColor: `${accentColor}33`,
            fill: true,
            pointRadius: 2,
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { ticks: { color: '#ddd' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { ticks: { color: '#ddd' }, grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true }
        }
      }
    });
  }
}
