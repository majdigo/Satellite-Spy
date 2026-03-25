/**
 * GraphModel — TypeScript port of graph_engine.py for geospatial events.
 *
 * Typed dependency graph where each node is a DataBucket and each edge
 * has propagation semantics. This is the S-Agent prototype for the
 * Task Force KG-ORM/SDK.
 *
 * Key differences from a flat array of events:
 * - Each edge TYPE determines HOW changes propagate
 * - Confidence degrades through computation chains
 * - Truth layer propagates (worst of inputs)
 * - Spatial proximity creates automatic SAME_LOCATION edges
 * - Temporal proximity creates automatic TEMPORAL_SEQUENCE edges
 *
 * S-Agent — Task Force KG-ORM Prototype
 */

// ── Edge Types with propagation semantics ───────────────────────────────────

export type EdgeType =
  | "COMPOSES"          // A is part of B's formula (deterministic recalc)
  | "FEEDS"             // A is a hypothesis feeding model B (sensitivity)
  | "TEMPORAL_NEXT"     // A and B are same metric in consecutive periods
  | "VALIDATED_BY"      // A is cross-checked against B (confidence only)
  | "SAME_LOCATION"     // A and B share spatial proximity
  | "SAME_ACTOR"        // A and B share an actor
  | "ESCALATES_TO"      // A temporally escalates to B
  | "CORRELATES_WITH"   // A has probabilistic correlation with B
  | "EXTRACTED_FROM"    // A was extracted from source B
  | "AGGREGATED_INTO"   // A contributes to aggregate B
  | "DETECTED_BY";      // A was observed by sensor/satellite B

export type TruthLayer = "OBSERVED" | "COMPUTED" | "ESTIMATED" | "MARKET_REFERENCE" | "USER_INPUT";

// ── Graph Node ──────────────────────────────────────────────────────────────

export interface GraphNode {
  id: string;
  label: string;
  value: number | string | null;
  unit: string;
  truthLayer: TruthLayer;
  confidence: number;
  concept?: string;            // ontology concept URI
  formula?: string;            // human-readable formula
  formulaFn?: (inputs: Record<string, number>) => number;
  source?: string;
  period?: string;
  // Spatial
  lat?: number;
  lon?: number;
  country?: string;
  // Metadata
  computeCount: number;
  lastComputedBy: string;
}

// ── Graph Edge ──────────────────────────────────────────────────────────────

export interface GraphEdge {
  sourceId: string;
  targetId: string;
  edgeType: EdgeType;
  role: string;               // e.g. "numerator", "location_match"
  weight: number;             // 0-1 strength
  confidence: number;
}

// ── Change record ───────────────────────────────────────────────────────────

export interface ChangeRecord {
  nodeId: string;
  old: number | string | null;
  new_: number | string | null;
  truthLayer: string;
  confidence: number;
  trigger: string;
  reason: string;
}

// ── The Graph Engine ────────────────────────────────────────────────────────

export class IntelligenceGraph {
  nodes: Map<string, GraphNode> = new Map();
  edges: GraphEdge[] = [];
  private outgoing: Map<string, GraphEdge[]> = new Map();
  private incoming: Map<string, GraphEdge[]> = new Map();

  addNode(node: GraphNode): void {
    this.nodes.set(node.id, node);
  }

  addEdge(edge: GraphEdge): void {
    this.edges.push(edge);
    if (!this.outgoing.has(edge.sourceId)) this.outgoing.set(edge.sourceId, []);
    this.outgoing.get(edge.sourceId)!.push(edge);
    if (!this.incoming.has(edge.targetId)) this.incoming.set(edge.targetId, []);
    this.incoming.get(edge.targetId)!.push(edge);
  }

  getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  getIncoming(nodeId: string): GraphEdge[] {
    return this.incoming.get(nodeId) || [];
  }

  getOutgoing(nodeId: string): GraphEdge[] {
    return this.outgoing.get(nodeId) || [];
  }

  getDependents(nodeId: string, edgeTypes?: Set<EdgeType>): string[] {
    return (this.outgoing.get(nodeId) || [])
      .filter((e) => !edgeTypes || edgeTypes.has(e.edgeType))
      .map((e) => e.targetId);
  }

  // ── Propagation Engine ──────────────────────────────────────────────────

  propagateChange(
    changedNodeId: string,
    newValue?: number | string | null,
    reason: string = "",
  ): ChangeRecord[] {
    const node = this.nodes.get(changedNodeId);
    if (!node) return [];

    const changes: ChangeRecord[] = [];
    const oldValue = node.value;
    if (newValue !== undefined) node.value = newValue;

    changes.push({
      nodeId: changedNodeId,
      old: oldValue,
      new_: node.value,
      truthLayer: node.truthLayer,
      confidence: node.confidence,
      trigger: "direct_change",
      reason,
    });

    // Topological sort of dependents via COMPOSES/FEEDS/AGGREGATED_INTO
    const toRecompute = this.topologicalDependents(changedNodeId);

    for (const depId of toRecompute) {
      const depNode = this.nodes.get(depId);
      if (!depNode) continue;
      const depOld = depNode.value;

      const incomingEdges = this.incoming.get(depId) || [];
      const edgeTypesIn = new Set(incomingEdges.map((e) => e.edgeType));

      if (depNode.formulaFn) {
        const inputVals: Record<string, number> = {};
        for (const e of incomingEdges) {
          const src = this.nodes.get(e.sourceId);
          if (src && typeof src.value === "number") {
            inputVals[e.role || e.sourceId] = src.value;
          }
        }
        try {
          depNode.value = depNode.formulaFn(inputVals);
          depNode.computeCount++;
          depNode.confidence = this.computeConfidence(depId);
          depNode.truthLayer = this.computeTruthLayer(depId);
        } catch {
          depNode.confidence *= 0.5;
        }
      }

      if (depNode.value !== depOld) {
        let trigger = "recomputed";
        if (edgeTypesIn.has("FEEDS")) trigger = "hypothesis_propagation";
        else if (edgeTypesIn.has("COMPOSES")) trigger = "formula_cascade";
        else if (edgeTypesIn.has("AGGREGATED_INTO")) trigger = "spatial_aggregation";
        else if (edgeTypesIn.has("CORRELATES_WITH")) trigger = "cross_domain_correlation";

        changes.push({
          nodeId: depId,
          old: depOld,
          new_: depNode.value,
          truthLayer: depNode.truthLayer,
          confidence: depNode.confidence,
          trigger,
          reason: "",
        });
      }
    }

    return changes;
  }

  // ── Confidence propagation ────────────────────────────────────────────

  private computeConfidence(nodeId: string): number {
    const incomingEdges = this.incoming.get(nodeId) || [];
    if (incomingEdges.length === 0) return this.nodes.get(nodeId)?.confidence ?? 1;

    const confs: number[] = [];
    for (const e of incomingEdges) {
      const src = this.nodes.get(e.sourceId);
      if (src) confs.push(src.confidence * e.weight);
    }
    if (confs.length === 0) return 1;

    // min input confidence × 0.98 degradation per step
    return Math.round(Math.min(...confs) * 0.98 * 10000) / 10000;
  }

  // ── Truth layer propagation (worst of inputs) ─────────────────────────

  private computeTruthLayer(nodeId: string): TruthLayer {
    const priority: Record<TruthLayer, number> = {
      OBSERVED: 0,
      MARKET_REFERENCE: 1,
      COMPUTED: 2,
      USER_INPUT: 3,
      ESTIMATED: 4,
    };
    const incomingEdges = this.incoming.get(nodeId) || [];
    let worst: TruthLayer = "COMPUTED";
    for (const e of incomingEdges) {
      const src = this.nodes.get(e.sourceId);
      if (src && (priority[src.truthLayer] ?? 2) > (priority[worst] ?? 2)) {
        worst = src.truthLayer;
      }
    }
    if (worst === "USER_INPUT" || worst === "ESTIMATED") return "ESTIMATED";
    return "COMPUTED";
  }

  // ── Topological sort ──────────────────────────────────────────────────

  private topologicalDependents(startId: string): string[] {
    const propagatingTypes = new Set<EdgeType>(["COMPOSES", "FEEDS", "AGGREGATED_INTO", "CORRELATES_WITH"]);
    const visited = new Set<string>();
    const order: string[] = [];

    const dfs = (nid: string) => {
      if (visited.has(nid)) return;
      visited.add(nid);
      for (const edge of this.outgoing.get(nid) || []) {
        if (propagatingTypes.has(edge.edgeType)) dfs(edge.targetId);
      }
      order.push(nid);
    };

    dfs(startId);
    order.reverse();
    return order.filter((n) => n !== startId);
  }

  // ── Provenance trace ──────────────────────────────────────────────────

  traceProvenance(nodeId: string, depth: number = 0, maxDepth: number = 6): string {
    const node = this.nodes.get(nodeId);
    if (!node) return `${"  ".repeat(depth)}? ${nodeId} (not found)`;

    const indent = "  ".repeat(depth);
    const val = typeof node.value === "number" ? node.value.toFixed(1) : String(node.value);
    let line = `${indent}${node.label} = ${val} [${node.truthLayer}, conf=${(node.confidence * 100).toFixed(0)}%]`;
    if (node.source) line += ` <- ${node.source}`;
    if (node.formula) line += ` (${node.formula})`;

    if (depth >= maxDepth) return line + " ...";

    const lines = [line];
    for (const edge of this.incoming.get(nodeId) || []) {
      lines.push(`${indent}  ^ ${edge.edgeType} (${edge.role})`);
      lines.push(this.traceProvenance(edge.sourceId, depth + 2, maxDepth));
    }
    return lines.join("\n");
  }

  // ── Stats ─────────────────────────────────────────────────────────────

  stats(): {
    totalNodes: number;
    totalEdges: number;
    edgeTypes: Record<string, number>;
    truthLayers: Record<string, number>;
    avgConfidence: number;
  } {
    const edgeTypes: Record<string, number> = {};
    for (const e of this.edges) edgeTypes[e.edgeType] = (edgeTypes[e.edgeType] || 0) + 1;

    const truthLayers: Record<string, number> = {};
    for (const n of this.nodes.values()) truthLayers[n.truthLayer] = (truthLayers[n.truthLayer] || 0) + 1;

    const vals = [...this.nodes.values()];
    const avgConf = vals.length > 0
      ? vals.reduce((s, n) => s + n.confidence, 0) / vals.length
      : 0;

    return {
      totalNodes: this.nodes.size,
      totalEdges: this.edges.length,
      edgeTypes,
      truthLayers,
      avgConfidence: Math.round(avgConf * 1000) / 1000,
    };
  }
}

// ── Factory: Build intelligence graph from GeoEventBuckets ──────────────────

import type { GeoEventBucket } from "@/models/GeoEventBucket";

export function buildIntelligenceGraph(buckets: GeoEventBucket[]): IntelligenceGraph {
  const g = new IntelligenceGraph();

  // Add event nodes
  for (const b of buckets) {
    g.addNode({
      id: b.id,
      label: b.label,
      value: b.properties.goldsteinScale,
      unit: "goldstein",
      truthLayer: b.truthLayer as TruthLayer,
      confidence: b.confidence,
      concept: `plover:${b.properties.eventType}`,
      source: b.properties.sourceFeed as string,
      lat: b.properties.lat,
      lon: b.properties.lon,
      country: b.properties.country,
      computeCount: 0,
      lastComputedBy: b.createdBy,
    });
  }

  // Auto-create edges based on spatial/temporal/actor proximity
  for (let i = 0; i < buckets.length; i++) {
    for (let j = i + 1; j < buckets.length; j++) {
      const a = buckets[i];
      const b = buckets[j];

      // SAME_LOCATION
      if (a.properties.country === b.properties.country && a.properties.country !== "") {
        g.addEdge({
          sourceId: a.id, targetId: b.id,
          edgeType: "SAME_LOCATION", role: "co-located",
          weight: 0.5, confidence: 1.0,
        });
      }

      // SAME_ACTOR
      const actorsA = new Set(a.properties.actors.map((s: string) => s.toLowerCase()));
      const sharedActors = b.properties.actors.filter((s: string) => actorsA.has(s.toLowerCase()));
      if (sharedActors.length > 0) {
        g.addEdge({
          sourceId: a.id, targetId: b.id,
          edgeType: "SAME_ACTOR", role: sharedActors[0],
          weight: Math.min(1, sharedActors.length * 0.4), confidence: 0.9,
        });
      }

      // TEMPORAL_SEQUENCE (< 24h)
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      if (Math.abs(timeA - timeB) < 24 * 3600000 && timeA !== timeB) {
        const earlier = timeA < timeB ? a : b;
        const later = timeA < timeB ? b : a;
        g.addEdge({
          sourceId: earlier.id, targetId: later.id,
          edgeType: "TEMPORAL_NEXT", role: "temporal_sequence",
          weight: 0.3, confidence: 1.0,
        });
      }
    }
  }

  return g;
}
