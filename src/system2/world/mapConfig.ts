// DEVELOPMENT ONLY: official MapLibre Demo Tiles for Android QA.
// Not a production map source. Replace before production release; no API key required.
export const WORLD_MAP_STYLE_URL: string = 'https://demotiles.maplibre.org/style.json';
export function configuredMapStyle(): string | null {
  return /^https:\/\/[^\s]+$/.test(WORLD_MAP_STYLE_URL) ? WORLD_MAP_STYLE_URL : null;
}
