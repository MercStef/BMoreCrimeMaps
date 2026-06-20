import { norm } from "../utils/dataFilters";
import { WEB_MERCATOR_RADIUS } from "../config/constants/geo";
import type { CrimeData } from "./fetch";

/**
 * Unified feature type for all crime data throughout the app.
 * Includes both NIBRS and homicide/shooting incident properties.
 */
export interface CrimeFeature {
  attributes: {
    CrimeDateTime?: string | number | null;
    Date_?: string | number | null;
    CrimeCode?: string;
    CRIME_CODE?: string;
    Description?: string;
    New_District?: string | null;
    DISTRICT_1?: string | null;
    [key: string]: any;
  };
  geometry?: {
    x?: number;
    y?: number;
  };
}

export function buildCrimeDataFromFeatures(features: CrimeFeature[]): CrimeData {
  const incidents: [number, number, number][] = [];
  const districtsSet = new Set<string>();
  const codesMap = new Map<string, string>();

  for (const f of features) {
    const a = f.attributes ?? {};

    // Districts
    const district = norm((a.New_District || a.DISTRICT_1) ?? "");
    if (district && district !== "OUT OF JURISDICTION") {
      districtsSet.add(district);
    }

    // Codes
    const code = a.CrimeCode ?? a.CRIME_CODE;
    const desc = norm(a.Description) || "UNKNOWN";
    if (code && !codesMap.has(code)) {
      codesMap.set(code, desc);
    }

    // Geometries
    const geo = f.geometry;
    if (geo?.x != null && geo?.y != null) {
      let lat: number, lng: number;

      if (Math.abs(geo.x) > 180) {
        lng = (geo.x / WEB_MERCATOR_RADIUS) * 180;
        lat =
          (Math.atan(Math.exp(((geo.y / WEB_MERCATOR_RADIUS) * 180 * Math.PI) / 180)) *
            360) /
            Math.PI -
          90;
      } else {
        lng = geo.x;
        lat = geo.y;
      }

      if (isFinite(lat) && isFinite(lng)) {
        incidents.push([lat, lng, 1]);
      }
    }
  }

  return {
    incidents,
    features,
    districts: Array.from(districtsSet).sort(),
    codes: Array.from(codesMap.entries())
      .map(([code, description]) => ({ code, description }))
      .sort((a, b) => a.code.localeCompare(b.code)),
  };
}
