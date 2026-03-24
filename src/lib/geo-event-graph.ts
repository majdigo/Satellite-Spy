/**
 * GeoEvent Graph — Pure computation for building a force-directed graph
 * from GeoEventBuckets. Links events by shared location, actors, or time.
 *
 * S-Agent Phase 2 — Agentic Cognitive UI
 */

import type { GeoEventBucket } from "@/models/GeoEventBucket";

export interface GraphNode {
  id: string;
  label: string;
  lat: number;
  lon: number;
  truthLayer: string;
  confidence: number;
  severity: string;
  goldstein: number;
  sourceFeed: string;
  eventType: string;
  group: string;    // grouping key for clustering (country or actor)
}

export interface GraphLink {
  source: string;
  target: string;
  relation: "SAME_LOCATION" | "SAME_ACTOR" | "TEMPORAL_SEQUENCE" | "CO_OCCURRING";
  weight: number;   // 0-1 strength
}

export interface GeoEventGraph {
  nodes: GraphNode[];
  links: GraphLink[];
}

/**
 * Build a force graph from GeoEventBuckets.
 *
 * Links are created when events share:
 * - Same country (SAME_LOCATION)
 * - Common actor (SAME_ACTOR)
 * - Close timestamps (TEMPORAL_SEQUENCE, within 24h)
 * - Same grid cell (CO_OCCURRING, within 2° lat/lon)
 */
export function buildGeoEventGraph(
  buckets: GeoEventBucket[],
  maxNodes: number = 100,
): GeoEventGraph {
  const limited = buckets.slice(0, maxNodes);

  const nodes: GraphNode[] = limited.map((b) => ({
    id: b.id,
    label: b.label,
    lat: b.properties.lat,
    lon: b.properties.lon,
    truthLayer: b.truthLayer,
    confidence: b.confidence,
    severity: b.properties.severity as string,
    goldstein: b.properties.goldsteinScale,
    sourceFeed: b.properties.sourceFeed as string,
    eventType: b.properties.eventType,
    group: b.properties.country,
  }));

  const links: GraphLink[] = [];
  const nodeIds = new Set(nodes.map((n) => n.id));

  for (let i = 0; i < limited.length; i++) {
    for (let j = i + 1; j < limited.length; j++) {
      const a = limited[i];
      const b = limited[j];

      // SAME_LOCATION: same country
      if (a.properties.country === b.properties.country && a.properties.country !== "") {
        links.push({
          source: a.id,
          target: b.id,
          relation: "SAME_LOCATION",
          weight: 0.5,
        });
      }

      // SAME_ACTOR: shared actor name
      const actorsA = new Set(a.properties.actors.map((s: string) => s.toLowerCase()));
      const actorsB = b.properties.actors.map((s: string) => s.toLowerCase());
      const sharedActors = actorsB.filter((actor: string) => actorsA.has(actor));
      if (sharedActors.length > 0) {
        links.push({
          source: a.id,
          target: b.id,
          relation: "SAME_ACTOR",
          weight: Math.min(1, sharedActors.length * 0.4),
        });
      }

      // CO_OCCURRING: within 2° lat/lon
      const latDiff = Math.abs(a.properties.lat - b.properties.lat);
      const lonDiff = Math.abs(a.properties.lon - b.properties.lon);
      if (latDiff < 2 && lonDiff < 2 && a.properties.country !== b.properties.country) {
        links.push({
          source: a.id,
          target: b.id,
          relation: "CO_OCCURRING",
          weight: 0.7,
        });
      }

      // TEMPORAL_SEQUENCE: within 24h
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      if (Math.abs(timeA - timeB) < 24 * 60 * 60 * 1000 && timeA !== timeB) {
        links.push({
          source: a.id,
          target: b.id,
          relation: "TEMPORAL_SEQUENCE",
          weight: 0.3,
        });
      }
    }
  }

  return { nodes, links };
}

/**
 * Compute graph statistics for display.
 */
export function graphStats(graph: GeoEventGraph) {
  const relationCounts: Record<string, number> = {};
  for (const link of graph.links) {
    relationCounts[link.relation] = (relationCounts[link.relation] || 0) + 1;
  }

  const countries = new Set(graph.nodes.map((n) => n.group));
  const avgGoldstein = graph.nodes.length > 0
    ? graph.nodes.reduce((sum, n) => sum + n.goldstein, 0) / graph.nodes.length
    : 0;

  return {
    nodeCount: graph.nodes.length,
    linkCount: graph.links.length,
    countries: countries.size,
    relationCounts,
    avgGoldstein: Math.round(avgGoldstein * 10) / 10,
  };
}
