/**
 * Geographic and coordinate transformation constants.
 * Used for map initialization and Web Mercator projections.
 */

/** Baltimore city center coordinates [latitude, longitude] */
export const BALTIMORE_CENTER = [39.29, -76.61] as const;

/** Default map zoom level on application load */
export const DEFAULT_MAP_ZOOM = 12;

/** Web Mercator projection constant (Earth's circumference at equator / 2π) */
export const WEB_MERCATOR_RADIUS = 20037508.34;

/** Geometry simplification tolerance in degrees (for neighborhood boundaries) */
export const GEOMETRY_SIMPLIFY_TOLERANCE = 0.0003;

/** Minimum neighborhood area floor in square kilometers */
export const MIN_NEIGHBORHOOD_AREA_SQKM = 0.001;

/** Zoom level threshold for showing circle markers vs heatmap */
export const CIRCLE_LAYER_MIN_ZOOM = 13;

/** Zoom level threshold for transitioning between heat and circle display */
export const HEAT_CIRCLE_TRANSITION_ZOOM = 14;
