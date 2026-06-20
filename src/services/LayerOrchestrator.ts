import { HeatLayer } from "../components/layers/Heat";
import { CircleLayer } from "../components/layers/Circle";
import { ChoroplethLayer } from "../components/layers/Choropleth";
import { CIRCLE_CONFIG } from "../config/constants/map";
import { MapManager } from "../components/MapManager";
import { NeighborhoodDrill } from "../components/NeighborhoodDrill";
import type { ColorMap } from "../utils/colorScales";
import type { NeighborhoodCollection } from "./NeighborhoodService";

export class LayerOrchestrator {
  private mapManager: MapManager;
  private drill: NeighborhoodDrill;
  private heatLayer: HeatLayer | null = null;
  private circleLayer: CircleLayer | null = null;
  private choroplethLayer: ChoroplethLayer | null = null;

  constructor(mapManager: MapManager, drillId: string) {
    this.mapManager = mapManager;
    this.drill = new NeighborhoodDrill(drillId); // Defensive copy
  }

  renderChoropleth(
    neighborhoodGeoJson: NeighborhoodCollection,
    inView: any[],
    selectedNeighborhoodId: string | null,
    accentColor: string,
  ): void {
    this.choroplethLayer = new ChoroplethLayer(
      neighborhoodGeoJson,
      inView,
      selectedNeighborhoodId,
      accentColor,
      this.mapManager,
      this.drill,
    );
    this.mapManager.add(this.choroplethLayer.layer);
  }

  renderHeatmap(
    features: any[],
    colorMap: ColorMap,
    accentColor: string,
  ): void {
    this.drill.update("heatmap", null);

    // If there are no features to render, skip creating heat/circle layers
    if (!features || features.length === 0) {
      return;
    }

    // Ensure the map canvas has been sized before adding canvas-based layers
    this.mapManager.refresh();

    this.heatLayer = new HeatLayer(features, accentColor);
    this.mapManager.add(this.heatLayer.layer);

    if (this.mapManager.map.getZoom() >= CIRCLE_CONFIG.behavior.minZoom) {
      this.circleLayer = new CircleLayer(features, colorMap, accentColor);
      this.mapManager.add(this.circleLayer.layer);
    }
  }

  clear(): void {
    if (this.heatLayer) {
      this.mapManager.remove(this.heatLayer.layer);
      this.heatLayer = null;
    }
    if (this.circleLayer) {
      this.mapManager.remove(this.circleLayer.layer);
      this.circleLayer = null;
    }
    if (this.choroplethLayer) {
      this.choroplethLayer.abort();
      this.mapManager.remove(this.choroplethLayer.layer);
      this.drill.update("heatmap", null); // Reset drill when choropleth is removed
      this.choroplethLayer = null;
    }
  }
}
