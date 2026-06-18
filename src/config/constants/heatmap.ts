/**
 * Heatmap layer rendering and behavior constants.
 */

/** Heatmap blur radius for smooth gradient visualization */
export const HEATMAP_BLUR_RADIUS = 20;

/** Maximum heat intensity level (higher = more concentrated color) */
export const HEATMAP_MAX_INTENSITY = 3;

/** Minimum heatmap opacity baseline when zoomed out */
export const HEATMAP_MIN_OPACITY = 0.1;

/** Heatmap opacity when user zooms in (layers behind circles) */
export const HEATMAP_ZOOMED_OPACITY = 0.3;

/** Maximum number of crime categories to display in charts */
export const MAX_CRIME_CATEGORIES = 8;

/** Zoom threshold at which heatmap is shown vs hidden */
export const HEATMAP_SHOW_ZOOM = 12;

/** Logarithm base for heatmap intensity calculation */
export const HEAT_LOG_DENOMINATOR = 10;
