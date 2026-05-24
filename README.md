# Baltimore Crime Analytics Dashboard

A data-driven web app for visualizing crime patterns in Baltimore using heatmaps, choropleths, charts, and filters.

## Features

- Interactive Leaflet map with heatmap rendering
- Neighborhood choropleth visualization for incident density
- Time slider for adjustable date ranges
- Police district dropdown and crime-type filters
- Incident and trend charts using Chart.js
- Custom accent color picker for theme styling
- Fetches live crime data from ArcGIS feature services

## Tech stack

- TypeScript
- Vite
- Leaflet + leaflet.heat
- Chart.js
- noUiSlider
- vanilla-picker
- Turf.js for spatial analysis

## Project structure

- `index.html` – app shell and UI layout
- `src/main.ts` – application entry point
- `src/components/MapManager.ts` – map rendering and layers
- `src/api/fetchCrimes.ts` – ArcGIS query and data normalization
- `src/ui/FilterUI.ts` – filter controls and buttons
- `src/components/TimeSlider.ts` – date range slider
- `src/components/CrimeChart.ts` – incident chart component
- `src/components/TrendChart.ts` – trend line chart
- `src/services/NeighborhoodService.ts` – geojson loading and neighborhood analytics
- `src/services/ThemeManager.ts` – accent color picker integration
- `src/utils/dataFilters.ts` – filtering and chart data helpers
- `public/data` – neighborhood boundary GeoJSON asset

## Setup

```bash
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal.

## Build

```bash
npm run build
```

## Deployment

This is a static web app and can be deployed to GitHub Pages, Netlify, Vercel, or any static site host.

### GitHub Pages

1. Build the app:
   ```bash
   npm run build
   ```
2. Deploy the contents of `dist/`.

## Notes

- The app currently loads crime data from a live ArcGIS API, so an internet connection is required.
- Neighborhood boundaries are loaded from `public/data/Neighborhood_Statistical_Area_(NSA)_Boundaries.geojson`.
