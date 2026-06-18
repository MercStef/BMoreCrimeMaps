/**
 * Circle marker layer rendering and styling constants.
 * Applied when zoomed in to show individual crime incidents.
 */

/** Minimum zoom level to display circle markers */
export const CIRCLE_MIN_ZOOM = 13;

/** Circle marker radius in pixels */
export const CIRCLE_RADIUS = 5.5;

/** Circle marker fill opacity (0-1) */
export const CIRCLE_FILL_OPACITY = 0.8;

/** Circle marker border/stroke weight in pixels */
export const CIRCLE_BORDER_WEIGHT = 1.2;

/** Rim (border) color darkening factor for circles */
export const CIRCLE_RIM_DARKEN = 0.5;

/** Z-index for circle marker pane (rendered above choropleth) */
export const CIRCLE_PANE_ZINDEX = 450;

/** Z-index for choropleth pane (rendered below circles) */
export const CHOROPLETH_PANE_ZINDEX = 400;

/** Canvas renderer padding for performance optimization */
export const CANVAS_RENDERER_PADDING = 0.5;

/** Canvas renderer tolerance for snap distance (pixels) */
export const CANVAS_RENDERER_TOLERANCE = 10;
