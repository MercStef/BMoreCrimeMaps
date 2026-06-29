import bbox from "@turf/bbox";
import { area, booleanPointInPolygon, point } from "@turf/turf";
import simplify from "@turf/simplify";
import type {
  FeatureCollection,
  Feature,
  Polygon,
  MultiPolygon,
} from "geojson";
import {GEO_CONFIG} from "../config/constants/map";

export interface NeighborhoodProperties {
  id: string;
  name: string;
  incidentCount?: number;
  density?: number;
}

export type NeighborhoodFeature = Feature<
  NeighborhoodGeometry,
  NeighborhoodProperties
>;
export type NeighborhoodCollection = FeatureCollection<
  NeighborhoodGeometry,
  NeighborhoodProperties
>;

type NeighborhoodGeometry = Polygon | MultiPolygon;

type IndexedNeighborhood = {
  feature: any;
  bbox: [number, number, number, number];
  sqkm: number;
};

let boundaryCache: NeighborhoodCollection | null = null;
let neighborhoodIndex: IndexedNeighborhood[] = [];

export async function loadNeighborhoodBoundaries(): Promise<NeighborhoodCollection> {
  if (boundaryCache) return boundaryCache;

  // Try both base-prefixed and root-relative paths to be tolerant of dev setups
  const candidates = [
    `${import.meta.env.BASE_URL}data/Neighborhood_Statistical_Area_(NSA)_Boundaries.geojson`,
    "/data/Neighborhood_Statistical_Area_(NSA)_Boundaries.geojson",
  ];

  let raw: any = null;
  for (const p of candidates) {
    const res = await fetch(p).catch(
      (err) => ({ ok: false, status: err?.message }) as any,
    );
    if (res && res.ok) {
      raw = await res.json();
      break;
    }
    console.warn(
      `Neighborhood geojson fetch failed for ${p}:`,
      res?.status || "unknown",
    );
  }

  if (!raw) {
    throw new Error(
      "Failed to load neighborhood boundaries: no candidate succeeded",
    );
  }

  const neighborhoods: NeighborhoodCollection = {
    ...raw,
    features: raw.features.map((f: any) => {
      // Simplify geometry to make point-in-polygon calculations performant
      const simplified = simplify(f, {
        tolerance: GEO_CONFIG.GEO_SMPLFY_TOLER,
        highQuality: false,
        mutate: true,
      });

      return {
        ...simplified,
        properties: {
          id: String(f.properties.OBJECTID ?? f.properties.id),
          name:
            f.properties.Name ?? f.properties.NAME ?? "Unknown Neighborhood",
          incidentCount: 0,
          density: 0,
        },
      };
    }),
  };

  // Build the spatial index cache once
  neighborhoodIndex = neighborhoods.features.map((feature) => ({
    feature,
    bbox: bbox(feature) as [number, number, number, number],
    sqkm: Math.max(area(feature) / 1_000_000, GEO_CONFIG.MIN_NBHD_AREA_SQKM), // Prevent division by zero
  }));

  boundaryCache = neighborhoods;
  return neighborhoods;
}

export function summarizeNeighborhoods(
  neighborhoods: NeighborhoodCollection,
  incidents: any[],
  includeEmpty = true, // Changed default to true so Choropleth rendering doesn't drop holes in map
): NeighborhoodCollection {
  // 1. Create an isolated map/dictionary for calculating counts safely by ID
  const countMap = new Map<string, number>();

  // Initialize map keys for all known neighborhoods
  for (const item of neighborhoodIndex) {
    countMap.set(item.feature.properties.id, 0);
  }

  // 2. Spatial assignment loop
  for (const incident of incidents) {
    // Check both standard ArcGIS JSON geometry payload formats
    const x = incident.geometry?.x ?? incident.geometry?.coordinates?.[0];
    const y = incident.geometry?.y ?? incident.geometry?.coordinates?.[1];

    if (x == null || y == null) continue;

    const pt = point([x, y]);

    for (const item of neighborhoodIndex) {
      const [minX, minY, maxX, maxY] = item.bbox;

      // Fast Bounding Box check (keeps loop blazing fast)
      if (x < minX || x > maxX || y < minY || y > maxY) {
        continue;
      }

      // Exact Polygon intersection check
      if (booleanPointInPolygon(pt, item.feature)) {
        const id = item.feature.properties.id;
        countMap.set(id, (countMap.get(id) || 0) + 1);
        // Removed `break;` to prevent edge-case losses on shared boundary coordinates
      }
    }
  }

  // 3. Construct clean, stable GeoJSON outputs matching original indexed instances
  const features = neighborhoodIndex
    .map((item) => {
      const id = item.feature.properties.id;
      const incidentCount =
        incidents.length > 0
          ? countMap.get(id) || 0
          : item.feature.properties.incidentCount || 0;

      return {
        ...item.feature,
        properties: {
          ...item.feature.properties,
          incidentCount,
          sqkm: item.sqkm,
          density:
            incidentCount > 0 ? +(incidentCount / item.sqkm).toFixed(1) : 0,
        },
      };
    })
    // Filter out empty neighborhoods ONLY if explicitly requested
    .filter((f) => includeEmpty || f.properties.incidentCount > 0);

  return {
    ...neighborhoods,
    features,
  };
}
