/**
 * Time and date constants used throughout the application.
 */

/** One day in milliseconds */
export const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** One month in milliseconds (approximate: 30 days) */
export const ONE_MONTH_MS = 30 * ONE_DAY_MS;

/** Minimum data lookback period in milliseconds (30 days) */
export const MIN_DATA_LOOKBACK_MS = 30 * ONE_DAY_MS;

/** Time slider step size in milliseconds (1 day) */
export const TIME_SLIDER_STEP_MS = ONE_DAY_MS;
