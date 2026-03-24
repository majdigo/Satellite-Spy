/**
 * GeoEventBucket — DataBucket adapter for geospatial events.
 *
 * Port of madgic_shared/core/data_bucket.py DataBucket class,
 * specialized for GDELT/ACLED geo-located events.
 *
 * bucket_type = "geo_event"
 * modality = "spatial"
 *
 * S-Agent T1 — Agentic Cognitive UI Sprint
 */

import type { TruthLayer } from "@/types/quantum-data";
import type { GDELTEvent, ConflictEvent } from "@/types";

// ── Interaction types (from data_bucket.py InteractionType) ─────────────────

export type InteractionType =
  | "created"
  | "computed"
  | "enriched"
  | "converted"
  | "validated"
  | "corrected"
  | "aggregated"
  | "projected"
  | "queried"
  | "propagated"
  | "archived";

export type Modality = "financial" | "visual" | "audio" | "spatial" | "textual" | "haptic" | "raw";

// ── Interaction record ──────────────────────────────────────────────────────

export interface Interaction {
  interactionId: string;
  interactionType: InteractionType;
  timestamp: string;
  agentId: string;       // "S-Agent", "GDELT-feed", "ACLED-feed", "user"
  agentType: "ai_agent" | "human" | "sensor" | "algorithm" | "feed";
  method: string;        // "gdelt_ingest", "acled_ingest", "anomaly_detect"
  confidenceBefore: number;
  confidenceAfter: number;
  modalityBefore?: Modality;
  modalityAfter?: Modality;
}

// ── GeoEventBucket (DataBucket for geospatial events) ───────────────────────

export interface GeoEventBucket {
  // Identity
  id: string;
  label: string;
  bucketType: "geo_event";

  // State
  value: number | string;
  unit: string;
  truthLayer: TruthLayer;
  confidence: number;
  modality: Modality;

  // Geo-specific properties
  properties: {
    lat: number;
    lon: number;
    country: string;
    actors: string[];
    eventType: string;        // PLOVER type or ACLED event type
    goldsteinScale: number;   // -10 to +10
    tone: number;             // -100 to +100
    numMentions: number;
    severity: "low" | "medium" | "high" | "critical";
    sourceFeed: "GDELT" | "ACLED" | "USGS" | "computed";
    sourceUrl?: string;
    [key: string]: unknown;
  };

  // Graph edges
  links: Array<{
    target: string;
    relation: string;  // "SAME_LOCATION", "SAME_ACTOR", "TEMPORAL_SEQUENCE", "CAUSAL"
  }>;

  // Trajectory (interaction journal)
  interactions: Interaction[];

  // Metadata
  createdAt: string;
  createdBy: string;
}

// ── Visual projection (spatial → visual via ModalityConverter logic) ─────────

export interface GeoVisualProjection {
  color: string;          // Truth layer color
  opacity: number;        // Confidence mapped to opacity
  size: number;           // Goldstein magnitude → marker size
  glowColor?: string;     // Red glow for critical anomalies
  glowIntensity: number;  // 0-1
  pulse: boolean;         // Animate if recent (<5 min)
}

// Truth layer → color (from modality_converter.py TRUTH_LAYER_COLORS)
const TRUTH_LAYER_COLORS: Record<TruthLayer, string> = {
  OBSERVED: "#2D6A4F",         // Bayati green
  COMPUTED: "#1B4965",         // Rast blue
  ESTIMATED: "#E76F51",        // Hijaz orange
  MARKET_REFERENCE: "#6C567B", // Nahawand purple
};

/**
 * Convert a GeoEventBucket to visual projection properties.
 * Implements the spatial→visual conversion from ModalityConverter.
 */
export function projectToVisual(bucket: GeoEventBucket): GeoVisualProjection {
  const color = TRUTH_LAYER_COLORS[bucket.truthLayer] || TRUTH_LAYER_COLORS.OBSERVED;
  const opacity = 0.4 + Math.min(1, Math.max(0, bucket.confidence)) * 0.6;
  const goldsteinMag = Math.abs(bucket.properties.goldsteinScale);
  const size = 4 + goldsteinMag * 0.8; // 4px base + scale by magnitude

  const isCritical = bucket.properties.severity === "critical";
  const isRecent = (Date.now() - new Date(bucket.createdAt).getTime()) < 5 * 60 * 1000;

  return {
    color,
    opacity,
    size: Math.min(16, size),
    glowColor: isCritical ? "#E63946" : undefined,
    glowIntensity: isCritical ? 0.8 : 0,
    pulse: isRecent || isCritical,
  };
}

// ── Factory functions ───────────────────────────────────────────────────────

let bucketCounter = 0;

/**
 * Create a GeoEventBucket from a GDELT event.
 */
export function gdeltToBucket(event: GDELTEvent): GeoEventBucket {
  const id = `geo-bucket-gdelt-${event.globalEventId}`;
  const severity = event.goldsteinScale < -7 ? "critical"
    : event.goldsteinScale < -3 ? "high"
    : event.goldsteinScale < 0 ? "medium"
    : "low" as const;

  const now = new Date().toISOString();

  return {
    id,
    label: event.title || `GDELT ${event.eventCode}`,
    bucketType: "geo_event",
    value: event.goldsteinScale,
    unit: "goldstein",
    truthLayer: "OBSERVED",
    confidence: Math.min(1, event.numSources / 20), // More sources = higher confidence
    modality: "spatial",
    properties: {
      lat: event.latitude,
      lon: event.longitude,
      country: event.country,
      actors: [event.actor1?.name, event.actor2?.name].filter(Boolean) as string[],
      eventType: event.quadClass,
      goldsteinScale: event.goldsteinScale,
      tone: event.avgTone,
      numMentions: event.numMentions,
      severity,
      sourceFeed: "GDELT",
      sourceUrl: event.sourceUrl,
    },
    links: [],
    interactions: [{
      interactionId: `int-${++bucketCounter}`,
      interactionType: "created",
      timestamp: now,
      agentId: "GDELT-feed",
      agentType: "feed",
      method: "gdelt_ingest",
      confidenceBefore: 0,
      confidenceAfter: Math.min(1, event.numSources / 20),
    }],
    createdAt: event.dateAdded || now,
    createdBy: "S-Agent",
  };
}

/**
 * Create a GeoEventBucket from an ACLED conflict event.
 */
export function acledToBucket(conflict: ConflictEvent): GeoEventBucket {
  const id = `geo-bucket-acled-${conflict.id}`;
  const confidence = conflict.source === "ACLED" ? 0.85 : 0.6;
  const now = new Date().toISOString();

  // Map ACLED severity to goldstein-like scale
  const goldsteinMap: Record<string, number> = {
    critical: -9, high: -6, medium: -3, low: -1,
  };

  return {
    id,
    label: `${conflict.eventType}: ${conflict.location}`,
    bucketType: "geo_event",
    value: goldsteinMap[conflict.severity] ?? -3,
    unit: "goldstein_equiv",
    truthLayer: "OBSERVED",
    confidence,
    modality: "spatial",
    properties: {
      lat: conflict.latitude,
      lon: conflict.longitude,
      country: conflict.country,
      actors: conflict.actors,
      eventType: conflict.eventType,
      goldsteinScale: goldsteinMap[conflict.severity] ?? -3,
      tone: conflict.fatalities > 0 ? -Math.min(10, conflict.fatalities) : -2,
      numMentions: 0,
      severity: conflict.severity,
      sourceFeed: "ACLED",
      fatalities: conflict.fatalities,
      subEventType: conflict.subEventType,
      region: conflict.region,
    },
    links: [],
    interactions: [{
      interactionId: `int-${++bucketCounter}`,
      interactionType: "created",
      timestamp: now,
      agentId: "ACLED-feed",
      agentType: "feed",
      method: "acled_ingest",
      confidenceBefore: 0,
      confidenceAfter: confidence,
    }],
    createdAt: conflict.date || now,
    createdBy: "S-Agent",
  };
}

/**
 * Record a PROJECTED interaction (bucket was shown in UI).
 */
export function recordProjection(bucket: GeoEventBucket, viewId: string): void {
  bucket.interactions.push({
    interactionId: `int-${++bucketCounter}`,
    interactionType: "projected",
    timestamp: new Date().toISOString(),
    agentId: viewId,
    agentType: "ai_agent",
    method: "globe_render",
    confidenceBefore: bucket.confidence,
    confidenceAfter: bucket.confidence,
    modalityBefore: bucket.modality,
    modalityAfter: "visual",
  });
}

/**
 * Record a QUERIED interaction (user clicked/hovered the bucket).
 */
export function recordQuery(bucket: GeoEventBucket, userId: string = "user"): void {
  bucket.interactions.push({
    interactionId: `int-${++bucketCounter}`,
    interactionType: "queried",
    timestamp: new Date().toISOString(),
    agentId: userId,
    agentType: "human",
    method: "click",
    confidenceBefore: bucket.confidence,
    confidenceAfter: bucket.confidence,
  });
}

/**
 * Reset the internal counter (for testing).
 */
export function resetBucketCounter(): void {
  bucketCounter = 0;
}
