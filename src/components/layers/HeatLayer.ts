import * as L from "leaflet";
import { HEATMAP_CONFIG } from "../../config/mapConfig";
import { getHeatGradient } from "../../utils/colorScales";
import type { CircleFeature } from "./CircleLayer";
import 'leaflet.heat';

declare module "leaflet" {
  function heatLayer(
    latlngs: Array<[number, number, number]>,
    options: any,
  ): L.Layer;
}

const LOG1P_10 = Math.log1p(10);

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
        Math.log1p(f.attributes?.Weight ?? 1) / LOG1P_10,
        1,
      );
      out.push([f.geometry.y, f.geometry.x, intensity]);
    }
    return out;
  }
}
