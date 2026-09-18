import type { GeoPoint } from '../core';

// XYZ z18: ~109m at 45°, ~94m at 52°, ~77m at 60° (z17 is twice as wide).
export const SECTOR_ZOOM = 18;
const N = 2 ** SECTOR_ZOOM;
const LIMIT = 85.0511287798066;
export function locationToSector({ latitude, longitude }: GeoPoint): string {
  if (!Number.isFinite(latitude) || Math.abs(latitude) > 90 || !Number.isFinite(longitude) || Math.abs(longitude) > 180) throw new Error('Invalid location');
  const lat = Math.max(-LIMIT, Math.min(LIMIT, latitude)) * Math.PI / 180;
  const x = Math.floor(((longitude + 180) % 360) / 360 * N);
  const y = Math.max(0, Math.min(N - 1, Math.floor((1 - Math.asinh(Math.tan(lat)) / Math.PI) / 2 * N)));
  return `${SECTOR_ZOOM}/${x}/${y}`;
}
function indices(id: string) {
  if (!/^18\/\d+\/\d+$/.test(id)) throw new Error('Invalid sector');
  const [, x, y] = id.split('/').map(Number);
  if (x >= N || y >= N || id !== `${SECTOR_ZOOM}/${x}/${y}`) throw new Error('Invalid sector');
  return { x, y };
}
export function sectorToBounds(id: string): [number, number, number, number] {
  const { x, y } = indices(id);
  const lat = (row: number) => Math.atan(Math.sinh(Math.PI * (1 - 2 * row / N))) * 180 / Math.PI;
  return [x / N * 360 - 180, lat(y + 1), (x + 1) / N * 360 - 180, lat(y)];
}
export function getNearbySectors(id: string, radius = 6): string[] {
  const { x, y } = indices(id);
  if (!Number.isInteger(radius) || radius < 0 || radius > 12) throw new Error('Invalid radius');
  const result: string[] = [];
  for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
    if (y + dy >= 0 && y + dy < N) result.push(`${SECTOR_ZOOM}/${(x + dx + N) % N}/${y + dy}`);
  }
  return result;
}
export function sectorRing(id: string): number[][] {
  const [w, s, e, n] = sectorToBounds(id);
  return [[w, s], [e, s], [e, n], [w, n], [w, s]];
}
