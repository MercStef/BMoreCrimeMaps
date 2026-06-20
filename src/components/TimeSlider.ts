import noUiSlider from "nouislider";
import { getTime } from "../utils/dataFilters";
import { TIME_SLIDER_STEP_MS } from "../config/constants/time";
import AppState from "../services/AppState"; // <-- NEW

// Calendar and date helpers
// Use native date inputs for a zero-dependency calendar experience

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

    // ------------------------------------------------------------------
    // Local-time date helpers, hoisted so every closure below (update
    // handler, input listeners, flatpickr onChange) shares one definition.
    // Using local getFullYear/getMonth/getDate (NOT toISOString, which
    // converts to UTC and can shift the displayed day) keeps the slider,
    // the native date inputs, and flatpickr all agreeing on "the date".
    // ------------------------------------------------------------------
    const toStartOfDay = (d: Date) =>
      new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const toEndOfDay = (d: Date) =>
      new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
        23,
        59,
        59,
        999,
      ).getTime();
    const toLocalISO = (ms: number) => {
      const d = new Date(ms);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

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

      if (
        start.getFullYear() === end.getFullYear() &&
        start.getMonth() === end.getMonth()
      ) {
        const sameDay = start.getDate() === end.getDate();
        if (sameDay) {
          this.labelEl.textContent = start.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
        } else {
          const monthName = start.toLocaleDateString(undefined, {
            month: "short",
          });
          this.labelEl.textContent = `${monthName} ${start.getDate()}–${end.getDate()}, ${start.getFullYear()}`;
        }
      } else {
        this.labelEl.textContent = `${fmt(Number(values[0]))} – ${fmt(Number(values[1]))}`;
      }

      try {
        const sISO = toLocalISO(Number(values[0]));
        const eISO = toLocalISO(Number(values[1]));

        const startEl = document.getElementById(
          "date-start",
        ) as HTMLInputElement | null;
        const endEl = document.getElementById(
          "date-end",
        ) as HTMLInputElement | null;
        if (startEl) startEl.value = sISO;
        if (endEl) endEl.value = eISO;
      } catch (e) {
        // ignore
      }
    });

    this.sliderInstance.on("change", (values: string[]) => {
      const minVal = Math.round(Number(values[0]));
      const maxVal = Math.round(Number(values[1]));
      this.state.setState({ minTime: minVal, maxTime: maxVal });
      if (onChangeCallback) onChangeCallback(minVal, maxVal);
    });

    // Wire native date inputs to update the slider
    try {
      const startEl = document.getElementById(
        "date-start",
      ) as HTMLInputElement | null;
      const endEl = document.getElementById(
        "date-end",
      ) as HTMLInputElement | null;

      if (startEl)
        startEl.addEventListener("change", () => {
          const s = startEl.value
            ? toStartOfDay(new Date(startEl.value))
            : (initialMin ?? min);
          const e = endEl?.value
            ? toEndOfDay(new Date(endEl.value))
            : (initialMax ?? max);
          this.sliderInstance?.set([s, e]);
          this.state.setState({ minTime: s, maxTime: e });
        });

      if (endEl)
        endEl.addEventListener("change", () => {
          const s = startEl?.value
            ? toStartOfDay(new Date(startEl.value))
            : (initialMin ?? min);
          const e = endEl.value
            ? toEndOfDay(new Date(endEl.value))
            : (initialMax ?? max);
          this.sliderInstance?.set([s, e]);
          this.state.setState({ minTime: s, maxTime: e });
        });

      // Initialize inputs with current slider values
      const sISO = toLocalISO(initialMin ?? min);
      const eISO = toLocalISO(initialMax ?? max);
      const startElRef = document.getElementById(
        "date-start",
      ) as HTMLInputElement | null;
      const endElRef = document.getElementById(
        "date-end",
      ) as HTMLInputElement | null;
      if (startElRef) startElRef.value = sISO;
      if (endElRef) endElRef.value = eISO;
    } catch (e) {
      // ignore
    }

    // Progressive flatpickr integration (loads from CDN when requested)
    const openBtn = document.getElementById(
      "open-calendar",
    ) as HTMLButtonElement | null;
    const pickerInput = document.getElementById(
      "date-picker",
    ) as HTMLInputElement | null;
    const singleDayToggle = document.getElementById(
      "single-day-toggle",
    ) as HTMLInputElement | null;

    const initFlatpickr = async () => {
      if (!pickerInput) return;
      if ((window as any).flatpickr) {
        setupFlatpickr();
        return;
      }
      const cssHref =
        "https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css";
      if (!document.querySelector(`link[href="${cssHref}"]`)) {
        const l = document.createElement("link");
        l.rel = "stylesheet";
        l.href = cssHref;
        document.head.appendChild(l);
      }
      if (!document.querySelector("script[data-flatpickr]")) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://cdn.jsdelivr.net/npm/flatpickr";
          s.setAttribute("data-flatpickr", "1");
          s.onload = () => resolve();
          s.onerror = () => reject();
          document.head.appendChild(s);
        });
      }
      setupFlatpickr();
    };

    const setupFlatpickr = () => {
      if (!pickerInput) return;
      if ((pickerInput as any)._flatpickr)
        (pickerInput as any)._flatpickr.destroy();
      const opts: any = {
        mode: singleDayToggle?.checked ? "single" : "range",
        dateFormat: "Y-m-d",
        onChange: (selectedDates: Date[]) => {
          if (!selectedDates || selectedDates.length === 0) return;
          const s = toStartOfDay(selectedDates[0]);
          const e =
            selectedDates.length === 1
              ? toEndOfDay(selectedDates[0])
              : toEndOfDay(selectedDates[selectedDates.length - 1]);
          this.sliderInstance?.set([s, e]);
          this.state.setState({ minTime: s, maxTime: e });
        },
      };
      (window as any).flatpickr(pickerInput, opts);
      pickerInput.style.display = "inline-block";
      pickerInput.focus();
    };

    if (openBtn) {
      openBtn.addEventListener("click", async () => {
        try {
          await initFlatpickr();
        } catch (err) {
          if (pickerInput) pickerInput.focus();
        }
      });
    }

    if (singleDayToggle) {
      singleDayToggle.addEventListener("change", () => {
        if (
          (window as any).flatpickr &&
          pickerInput &&
          (pickerInput as any)._flatpickr
        ) {
          setupFlatpickr();
        }
      });
    }

    return { min, max };
  }

  public setRange(min: number, max: number): void {
    this.sliderInstance?.set([min, max]);
  }
}
