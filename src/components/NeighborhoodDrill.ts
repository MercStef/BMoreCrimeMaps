export class NeighborhoodDrill {
  private mode: "heatmap" | "choropleth" = "heatmap";
  private hasError = false;

  private root: HTMLElement;
  private activeEl: HTMLElement;
  private emptyEl: HTMLElement;
  private countEl: HTMLElement;
  private densityEl: HTMLElement;
  private activeNameEl: HTMLElement;

  constructor(rootId: string) {
    const rootElement = document.getElementById(rootId);
    if (!rootElement) {
      throw new Error(
        `NeighborhoodDrill: Required DOM element not found: #${rootId}`,
      );
    }
    this.root = rootElement;
    this.activeEl = this.q("active");
    this.emptyEl = this.q("empty");
    this.countEl = this.q("count");
    this.densityEl = this.q("density");
    this.activeNameEl = this.q("active-name");
  }

  private q(el: string): HTMLElement {
    const elem = this.root.querySelector(
      `[data-el="${el}"]`,
    ) as HTMLElement | null;
    if (!elem) {
      throw new Error(
        `NeighborhoodDrill: Required child element not found: [data-el="${el}"]`,
      );
    }
    return elem;
  }

  public update(
    mode: "heatmap" | "choropleth",
    selectedFeature: any | null,
  ): void {
    this.mode = mode;
    this.render(selectedFeature);
  }

  private render(feature: any | null): void {
    const visible = this.mode === "choropleth" && !this.hasError;

    this.root.style.display = visible ? "" : "none";

    if (!visible) {
      return;
    }

    const props = feature?.properties;
    const name = props?.name || props?.Name || "Unselected Neighborhood";
    const count = props?.incidentCount ?? 0;

    const density =
      props?.density ??
      (props?._count && props?.sqkm
        ? +(props._count / props.sqkm).toFixed(1)
        : 0);

    this.activeEl.style.display = feature ? "" : "none";
    this.emptyEl.style.display = feature ? "none" : "";

    if (feature) {
      this.activeNameEl.textContent = name;
      this.countEl.textContent = String(count);
      this.densityEl.textContent = `(${density} / sq km)`;
    }
  }
}
