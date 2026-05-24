// src/main.ts
import 'leaflet/dist/leaflet.css';
import 'nouislider/dist/nouislider.css';
import './style.css';
import ThemeManager from './services/ThemeManager';
import { MapManager, TimeSlider, CrimeChart, TrendChart } from './components';
import FilterUI from './ui/FilterUI';
import { fetchAllCrimeData } from './api/fetchCrimes';
import { filterFeaturesByTime } from './utils/dataFilters';
import { loadNeighborhoodBoundaries, summarizeNeighborhoods } from './services/NeighborhoodService';

// Instantiate UI Elements
const mapManager = new MapManager('map', [39.2904, -76.6122], 12);
const timeSlider = new TimeSlider('date-slider', 'date-range-label');
const crimeChart = new CrimeChart('chart');
const trendChart = new TrendChart('trend-chart');

// Application States
let rawFeatures: any[] = [];
let minTime = 0, maxTime = 0;
let selectedCode = '';
let selectedDistrict = '';
let districtsBuilt = false; // Separate tracking from crime buttons
let mapMode: 'heatmap' | 'choropleth' = 'heatmap';
let neighborhoodGeoJson: any = null;
let selectedNeighborhoodId: string | null = null;
let isNeighborhoodDataLoaded = false;

let currentAccentColor = '#FFFFFF';

// Theme manager handles the color picker and updates the accent color across the UI.
const themeManager = new ThemeManager('theme-picker-parent', 'theme-color-preview', 'theme-color-text', currentAccentColor);
themeManager.onChange((selectedColor) => {
  currentAccentColor = selectedColor;
  processUI();
});

// DOM Selectors for Layout Elements
const spinner = document.getElementById('spinner')!;
const districtSelect = document.getElementById('district-filter') as HTMLSelectElement | null;
const crimeFiltersContainer = document.getElementById('crime-filters');
const heatmapModeBtn = document.getElementById('mode-heatmap');
const choroplethModeBtn = document.getElementById('mode-choropleth');
const statIncidents = document.getElementById('stat-incidents');
const statTypes = document.getElementById('stat-types');
const statSelected = document.getElementById('stat-selected');
const neighborhoodDetails = document.getElementById('neighborhood-details');
const neighborhoodMessage = document.getElementById('neighborhood-message');

// Initialize Filter UI helper
const filterUI = new FilterUI(
  districtSelect,
  crimeFiltersContainer,
  (code) => {
    selectedCode = code;
    loadData(selectedCode, selectedDistrict);
  },
  (district) => {
    selectedDistrict = district;
    loadData(selectedCode, selectedDistrict);
  }
);

heatmapModeBtn?.addEventListener('click', () => setMapMode('heatmap'));
choroplethModeBtn?.addEventListener('click', () => setMapMode('choropleth'));

mapManager.onMoveEnd(() => processUI());
mapManager.onPolygonClick((feature) => {
  if (!feature?.properties) return;
  selectedNeighborhoodId = feature.properties.id || null;
  neighborhoodDetails && (neighborhoodDetails.textContent = `${feature.properties.name || 'Neighborhood'}: ${feature.properties.incidentCount ?? 0} incidents, ${feature.properties.density ?? 0} / km²`);
  processUI();
});

function setMapMode(mode: 'heatmap' | 'choropleth') {
  mapMode = mode;
  heatmapModeBtn?.classList.toggle('active', mode === 'heatmap');
  choroplethModeBtn?.classList.toggle('active', mode === 'choropleth');
  if (mode === 'choropleth' && !isNeighborhoodDataLoaded) {
    loadNeighborhoodBoundaries()
      .then((data) => {
        neighborhoodGeoJson = data;
        isNeighborhoodDataLoaded = true;
        neighborhoodMessage?.classList.add('hidden');
        processUI();
      })
      .catch(() => {
        neighborhoodMessage?.classList.remove('hidden');
      });
  } else {
    processUI();
  }
}

async function loadData(code?: string, district?: string) {
  if (spinner) spinner.classList.remove('hidden');

  // Load the latest crime data from the ArcGIS services.
  const data = await fetchAllCrimeData(code, district);
  rawFeatures = data.features;

  if (minTime === 0) {
    const dates = rawFeatures
      .map(f => new Date(f.attributes.CrimeDateTime).getTime())
      .filter(t => !isNaN(t))
      .sort((a, b) => a - b);

    if (dates.length > 0) {
      const absoluteMin = dates[0];
      const absoluteMax = dates[dates.length - 1];

      const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
      const rightNow = Date.now();
      const oneMonthAgo = rightNow - thirtyDaysInMs;

      const targetMin = Math.max(absoluteMin, oneMonthAgo);
      const targetMax = absoluteMax;

      minTime = targetMin;
      maxTime = targetMax;

      timeSlider.init(
        rawFeatures, 
        (min, max) => {
          minTime = min;
          maxTime = max;
          processUI();
        },
        targetMin,
        targetMax
      );
    }
  }

  // Build the district dropdown only once, since district boundaries are static.
  if (!districtsBuilt) {
    filterUI.buildDistrictOptions(data.districts, selectedDistrict);
    districtsBuilt = true;
  }

  processUI();

  if (spinner) spinner.classList.add('hidden');
}

function processUI() {
  // 1. Get the incidents matching the active time frame window
  const filteredByTime = filterFeaturesByTime(rawFeatures, minTime, maxTime);

  // Only keep incidents that have valid coordinates for the map.
  const validSpatialFeatures = filteredByTime.filter(
    f => f && f.geometry && typeof f.geometry.x === 'number' && typeof f.geometry.y === 'number'
  );

  const countEl = document.getElementById('incident-count');
  if (countEl) {
    countEl.textContent = String(validSpatialFeatures.length);
  }

  const inViewBounds = mapManager.map.getBounds();
  const featuresInView = validSpatialFeatures.filter((f) =>
    inViewBounds.contains([f.geometry.y, f.geometry.x])
  );

  statIncidents && (statIncidents.textContent = String(featuresInView.length));
  statTypes && (statTypes.textContent = String(new Set(featuresInView.map(f => f.attributes.Description)).size));
  statSelected && (statSelected.textContent = selectedNeighborhoodId ? selectedNeighborhoodId : 'None');

  // 2. REBUILD CRIME BUTTONS DYNAMICALLY based on active temporal features
  filterUI.updateDynamicCrimeFilters(filteredByTime, rawFeatures, selectedCode);

  // Build the full list of all offense descriptions in the dataset so colors stay consistent.
  const allPossibleDescriptions = rawFeatures.map(f => f.attributes.Description || 'Incident');

  // Update chart layout and daily trend analytics.
  crimeChart.update(validSpatialFeatures, currentAccentColor, allPossibleDescriptions);
  trendChart.update(featuresInView, currentAccentColor);

  if (mapMode === 'choropleth') {
    if (neighborhoodGeoJson) {
      const summarized = summarizeNeighborhoods(neighborhoodGeoJson, featuresInView);
      mapManager.renderChoropleth(summarized, selectedNeighborhoodId, currentAccentColor);
    } else {
      mapManager.clearChoropleth();
    }
    // In choropleth mode, show heatmap + individual incident circles together
    mapManager.renderHeatmap(featuresInView, crimeChart.colorMap, currentAccentColor);
    mapManager.renderCircles(featuresInView, crimeChart.colorMap, currentAccentColor);
  } else {
    // In heatmap mode, always render both heatmap and circles for visibility at all zoom levels
    mapManager.clearChoropleth();
    mapManager.renderHeatmap(validSpatialFeatures, crimeChart.colorMap, currentAccentColor);
    mapManager.renderCircles(validSpatialFeatures, crimeChart.colorMap, currentAccentColor);
  }
}

mapManager.onZoom(() => processUI());
loadData();