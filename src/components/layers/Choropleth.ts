import * as L from "leaflet";
import type { Feature, Geometry, FeatureCollection } from "geojson";
import { CHOROPLETH_CONFIG } from "../../config/constants/map";
import type { MapManager } from "../MapManager";
import { buildScale } from "../../utils/colorScales";
import type { NeighborhoodProperties } from "../../services/NeighborhoodService";
import { CHOROPLETH_COLOR_BINS } from "../../config/constants/choropleth";

export interface ChoroplethRenderProps {
  _fill?: string;
  _count?: number;
  _id?: string;
}

export interface ChoroplethProperties
  extends NeighborhoodProperties, ChoroplethRenderProps {}

export type StyleProps = Partial<ChoroplethProperties>;
export type ChoroplethFeature = Feature<Geometry, ChoroplethProperties>;
export type ChoroplethCollection = FeatureCollection<
  Geometry,
  ChoroplethProperties
>;
import { NeighborhoodDrill } from "../NeighborhoodDrill";
import { summarizeNeighborhoods } from "../../services/NeighborhoodService";
import type { NeighborhoodCollection } from "../../services/NeighborhoodService";
export class ChoroplethLayer {
  public layer: L.GeoJSON;
  private abortController = new AbortController();

  constructor(
    data: NeighborhoodCollection, // changed from ChoroplethCollection
    inView: any[],
    selectedId: string | null,
    accentColor: string,
    mapManager: MapManager,
    drill: NeighborhoodDrill,
  ) {
    const summarized = summarizeNeighborhoods(data, inView);

    const fillScale = buildScale(accentColor);
    const logMax = this.getLogMax(summarized.features);
    const enriched = this.precompute(summarized.features, fillScale, logMax);

    this.layer = L.geoJSON(
      { ...summarized, features: enriched } as GeoJSON.GeoJsonObject,
      {
        pane: "choroplethPane",
        style: (feature) => {
          const props = feature?.properties as StyleProps | undefined;
          return this.style(props ?? {}, selectedId);
        },
      },
    );

    // Update drill from the summarized data
    const selectedFeature = selectedId
      ? summarized.features.find(
          (f) => String(f.properties?.id) === String(selectedId),
        )
      : null;

    drill.update("choropleth", selectedFeature ?? null);

    mapManager.bindPolygonEvents(this.layer, this.abortController.signal);
  }

  public abort(): void {
    this.abortController.abort();
  }

  private precompute(
    features: ChoroplethFeature[],
    fillScale: ReturnType<typeof buildScale>,
    logMax: number,
  ): ChoroplethFeature[] {
    const invLogMax = logMax === 0 ? 1 : 1 / logMax;
    const binSize = 1 / CHOROPLETH_COLOR_BINS;

    return features.map((f) => {
      const count = Number(f.properties?.incidentCount ?? 0);
      const normalized = Math.log1p(count) * invLogMax;
      const stepped = Math.floor(normalized / binSize) * binSize;

      return {
        ...f,
        properties: {
          ...f.properties,
          _fill:
            count > 0
              ? fillScale(stepped).hex()
              : CHOROPLETH_CONFIG.fill.emptyColor,
          _count: count,
          _id: f.properties?.id,
        },
      };
    });
  }

  // Takes StyleProps — all fields optional, safe to receive {} from the Leaflet callback
  private style(props: StyleProps, selectedId: string | null): L.PathOptions {
    const isSelected = props._id === selectedId;
    const hasValue = (props._count ?? 0) > 0;

    return {
      fillColor: props._fill,
      fillOpacity: hasValue
        ? CHOROPLETH_CONFIG.fill.activeOpacity
        : CHOROPLETH_CONFIG.fill.emptyOpacity,
      color: isSelected ? CHOROPLETH_CONFIG.border.selectedColor : "#333",
      weight: isSelected
        ? CHOROPLETH_CONFIG.border.selectedWeight
        : CHOROPLETH_CONFIG.border.defaultWeight,
      opacity: CHOROPLETH_CONFIG.border.opacity,
      pane: "choroplethPane",
    };
  }

  private getLogMax(features: ChoroplethFeature[]): number {
    let max = 1;
    for (const f of features) {
      const c = f.properties?.incidentCount ?? 0;
      if (c > max) max = c;
    }
    return Math.log1p(max);
  }
}
