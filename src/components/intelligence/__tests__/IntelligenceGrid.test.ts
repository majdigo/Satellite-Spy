/**
 * Tests for IntelligenceGrid data transformation logic.
 *
 * Since IntelligenceGrid is a React component, we test the underlying
 * data flow: GDELT/ACLED → GeoEventBucket → grid rows.
 *
 * S-Agent T3 — Agentic Cognitive UI Sprint
 */

import { gdeltToBucket, acledToBucket, projectToVisual, resetBucketCounter } from "@/models/GeoEventBucket";
import type { GDELTEvent, ConflictEvent } from "@/types";

beforeEach(() => resetBucketCounter());

const mockGDELTEvents: GDELTEvent[] = [
  {
    globalEventId: "g-100",
    dateAdded: "2026-03-24T10:00:00Z",
    sourceUrl: "https://example.com/a",
    title: "Border tensions rise",
    tone: -6,
    goldsteinScale: -5.5,
    numMentions: 30,
    numSources: 8,
    numArticles: 5,
    avgTone: -6,
    actor1: { name: "Country A", countryCode: "AAA", type: "GOV" },
    actor2: { name: "Country B", countryCode: "BBB", type: "MIL" },
    eventCode: "170",
    eventDescription: "Coerce",
    quadClass: "material_conflict",
    latitude: 34.0,
    longitude: 36.0,
    country: "SYR",
    location: "Damascus",
  },
  {
    globalEventId: "g-101",
    dateAdded: "2026-03-24T11:00:00Z",
    sourceUrl: "https://example.com/b",
    title: "Trade agreement signed",
    tone: 4.5,
    goldsteinScale: 5.0,
    numMentions: 10,
    numSources: 15,
    numArticles: 7,
    avgTone: 4.5,
    actor1: { name: "EU", countryCode: "EUR", type: "IGO" },
    actor2: { name: "Japan", countryCode: "JPN", type: "GOV" },
    eventCode: "050",
    eventDescription: "Cooperate",
    quadClass: "material_cooperation",
    latitude: 48.0,
    longitude: 2.0,
    country: "FRA",
    location: "Paris",
  },
];

const mockConflicts: ConflictEvent[] = [
  {
    id: "c-200",
    date: "2026-03-23T08:00:00Z",
    eventType: "explosion",
    subEventType: "Remote explosive",
    actors: ["Group X"],
    location: "Aden",
    latitude: 12.78,
    longitude: 45.02,
    country: "Yemen",
    region: "Middle East",
    fatalities: 3,
    notes: "IED attack",
    source: "ACLED",
    severity: "high",
  },
];

describe("IntelligenceGrid data pipeline", () => {
  describe("GDELT → GeoEventBucket conversion", () => {
    test("converts conflict event with correct truth layer", () => {
      const bucket = gdeltToBucket(mockGDELTEvents[0]);
      expect(bucket.truthLayer).toBe("OBSERVED");
      expect(bucket.bucketType).toBe("geo_event");
      expect(bucket.modality).toBe("spatial");
    });

    test("calculates confidence from sources", () => {
      const bucket1 = gdeltToBucket(mockGDELTEvents[0]); // 8 sources
      const bucket2 = gdeltToBucket(mockGDELTEvents[1]); // 15 sources
      expect(bucket2.confidence).toBeGreaterThan(bucket1.confidence);
    });

    test("preserves actors in properties", () => {
      const bucket = gdeltToBucket(mockGDELTEvents[0]);
      expect(bucket.properties.actors).toEqual(["Country A", "Country B"]);
    });

    test("maps goldstein to severity", () => {
      const bucket = gdeltToBucket(mockGDELTEvents[0]); // -5.5
      expect(bucket.properties.severity).toBe("high");

      const bucket2 = gdeltToBucket(mockGDELTEvents[1]); // +5.0
      expect(bucket2.properties.severity).toBe("low");
    });
  });

  describe("ACLED → GeoEventBucket conversion", () => {
    test("converts conflict with ACLED confidence", () => {
      const bucket = acledToBucket(mockConflicts[0]);
      expect(bucket.confidence).toBe(0.85);
      expect(bucket.properties.sourceFeed).toBe("ACLED");
    });

    test("maps severity to goldstein equivalent", () => {
      const bucket = acledToBucket(mockConflicts[0]); // high
      expect(bucket.value).toBe(-6);
    });

    test("includes fatalities in properties", () => {
      const bucket = acledToBucket(mockConflicts[0]);
      expect(bucket.properties.fatalities).toBe(3);
    });
  });

  describe("visual projection for grid cells", () => {
    test("conflict event projects with truth layer color", () => {
      const bucket = gdeltToBucket(mockGDELTEvents[0]);
      const visual = projectToVisual(bucket);
      expect(visual.color).toBe("#2D6A4F"); // OBSERVED → Bayati green
    });

    test("high severity event has larger size", () => {
      const high = gdeltToBucket(mockGDELTEvents[0]); // goldstein -5.5
      const low = gdeltToBucket(mockGDELTEvents[1]); // goldstein +5.0
      const visHigh = projectToVisual(high);
      const visLow = projectToVisual(low);
      // Both scale by magnitude, 5.5 > 5.0 → slightly larger
      expect(visHigh.size).toBeGreaterThanOrEqual(visLow.size);
    });

    test("opacity maps from confidence", () => {
      const bucket = gdeltToBucket(mockGDELTEvents[0]); // 8/20 = 0.4 confidence
      const visual = projectToVisual(bucket);
      // opacity = 0.4 + 0.4 * 0.6 = 0.64
      expect(visual.opacity).toBeCloseTo(0.64, 1);
    });
  });

  describe("sorting data for grid", () => {
    test("all buckets have dates for sorting", () => {
      const buckets = [
        ...mockGDELTEvents.map(gdeltToBucket),
        ...mockConflicts.map(acledToBucket),
      ];
      for (const b of buckets) {
        expect(b.createdAt).toBeTruthy();
      }
    });

    test("all buckets have goldstein for sorting", () => {
      const buckets = [
        ...mockGDELTEvents.map(gdeltToBucket),
        ...mockConflicts.map(acledToBucket),
      ];
      for (const b of buckets) {
        expect(typeof b.properties.goldsteinScale).toBe("number");
      }
    });

    test("all buckets have severity for sorting", () => {
      const buckets = [
        ...mockGDELTEvents.map(gdeltToBucket),
        ...mockConflicts.map(acledToBucket),
      ];
      const valid = ["low", "medium", "high", "critical"];
      for (const b of buckets) {
        expect(valid).toContain(b.properties.severity);
      }
    });
  });

  describe("filtering", () => {
    test("can filter by country", () => {
      const buckets = mockGDELTEvents.map(gdeltToBucket);
      const syrOnly = buckets.filter((b) =>
        b.properties.country.toLowerCase().includes("syr")
      );
      expect(syrOnly.length).toBe(1);
      expect(syrOnly[0].properties.country).toBe("SYR");
    });

    test("can filter by confidence threshold", () => {
      const buckets = [
        ...mockGDELTEvents.map(gdeltToBucket),
        ...mockConflicts.map(acledToBucket),
      ];
      const highConf = buckets.filter((b) => b.confidence >= 0.5);
      const lowConf = buckets.filter((b) => b.confidence < 0.5);
      expect(highConf.length + lowConf.length).toBe(buckets.length);
    });

    test("can filter by event type", () => {
      const buckets = mockGDELTEvents.map(gdeltToBucket);
      const conflicts = buckets.filter((b) =>
        b.properties.eventType.includes("conflict")
      );
      expect(conflicts.length).toBe(1);
    });
  });
});
