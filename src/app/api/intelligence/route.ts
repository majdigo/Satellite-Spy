import { NextRequest, NextResponse } from "next/server";
import { gdeltToBucket, acledToBucket, projectToVisual } from "@/models/GeoEventBucket";
import { computeHeatmap } from "@/lib/anomaly-heatmap";
import { buildGeoEventGraph, graphStats } from "@/lib/geo-event-graph";
import type { GDELTEvent, ConflictEvent } from "@/types";

/**
 * Intelligence API — Unified endpoint combining GDELT + ACLED data
 * with DataBucket conversion, heatmap computation, and graph analysis.
 *
 * GET /api/intelligence
 *   ?format=buckets   → GeoEventBuckets with visual projections
 *   ?format=heatmap   → Spatial aggregation heatmap cells
 *   ?format=graph     → Force graph (nodes + links)
 *   ?format=full      → All of the above (default)
 *   ?maxEvents=100    → Limit number of events processed
 *
 * S-Agent Phase 4 — Agentic Cognitive UI
 */

// Internal fetch helpers — call sibling routes
async function fetchGDELT(baseUrl: string): Promise<GDELTEvent[]> {
  try {
    const res = await fetch(`${baseUrl}/api/gdelt?timespan=24h&maxpoints=200`, {
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.events || [];
  } catch {
    return [];
  }
}

async function fetchACLED(baseUrl: string): Promise<ConflictEvent[]> {
  try {
    const res = await fetch(`${baseUrl}/api/acled?limit=200`, {
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.conflicts || [];
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  const format = request.nextUrl.searchParams.get("format") || "full";
  const maxEvents = parseInt(request.nextUrl.searchParams.get("maxEvents") || "100");
  const baseUrl = request.nextUrl.origin;

  // Fetch data from sibling routes
  const [gdeltEvents, conflicts] = await Promise.all([
    fetchGDELT(baseUrl),
    fetchACLED(baseUrl),
  ]);

  // Convert to GeoEventBuckets
  const allBuckets = [
    ...gdeltEvents.slice(0, maxEvents).map(gdeltToBucket),
    ...conflicts.slice(0, maxEvents).map(acledToBucket),
  ];

  const response: Record<string, unknown> = {
    format,
    totalEvents: gdeltEvents.length + conflicts.length,
    processedBuckets: allBuckets.length,
    fetchedAt: new Date().toISOString(),
  };

  // Buckets with visual projections
  if (format === "buckets" || format === "full") {
    response.buckets = allBuckets.map((b) => ({
      id: b.id,
      label: b.label,
      truthLayer: b.truthLayer,
      confidence: b.confidence,
      severity: b.properties.severity,
      lat: b.properties.lat,
      lon: b.properties.lon,
      country: b.properties.country,
      eventType: b.properties.eventType,
      goldstein: b.properties.goldsteinScale,
      sourceFeed: b.properties.sourceFeed,
      actors: b.properties.actors,
      visual: projectToVisual(b),
      interactionCount: b.interactions.length,
    }));
  }

  // Heatmap
  if (format === "heatmap" || format === "full") {
    response.heatmap = computeHeatmap(gdeltEvents, conflicts);
  }

  // Graph
  if (format === "graph" || format === "full") {
    const graph = buildGeoEventGraph(allBuckets, maxEvents);
    response.graph = {
      nodes: graph.nodes.map((n) => ({
        id: n.id,
        label: n.label,
        lat: n.lat,
        lon: n.lon,
        truthLayer: n.truthLayer,
        severity: n.severity,
        group: n.group,
      })),
      links: graph.links,
      stats: graphStats(graph),
    };
  }

  return NextResponse.json(response);
}
