/**
 * UI and styling constants for colors, fonts, and chart styling.
 */

/** Default color for "other" category in charts */
export const OTHER_CATEGORY_COLOR = "#888888";

/** Color for chart axis ticks */
export const CHART_TICK_COLOR = "#ddd";

/** Color for chart grid lines */
export const CHART_GRID_COLOR = "rgba(255,255,255,0.05)";

/** Color saturation for crime categories (≤8 categories) */
export const COLOR_SATURATION_MANY = 0.78;

/** Color saturation for crime categories (>8 categories) */
export const COLOR_SATURATION_FEW = 0.68;

/** Color lightness for crime categories (≤8 categories) */
export const COLOR_LIGHTNESS_MANY = 0.52;

/** Color lightness for crime categories (>8 categories) */
export const COLOR_LIGHTNESS_FEW = 0.6;

/** Rim darkening factor for circle markers */
export const RIM_DARKEN_AMOUNT = 1.5;

/** Scale darkening intensity for color operations */
export const SCALE_DARKEN_INTENSITY = 2;

/** Scale brightening intensity for color operations */
export const SCALE_BRIGHTEN_INTENSITY = 1.2;

/** CSS variable name for accent color theme */
export const ACCENT_COLOR_CSS_VAR = "--accent-color";

/** Default accent color when theme manager initializes */
export const DEFAULT_ACCENT_COLOR = "#3498db";
