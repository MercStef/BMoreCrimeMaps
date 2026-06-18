import * as L from "leaflet";
import { CIRCLE_CONFIG } from "../../config/mapConfig";
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

    const renderer = L.canvas({ padding: 0.5, tolerance: 10, pane: 'circlePane' });

    const {
      radius = 5,
      fillOpacity = 0.75,
      weight = 1,
      rimDarken = 1.5,
    } = CIRCLE_CONFIG?.style ?? {};

    for (const f of features) {
      if (f.geometry?.x == null || f.geometry?.y == null || !f.attributes) continue;

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
          pane: 'circlePane',
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
        month: 'short', day: 'numeric', year: 'numeric'
      })
    : 'Unknown date';

  return `
    <div class="incident-popup">
      <strong>${attrs.Description ?? 'Unknown'}</strong><br/>
      <span>${attrs.New_District ?? 'Unknown district'}</span><br/>
      <span>${date}</span>
    </div>
  `;
}