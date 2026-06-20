// src/services/FilterService.ts
import { filterFeaturesByTime, norm } from "../utils/dataFilters";
import type { CrimeFeature } from "../data/transform";
import AppState from "./AppState";
import type { MapManager } from "../components/MapManager";

/**
 * Central place for all data‑filtering logic that used to live in `processUI`.
 * It receives the shared `AppState`, performs the selections, and returns the
 * structures the UI needs (filtered lists, stats, etc.).
 */
export default class FilterService {
  private state: AppState;
  private mapManager?: MapManager | null;

  constructor(state: AppState, mapManager?: MapManager | null) {
    this.state = state;
    this.mapManager = mapManager ?? null;
  }

  /** Returns an object with everything the UI needs for a render pass */
  public compute(): {
    timeFiltered: CrimeFeature[];
    districtFiltered: CrimeFeature[];
    valid: CrimeFeature[];
    fullyFiltered: CrimeFeature[];
    inView: CrimeFeature[];
    uniqueDescriptions: string[];
    incidentCount: number;
    typeCount: number;
  } {
    const {
      rawFeatures,
      minTime,
      maxTime,
      selectedDistrict,
      selectedCrimeCode,
    } = this.state;

    // 1️⃣ Time filter
    const timeFiltered = filterFeaturesByTime(rawFeatures, minTime, maxTime);

    // 2️⃣ District filter (if any)
    const districtFiltered = selectedDistrict
      ? timeFiltered.filter(
          (f) => norm(f.attributes?.New_District) === selectedDistrict,
        )
      : timeFiltered;

    // 3️⃣ Remove features without valid geometry
    const valid = districtFiltered.filter(
      (f) => f?.geometry?.x != null && f?.geometry?.y != null,
    );

    // 4️⃣ Crime‑code filter (multi‑code support)
    const activeCodes = selectedCrimeCode
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    const fullyFiltered =
      activeCodes.length > 0
        ? valid.filter((f) =>
            activeCodes.includes(String(f.attributes?.CrimeCode).trim()),
          )
        : valid;

    // 5️⃣ Map‑viewport filter
    const bounds = this.mapManager?.map?.getBounds?.();
    const inView = bounds
      ? fullyFiltered.filter((f) =>
          bounds.contains([f.geometry.y, f.geometry.x]),
        )
      : [];

    // 6️⃣ Statistics
    const incidentCount = inView.length;
    const typeCount = new Set(inView.map((f) => f.attributes?.Description))
      .size;
    const uniqueDescriptions = Array.from(
      new Set(
        fullyFiltered.map((f) => f.attributes?.Description).filter(Boolean),
      ),
    );

    return {
      timeFiltered,
      districtFiltered,
      valid,
      fullyFiltered,
      inView,
      uniqueDescriptions,
      incidentCount,
      typeCount,
    };
  }
}
