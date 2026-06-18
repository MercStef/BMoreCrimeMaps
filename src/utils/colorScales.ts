import chroma from "chroma-js";

const rimCache = new Map<string, string>();
const gradientCache = new Map<string, Record<number, string>>();
const scaleCache = new Map<string, chroma.Scale>();
export type ColorMap = Record<string, string>;

export function getRimColor(baseColor: string, darken = 1.5): string {
  const key = `${baseColor}::${darken}`;
  if (!rimCache.has(key)) {
    rimCache.set(key, chroma(baseColor).darken(darken).hex());
  }
  return rimCache.get(key)!;
}

export function buildScale(color: string): chroma.Scale {
  const cached = scaleCache.get(color);
  if (cached) return cached;

  const base = chroma(color);
  const scale = chroma.scale([base.darken(2), base, base.brighten(1.2)]);

  scaleCache.set(color, scale);
  return scale;
}

export function getHeatGradient(accentColor: string): Record<number, string> {
  if (gradientCache.has(accentColor)) return gradientCache.get(accentColor)!;

  const base = chroma(accentColor);
  const scale = chroma
    .scale([
      base.darken(2.5).saturate(2),
      base.darken(1),
      base,
      base.brighten(1),
      "#ffcc00",
      "#ff3300",
    ])
    .mode("lch");

  const gradient: Record<number, string> = {
    0.0: scale(0.0).alpha(0).css(),
    0.2: scale(0.2).alpha(0.25).css(),
    0.4: scale(0.4).alpha(0.45).css(),
    0.6: scale(0.6).alpha(0.65).css(),
    0.8: scale(0.8).alpha(0.85).css(),
    1.0: scale(1.0).alpha(1).css(),
  };

  gradientCache.set(accentColor, gradient);
  return gradient;
}

export function buildCategoryColorMap(
  descriptions: string[],
  accentColor: string,
): Record<string, string> {
  const uniqueTypes = [...new Set(descriptions)].sort();
  const count = uniqueTypes.length;
  const colorMap: Record<string, string> = {};
  if (count === 0) return colorMap;

  const baseHue = (() => {
    const h = chroma(accentColor).hsl()[0];
    return Number.isFinite(h) ? h : 180;
  })();

  const saturation = count <= 8 ? 0.78 : 0.68;
  const lightness = count <= 8 ? 0.52 : 0.6;
  const hueStep = 360 / count;

  uniqueTypes.forEach((type, i) => {
    colorMap[type] = chroma
      .hsl((baseHue + i * hueStep) % 360, saturation, lightness)
      .hex();
  });

  return colorMap;
}
