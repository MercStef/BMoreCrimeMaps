/**
 * Choropleth layer rendering and styling constants.
 * Controls neighborhood polygon coloring and interaction.
 */

/** Number of color bins for choropleth choropleth scale */
export const CHOROPLETH_COLOR_BINS = 7;

/** Fill opacity for neighborhoods with incident data */
export const CHOROPLETH_ACTIVE_OPACITY = 0.55;

/** Fill opacity for neighborhoods with no incidents */
export const CHOROPLETH_EMPTY_OPACITY = 0.1;

/** Color for neighborhoods with no incidents */
export const CHOROPLETH_EMPTY_COLOR = "#111";

/** Border color for selected neighborhood */
export const CHOROPLETH_SELECTED_COLOR = "#fff";

/** Border stroke weight for selected neighborhood (pixels) */
export const CHOROPLETH_SELECTED_WEIGHT = 3;

/** Default border stroke weight for neighborhoods (pixels) */
export const CHOROPLETH_DEFAULT_WEIGHT = 1;

/** Border line opacity for all neighborhoods */
export const CHOROPLETH_BORDER_OPACITY = 0.9;

/** HTML element ID for neighborhood drill panel */
export const NEIGHBORHOOD_DRILL_ID = "neighborhood-drill";
