/**
 * Tests for Spatial Utilities.
 * S-Agent — Product quality refactoring
 */

import {
  haversineDistance,
  isWithinDistance,
  isInBounds,
  isValidCoordinate,
  isWithinDegrees,
  gridCellKey,
  parseGridCellKey,
} from "../spatial";

describe("Spatial Utilities", () => {
  describe("haversineDistance", () => {
    test("same point = 0 km", () => {
      expect(haversineDistance(33.3, 44.4, 33.3, 44.4)).toBeCloseTo(0, 1);
    });

    test("Baghdad to Mosul ≈ 350km", () => {
      const dist = haversineDistance(33.3, 44.4, 36.3, 43.1);
      expect(dist).toBeGreaterThan(300);
      expect(dist).toBeLessThan(400);
    });

    test("Baghdad to London ≈ 4100km", () => {
      const dist = haversineDistance(33.3, 44.4, 51.5, -0.1);
      expect(dist).toBeGreaterThan(3800);
      expect(dist).toBeLessThan(4400);
    });

    test("poles to equator ≈ 10000km", () => {
      const dist = haversineDistance(90, 0, 0, 0);
      expect(dist).toBeGreaterThan(9500);
      expect(dist).toBeLessThan(10500);
    });
  });

  describe("isWithinDistance", () => {
    test("nearby points within threshold", () => {
      expect(isWithinDistance(33.3, 44.4, 33.4, 44.5, 50)).toBe(true);
    });

    test("distant points outside threshold", () => {
      expect(isWithinDistance(33.3, 44.4, 51.5, -0.1, 500)).toBe(false);
    });
  });

  describe("isInBounds", () => {
    const middleEast = { north: 42, south: 12, east: 63, west: 25 };

    test("Baghdad is in Middle East", () => {
      expect(isInBounds(33.3, 44.4, middleEast)).toBe(true);
    });

    test("London is NOT in Middle East", () => {
      expect(isInBounds(51.5, -0.1, middleEast)).toBe(false);
    });
  });

  describe("isValidCoordinate", () => {
    test("valid coordinates", () => {
      expect(isValidCoordinate(33.3, 44.4)).toBe(true);
      expect(isValidCoordinate(-90, -180)).toBe(true);
      expect(isValidCoordinate(90, 180)).toBe(true);
    });

    test("invalid coordinates", () => {
      expect(isValidCoordinate(91, 0)).toBe(false);
      expect(isValidCoordinate(0, 181)).toBe(false);
    });
  });

  describe("isWithinDegrees", () => {
    test("close points within threshold", () => {
      expect(isWithinDegrees(33.3, 44.4, 33.5, 44.6, 1)).toBe(true);
    });

    test("distant points outside threshold", () => {
      expect(isWithinDegrees(33.3, 44.4, 36.3, 43.1, 2)).toBe(false);
    });
  });

  describe("gridCellKey", () => {
    test("produces consistent keys", () => {
      const key1 = gridCellKey(33.3, 44.4, 2);
      const key2 = gridCellKey(33.8, 44.9, 2);
      expect(key1).toBe(key2); // same 2° cell
    });

    test("different cells for distant points", () => {
      const key1 = gridCellKey(33.3, 44.4, 2);
      const key2 = gridCellKey(36.3, 43.1, 2);
      expect(key1).not.toBe(key2);
    });

    test("parseGridCellKey roundtrips", () => {
      const key = gridCellKey(33.3, 44.4, 2);
      const { lat, lon } = parseGridCellKey(key);
      expect(lat).toBeCloseTo(33, 0);
      expect(lon).toBeCloseTo(45, 0);
    });
  });
});
