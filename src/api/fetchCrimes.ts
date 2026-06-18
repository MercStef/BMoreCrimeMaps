import { buildCrimeDataFromFeatures, type CrimeFeature } from "./buildCrimeData";
// The app fetches two ArcGIS feature layers: one for general NIBRS crime data,
// and a second layer for homicide/shooting incidents.
const BASE =
  "https://services1.arcgis.com/UWYHeuuJISiGmgXx/arcgis/rest/services/NIBRS_GroupA_Crime_Data/FeatureServer/0/query";
const HOMICIDES_BASE =
  "https://services1.arcgis.com/UWYHeuuJISiGmgXx/arcgis/rest/services/Homicides_Shootings_YTD/FeatureServer/0/query";

function getPastDateString(monthsAgo = 12): string {
  const date = new Date();
  date.setMonth(date.getMonth() - monthsAgo);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} 00:00:00`;
}

// Build a date filter string for the ArcGIS query.

async function queryArcGISUrl(base: string, params: Record<string, string>) {
  const res = await fetch(`${base}?${new URLSearchParams(params)}`);
  if (!res.ok) throw new Error(`ArcGIS error: ${res.status}`);
  const data = await res.json();
  if (!data.features) throw new Error(`No features: ${JSON.stringify(data)}`);
  return data.features;
}

async function loadLocalBackup(): Promise<any[]> {
  try {
    const res = await fetch("/data/crime-backup.json");
    if (!res.ok) throw new Error(`Backup fetch failed: ${res.status}`);
    const backup = await res.json();
    return backup.features || [];
  } catch (err) {
    console.warn("Local crime backup load failed:", err);
    return [];
  }
}

// Fetch all pages from ArcGIS by paging through the results.

export interface CrimeData {
  incidents: [number, number, number][];
  features: CrimeFeature[];
  districts: string[];
  codes: { code: string; description: string }[];
}

/**
 * Input validation helper to prevent SQL injection and malformed queries.
 */
function validateAndEscapeInput(input: string | undefined, maxLength: number = 100): string {
  if (!input) return "";
  
  // Trim and limit length
  let sanitized = input.trim().substring(0, maxLength);
  
  // Only allow alphanumeric, spaces, hyphens, underscores
  if (!/^[a-zA-Z0-9\s\-_,]+$/.test(sanitized)) {
    console.warn(`Input validation warning: input contains invalid characters, filtering them: ${input}`);
    sanitized = sanitized.replace(/[^a-zA-Z0-9\s\-_,]/g, "");
  }
  
  return sanitized;
}

async function queryAllPages(base: string, where: string): Promise<CrimeFeature[]> {
  const PAGE_SIZE = 1000;
  let offset = 0;
  let allFeatures: any[] = [];

  while (true) {
    const features = await queryArcGISUrl(base, {
      where,
      outFields: "*",
      resultRecordCount: String(PAGE_SIZE),
      resultOffset: String(offset),
      f: "json",
    });
    allFeatures = allFeatures.concat(features);
    if (features.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return allFeatures;
}

// Pull both datasets together and normalize the fields so the rest of the app can treat them uniformly.

export async function fetchAllCrimeData(
  crimeCode?: string,
  district?: string,
): Promise<CrimeData> {
  const dateFilter = getPastDateString(12);

  const nibrsConditions = [`CrimeDateTime >= DATE '${dateFilter}'`];
  const homicideConditions = [`Date_ >= DATE '${dateFilter}'`];

  // ------------------------
  // INPUT VALIDATION & FILTERS
  // ------------------------
  if (crimeCode) {
    const validatedInput = validateAndEscapeInput(crimeCode, 500);
    const codeValues = validatedInput
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    if (codeValues.length === 1) {
      const escaped = codeValues[0].replace(/'/g, "''");
      nibrsConditions.push(`CrimeCode='${escaped}'`);
      homicideConditions.push(`CRIME_CODE='${escaped}'`);
    } else if (codeValues.length > 1) {
      const escapedList = codeValues
        .map((c) => `'${c.replace(/'/g, "''")}'`)
        .join(",");

      nibrsConditions.push(`CrimeCode IN (${escapedList})`);
      homicideConditions.push(`CRIME_CODE IN (${escapedList})`);
    }
  }

  if (district) {
    const validatedDistrict = validateAndEscapeInput(district, 50);
    if (validatedDistrict) {
      const safeDistrict = validatedDistrict.trim().toUpperCase();
      nibrsConditions.push(`New_District = '${safeDistrict}'`);
      homicideConditions.push(`DISTRICT_1 = '${safeDistrict}'`);
    }
  }

  // ======================================================
  // 1. TRY BACKUP FIRST
  // ======================================================
  try {
    const backup = await loadLocalBackup();

    if (backup && backup.length > 0) {
      return buildCrimeDataFromFeatures(backup);
    }

    throw new Error("Empty backup");
  } catch (backupErr) {
    console.warn("Backup failed, falling back to API:", backupErr);
  }

  // ======================================================
  // 2. FALLBACK TO LIVE API
  // ======================================================
  try {
    const [nibrsFeatures, homicideFeatures] = await Promise.all([
      queryAllPages(BASE, nibrsConditions.join(" AND ")),
      queryAllPages(HOMICIDES_BASE, homicideConditions.join(" AND ")).catch(
        () => [],
      ),
    ]);

    const combined = [
      ...nibrsFeatures.map((f) => normalizeFeature(f, "nibrs")),
      ...homicideFeatures.map((f) => normalizeFeature(f, "homicide")),
    ];

    return buildCrimeDataFromFeatures(combined);
  } catch (apiErr) {
    console.error("API also failed:", apiErr);
    // Instead of throwing, return empty data structure with user-visible warning
    console.warn("⚠️ CRITICAL: Failed to load crime data from both backup and API. App may display incomplete data.");
    return {
      incidents: [],
      features: [],
      districts: [],
      codes: [],
    };
  }
}

function normalizeFeature(f: CrimeFeature, source: "nibrs" | "homicide"): CrimeFeature {
  const a = f.attributes ?? {};

  // ---- District normalization (CRITICAL FIX) ----
  let district = a.New_District ?? a.DISTRICT_1 ?? null;

  if (typeof district === "string") {
    district = district.trim().toUpperCase();
  } else {
    district = null;
  }

  if (district === "UNKNOWN" || district === "NULL" || district === "") {
    district = null;
  }

  // ---- Date normalization (CRITICAL FIX) ----
  let date = a.CrimeDateTime ?? a.Date_ ?? null;

  // ArcGIS sometimes returns strings, sometimes epoch numbers
  if (typeof date === "string") {
    const parsed = Date.parse(date);
    date = isNaN(parsed) ? null : parsed;
  }

  if (typeof date === "number") {
    // assume epoch ms already
  } else {
    date = null;
  }

  // ---- Description normalization ----
  let description = a.Description ?? null;
  if (!description || description.trim() === "") {
    description = source === "homicide" ? "HOMICIDE / SHOOTING" : "UNKNOWN";
  }

  // ---- Return cleaned feature ----
  return {
    ...f,
    attributes: {
      ...a,
      New_District: district,
      CrimeDateTime: date,
      Description: description,
    },
  };
}
