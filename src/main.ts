import "./base.css";

import {
  BALTIMORE_CENTER,
  DEFAULT_MAP_ZOOM,
  DEFAULT_ACCENT_COLOR,
} from "./config/constants";
import { MapManager, TimeSlider, CrimeChart, TrendChart } from "./components";
import FilterUI from "./ui/FilterUI";
import ThemeManager from "./services/ThemeManager";
import { LayerOrchestrator } from "./services/LayerOrchestrator";
import AppState from "./services/AppState";
import DataService from "./services/DataService";
import UIManager from "./services/UIManager";

// ------------------------------------------------------------------
// 1️⃣ Instantiate core objects (only once)
// ------------------------------------------------------------------
const state = new AppState();

const mapManager = new MapManager(
  "map",
  BALTIMORE_CENTER as [number, number],
  DEFAULT_MAP_ZOOM,
);
const orchestrator = new LayerOrchestrator(mapManager, "neighborhood-drill");

const timeSlider = new TimeSlider("date-slider", "date-range-label", state);

const crimeChart = new CrimeChart("chart");
const trendChart = new TrendChart("trend-chart");

// UI controls
const filterUI = new FilterUI(
  document.getElementById("district-filter") as HTMLSelectElement,
  document.getElementById("crime-filters"),
  (code) => state.setState({ selectedCrimeCode: code }),
  (district) => state.setState({ selectedDistrict: district }),
);
const themeManager = new ThemeManager(
  "theme-picker-parent",
  "theme-color-preview",
  "theme-color-text",
  DEFAULT_ACCENT_COLOR,
);

// ------------------------------------------------------------------
// 2️⃣ Wire everything together via UIManager
// ------------------------------------------------------------------
const uiManager = new UIManager(
  state,
  mapManager,
  orchestrator,
  timeSlider,
  crimeChart,
  trendChart,
  filterUI,
  themeManager,
);

// ------------------------------------------------------------------
// 3️⃣ Bootstrap data (async) – once finished we tell UIManager to build UI
// ------------------------------------------------------------------
const dataService = new DataService(state, timeSlider);
dataService.load().then(() => uiManager.bootstrapAfterDataLoad());
