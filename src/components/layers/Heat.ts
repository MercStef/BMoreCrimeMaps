import { HEATMAP_CONFIG } from "../../config/constants/map";
import { getHeatGradient } from "../../utils/colorScales";
import type { CircleFeature } from "./Circle";
import L from "leaflet";  // default import, not namespace
import "leaflet.heat";

declare module "leaflet" {
  function heatLayer(
    latlngs: Array<[number, number, number]>,
    options: any,
  ): L.Layer;
}

const LOG1P_DENOMINATOR = Math.log1p(
  HEATMAP_CONFIG.behavior.logDenominator,
);

export class HeatLayer {
  public layer: L.Layer;

  constructor(features: CircleFeature[], accentColor: string) {
    this.layer = L.heatLayer(HeatLayer.flatten(features), {
      radius: HEATMAP_CONFIG.render.blur,
      blur: HEATMAP_CONFIG.render.blur,
      max: HEATMAP_CONFIG.render.maxIntensity,
      minOpacity: HEATMAP_CONFIG.render.minOpacityBase,
      maxZoom: 18,
      gradient: getHeatGradient(accentColor),
    });
  }

  private static flatten(
    features: CircleFeature[],
  ): Array<[number, number, number]> {
    const out: Array<[number, number, number]> = [];

    for (const f of features) {
      if (f.geometry?.x == null || f.geometry?.y == null) continue;

      const intensity = Math.min(
        Math.log1p(f.attributes?.Weight ?? 1) / LOG1P_DENOMINATOR,
        1,
      );

      out.push([f.geometry.y, f.geometry.x, intensity]);
    }

    return out;
  }
}