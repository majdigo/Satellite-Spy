/**
 * Tests for AnomalyHeatmap computation logic.
 * S-Agent T4 — Agentic Cognitive UI Sprint
 */

import { computeHeatmap, heatmapColor, heatmapOpacity } from "@/lib/anomaly-heatmap";
import type { GDELTEvent, ConflictEvent } from "@/types";

const mockGDELT: GDELTEvent[] = [
  {
    globalEventId: "g1",
    dateAdded: "2026-03-24",
    sourceUrl: "https://example.com",
    title: "Conflict in region A",
    tone: -5,
    goldsteinScale: -8,
    numMentions: 20,
    numSources: 10,
    numArticles: 5,
    avgTone: -5,
    actor1: { name: "Gov A", countryCode: "AA", type: "GOV" },
    actor2: { name: "Mil B", countryCode: "BB", type: "MIL" },
    eventCode: "190",
    eventDescription: "Use of force",
    quadClass: "material_conflict",
    latitude: 33.0,
    longitude: 44.0,
    country: "IRQ",
    location: "Baghdad",
  },
  {
    globalEventId: "g2",
    dateAdded: "2026-03-24",
    sourceUrl: "https://example.com",
    title: "Cooperation event",
    tone: 3,
    goldsteinScale: 3.5,
    numMentions: 5,
    numSources: 3,
    numArticles: 2,
    avgTone: 3,
    actor1: { name: "Org A", countryCode: "CC", type: "NGO" },
    actor2: { name: "Org B", countryCode: "DD", type: "NGO" },
    eventCode: "050",
    eventDescription: "Diplomatic cooperation",
    quadClass: "verbal_cooperation",
    latitude: 33.0,
    longitude: 44.0, // same cell as g1
    country: "IRQ",
    location: "Baghdad",
  },
  {
    globalEventId: "g3",
    dateAdded: "2026-03-24",
    sourceUrl: "https://example.com",
    title: "Distant event",
    tone: -2,
    goldsteinScale: -2,
    numMentions: 3,
    numSources: 2,
    numArticles: 1,
    avgTone: -2,
    actor1: { name: "X", countryCode: "XX", type: "GOV" },
    actor2: { name: "Y", countryCode: "YY", type: "GOV" },
    eventCode: "100",
    eventDescription: "Demand",
    quadClass: "verbal_conflict",
    latitude: 10.0,
    longitude: 10.0, // different cell
    country: "NGA",
    location: "Lagos",
  },
];

const mockConflicts: ConflictEvent[] = [
  {
    id: "c1",
    date: "2026-03-24",
    eventType: "battle",
    subEventType: "Armed clash",
    actors: ["Group A", "Group B"],
    location: "Mosul",
    latitude: 36.34,
    longitude: 43.13,
    country: "Iraq",
    region: "Middle East",
    fatalities: 5,
    notes: "Armed clash",
    source: "ACLED",
    severity: "high",
  },
];

describe("AnomalyHeatmap", () => {
  describe("computeHeatmap", () => {
    test("aggregates events into grid cells", () => {
      const cells = computeHeatmap(mockGDELT, mockConflicts);
      expect(cells.length).toBeGreaterThan(0);
    });

    test("co-located events share the same cell", () => {
      // g1 and g2 are at same location
      const cells = computeHeatmap(mockGDELT, []);
      const baghdadCells = cells.filter(
        (c) => Math.abs(c.lat - 33) < 2 && Math.abs(c.lon - 44) < 2
      );
      expect(baghdadCells.length).toBe(1);
      expect(baghdadCells[0].eventCount).toBe(2);
    });

    test("distant events go to separate cells", () => {
      const cells = computeHeatmap(mockGDELT, []);
      expect(cells.length).toBeGreaterThanOrEqual(2);
    });

    test("intensity is normalized 0-1", () => {
      const cells = computeHeatmap(mockGDELT, mockConflicts);
      for (const cell of cells) {
        expect(cell.intensity).toBeGreaterThanOrEqual(0);
        expect(cell.intensity).toBeLessThanOrEqual(1);
      }
    });

    test("max intensity cell has intensity 1.0", () => {
      const cells = computeHeatmap(mockGDELT, mockConflicts);
      const maxIntensity = Math.max(...cells.map((c) => c.intensity));
      expect(maxIntensity).toBe(1);
    });

    test("computes average goldstein per cell", () => {
      const cells = computeHeatmap(mockGDELT, []);
      const baghdadCell = cells.find(
        (c) => Math.abs(c.lat - 33) < 2 && Math.abs(c.lon - 44) < 2
      );
      expect(baghdadCell).toBeDefined();
      // avg of -8 and 3.5 = -2.25
      expect(baghdadCell!.avgGoldstein).toBeCloseTo(-2.25, 1);
    });

    test("tracks max severity per cell", () => {
      const cells = computeHeatmap(mockGDELT, []);
      const baghdadCell = cells.find(
        (c) => Math.abs(c.lat - 33) < 2 && Math.abs(c.lon - 44) < 2
      );
      // g1 has goldstein -8 → critical severity
      expect(baghdadCell!.maxSeverity).toBe("critical");
    });

    test("handles empty inputs", () => {
      const cells = computeHeatmap([], []);
      expect(cells).toEqual([]);
    });

    test("handles ACLED conflicts alone", () => {
      const cells = computeHeatmap([], mockConflicts);
      expect(cells.length).toBe(1);
      expect(cells[0].eventCount).toBe(1);
    });
  });

  describe("heatmapColor", () => {
    test("low intensity returns green", () => {
      expect(heatmapColor(0.1)).toBe("#2D6A4F");
    });

    test("medium intensity returns orange", () => {
      expect(heatmapColor(0.5)).toBe("#E76F51");
    });

    test("high intensity returns red", () => {
      expect(heatmapColor(0.8)).toBe("#E63946");
    });

    test("zero intensity returns green", () => {
      expect(heatmapColor(0)).toBe("#2D6A4F");
    });

    test("max intensity returns red", () => {
      expect(heatmapColor(1.0)).toBe("#E63946");
    });
  });

  describe("heatmapOpacity", () => {
    test("zero intensity gives minimum opacity", () => {
      expect(heatmapOpacity(0)).toBe(0.15);
    });

    test("max intensity gives maximum opacity", () => {
      expect(heatmapOpacity(1)).toBeCloseTo(0.7);
    });

    test("mid intensity gives proportional opacity", () => {
      const op = heatmapOpacity(0.5);
      expect(op).toBeGreaterThan(0.15);
      expect(op).toBeLessThan(0.7);
    });
  });
});
