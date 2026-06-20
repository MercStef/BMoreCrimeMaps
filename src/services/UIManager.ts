import { MapManager, TimeSlider, CrimeChart, TrendChart } from "../components";
import FilterUI from "../ui/FilterUI";
import ThemeManager from "../services/ThemeManager";
import FilterService from "./FilterService";
import AppState from "./AppState";
// NeighborhoodDrill is available from components but not needed here
/**
 * UIManager is the thin glue that:
 *   1️⃣ Binds DOM events (mode toggle, map moves, filter clicks)
 *   2️⃣ Calls `FilterService.compute()` to get the latest view data
 *   3️⃣ Updates the visual components (charts, map layers, stats)
 *
 * It receives all required objects via its constructor – making it easy to
 * instantiate in `main.ts` and to swap out in tests.
 */
export default class UIManager {
  private state: AppState;
  private filterService: FilterService;
  // UI components
  private mapManager: MapManager;
  private orchestrator: any; // LayerOrchestrator (type imported lazily to avoid circular deps)
  private crimeChart: CrimeChart;
  private trendChart: TrendChart;
  private filterUI: FilterUI;
  private themeManager: ThemeManager;

  // DOM refs for statistics
  private statIncidents: HTMLElement | null;
  private statTypes: HTMLElement | null;
  private heatBtn: HTMLElement | null;
  private choroplethBtn: HTMLElement | null;

  constructor(
    state: AppState,
    mapManager: MapManager,
    orchestrator: any,
    timeSlider: TimeSlider,
    crimeChart: CrimeChart,
    trendChart: TrendChart,
    filterUI: FilterUI,
    themeManager: ThemeManager,
  ) {
    this.state = state;
    this.mapManager = mapManager;
    this.orchestrator = orchestrator;
    // timeSlider is intentionally not retained here; it's passed to services that need it
    this.crimeChart = crimeChart;
    this.trendChart = trendChart;
    this.filterUI = filterUI;
    this.themeManager = themeManager;

    this.filterService = new FilterService(state, this.mapManager);

    // Reference `timeSlider` to avoid unused-parameter errors (it's consumed elsewhere)
    void timeSlider;

    // Stats DOM refs (null‑safe)
    this.statIncidents = document.getElementById("stat-incidents") ?? null;
    this.statTypes = document.getElementById("stat-types") ?? null;

    // Mode toggle buttons
    this.heatBtn = document.getElementById("mode-heatmap");
    this.choroplethBtn = document.getElementById("mode-choropleth");

    // ------------------------------------------------------------------
    // ★ Subscribe to any state change – ensures UI always refreshes
    // ------------------------------------------------------------------
    this.state.subscribe(() => this.refresh());

    this.attachEventListeners();
  }

  /** Wire all UI events to state changes and reload UI */
  private attachEventListeners(): void {
    // ── Map events ─────────────────────
    this.mapManager.onMoveEnd(() => this.refresh());
    this.mapManager.onZoom(() => this.refresh());

    this.mapManager.onPolygonClick((feature) => {
      this.state.setState({
        selectedNeighborhoodId: feature?.properties?.id ?? null,
      });
    });

    // ── Theme picker ───────────────────
    this.themeManager.onChange((hex) => {
      this.state.setState({ currentAccentColor: hex });
    });

    // ── Mode toggle ─────────────────────
    this.heatBtn?.addEventListener("click", () => {
      this.state.setState({ mapMode: "heatmap" });
      this.toggleButtons();
    });
    this.choroplethBtn?.addEventListener("click", () => {
      this.state.setState({ mapMode: "choropleth" });
      this.toggleButtons();
    });
  }

  /** Update button active classes – UI only */
  private toggleButtons(): void {
    if (this.state.mapMode === "heatmap") {
      this.heatBtn?.classList.add("active");
      this.choroplethBtn?.classList.remove("active");
    } else {
      this.choroplethBtn?.classList.add("active");
      this.heatBtn?.classList.remove("active");
    }
  }

  /** Core render pipeline – called after any state mutation */
  public refresh(): void {
    const {
      fullyFiltered,
      inView,
      uniqueDescriptions,
      incidentCount,
      typeCount,
      valid,
    } = this.filterService.compute();

    // Update dynamic crime filters based on currently valid features
    this.filterUI.updateDynamicCrimeFilters(
      valid,
      this.state.rawFeatures,
      this.state.selectedCrimeCode,
    );

    // Debugging info to help diagnose missing crime-type buttons
    // (inspect browser console for these messages)
    try {
      // eslint-disable-next-line no-console
      console.debug("UIManager.refresh:", {
        validCount: valid?.length ?? 0,
        fullyFilteredCount: fullyFiltered?.length ?? 0,
        uniqueDescriptionsCount: uniqueDescriptions?.length ?? 0,
      });
    } catch (e) {
      // ignore
    }

    // Update statistics
    if (this.statIncidents)
      this.statIncidents.textContent = String(incidentCount);
    if (this.statTypes) this.statTypes.textContent = String(typeCount);

    // Update charts
    this.crimeChart.update(
      fullyFiltered,
      this.state.currentAccentColor,
      uniqueDescriptions,
    );
    this.trendChart.update(inView, this.state.currentAccentColor);

    // Render map layers
    this.orchestrator.clear();

    if (this.state.mapMode === "choropleth") {
      if (!this.state.neighborhoodGeoJson) return;
      this.orchestrator.renderChoropleth(
        this.state.neighborhoodGeoJson,
        inView,
        this.state.selectedNeighborhoodId,
        this.state.currentAccentColor,
      );
    } else {
      this.orchestrator.renderHeatmap(
        fullyFiltered,
        this.crimeChart.colorMap,
        this.state.currentAccentColor,
      );
    }
  }

  /** One‑time “bootstrap” call used after the initial data load */
  public bootstrapAfterDataLoad(): void {
    // Populate the district dropdown (distinctDistricts were stored earlier in state)
    const districts = (this.state as any).distinctDistricts ?? [];
    this.filterUI.buildDistrictOptions(districts, this.state.selectedDistrict);
    // Update the total-loaded counter shown in the header
    const loadedEl = document.getElementById("incident-count");
    if (loadedEl) loadedEl.textContent = String(this.state.rawFeatures.length);

    // Ensure stats and charts render for the initial state
    this.refresh(); // ← first render with real data
  }
}
