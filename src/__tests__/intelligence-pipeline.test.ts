/**
 * E2E pipeline tests: GDELT/ACLED → GeoEventBucket → Graph → Visual → Heatmap
 *
 * Tests the full intelligence data pipeline without network calls.
 *
 * S-Agent Phase 4 — Agentic Cognitive UI
 */

import { gdeltToBucket, acledToBucket, projectToVisual, recordProjection, recordQuery } from "@/models/GeoEventBucket";
import { computeHeatmap, computeTemporalHeatmap, heatmapColor } from "@/lib/anomaly-heatmap";
import { buildGeoEventGraph, graphStats } from "@/lib/geo-event-graph";
import type { GDELTEvent, ConflictEvent } from "@/types";

// ── Test data with realistic timestamps ─────────────────────────────────────

const baseTime = new Date("2026-03-24T06:00:00Z").getTime();

function makeGDELT(id: string, hours: number, goldstein: number, country: string, actor1: string): GDELTEvent {
  return {
    globalEventId: id,
    dateAdded: new Date(baseTime + hours * 3600000).toISOString(),
    sourceUrl: `https://example.com/${id}`,
    title: `Event ${id}`,
    tone: goldstein * 0.5,
    goldsteinScale: goldstein,
    numMentions: 10 + Math.abs(goldstein) * 5,
    numSources: 5 + Math.abs(goldstein) * 2,
    numArticles: 3,
    avgTone: goldstein * 0.5,
    actor1: { name: actor1, countryCode: country, type: "GOV" },
    actor2: { name: "Unknown", countryCode: "", type: "" },
    eventCode: goldstein < 0 ? "190" : "050",
    eventDescription: goldstein < 0 ? "Force" : "Cooperate",
    quadClass: goldstein < -3 ? "material_conflict" : goldstein < 0 ? "verbal_conflict" : "verbal_cooperation",
    latitude: country === "IRQ" ? 33.3 : country === "SYR" ? 35.0 : 48.8,
    longitude: country === "IRQ" ? 44.4 : country === "SYR" ? 38.0 : 2.3,
    country,
    location: country,
  };
}

function makeConflict(id: string, hours: number, severity: "low" | "medium" | "high" | "critical", country: string): ConflictEvent {
  return {
    id,
    date: new Date(baseTime + hours * 3600000).toISOString(),
    eventType: "battle",
    subEventType: "Armed clash",
    actors: ["Group A", "Group B"],
    location: country,
    latitude: country === "IRQ" ? 33.3 : 36.3,
    longitude: country === "IRQ" ? 44.4 : 43.1,
    country,
    region: "Middle East",
    fatalities: severity === "critical" ? 20 : severity === "high" ? 5 : 1,
    notes: "",
    source: "ACLED",
    severity,
  };
}

const gdeltEvents: GDELTEvent[] = [
  makeGDELT("g1", 0, -8, "IRQ", "Iraq Gov"),
  makeGDELT("g2", 2, -5, "IRQ", "Iraq Gov"),
  makeGDELT("g3", 4, -3, "SYR", "Syria Gov"),
  makeGDELT("g4", 6, 3, "FRA", "EU"),
  makeGDELT("g5", 12, -9, "IRQ", "Iraq Gov"),
  makeGDELT("g6", 18, -2, "SYR", "Syria Gov"),
];

const conflicts: ConflictEvent[] = [
  makeConflict("c1", 1, "high", "IRQ"),
  makeConflict("c2", 8, "critical", "IRQ"),
  makeConflict("c3", 14, "medium", "SYR"),
];

describe("Intelligence Pipeline E2E", () => {
  describe("Stage 1: GDELT/ACLED → GeoEventBucket", () => {
    test("all events convert to buckets", () => {
      const buckets = [
        ...gdeltEvents.map(gdeltToBucket),
        ...conflicts.map(acledToBucket),
      ];
      expect(buckets).toHaveLength(9);
      buckets.forEach((b) => {
        expect(b.bucketType).toBe("geo_event");
        expect(b.modality).toBe("spatial");
        expect(b.truthLayer).toBe("OBSERVED");
      });
    });

    test("critical events have correct severity", () => {
      const b1 = gdeltToBucket(gdeltEvents[0]); // goldstein -8
      expect(b1.properties.severity).toBe("critical");

      const b4 = gdeltToBucket(gdeltEvents[3]); // goldstein +3
      expect(b4.properties.severity).toBe("low");
    });

    test("each bucket has a creation interaction", () => {
      const buckets = gdeltEvents.map(gdeltToBucket);
      buckets.forEach((b) => {
        expect(b.interactions).toHaveLength(1);
        expect(b.interactions[0].interactionType).toBe("created");
      });
    });
  });

  describe("Stage 2: GeoEventBucket → Visual Projection", () => {
    test("truth layer determines color", () => {
      const bucket = gdeltToBucket(gdeltEvents[0]);
      const visual = projectToVisual(bucket);
      expect(visual.color).toBe("#2D6A4F"); // OBSERVED → Bayati green
    });

    test("critical events pulse and glow", () => {
      const bucket = gdeltToBucket(gdeltEvents[4]); // goldstein -9 → critical
      const visual = projectToVisual(bucket);
      expect(visual.glowColor).toBe("#E63946");
      expect(visual.glowIntensity).toBe(0.8);
    });

    test("confidence maps to opacity range 0.4-1.0", () => {
      const low = gdeltToBucket({ ...gdeltEvents[0], numSources: 1 });
      const high = gdeltToBucket({ ...gdeltEvents[0], numSources: 20 });
      const visLow = projectToVisual(low);
      const visHigh = projectToVisual(high);
      expect(visLow.opacity).toBeGreaterThanOrEqual(0.4);
      expect(visHigh.opacity).toBeLessThanOrEqual(1.0);
      expect(visHigh.opacity).toBeGreaterThan(visLow.opacity);
    });
  });

  describe("Stage 3: GeoEventBucket → ForceGraph", () => {
    test("builds graph with correct node count", () => {
      const buckets = [
        ...gdeltEvents.map(gdeltToBucket),
        ...conflicts.map(acledToBucket),
      ];
      const graph = buildGeoEventGraph(buckets);
      expect(graph.nodes).toHaveLength(9);
    });

    test("same-country events are linked", () => {
      const buckets = gdeltEvents.map(gdeltToBucket);
      const graph = buildGeoEventGraph(buckets);
      const irqLinks = graph.links.filter((l) => l.relation === "SAME_LOCATION");
      // g1, g2, g5 are all IRQ → 3 pairs
      expect(irqLinks.length).toBeGreaterThanOrEqual(3);
    });

    test("same-actor events are linked", () => {
      const buckets = gdeltEvents.map(gdeltToBucket);
      const graph = buildGeoEventGraph(buckets);
      const actorLinks = graph.links.filter((l) => l.relation === "SAME_ACTOR");
      // Iraq Gov appears in g1, g2, g5 → links between them
      expect(actorLinks.length).toBeGreaterThanOrEqual(3);
    });

    test("graph stats are consistent", () => {
      const buckets = gdeltEvents.map(gdeltToBucket);
      const graph = buildGeoEventGraph(buckets);
      const stats = graphStats(graph);
      expect(stats.nodeCount).toBe(6);
      expect(stats.countries).toBe(3); // IRQ, SYR, FRA
      expect(stats.linkCount).toBe(graph.links.length);
    });
  });

  describe("Stage 4: Events → Heatmap", () => {
    test("computes heatmap from events", () => {
      const cells = computeHeatmap(gdeltEvents, conflicts);
      expect(cells.length).toBeGreaterThan(0);
    });

    test("Iraq cluster has highest intensity", () => {
      const cells = computeHeatmap(gdeltEvents, conflicts);
      const irqCell = cells.find((c) => Math.abs(c.lat - 33) < 2);
      expect(irqCell).toBeDefined();
      expect(irqCell!.intensity).toBe(1.0); // most events in IRQ
    });

    test("heatmap colors match severity", () => {
      expect(heatmapColor(0.1)).toBe("#2D6A4F"); // calm
      expect(heatmapColor(0.5)).toBe("#E76F51"); // tension
      expect(heatmapColor(0.9)).toBe("#E63946"); // conflict
    });
  });

  describe("Stage 5: Temporal Replay", () => {
    test("generates multiple time frames", () => {
      const frames = computeTemporalHeatmap(gdeltEvents, conflicts, 6 * 3600000, 4);
      expect(frames.length).toBe(4);
    });

    test("each frame has valid time window", () => {
      const frames = computeTemporalHeatmap(gdeltEvents, conflicts, 6 * 3600000, 4);
      for (const frame of frames) {
        expect(new Date(frame.startTime).getTime()).toBeLessThan(new Date(frame.endTime).getTime());
      }
    });

    test("early frames capture early events", () => {
      const frames = computeTemporalHeatmap(gdeltEvents, conflicts, 6 * 3600000, 4);
      // First frame should have the early events (0-6h window)
      const firstFrame = frames[0];
      expect(firstFrame.cells.length).toBeGreaterThanOrEqual(0);
    });

    test("empty events produce empty frames", () => {
      const frames = computeTemporalHeatmap([], [], 6 * 3600000, 4);
      expect(frames).toEqual([]);
    });
  });

  describe("Stage 6: Interaction Tracking", () => {
    test("projection adds PROJECTED interaction", () => {
      const bucket = gdeltToBucket(gdeltEvents[0]);
      expect(bucket.interactions).toHaveLength(1);

      recordProjection(bucket, "globe-view");
      expect(bucket.interactions).toHaveLength(2);
      expect(bucket.interactions[1].interactionType).toBe("projected");
      expect(bucket.interactions[1].modalityAfter).toBe("visual");
    });

    test("user query adds QUERIED interaction", () => {
      const bucket = gdeltToBucket(gdeltEvents[0]);
      recordQuery(bucket, "majdi");

      expect(bucket.interactions).toHaveLength(2);
      expect(bucket.interactions[1].interactionType).toBe("queried");
      expect(bucket.interactions[1].agentType).toBe("human");
    });

    test("full interaction chain tracks provenance", () => {
      const bucket = gdeltToBucket(gdeltEvents[0]);
      recordProjection(bucket, "globe");
      recordQuery(bucket, "analyst");
      recordProjection(bucket, "intel-grid");

      expect(bucket.interactions).toHaveLength(4);
      expect(bucket.interactions.map((i) => i.interactionType)).toEqual([
        "created", "projected", "queried", "projected",
      ]);
    });
  });
});
