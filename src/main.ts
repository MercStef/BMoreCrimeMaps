import "./base.css";

import { fetchAllCrimeData } from "./api/fetchCrimes";
import { loadNeighborhoodBoundaries } from "./services/NeighborhoodService";
import { LayerOrchestrator } from "./services/LayerOrchestrator";
import ThemeManager from "./services/ThemeManager";
import { MapManager, TimeSlider, CrimeChart, TrendChart} from "./components";
import FilterUI from "./ui/FilterUI";
import { filterFeaturesByTime, norm } from "./utils/dataFilters";
import {enrichFeatures} from "./utils/dataFilters";
import type { CrimeFeature } from "./api/buildCrimeData";
import {
  BALTIMORE_CENTER,
  DEFAULT_MAP_ZOOM,
  DEFAULT_ACCENT_COLOR,
  MIN_DATA_LOOKBACK_MS,
} from "./config/constants";
// ────────────────────────────────────
const mapManager        = new MapManager("map", BALTIMORE_CENTER as [number, number], DEFAULT_MAP_ZOOM);
const orchestrator      = new LayerOrchestrator(mapManager, 'neighborhood-drill');
const timeSlider        = new TimeSlider("date-slider", "date-range-label");
const crimeChart        = new CrimeChart("chart");
const trendChart        = new TrendChart("trend-chart");

// ─────────────────────────────────────────────
// DOM REFS (with null coalescing for strict mode)
// ─────────────────────────────────────────────

const statIncidents = document.getElementById("stat-incidents") ?? null;
const statTypes     = document.getElementById("stat-types") ?? null;
const statLoaded    = document.getElementById("incident-count") ?? null;

// ─────────────────────────────────────────────
// APPLICATION STATE
// ─────────────────────────────────────────────

let rawFeatures:           CrimeFeature[]           = [];
let minTime                                         = 0;
let maxTime                                         = 0;
let selectedCrimeCode                               = "";
let selectedDistrict                                = "";
let mapMode:               "heatmap" | "choropleth" = "heatmap";
let selectedNeighborhoodId: string | null           = null;
let neighborhoodGeoJson:   any                      = null;
let currentAccentColor                              = DEFAULT_ACCENT_COLOR;
// ─────────────────────────────────────────────
// FILTER UI
// ─────────────────────────────────────────────

const filterUI = new FilterUI(
  document.getElementById("district-filter") as HTMLSelectElement,
  document.getElementById("crime-filters"),
  (code)     => { selectedCrimeCode = code;     processUI(); },
  (district) => { selectedDistrict  = district; processUI(); },
);

// ─────────────────────────────────────────────
// THEME
// ─────────────────────────────────────────────

const themeManager = new ThemeManager(
  "theme-picker-parent",
  "theme-color-preview",
  "theme-color-text",
  DEFAULT_ACCENT_COLOR,
);

themeManager.onChange((color) => {
  currentAccentColor = color;
  processUI();
});

// ─────────────────────────────────────────────
// MAP MODE TOGGLE
// ─────────────────────────────────────────────

const heatBtn       = document.getElementById("mode-heatmap");
const choroplethBtn = document.getElementById("mode-choropleth");

heatBtn?.addEventListener("click", () => {
  mapMode = "heatmap";
  heatBtn.classList.add("active");
  choroplethBtn?.classList.remove("active");
  processUI();
});

choroplethBtn?.addEventListener("click", () => {
  mapMode = "choropleth";
  choroplethBtn.classList.add("active");
  heatBtn?.classList.remove("active");
  processUI();
});

// ─────────────────────────────────────────────
// MAP EVENTS
// ─────────────────────────────────────────────

mapManager.onMoveEnd(processUI);
mapManager.onZoom(processUI);

mapManager.onPolygonClick((feature) => {
  selectedNeighborhoodId = feature?.properties?.id ?? null;
  processUI();
});

// ─────────────────────────────────────────────
// DATA BOOTSTRAP
// ─────────────────────────────────────────────

async function loadData(): Promise<void> {
  try {
    const [crimeData, neighborhoodData] = await Promise.all([
      fetchAllCrimeData(),
      loadNeighborhoodBoundaries().catch((err) => {
        console.error("Failed loading neighborhood boundaries:", err);
        return null;
      }),
    ]);

    rawFeatures      = enrichFeatures(crimeData.features);
    neighborhoodGeoJson = neighborhoodData;

    if (statLoaded) statLoaded.textContent = String(rawFeatures.length);

    const distinctDistricts = Array.from(
      new Set(
        rawFeatures
          .map((f) => norm(f.attributes?.New_District ?? ""))
          .filter((d) => d && d !== "OUT OF JURISDICTION"),
      ),
    ).sort();

    filterUI.buildDistrictOptions(distinctDistricts, selectedDistrict);

    const dates = rawFeatures
      .map((f) => f.attributes?.CrimeDateTime)
      .filter((t) => typeof t === 'number' && Number.isFinite(t))
      .sort((a, b) => (a as number) - (b as number));

    if (dates.length === 0) {
      console.error("No valid timestamps in data");
      return;
    }

    const monthAgo = Date.now() - MIN_DATA_LOOKBACK_MS;
    minTime = Math.max(dates[0] as number, monthAgo);
    maxTime = dates.at(-1) as number;

    timeSlider.init(rawFeatures, (min, max) => {
      minTime = min;
      maxTime = max;
      processUI();
    }, minTime, maxTime);

    processUI();
  } catch (error) {
    console.error("Critical dashboard boot failure:", error);
  }
}

// ─────────────────────────────────────────────
// RENDER PIPELINE
// ─────────────────────────────────────────────

function processUI(): void {
  const timeFiltered = filterFeaturesByTime(rawFeatures, minTime, maxTime);

  const districtFiltered = selectedDistrict
    ? timeFiltered.filter((f) => norm(f.attributes?.New_District) === selectedDistrict)
    : timeFiltered;

  const valid = districtFiltered.filter(
    (f) => f?.geometry?.x != null && f?.geometry?.y != null,
  );

  filterUI.updateDynamicCrimeFilters(valid, rawFeatures, selectedCrimeCode);

  const activeCodes = selectedCrimeCode.split(",").map((c) => c.trim()).filter(Boolean);
  const fullyFiltered = activeCodes.length > 0
    ? valid.filter((f) => activeCodes.includes(String(f.attributes?.CrimeCode).trim()))
    : valid;

  const bounds   = mapManager.map.getBounds();
  const inView   = fullyFiltered.filter((f) => bounds.contains([f.geometry.y, f.geometry.x]));

  if (statIncidents) statIncidents.textContent = String(inView.length);
  if (statTypes)     statTypes.textContent     = String(new Set(inView.map((f) => f.attributes?.Description)).size);

  const uniqueDescriptions = Array.from(
    new Set(fullyFiltered.map((f) => f.attributes?.Description).filter(Boolean)),
  );

  crimeChart.update(fullyFiltered, currentAccentColor, uniqueDescriptions);
  trendChart.update(inView, currentAccentColor);

  orchestrator.clear();

  if (mapMode === "choropleth") {
    if (!neighborhoodGeoJson) return;
    orchestrator.renderChoropleth(neighborhoodGeoJson, inView, selectedNeighborhoodId, currentAccentColor);
    return;
  }

  orchestrator.renderHeatmap(fullyFiltered, crimeChart.colorMap, currentAccentColor);
}

// ─────────────────────────────────────────────
// BOOT
// ─────────────────────────────────────────────

loadData();