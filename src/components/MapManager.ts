import { MAP_CONFIG } from "../config/constants/map";
import { CIRCLE_PANE_ZINDEX, CHOROPLETH_PANE_ZINDEX } from "../config/constants/circles";
import * as L from "leaflet";
import "leaflet.heat";

export class MapManager {
  public map: L.Map;

  private polygonClickCallback: ((feature: any) => void) | null = null;

  // Store bound handler references so we can remove exactly them later
  private zoomHandler: (() => void) | null = null;
  private moveHandler: (() => void) | null = null;

 constructor(id: string, center: [number, number], zoom: number) {
  this.map = L.map(id, { preferCanvas: true }).setView(center, zoom);

  L.tileLayer(MAP_CONFIG.tileUrl, {
    attribution: MAP_CONFIG.tileAttribution,
  }).addTo(this.map);

  this.initPanes();
}

private initPanes(): void {
  this.map.createPane('circlePane').style.zIndex = String(CIRCLE_PANE_ZINDEX);
  this.map.createPane('choroplethPane').style.zIndex = String(CHOROPLETH_PANE_ZINDEX);
}

  public add(layer: L.Layer): void {
    layer.addTo(this.map);
  }

  public remove(layer: L.Layer): void {
    this.map.removeLayer(layer);
  }

  public refresh(): void {
    this.map.invalidateSize();
  }

  // ─────────────────────────────
  // EVENTS
  // ─────────────────────────────

  public onZoom(cb: (zoom: number) => void): void {
    // Remove only our previously registered handler, not all zoomend listeners
    if (this.zoomHandler) this.map.off("zoomend", this.zoomHandler);
    this.zoomHandler = () => cb(this.map.getZoom());
    this.map.on("zoomend", this.zoomHandler);
  }

  public onMoveEnd(cb: (bounds: L.LatLngBounds) => void): void {
    if (this.moveHandler) this.map.off("moveend", this.moveHandler);
    this.moveHandler = () => cb(this.map.getBounds());
    this.map.on("moveend", this.moveHandler);
  }

  public onPolygonClick(cb: (feature: any) => void): void {
    this.polygonClickCallback = cb;
  }

  public bindPolygonEvents(layer: L.GeoJSON, signal: AbortSignal): void {
    layer.eachLayer((l: any) => {
      const handler = () => this.polygonClickCallback?.(l.feature);

      l.on("click", handler);

      // Clean up this specific handler when the caller aborts
      signal.addEventListener("abort", () => l.off("click", handler), {
        once: true,
      });
    });
  }

  public destroy(): void {
    if (this.zoomHandler) this.map.off("zoomend", this.zoomHandler);
    if (this.moveHandler) this.map.off("moveend", this.moveHandler);
    this.map.remove();
  }
}
