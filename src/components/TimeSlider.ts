// src/components/TimeSlider.ts
import noUiSlider from 'nouislider';

export class TimeSlider {
  private sliderInstance: any = null;
  private labelEl: HTMLElement;
  private sliderId: string;

  constructor(sliderId: string, labelId: string) {
    this.sliderId = sliderId;
    this.labelEl = document.getElementById(labelId)!;
  }

  // Initialize the time slider once, using the provided date range.
  public init(
    features: any[], 
    onChangeCallback: (min: number, max: number) => void,
    initialMin?: number,
    initialMax?: number
  ) {
    if (this.sliderInstance || features.length === 0) return;

    const dates = features
      .map(f => new Date(f.attributes.CrimeDateTime).getTime())
      .filter(t => !isNaN(t))
      .sort((a, b) => a - b);

    const min = dates[0];
    const max = dates[dates.length - 1];

    const sliderEl = document.getElementById(this.sliderId)!;
    
    // Build the slider and initialize the visible labels.
    this.sliderInstance = noUiSlider.create(sliderEl, {
      start: [initialMin ?? min, initialMax ?? max], 
      connect: true,
      step: 24 * 60 * 60 * 1000,
      range: { min, max }
    });

    this.sliderInstance.on('update', (values: string[]) => {
      const minStr = new Date(Number(values[0])).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
      const maxStr = new Date(Number(values[1])).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
      this.labelEl.textContent = `${minStr} – ${maxStr}`;
    });

    this.sliderInstance.on('change', (values: string[]) => {
      onChangeCallback(Math.round(Number(values[0])), Math.round(Number(values[1])));
    });
    
    return { min, max };
  }

  /**
   * Safely adjust the slider range from outside of this class.
   */
  public setRange(min: number, max: number) {
    if (this.sliderInstance) {
      this.sliderInstance.set([min, max]);
    }
  }
}