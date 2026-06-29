import * as L from "leaflet";
import { MAP_CONFIG, CIRCLE_CONFIG } from "../../config/constants/map";
import { getRimColor, type ColorMap } from "../../utils/colorScales";

export interface CircleFeature {
  geometry?: { x: number; y: number };
  attributes: {
    Description: string;
    [key: string]: any;
  };
}

export class CircleLayer {
  public layer: L.FeatureGroup;

  constructor(features: CircleFeature[], colorMap: ColorMap, fallback: string) {
    this.layer = L.featureGroup();

    const renderer = L.canvas({
      padding: MAP_CONFIG.renderer.canvasPadding,
      tolerance: MAP_CONFIG.renderer.canvasTolerance,
      pane: "circlePane",
    });

    const { radius, fillOpacity, weight, rimDarken } =
      CIRCLE_CONFIG.style;

    for (const f of features) {
      if (f.geometry?.x == null || f.geometry?.y == null || !f.attributes) {
        continue;
      }

      const baseColor = colorMap[f.attributes.Description] ?? fallback;

      const marker = L.circleMarker(
        [f.geometry.y, f.geometry.x] as L.LatLngTuple,
        {
          radius,
          fillColor: baseColor,
          fillOpacity,
          color: getRimColor(baseColor, rimDarken),
          weight,
          renderer,
          pane: "circlePane",
        } as L.CircleMarkerOptions,
      );

      marker.bindPopup(buildPopup(f.attributes));
      marker.addTo(this.layer);
    }
  }
}

function buildPopup(attrs: Record<string, any>): string {
  const date = attrs.CrimeDateTime
    ? new Date(attrs.CrimeDateTime).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Unknown date";

  return `
    <div class="incident-popup">
      <strong>${attrs.Description ?? "Unknown"}</strong><br/>
      <span>${attrs.New_District ?? "Unknown district"}</span><br/>
      <span>${date}</span>
    </div>
  `;
}