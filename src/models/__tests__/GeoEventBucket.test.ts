import {
  gdeltToBucket,
  acledToBucket,
  projectToVisual,
  recordProjection,
  recordQuery,
  resetBucketCounter,
  type GeoEventBucket,
} from "../GeoEventBucket";
import type { GDELTEvent, ConflictEvent } from "@/types";

beforeEach(() => resetBucketCounter());

const mockGDELT: GDELTEvent = {
  globalEventId: "gdelt-100",
  dateAdded: new Date().toISOString(),
  sourceUrl: "https://example.com/article",
  title: "Military buildup near border",
  tone: -5.2,
  goldsteinScale: -7.5,
  numMentions: 45,
  numSources: 12,
  numArticles: 8,
  avgTone: -4.8,
  actor1: { name: "Country A", countryCode: "AAA", type: "GOV" },
  actor2: { name: "Country B", countryCode: "BBB", type: "MIL" },
  eventCode: "190",
  eventDescription: "Use of force",
  quadClass: "material_conflict",
  latitude: 35.0,
  longitude: 45.0,
  country: "IRQ",
  location: "Baghdad",
};

const mockConflict: ConflictEvent = {
  id: "acled-200",
  date: new Date().toISOString(),
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
};

describe("GeoEventBucket (T1)", () => {
  describe("gdeltToBucket", () => {
    test("creates bucket with correct identity", () => {
      const bucket = gdeltToBucket(mockGDELT);
      expect(bucket.id).toBe("geo-bucket-gdelt-gdelt-100");
      expect(bucket.bucketType).toBe("geo_event");
      expect(bucket.label).toBe("Military buildup near border");
    });

    test("sets truth layer to OBSERVED for direct feed", () => {
      const bucket = gdeltToBucket(mockGDELT);
      expect(bucket.truthLayer).toBe("OBSERVED");
    });

    test("calculates confidence from source count", () => {
      const bucket = gdeltToBucket(mockGDELT);
      expect(bucket.confidence).toBe(12 / 20); // 12 sources / 20 max
    });

    test("maps goldstein to severity correctly", () => {
      const critical = gdeltToBucket({ ...mockGDELT, goldsteinScale: -8.5 });
      expect(critical.properties.severity).toBe("critical");

      const high = gdeltToBucket({ ...mockGDELT, goldsteinScale: -5 });
      expect(high.properties.severity).toBe("high");

      const medium = gdeltToBucket({ ...mockGDELT, goldsteinScale: -1 });
      expect(medium.properties.severity).toBe("medium");

      const low = gdeltToBucket({ ...mockGDELT, goldsteinScale: 2 });
      expect(low.properties.severity).toBe("low");
    });

    test("extracts actors from GDELT event", () => {
      const bucket = gdeltToBucket(mockGDELT);
      expect(bucket.properties.actors).toEqual(["Country A", "Country B"]);
    });

    test("records CREATED interaction", () => {
      const bucket = gdeltToBucket(mockGDELT);
      expect(bucket.interactions).toHaveLength(1);
      expect(bucket.interactions[0].interactionType).toBe("created");
      expect(bucket.interactions[0].agentId).toBe("GDELT-feed");
      expect(bucket.interactions[0].agentType).toBe("feed");
    });

    test("sets modality to spatial", () => {
      const bucket = gdeltToBucket(mockGDELT);
      expect(bucket.modality).toBe("spatial");
    });

    test("preserves geolocation", () => {
      const bucket = gdeltToBucket(mockGDELT);
      expect(bucket.properties.lat).toBe(35.0);
      expect(bucket.properties.lon).toBe(45.0);
      expect(bucket.properties.country).toBe("IRQ");
    });
  });

  describe("acledToBucket", () => {
    test("creates bucket from ACLED conflict", () => {
      const bucket = acledToBucket(mockConflict);
      expect(bucket.id).toBe("geo-bucket-acled-acled-200");
      expect(bucket.bucketType).toBe("geo_event");
      expect(bucket.properties.sourceFeed).toBe("ACLED");
    });

    test("maps severity to goldstein equivalent", () => {
      const bucket = acledToBucket(mockConflict);
      expect(bucket.value).toBe(-6); // "high" → -6
    });

    test("sets confidence for ACLED source", () => {
      const bucket = acledToBucket(mockConflict);
      expect(bucket.confidence).toBe(0.85);
    });

    test("includes fatalities in properties", () => {
      const bucket = acledToBucket(mockConflict);
      expect(bucket.properties.fatalities).toBe(5);
    });
  });

  describe("projectToVisual", () => {
    test("maps OBSERVED to Bayati green", () => {
      const bucket = gdeltToBucket(mockGDELT);
      const visual = projectToVisual(bucket);
      expect(visual.color).toBe("#2D6A4F");
    });

    test("maps confidence to opacity (0.4-1.0)", () => {
      const bucket = gdeltToBucket(mockGDELT);
      bucket.confidence = 0.5;
      const visual = projectToVisual(bucket);
      expect(visual.opacity).toBeCloseTo(0.7, 1); // 0.4 + 0.5 * 0.6
    });

    test("zero confidence gives minimum opacity", () => {
      const bucket = gdeltToBucket(mockGDELT);
      bucket.confidence = 0;
      const visual = projectToVisual(bucket);
      expect(visual.opacity).toBe(0.4);
    });

    test("critical events glow red", () => {
      const bucket = gdeltToBucket({ ...mockGDELT, goldsteinScale: -9 });
      const visual = projectToVisual(bucket);
      expect(visual.glowColor).toBe("#E63946");
      expect(visual.glowIntensity).toBe(0.8);
    });

    test("non-critical events have no glow", () => {
      const bucket = gdeltToBucket({ ...mockGDELT, goldsteinScale: -2 });
      const visual = projectToVisual(bucket);
      expect(visual.glowColor).toBeUndefined();
      expect(visual.glowIntensity).toBe(0);
    });

    test("size scales with goldstein magnitude", () => {
      const mild = gdeltToBucket({ ...mockGDELT, goldsteinScale: -1 });
      const severe = gdeltToBucket({ ...mockGDELT, goldsteinScale: -9 });
      const visMild = projectToVisual(mild);
      const visSevere = projectToVisual(severe);
      expect(visSevere.size).toBeGreaterThan(visMild.size);
    });
  });

  describe("interaction tracking", () => {
    test("recordProjection adds PROJECTED interaction", () => {
      const bucket = gdeltToBucket(mockGDELT);
      expect(bucket.interactions).toHaveLength(1);

      recordProjection(bucket, "globe-view");
      expect(bucket.interactions).toHaveLength(2);
      expect(bucket.interactions[1].interactionType).toBe("projected");
      expect(bucket.interactions[1].agentId).toBe("globe-view");
      expect(bucket.interactions[1].modalityAfter).toBe("visual");
    });

    test("recordQuery adds QUERIED interaction", () => {
      const bucket = gdeltToBucket(mockGDELT);
      recordQuery(bucket, "majdi");
      expect(bucket.interactions).toHaveLength(2);
      expect(bucket.interactions[1].interactionType).toBe("queried");
      expect(bucket.interactions[1].agentType).toBe("human");
    });

    test("multiple interactions accumulate", () => {
      const bucket = gdeltToBucket(mockGDELT);
      recordProjection(bucket, "globe");
      recordQuery(bucket, "user");
      recordProjection(bucket, "sidebar");
      expect(bucket.interactions).toHaveLength(4);
    });
  });
});
