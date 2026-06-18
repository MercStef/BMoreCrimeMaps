import noUiSlider from "nouislider";
import { getTime} from "../utils/dataFilters";
import { TIME_SLIDER_STEP_MS } from "../config/constants/time";

export class TimeSlider {
  private sliderInstance: any = null;
  private labelEl: HTMLElement;
  private sliderId: string;

  constructor(sliderId: string, labelId: string) {
    this.sliderId = sliderId;
    this.labelEl = document.getElementById(labelId)!;
  }

  public init(
    features: any[],
    onChangeCallback: (min: number, max: number) => void,
    initialMin?: number,
    initialMax?: number,
  ): { min: number; max: number } | undefined {
    if (this.sliderInstance || features.length === 0) return;

    // Reuse cached timestamps — no redundant Date construction
    const dates = features
      .map(getTime)
      .filter((t) => !isNaN(t))
      .sort((a, b) => a - b);

    const min = dates[0];
    const max = dates[dates.length - 1];

    const sliderEl = document.getElementById(this.sliderId)!;

    this.sliderInstance = noUiSlider.create(sliderEl, {
      start: [initialMin ?? min, initialMax ?? max],
      connect: true,
      step: TIME_SLIDER_STEP_MS,
      range: { min, max },
    });

    this.sliderInstance.on("update", (values: string[]) => {
      const fmt = (ms: number) =>
        new Date(ms).toLocaleDateString(undefined, {
          month: "short",
          year: "numeric",
        });
      this.labelEl.textContent = `${fmt(Number(values[0]))} – ${fmt(Number(values[1]))}`;
    });

    this.sliderInstance.on("change", (values: string[]) => {
      onChangeCallback(
        Math.round(Number(values[0])),
        Math.round(Number(values[1])),
      );
    });

    return { min, max };
  }

  public setRange(min: number, max: number): void {
    this.sliderInstance?.set([min, max]);
  }
}
