/**
 * Tests for IntelligenceGraph — propagation semantics.
 *
 * Validates that different edge types propagate differently,
 * confidence degrades correctly, and truth layers inherit properly.
 *
 * S-Agent — Task Force KG-ORM Prototype
 */

import { IntelligenceGraph, buildIntelligenceGraph } from "../graph-model";
import type { GraphNode, GraphEdge } from "../graph-model";
import { gdeltToBucket, acledToBucket, resetBucketCounter } from "@/models/GeoEventBucket";
import type { GDELTEvent, ConflictEvent } from "@/types";

beforeEach(() => resetBucketCounter());

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeNode(id: string, value: number, truth: "OBSERVED" | "COMPUTED" | "ESTIMATED" = "OBSERVED"): GraphNode {
  return {
    id, label: `Node ${id}`, value, unit: "test",
    truthLayer: truth, confidence: 1.0, computeCount: 0, lastComputedBy: "test",
  };
}

// ── Unit tests ──────────────────────────────────────────────────────────────

describe("IntelligenceGraph", () => {
  describe("basic graph operations", () => {
    test("add and retrieve nodes", () => {
      const g = new IntelligenceGraph();
      g.addNode(makeNode("a", 10));
      expect(g.getNode("a")).toBeDefined();
      expect(g.getNode("a")!.value).toBe(10);
    });

    test("add edges and query incoming/outgoing", () => {
      const g = new IntelligenceGraph();
      g.addNode(makeNode("a", 10));
      g.addNode(makeNode("b", 20));
      g.addEdge({ sourceId: "a", targetId: "b", edgeType: "COMPOSES", role: "input", weight: 1, confidence: 1 });
      expect(g.getIncoming("b")).toHaveLength(1);
      expect(g.getOutgoing("a")).toHaveLength(1);
    });

    test("getDependents filters by edge type", () => {
      const g = new IntelligenceGraph();
      g.addNode(makeNode("a", 10));
      g.addNode(makeNode("b", 20));
      g.addNode(makeNode("c", 30));
      g.addEdge({ sourceId: "a", targetId: "b", edgeType: "COMPOSES", role: "", weight: 1, confidence: 1 });
      g.addEdge({ sourceId: "a", targetId: "c", edgeType: "SAME_LOCATION", role: "", weight: 0.5, confidence: 1 });

      const composeDeps = g.getDependents("a", new Set(["COMPOSES"]));
      expect(composeDeps).toEqual(["b"]);
    });
  });

  describe("COMPOSES propagation (formula cascade)", () => {
    test("changes propagate through formula chain", () => {
      const g = new IntelligenceGraph();
      g.addNode(makeNode("event_count_irq", 5));
      g.addNode(makeNode("event_count_syr", 3));
      g.addNode({
        ...makeNode("total_events_mideast", 0, "COMPUTED"),
        formula: "irq + syr",
        formulaFn: (v) => (v["irq"] || 0) + (v["syr"] || 0),
      });
      g.addEdge({ sourceId: "event_count_irq", targetId: "total_events_mideast", edgeType: "COMPOSES", role: "irq", weight: 1, confidence: 1 });
      g.addEdge({ sourceId: "event_count_syr", targetId: "total_events_mideast", edgeType: "COMPOSES", role: "syr", weight: 1, confidence: 1 });

      // Change Iraq event count
      const changes = g.propagateChange("event_count_irq", 8, "new events arrived");
      expect(changes.length).toBe(2); // direct + cascade
      expect(changes[0].trigger).toBe("direct_change");
      expect(changes[1].trigger).toBe("formula_cascade");
      expect(g.getNode("total_events_mideast")!.value).toBe(11); // 8 + 3
    });

    test("confidence degrades through COMPOSES chain", () => {
      const g = new IntelligenceGraph();
      const a = makeNode("a", 10);
      a.confidence = 0.8;
      g.addNode(a);
      g.addNode({
        ...makeNode("b", 0, "COMPUTED"),
        formulaFn: (v) => (v["input"] || 0) * 2,
      });
      g.addEdge({ sourceId: "a", targetId: "b", edgeType: "COMPOSES", role: "input", weight: 1, confidence: 1 });

      g.propagateChange("a", 10);
      const b = g.getNode("b")!;
      // confidence = min(0.8 * 1.0) * 0.98 = 0.784
      expect(b.confidence).toBeCloseTo(0.784, 2);
    });
  });

  describe("FEEDS propagation (hypothesis sensitivity)", () => {
    test("hypothesis change propagates via FEEDS", () => {
      const g = new IntelligenceGraph();
      g.addNode({ ...makeNode("alert_threshold", 3, "USER_INPUT"), confidence: 0.7 });
      g.addNode({
        ...makeNode("alert_triggered", 0, "COMPUTED"),
        formulaFn: (v) => (v["event_count"] || 0) >= (v["threshold"] || 3) ? 1 : 0,
      });
      g.addNode(makeNode("event_count", 5));
      g.addEdge({ sourceId: "alert_threshold", targetId: "alert_triggered", edgeType: "FEEDS", role: "threshold", weight: 1, confidence: 0.7 });
      g.addEdge({ sourceId: "event_count", targetId: "alert_triggered", edgeType: "COMPOSES", role: "event_count", weight: 1, confidence: 1 });

      // Initially compute
      g.propagateChange("event_count", 5);
      expect(g.getNode("alert_triggered")!.value).toBe(1); // 5 >= 3

      // Change threshold hypothesis
      const changes = g.propagateChange("alert_threshold", 7, "analyst raises threshold");
      const alertChange = changes.find((c) => c.nodeId === "alert_triggered");
      expect(alertChange).toBeDefined();
      expect(alertChange!.trigger).toBe("hypothesis_propagation");
      expect(g.getNode("alert_triggered")!.value).toBe(0); // 5 < 7
    });
  });

  describe("AGGREGATED_INTO propagation (spatial aggregation)", () => {
    test("aggregate recomputes when input changes", () => {
      const g = new IntelligenceGraph();
      g.addNode(makeNode("event_a", -7));
      g.addNode(makeNode("event_b", -3));
      g.addNode({
        ...makeNode("heatmap_cell_33_44", 0, "COMPUTED"),
        formula: "avg(events)",
        formulaFn: (v) => {
          const vals = Object.values(v).filter((x) => typeof x === "number");
          return vals.length > 0 ? vals.reduce((s, x) => s + x, 0) / vals.length : 0;
        },
      });
      g.addEdge({ sourceId: "event_a", targetId: "heatmap_cell_33_44", edgeType: "AGGREGATED_INTO", role: "event_a", weight: 1, confidence: 1 });
      g.addEdge({ sourceId: "event_b", targetId: "heatmap_cell_33_44", edgeType: "AGGREGATED_INTO", role: "event_b", weight: 1, confidence: 1 });

      g.propagateChange("event_a", -7);
      expect(g.getNode("heatmap_cell_33_44")!.value).toBeCloseTo(-5, 0); // avg(-7, -3)

      // New event arrives, update
      const changes = g.propagateChange("event_a", -9, "escalation");
      expect(g.getNode("heatmap_cell_33_44")!.value).toBeCloseTo(-6, 0); // avg(-9, -3)
      expect(changes.find((c) => c.nodeId === "heatmap_cell_33_44")!.trigger).toBe("spatial_aggregation");
    });
  });

  describe("truth layer propagation", () => {
    test("COMPUTED inherits worst truth layer of inputs", () => {
      const g = new IntelligenceGraph();
      g.addNode(makeNode("observed_event", 10, "OBSERVED"));
      g.addNode({ ...makeNode("estimated_param", 0.5, "ESTIMATED"), confidence: 0.6 });
      g.addNode({
        ...makeNode("result", 0, "COMPUTED"),
        formulaFn: (v) => (v["event"] || 0) * (v["param"] || 1),
      });
      g.addEdge({ sourceId: "observed_event", targetId: "result", edgeType: "COMPOSES", role: "event", weight: 1, confidence: 1 });
      g.addEdge({ sourceId: "estimated_param", targetId: "result", edgeType: "FEEDS", role: "param", weight: 1, confidence: 0.6 });

      g.propagateChange("observed_event", 10);
      // worst truth layer of (OBSERVED, ESTIMATED) → ESTIMATED
      expect(g.getNode("result")!.truthLayer).toBe("ESTIMATED");
    });
  });

  describe("provenance trace", () => {
    test("traces full provenance chain", () => {
      const g = new IntelligenceGraph();
      g.addNode({ ...makeNode("gdelt_feed", -7), source: "GDELT API" });
      g.addNode({
        ...makeNode("severity", 0, "COMPUTED"),
        formula: "classify(goldstein)",
        formulaFn: (v) => (v["goldstein"] || 0) < -7 ? 3 : (v["goldstein"] || 0) < -3 ? 2 : 1,
      });
      g.addEdge({ sourceId: "gdelt_feed", targetId: "severity", edgeType: "COMPOSES", role: "goldstein", weight: 1, confidence: 1 });

      g.propagateChange("gdelt_feed", -8);
      const trace = g.traceProvenance("severity");
      expect(trace).toContain("COMPOSES");
      expect(trace).toContain("GDELT API");
      expect(trace).toContain("severity");
    });
  });

  describe("stats", () => {
    test("reports correct statistics", () => {
      const g = new IntelligenceGraph();
      g.addNode(makeNode("a", 1));
      g.addNode(makeNode("b", 2, "COMPUTED"));
      g.addEdge({ sourceId: "a", targetId: "b", edgeType: "COMPOSES", role: "", weight: 1, confidence: 1 });

      const s = g.stats();
      expect(s.totalNodes).toBe(2);
      expect(s.totalEdges).toBe(1);
      expect(s.edgeTypes["COMPOSES"]).toBe(1);
      expect(s.truthLayers["OBSERVED"]).toBe(1);
      expect(s.truthLayers["COMPUTED"]).toBe(1);
    });
  });
});

describe("buildIntelligenceGraph from GeoEventBuckets", () => {
  const mockGDELT: GDELTEvent[] = [
    {
      globalEventId: "g1", dateAdded: new Date().toISOString(), sourceUrl: "", title: "Clash Baghdad",
      tone: -5, goldsteinScale: -7, numMentions: 20, numSources: 10, numArticles: 5, avgTone: -5,
      actor1: { name: "Iraq Gov", countryCode: "IRQ", type: "GOV" },
      actor2: { name: "Militia", countryCode: "IRQ", type: "MIL" },
      eventCode: "190", eventDescription: "Force", quadClass: "material_conflict",
      latitude: 33.3, longitude: 44.4, country: "IRQ", location: "Baghdad",
    },
    {
      globalEventId: "g2", dateAdded: new Date().toISOString(), sourceUrl: "", title: "Protest Baghdad",
      tone: -3, goldsteinScale: -3, numMentions: 10, numSources: 5, numArticles: 3, avgTone: -3,
      actor1: { name: "Iraq Gov", countryCode: "IRQ", type: "GOV" },
      actor2: { name: "Civilians", countryCode: "IRQ", type: "CVL" },
      eventCode: "140", eventDescription: "Protest", quadClass: "verbal_conflict",
      latitude: 33.3, longitude: 44.4, country: "IRQ", location: "Baghdad",
    },
  ];

  test("creates graph from buckets", () => {
    const buckets = mockGDELT.map(gdeltToBucket);
    const graph = buildIntelligenceGraph(buckets);
    expect(graph.nodes.size).toBe(2);
  });

  test("auto-creates SAME_LOCATION edges", () => {
    const buckets = mockGDELT.map(gdeltToBucket);
    const graph = buildIntelligenceGraph(buckets);
    const locEdges = graph.edges.filter((e) => e.edgeType === "SAME_LOCATION");
    expect(locEdges.length).toBeGreaterThanOrEqual(1);
  });

  test("auto-creates SAME_ACTOR edges for shared actors", () => {
    const buckets = mockGDELT.map(gdeltToBucket);
    const graph = buildIntelligenceGraph(buckets);
    const actorEdges = graph.edges.filter((e) => e.edgeType === "SAME_ACTOR");
    expect(actorEdges.length).toBeGreaterThanOrEqual(1);
    expect(actorEdges[0].role.toLowerCase()).toBe("iraq gov");
  });

  test("nodes carry spatial properties", () => {
    const buckets = mockGDELT.map(gdeltToBucket);
    const graph = buildIntelligenceGraph(buckets);
    const node = graph.nodes.values().next().value;
    expect(node.lat).toBe(33.3);
    expect(node.lon).toBe(44.4);
    expect(node.country).toBe("IRQ");
  });

  test("stats reflect edge types", () => {
    const buckets = mockGDELT.map(gdeltToBucket);
    const graph = buildIntelligenceGraph(buckets);
    const s = graph.stats();
    expect(s.totalNodes).toBe(2);
    expect(s.totalEdges).toBeGreaterThan(0);
    expect(s.avgConfidence).toBeGreaterThan(0);
  });
});
