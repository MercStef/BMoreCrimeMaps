import * as L from "leaflet";
import { CIRCLE_CONFIG } from "../../config/constants/map";
import { getRimColor, type ColorMap } from "../../utils/colorScales";
import {
  CANVAS_RENDERER_PADDING,
  CANVAS_RENDERER_TOLERANCE,
  CIRCLE_RADIUS,
  CIRCLE_FILL_OPACITY,
  CIRCLE_BORDER_WEIGHT,
  CIRCLE_RIM_DARKEN,
} from "../../config/constants/circles";

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
      padding: CANVAS_RENDERER_PADDING,
      tolerance: CANVAS_RENDERER_TOLERANCE,
      pane: "circlePane",
    });

    const {
      radius = CIRCLE_RADIUS,
      fillOpacity = CIRCLE_FILL_OPACITY,
      weight = CIRCLE_BORDER_WEIGHT,
      rimDarken = CIRCLE_RIM_DARKEN,
    } = CIRCLE_CONFIG?.style ?? {};

    for (const f of features) {
      if (f.geometry?.x == null || f.geometry?.y == null || !f.attributes)
        continue;

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
