// ============================================================================
// Satellite-Spy — GeoEventQuantumData
// Domain-specific extension of QuantumData for geopolitical events.
// ============================================================================

import type { QuantumData, QuantumSource, TruthLayer } from "./quantum-data";

/**
 * PLOVER event classification — 16 types from the PLOVER ontology.
 * Used to classify geopolitical events in the knowledge graph.
 */
export type PLOVEREventType =
  | "AGREE"          // formal agreement
  | "CONSULT"        // diplomatic consultation
  | "SUPPORT"        // material or verbal support
  | "COOPERATE"      // active cooperation
  | "AID"            // humanitarian or military aid
  | "PROTEST"        // non-violent protest
  | "REJECT"         // rejection or refusal
  | "THREATEN"       // verbal threat
  | "SANCTION"       // economic or diplomatic sanction
  | "MOBILIZE"       // military mobilization
  | "COERCE"         // coercive action
  | "ASSAULT"        // physical assault / battle
  | "FIGHT"          // armed conflict
  | "SEIZE"          // territory or asset seizure
  | "FORCE"          // use of force
  | "UNKNOWN";       // unclassified

/**
 * Severity level for geopolitical events.
 */
export type GeoSeverity = "low" | "medium" | "high" | "critical";

/**
 * Source feed identifier.
 */
export type SourceFeed = "GDELT" | "ACLED" | "USGS" | "RELIEFWEB" | "SENTINEL" | "MANUAL";

/**
 * GeoEventQuantumData — a geopolitical event as a QuantumData node.
 *
 * Extends the base QuantumData interface with geospatial and event-specific fields.
 * In the Madgic graph, a GeoEvent is a node that can link to:
 *   - Countries (entity type: country)
 *   - Markets (via market correlation — cross-project with Harissa)
 *   - Suppliers (via supply chain risk — cross-project with Masar)
 *   - Other GeoEvents (escalation chains, causal sequences)
 */
export interface GeoEventQuantumData extends QuantumData {
  // Geospatial
  latitude: number;
  longitude: number;
  country: string;
  region?: string;
  location?: string;

  // Event classification
  eventType: PLOVEREventType;
  severity: GeoSeverity;
  sourceFeed: SourceFeed;

  // GDELT-specific (optional)
  goldsteinScale?: number;      // -10 to +10 (conflict intensity)
  tone?: number;                // -100 to +100 (media sentiment)
  numMentions?: number;
  numSources?: number;
  quadClass?: "verbal_cooperation" | "material_cooperation" | "verbal_conflict" | "material_conflict";

  // ACLED-specific (optional)
  fatalities?: number;
  actors?: string[];
  subEventType?: string;

  // Market correlation (cross-project with Harissa)
  marketImpact?: {
    symbols: string[];
    direction: "bullish" | "bearish" | "volatile";
    magnitude: "minor" | "moderate" | "major";
    confidence: number;
  };
}

/**
 * Factory: convert a GDELT event to GeoEventQuantumData.
 */
export function gdeltToQuantumData(gdelt: {
  globalEventId: string;
  title: string;
  latitude: number;
  longitude: number;
  country: string;
  location: string;
  tone: number;
  goldsteinScale: number;
  numMentions: number;
  numSources: number;
  numArticles: number;
  avgTone: number;
  eventCode: string;
  eventDescription: string;
  quadClass: string;
  sourceUrl: string;
  dateAdded: string;
}): GeoEventQuantumData {
  const severity = classifyGDELTSeverity(gdelt.goldsteinScale, gdelt.numMentions);
  const eventType = mapCAMEOToPLOVER(gdelt.eventCode);

  return {
    id: `gdelt-${gdelt.globalEventId}`,
    label: gdelt.title || gdelt.eventDescription || "Unknown GDELT Event",
    value: gdelt.goldsteinScale,
    unit: "goldstein",
    truthLayer: "OBSERVED" as TruthLayer,
    confidence: computeGDELTConfidence(gdelt.numSources, gdelt.numMentions),
    source: {
      document: "GDELT Event Database",
      feed: "GDELT",
      url: gdelt.sourceUrl,
      fetchedAt: new Date().toISOString(),
    } as QuantumSource,
    concept: `plover:${eventType}`,
    period: gdelt.dateAdded,
    explanation: `GDELT event: ${gdelt.eventDescription}. Goldstein=${gdelt.goldsteinScale}, Tone=${gdelt.avgTone}, ${gdelt.numSources} sources.`,
    links: [],
    inputs: [],
    createdAt: new Date().toISOString(),
    createdBy: "satellite-spy:gdelt-ingest",

    // Geo fields
    latitude: gdelt.latitude,
    longitude: gdelt.longitude,
    country: gdelt.country,
    location: gdelt.location,

    // Event fields
    eventType,
    severity,
    sourceFeed: "GDELT",
    goldsteinScale: gdelt.goldsteinScale,
    tone: gdelt.avgTone,
    numMentions: gdelt.numMentions,
    numSources: gdelt.numSources,
    quadClass: gdelt.quadClass as GeoEventQuantumData["quadClass"],
  };
}

/**
 * Factory: convert an ACLED conflict event to GeoEventQuantumData.
 */
export function acledToQuantumData(acled: {
  id: string;
  date: string;
  eventType: string;
  subEventType: string;
  actors: string[];
  location: string;
  latitude: number;
  longitude: number;
  country: string;
  region: string;
  fatalities: number;
  notes: string;
  source: string;
  severity: string;
}): GeoEventQuantumData {
  const eventType = mapACLEDToPLOVER(acled.eventType);

  return {
    id: `acled-${acled.id}`,
    label: `${acled.eventType} in ${acled.location}, ${acled.country}`,
    value: acled.fatalities,
    unit: "fatalities",
    truthLayer: "OBSERVED" as TruthLayer,
    confidence: 0.9, // ACLED uses field researchers — high confidence
    source: {
      document: "ACLED Conflict Database",
      feed: "ACLED",
      agent: acled.source,
      fetchedAt: new Date().toISOString(),
    } as QuantumSource,
    concept: `plover:${eventType}`,
    period: acled.date,
    explanation: acled.notes,
    links: [],
    inputs: [],
    createdAt: new Date().toISOString(),
    createdBy: "satellite-spy:acled-ingest",

    // Geo fields
    latitude: acled.latitude,
    longitude: acled.longitude,
    country: acled.country,
    region: acled.region,
    location: acled.location,

    // Event fields
    eventType,
    severity: acled.severity as GeoSeverity,
    sourceFeed: "ACLED",
    fatalities: acled.fatalities,
    actors: acled.actors,
    subEventType: acled.subEventType,
  };
}

// ── Helper functions ─────────────────────────────────────────────────────────

function classifyGDELTSeverity(goldstein: number, mentions: number): GeoSeverity {
  const absGold = Math.abs(goldstein);
  if (absGold >= 8 || mentions > 500) return "critical";
  if (absGold >= 5 || mentions > 100) return "high";
  if (absGold >= 2 || mentions > 20) return "medium";
  return "low";
}

function computeGDELTConfidence(numSources: number, numMentions: number): number {
  // More sources = higher confidence, capped at 0.95 (never 1.0 for media data)
  const sourceScore = Math.min(0.5, numSources * 0.05);
  const mentionScore = Math.min(0.45, numMentions * 0.005);
  return Math.min(0.95, 0.3 + sourceScore + mentionScore);
}

function mapCAMEOToPLOVER(cameoCode: string): PLOVEREventType {
  const code = parseInt(cameoCode, 10);
  if (isNaN(code)) return "UNKNOWN";

  // CAMEO root codes → PLOVER mapping
  if (code >= 1 && code <= 5) return "COOPERATE";
  if (code === 6) return "AID";
  if (code === 7) return "CONSULT";
  if (code === 8) return "SUPPORT";
  if (code === 9) return "AGREE";
  if (code === 10) return "REJECT";
  if (code === 11) return "PROTEST";
  if (code === 12) return "THREATEN";
  if (code === 13) return "SANCTION";
  if (code === 14) return "PROTEST"; // CAMEO 14 = protest
  if (code === 15) return "MOBILIZE";
  if (code === 16) return "COERCE";
  if (code === 17) return "ASSAULT";
  if (code === 18) return "FIGHT";
  if (code === 19) return "SEIZE";
  if (code === 20) return "FORCE";
  return "UNKNOWN";
}

function mapACLEDToPLOVER(acledType: string): PLOVEREventType {
  switch (acledType.toLowerCase()) {
    case "battle": return "FIGHT";
    case "explosion": return "ASSAULT";
    case "violence_against_civilians": return "FORCE";
    case "protest": return "PROTEST";
    case "riot": return "PROTEST";
    case "strategic_development": return "MOBILIZE";
    default: return "UNKNOWN";
  }
}
