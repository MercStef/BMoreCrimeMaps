/**
 * API configuration and data fetching constants.
 * Used for ArcGIS queries and input validation.
 */

/** Number of months of historical crime data to fetch */
export const DATA_HISTORY_MONTHS = 12;

/** ArcGIS API pagination page size (max records per request) */
export const ARCGIS_PAGE_SIZE = 1000;

/** Default maximum length for input validation (characters) */
export const MAX_INPUT_LENGTH_DEFAULT = 100;

/** Extended maximum length for multi-value inputs like crime codes (characters) */
export const MAX_INPUT_LENGTH_EXTENDED = 500;

/** List of valid characters for input validation regex */
export const VALID_INPUT_CHARS = /^[a-zA-Z0-9\s\-_,]+$/;

/** Base URL for ArcGIS NIBRS crime data feature service */
export const ARCGIS_NIBRS_BASE = "https://services1.arcgis.com/UWYHeuuJISiGmgXx/arcgis/rest/services/NIBRS_GroupA_Crime_Data/FeatureServer/0/query";

/** Base URL for ArcGIS homicides and shootings feature service */
export const ARCGIS_HOMICIDES_BASE = "https://services1.arcgis.com/UWYHeuuJISiGmgXx/arcgis/rest/services/Homicides_Shootings_YTD/FeatureServer/0/query";

/** Local backup file path for crime data */
export const LOCAL_BACKUP_PATH = "/data/crime-backup.json";
