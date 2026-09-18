import type { FeatureCollection, Polygon } from 'geojson';
import { getNearbySectors, sectorToBounds } from './sectors';

export function buildFog(centerSector: string, discovered: ReadonlySet<string>): FeatureCollection<Polygon> {
  const rows = new Map<number, { south: number; north: number; holes: [number, number][] }>();
  for (const id of getNearbySectors(centerSector)) {
    const y = Number(id.split('/')[2]);
    const [west, south, east, north] = sectorToBounds(id);
    const row = rows.get(y) ?? { south, north, holes: [] };
    if (discovered.has(id)) row.holes.push([west, east]);
    rows.set(y, row);
  }
  const features: FeatureCollection<Polygon>['features'] = [];
  function rectangle(w: number, s: number, e: number, n: number) {
    if (e <= w || n <= s) return;
    features.push({ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[w, s], [e, s], [e, n], [w, n], [w, s]]] } });
  }
  let south = 90, north = -90;
  for (const row of rows.values()) {
    south = Math.min(south, row.south); north = Math.max(north, row.north);
    let west = -180;
    for (const [w, e] of row.holes.sort((a, b) => a[0] - b[0])) { rectangle(west, row.south, w, row.north); west = e; }
    rectangle(west, row.south, 180, row.north);
  }
  // Constant-cost cover outside the local window; never render all world sectors.
  rectangle(-180, -85.05112878, 180, south);
  rectangle(-180, north, 180, 85.05112878);
  return { type: 'FeatureCollection', features };
}
