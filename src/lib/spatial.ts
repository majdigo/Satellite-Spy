/**
 * Spatial Utilities — Single source of truth for geographic calculations.
 *
 * Consolidates haversine distance, proximity checks, coordinate validation,
 * and bounding box operations used across the codebase.
 *
 * S-Agent — Product quality refactoring (deduplication)
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Haversine distance between two lat/lon points in kilometers.
 */
export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const toRad = (deg: number) => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Check if two points are within a distance threshold.
 */
export function isWithinDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
  thresholdKm: number,
): boolean {
  return haversineDistance(lat1, lon1, lat2, lon2) < thresholdKm;
}

/**
 * Check if a point is within a bounding box.
 */
export function isInBounds(
  lat: number, lon: number,
  bounds: { north: number; south: number; east: number; west: number },
): boolean {
  return lat >= bounds.south && lat <= bounds.north &&
         lon >= bounds.west && lon <= bounds.east;
}

/**
 * Validate lat/lon coordinates are within valid ranges.
 */
export function isValidCoordinate(lat: number, lon: number): boolean {
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

/**
 * Simple degree-based proximity check (faster than haversine for rough filtering).
 * 1 degree ≈ 111km at equator, less at higher latitudes.
 */
export function isWithinDegrees(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
  degrees: number,
): boolean {
  return Math.abs(lat1 - lat2) < degrees && Math.abs(lon1 - lon2) < degrees;
}

/**
 * Compute a grid cell key for spatial aggregation.
 * Used by heatmap and density computations.
 */
export function gridCellKey(lat: number, lon: number, resolution: number): string {
  const cellLat = Math.floor((lat + 90) / resolution) * resolution - 90 + resolution / 2;
  const cellLon = Math.floor((lon + 180) / resolution) * resolution - 180 + resolution / 2;
  return `${cellLat},${cellLon}`;
}

/**
 * Parse a grid cell key back to coordinates.
 */
export function parseGridCellKey(key: string): { lat: number; lon: number } {
  const [lat, lon] = key.split(",").map(Number);
  return { lat, lon };
}
