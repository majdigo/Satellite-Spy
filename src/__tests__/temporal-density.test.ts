import { buildDensityGrid, type TimeWindow } from "@/lib/api/temporal-density";
import type { GDELTEvent, ConflictEvent, NaturalDisaster } from "@/types";

const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000).toISOString();

const makeGDELT = (lat: number, lon: number, hoursBack: number, goldstein = -3): GDELTEvent => ({
  globalEventId: `g-${lat}-${lon}-${hoursBack}`,
  dateAdded: hoursAgo(hoursBack),
  sourceUrl: "", title: "Event", tone: -3,
  goldsteinScale: goldstein, numMentions: 10, numSources: 5, numArticles: 3, avgTone: -3,
  actor1: { name: "A", countryCode: "AA", type: "GOV" },
  actor2: { name: "B", countryCode: "BB", type: "GOV" },
  eventCode: "190", eventDescription: "Test", quadClass: "material_conflict",
  latitude: lat, longitude: lon, country: "TST", location: "Test",
});

const makeConflict = (lat: number, lon: number, hoursBack: number, severity: "low"|"medium"|"high"|"critical" = "medium"): ConflictEvent => ({
  id: `c-${lat}-${lon}-${hoursBack}`,
  date: hoursAgo(hoursBack),
  eventType: "battle", subEventType: "Armed clash",
  actors: ["A", "B"], location: "Test",
  latitude: lat, longitude: lon, country: "TST", region: "Test",
  fatalities: 2, notes: "", source: "ACLED", severity,
});

const makeDisaster = (lat: number, lon: number, hoursBack: number): NaturalDisaster => ({
  id: `d-${lat}-${lon}-${hoursBack}`,
  type: "earthquake", title: "Quake", description: "",
  date: hoursAgo(hoursBack),
  latitude: lat, longitude: lon, country: "TST", severity: "high",
  status: "ongoing", source: "USGS",
});

describe("Temporal Density Engine (S1-06)", () => {
  test("builds grid from mixed event types", () => {
    const grid = buildDensityGrid({
      gdeltEvents: [makeGDELT(35, 45, 2)],
      conflicts: [makeConflict(35, 45, 3)],
      disasters: [makeDisaster(35, 45, 4)],
    }, "24h", 2);

    expect(grid.cells.length).toBe(1); // All at same location, same cell
    expect(grid.cells[0].count).toBe(3);
    expect(grid.cells[0].gdeltCount).toBe(1);
    expect(grid.cells[0].conflictCount).toBe(1);
    expect(grid.cells[0].disasterCount).toBe(1);
    expect(grid.totalEvents).toBe(3);
  });

  test("separate cells for distant events", () => {
    const grid = buildDensityGrid({
      gdeltEvents: [makeGDELT(10, 20, 2), makeGDELT(50, 80, 3)],
      conflicts: [],
      disasters: [],
    }, "24h", 2);

    expect(grid.cells.length).toBe(2);
  });

  test("filters events outside time window", () => {
    const grid = buildDensityGrid({
      gdeltEvents: [
        makeGDELT(35, 45, 2),   // 2h ago → within 24h
        makeGDELT(35, 45, 48),  // 48h ago → outside 24h
      ],
      conflicts: [],
      disasters: [],
    }, "24h", 2);

    expect(grid.totalEvents).toBe(1);
  });

  test("7d window includes older events", () => {
    const grid = buildDensityGrid({
      gdeltEvents: [
        makeGDELT(35, 45, 2),     // 2h ago
        makeGDELT(35, 45, 48),    // 2 days ago
        makeGDELT(35, 45, 120),   // 5 days ago
        makeGDELT(35, 45, 200),   // ~8 days ago → outside 7d
      ],
      conflicts: [],
      disasters: [],
    }, "7d", 2);

    expect(grid.totalEvents).toBe(3);
  });

  test("intensity normalized to max cell", () => {
    const grid = buildDensityGrid({
      gdeltEvents: [
        makeGDELT(35, 45, 1),
        makeGDELT(35, 45, 2),
        makeGDELT(35, 45, 3),  // 3 events at same cell
        makeGDELT(10, 20, 1),  // 1 event at different cell
      ],
      conflicts: [],
      disasters: [],
    }, "24h", 2);

    const hotCell = grid.cells.find((c) => c.count === 3);
    const coldCell = grid.cells.find((c) => c.count === 1);
    expect(hotCell!.intensity).toBe(1.0);
    expect(coldCell!.intensity).toBeCloseTo(1/3, 2);
  });

  test("max severity tracked per cell", () => {
    const grid = buildDensityGrid({
      gdeltEvents: [makeGDELT(35, 45, 1, -9)], // Goldstein -9 → critical
      conflicts: [makeConflict(35, 45, 2, "medium")],
      disasters: [],
    }, "24h", 2);

    expect(grid.cells[0].maxSeverity).toBe("critical");
  });

  test("empty input returns empty grid", () => {
    const grid = buildDensityGrid({
      gdeltEvents: [],
      conflicts: [],
      disasters: [],
    }, "24h");

    expect(grid.cells).toHaveLength(0);
    expect(grid.totalEvents).toBe(0);
    expect(grid.maxCount).toBe(1); // Clamped to 1 to avoid division by zero
  });

  test("grid resolution controls cell size", () => {
    // Two events 3° apart: should be in same cell at 5° resolution, different at 2°
    const data = {
      gdeltEvents: [makeGDELT(35, 45, 1), makeGDELT(37, 47, 2)],
      conflicts: [],
      disasters: [],
    };

    const coarse = buildDensityGrid(data, "24h", 5);
    const fine = buildDensityGrid(data, "24h", 2);

    expect(coarse.cells.length).toBe(1); // Same cell at 5°
    expect(fine.cells.length).toBe(2);   // Different cells at 2°
  });
});
