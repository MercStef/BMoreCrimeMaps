import { OTHER_CATEGORY_COLOR } from "./constants/ui";

export const MAP_CONFIG = {
  tileUrl: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  tileAttribution: "© OpenStreetMap © CARTO",
} as const;

export const HEATMAP_CONFIG = {
  behavior: {
    maxCategories: 8,
    zoomedInThreshold: 14,
    zoomedInOpacity: 0.3,
  },

  render: {
    blur: 20,
    maxIntensity: 3,
    minOpacityBase: 0.1,
  },

  theme: {
    otherCategoryLabel: "Other",
    otherCategoryColor: OTHER_CATEGORY_COLOR,
    accentBrighten: 1.0,
    accentSaturate: 0.55,
  },

  gradient: {
    stop0: { alpha: 0, pos: 0.0 },
    stop1: { alphaScale: 0.12, pos: 0.2 },
    stop2: { alphaScale: 0.22, pos: 0.4 },
    stop3: { alphaScale: 0.42, pos: 0.65 },
    stop4: { alphaScale: 0.62, pos: 0.85 },
    stop5: { brighten: 0.4, pos: 1.0 },
  },
} as const;

export const CHOROPLETH_CONFIG = {
  fill: {
    activeOpacity: 0.55,
    emptyOpacity: 0.1,
    emptyColor: "#111",
  },
  border: {
    selectedColor: "#fff",
    selectedWeight: 3,
    defaultWeight: 1,
    opacity: 0.9,
  },
  scale: {
    desaturate: 0.6,
    darken: 0.7,
    brighten: 1.0,
    mode: "lch" as const, // Cast to literal for chroma compatibility
  },
} as const;

export const CIRCLE_CONFIG = {
  behavior: {
    minZoom: 13,
  },

  style: {
    radius: 5.5,
    fillOpacity: 0.8,
    weight: 1.2,
    rimDarken: 0.5,
  },
} as const;
