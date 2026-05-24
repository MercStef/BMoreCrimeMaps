// src/components/MapManager.ts
import L from 'leaflet';
import 'leaflet.heat';
import chroma from 'chroma-js';

export class MapManager {
  public map: L.Map;
  private heatLayerGroup: L.LayerGroup | null = null;
  private choroplethLayer: L.GeoJSON | null = null;
  private circleLayer: L.LayerGroup | null = null;
  private polygonClickCallback: ((feature: any) => void) | null = null;

  constructor(elementId: string, center: [number, number], zoom: number) {
    this.map = L.map(elementId, {
      preferCanvas: true
    }).setView(center, zoom);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO'
    }).addTo(this.map);
  }

  public onZoom(callback: (zoom: number) => void) {
    this.map.on('zoomend', () => callback(this.map.getZoom()));
  }

  public onMoveEnd(callback: (bounds: L.LatLngBounds) => void) {
    this.map.on('moveend', () => callback(this.map.getBounds()));
  }

  public onPolygonClick(callback: (feature: any) => void) {
    this.polygonClickCallback = callback;
  }

  public refresh() {
    if (this.map) {
      this.map.invalidateSize();
    }
  }

public renderHeatmap(
  features: any[],
  colorMap: Record<string, string>,
  accentColor: string
) {
  if (this.heatLayerGroup) {
    this.map.removeLayer(this.heatLayerGroup);
    this.heatLayerGroup = null;
  }

  if (features.length === 0) return;

  this.heatLayerGroup = L.layerGroup();

  // Group incidents by category
  const grouped = features.reduce(
    (acc: Record<string, any[]>, feature) => {
      const desc =
        feature.attributes?.Description || 'Unknown';

      const x = feature.geometry?.x;
      const y = feature.geometry?.y;

      if (x == null || y == null) {
        return acc;
      }

      if (!acc[desc]) {
        acc[desc] = [];
      }

      acc[desc].push([
        y,
        x,
        1.0
      ] as [number, number, number]);

      return acc;
    },
    {}
  );

  // Sort categories by incident count
  const sorted = Object.entries(grouped).sort(
    (a, b) => b[1].length - a[1].length
  );

  // Top 8 categories
  const topCategories = sorted.slice(0, 8);

  // Merge remaining categories into "Other"
  const otherPoints = sorted
    .slice(8)
    .flatMap(([, points]) => points);

  if (otherPoints.length > 0) {
    grouped.Other = otherPoints;
  }

  const categories = [
    ...topCategories.map(([category]) => category),
    ...(otherPoints.length ? ['Other'] : [])
  ];

  const primaryHeatColor = chroma(accentColor)
    .brighten(1.0)
    .saturate(0.55)
    .hex();

  const currentZoom = this.map.getZoom();

  // Render heat layers
  categories.forEach((category) => {
    const color =
      category === 'Other'
        ? '#888888'
        : colorMap[category] || primaryHeatColor;

    const heatOpacity =
      currentZoom >= 14 ? 0.3 : 1.0;

    const heatLayer = L.heatLayer(
      grouped[category],
      {
        radius: this.getHeatRadius(),
        blur: 20,
        minOpacity: 0.08 * heatOpacity,
        max: 20.0,
        gradient: {
          0.0: chroma(color).alpha(0).css(),
          0.2: chroma(color)
            .alpha(0.12 * heatOpacity)
            .css(),
          0.4: chroma(color)
            .alpha(0.22 * heatOpacity)
            .css(),
          0.65: chroma(color)
            .alpha(0.42 * heatOpacity)
            .css(),
          0.85: chroma(color)
            .alpha(0.62 * heatOpacity)
            .css(),
          1.0: chroma(color)
            .brighten(0.4)
            .hex()
        }
      }
    );

    this.heatLayerGroup!.addLayer(heatLayer);
  });

  this.heatLayerGroup.addTo(this.map);
}

  public clearChoropleth() {
    if (this.choroplethLayer) {
      this.map.removeLayer(this.choroplethLayer);
      this.choroplethLayer = null;
    }
  }

  public renderChoropleth(neighborhoods: any, selectedNeighborhoodId: string | null, accentColor: string) {
    this.clearChoropleth();
    if (!neighborhoods?.features || neighborhoods.features.length === 0) return;

    const counts = neighborhoods.features.map((feature: any) => feature.properties?.incidentCount ?? 0);
    const maxCount = Math.max(...counts, 1);
    const fillScale = chroma
      .scale([
        chroma(accentColor).desaturate(0.6).darken(0.7).hex(),
        accentColor,
        chroma(accentColor).brighten(1.0).hex()
      ])
      .mode('lch');

    this.choroplethLayer = L.geoJSON(neighborhoods, {
      style: (feature: any) => {
        const count = feature.properties?.incidentCount ?? 0;
        const fillColor = count > 0 ? fillScale(count / maxCount).hex() : '#111';
        const isSelected = feature.properties?.id === selectedNeighborhoodId;
        return {
          fillColor,
          fillOpacity: count > 0 ? 0.55 : 0.1,
          color: isSelected ? '#fff' : chroma(accentColor).darken(0.7).hex(),
          weight: isSelected ? 3 : 1,
          opacity: 0.9
        };
      },
      onEachFeature: (feature: any, layer: any) => {
        const name = feature.properties?.name || 'Neighborhood';
        const count = feature.properties?.incidentCount ?? 0;
        const density = feature.properties?.density ?? 0;
        layer.bindPopup(`<strong>${name}</strong><br/>Incidents: ${count}<br/>Density: ${density} / km²`);
        layer.on('click', () => {
          if (this.polygonClickCallback) {
            this.polygonClickCallback(feature);
          }
        });
      }
    }).addTo(this.map);
  }

  /**
   * FIXED: Accepts shared category dictionary object map reference 
   */
  public renderCircles(features: any[], colorMap: Record<string, string>, fallbackColor: string) {
    if (this.circleLayer) {
      this.map.removeLayer(this.circleLayer);
      this.circleLayer = null;
    }

    if (this.map.getZoom() < 13 || features.length === 0) return;

    this.circleLayer = L.layerGroup();

    features.forEach((f) => {
      if (!f.geometry?.x || !f.geometry?.y) return;

      const incidentDesc = f.attributes.Description || '';
      // READ SHARED COLOR: Look up value using the exact same map dictionary key string
      const markerColor = colorMap[incidentDesc] || fallbackColor;

      L.circleMarker([f.geometry.y, f.geometry.x], {
        radius: 5.5,
        color: chroma(markerColor).darken(0.5).hex(), // Balanced dark rim contract
        fillColor: markerColor,
        fillOpacity: 0.8,
        weight: 1.2
      })
        .bindPopup(`<b>${incidentDesc || 'Incident'}</b><br><small>District: ${f.attributes.New_District || 'N/A'}</small>`)
        .addTo(this.circleLayer!);
    });

    this.circleLayer.addTo(this.map);
  }

  private getHeatRadius() {
    const zoom = this.map.getZoom();
    return zoom <= 10 ? 25 : zoom <= 12 ? 18 : 12;
  }
}