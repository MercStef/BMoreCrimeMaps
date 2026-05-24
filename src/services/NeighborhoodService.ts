import bbox from '@turf/bbox'
import { area, booleanPointInPolygon, point } from '@turf/turf'
import simplify from '@turf/simplify'
import type {
  FeatureCollection,
  Feature,
  Polygon,
  MultiPolygon
} from 'geojson'

export interface NeighborhoodProperties {
  id: string
  name: string
  incidentCount?: number
  density?: number
}

type NeighborhoodGeometry = Polygon | MultiPolygon

export type NeighborhoodFeature =
  Feature<NeighborhoodGeometry, NeighborhoodProperties>

export type NeighborhoodCollection =
  FeatureCollection<NeighborhoodGeometry, NeighborhoodProperties>

export async function loadNeighborhoodBoundaries(): Promise<NeighborhoodCollection> {
  const res = await fetch(
    '/data/Neighborhood_Statistical_Area_(NSA)_Boundaries.geojson'
  )

  if (!res.ok) {
    throw new Error(
      `Failed to load neighborhood boundaries: ${res.status}`
    )
  }

  const raw = await res.json()

  return {
    ...raw,
    features: raw.features.map((f: any) => {
      const simplified = simplify(f, {
        tolerance: 0.0003,
        highQuality: false,
        mutate: false
      })

      return {
        ...simplified,
        properties: {
          id: String(f.properties.OBJECTID),
          name: f.properties.Name,
          incidentCount: 0,
          density: 0
        }
      }
    })
  }
}

export function summarizeNeighborhoods(
  neighborhoods: NeighborhoodCollection,
  incidents: any[]
): NeighborhoodCollection {

  // prepare indexed features once
  const indexed = neighborhoods.features.map((feature) => ({
    feature: {
      ...feature,
      properties: {
        ...feature.properties,
        incidentCount: 0
      }
    },

    bbox: bbox(feature),

    sqkm: Math.max(
      area(feature) / 1_000_000,
      0.001
    )
  }))

  // spatial join
  for (const incident of incidents) {
    const x = incident.geometry?.x
    const y = incident.geometry?.y

    if (x == null || y == null) continue

    const pt = point([x, y])

    for (const item of indexed) {
      const [minX, minY, maxX, maxY] = item.bbox

      // cheap bbox rejection
      if (
        x < minX ||
        x > maxX ||
        y < minY ||
        y > maxY
      ) {
        continue
      }

      // expensive polygon check
      if (booleanPointInPolygon(pt, item.feature)) {
        item.feature.properties.incidentCount!++
        break
      }
    }
  }

  // density calculation
  for (const item of indexed) {
    item.feature.properties.density = +(
      item.feature.properties.incidentCount! /
      item.sqkm
    ).toFixed(1)
  }

return {
  ...neighborhoods,
  features: indexed
    .map((i) => i.feature)
    .filter(
      (f) => (f.properties.incidentCount ?? 0) > 0
    )
}
}