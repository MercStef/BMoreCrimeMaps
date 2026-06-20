import noUiSlider from "nouislider";
import { getTime } from "../utils/dataFilters";
import { TIME_SLIDER_STEP_MS } from "../config/constants/time";
import AppState from "../services/AppState";   // <-- NEW

export class TimeSlider {
  private sliderInstance: any = null;
  private sliderId: string;
  private labelEl: HTMLElement;
  private state: AppState;                  


  constructor(sliderId: string, labelId: string, state: AppState) {
    this.sliderId = sliderId;
    this.labelEl = document.getElementById(labelId)!;
    this.state = state;                   
  }

  public init(
    features: any[],
    
    onChangeCallback?: (min: number, max: number) => void,
    initialMin?: number,
    initialMax?: number,
  ): { min: number; max: number } | undefined {
    if (this.sliderInstance || features.length === 0) return;

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

      const start = new Date(Number(values[0]));
      const end = new Date(Number(values[1]));

      if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
        // Same calendar month — decide whether to show day precision
        const sameDay = start.getDate() === end.getDate();
        if (sameDay) {
          // Single day: "May 1, 2026"
          this.labelEl.textContent = start.toLocaleDateString(undefined, {
            month: 'short', day: 'numeric', year: 'numeric'
          });
        } else {
          // Same month, different days: "May 1–15, 2026"
          const monthName = start.toLocaleDateString(undefined, { month: 'short' });
          this.labelEl.textContent = `${monthName} ${start.getDate()}–${end.getDate()}, ${start.getFullYear()}`;
        }
      } else {
        this.labelEl.textContent = `${fmt(Number(values[0]))} – ${fmt(Number(values[1]))}`;
      }
    });

    // ------------------------------------------------------------------
    // NEW: push the new range into AppState **and** call the old callback
    // (so any external code that still expects it keeps working).
    // ------------------------------------------------------------------
    this.sliderInstance.on("change", (values: string[]) => {
      const minVal = Math.round(Number(values[0]));
      const maxVal = Math.round(Number(values[1]));

      // 1️⃣ Update the global state – this triggers UIManager.refresh()
      this.state.setState({ minTime: minVal, maxTime: maxVal });

      // 2️⃣ Keep the previous behaviour for any legacy listener
      if (onChangeCallback) onChangeCallback(minVal, maxVal);
    });

    return { min, max };
  }

  public setRange(min: number, max: number): void {
    this.sliderInstance?.set([min, max]);
  }
}
