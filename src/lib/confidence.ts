/**
 * Unified Confidence Framework — Single source of truth for all confidence calculations.
 *
 * Every data point in Satellite-Spy carries a confidence score (0-1).
 * This module standardizes how confidence is:
 * - Assigned at ingestion (from source characteristics)
 * - Propagated through computation chains
 * - Boosted by cross-source validation
 * - Degraded by computation steps
 * - Mapped to visual channels (opacity, color, badge)
 *
 * S-Agent — Product quality refactoring
 */

// ── Source confidence profiles ──────────────────────────────────────────────

export interface SourceProfile {
  name: string;
  baseConfidence: number;
  maxConfidence: number;
  confidenceFn: (metadata: SourceMetadata) => number;
}

export interface SourceMetadata {
  numSources?: number;
  numMentions?: number;
  recencyHours?: number;
  isVerified?: boolean;
  hasCoordinates?: boolean;
}

/**
 * GDELT: confidence increases with number of independent sources.
 * 1 source = 0.15, 5 sources = 0.40, 10 = 0.65, 20+ = 1.0
 * Logarithmic scaling — diminishing returns after 10 sources.
 */
function gdeltConfidence(meta: SourceMetadata): number {
  const sources = meta.numSources ?? 1;
  const mentions = meta.numMentions ?? 1;
  const hasCoords = meta.hasCoordinates ?? false;

  // Log-scaled source confidence (1→0.15, 5→0.40, 10→0.65, 20→0.85)
  let conf = Math.min(1.0, Math.log2(sources + 1) / Math.log2(21));

  // Mentions boost (minor, +0.05 per 50 mentions, max +0.1)
  conf += Math.min(0.1, mentions / 500);

  // Coordinate penalty — DOC API (no coords) gets -0.1
  if (!hasCoords) conf -= 0.1;

  // Recency penalty — older events lose confidence
  const hours = meta.recencyHours ?? 0;
  if (hours > 48) conf *= 0.9;
  if (hours > 168) conf *= 0.8;  // > 1 week

  return Math.max(0.05, Math.min(1.0, conf));
}

/**
 * ACLED: high base confidence (curated data), varies by verification.
 * Verified ACLED events = 0.85, unverified = 0.65.
 */
function acledConfidence(meta: SourceMetadata): number {
  return meta.isVerified !== false ? 0.85 : 0.65;
}

/**
 * USGS: very high confidence (seismometer data).
 */
function usgsConfidence(_meta: SourceMetadata): number {
  return 0.95;
}

/**
 * Satellite TLE: high confidence with small positional uncertainty.
 */
function satelliteConfidence(_meta: SourceMetadata): number {
  return 0.90;
}

/**
 * OpenSky ADS-B: high confidence for recent data.
 */
function aircraftConfidence(meta: SourceMetadata): number {
  const hours = meta.recencyHours ?? 0;
  return hours < 1 ? 0.90 : hours < 4 ? 0.75 : 0.50;
}

/**
 * Computed values: confidence degrades through the computation chain.
 */
function computedConfidence(meta: SourceMetadata): number {
  return meta.baseConfidence ?? 0.7;
}

// ── Source profiles registry ────────────────────────────────────────────────

export const SOURCE_PROFILES: Record<string, SourceProfile> = {
  GDELT: {
    name: "GDELT Project",
    baseConfidence: 0.40,
    maxConfidence: 1.0,
    confidenceFn: gdeltConfidence,
  },
  ACLED: {
    name: "Armed Conflict Location & Event Data",
    baseConfidence: 0.85,
    maxConfidence: 0.95,
    confidenceFn: acledConfidence,
  },
  USGS: {
    name: "US Geological Survey",
    baseConfidence: 0.95,
    maxConfidence: 0.99,
    confidenceFn: usgsConfidence,
  },
  SATELLITE: {
    name: "NORAD TLE Data",
    baseConfidence: 0.90,
    maxConfidence: 0.95,
    confidenceFn: satelliteConfidence,
  },
  AIRCRAFT: {
    name: "OpenSky ADS-B Network",
    baseConfidence: 0.85,
    maxConfidence: 0.95,
    confidenceFn: aircraftConfidence,
  },
  COMPUTED: {
    name: "Computed/Derived",
    baseConfidence: 0.70,
    maxConfidence: 0.98,
    confidenceFn: computedConfidence,
  },
};

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Calculate confidence for a data point from a given source.
 */
export function calculateConfidence(source: string, metadata: SourceMetadata = {}): number {
  const profile = SOURCE_PROFILES[source];
  if (!profile) return 0.50; // unknown source
  return Math.min(profile.maxConfidence, profile.confidenceFn(metadata));
}

/**
 * Propagate confidence through a computation step.
 * Result confidence = min(input confidences) × degradation factor.
 */
export function propagateConfidence(
  inputConfidences: number[],
  degradation: number = 0.98,
): number {
  if (inputConfidences.length === 0) return 0.5;
  const minConf = Math.min(...inputConfidences);
  return Math.round(minConf * degradation * 10000) / 10000;
}

/**
 * Boost confidence when two independent sources corroborate.
 * Uses Bayesian update: posterior = 1 - (1 - conf_a)(1 - conf_b)
 */
export function crossValidateConfidence(confA: number, confB: number): number {
  // Bayesian: probability at least one is correct
  const combined = 1 - (1 - confA) * (1 - confB);
  return Math.min(0.99, combined);
}

/**
 * Map confidence to visual opacity (0.4 - 1.0 range for visibility).
 */
export function confidenceToOpacity(confidence: number): number {
  return 0.4 + Math.min(1, Math.max(0, confidence)) * 0.6;
}

/**
 * Classify confidence into discrete levels for badges/labels.
 */
export type ConfidenceLevel = "high" | "medium" | "low" | "unknown";

export function classifyConfidence(confidence: number | undefined): ConfidenceLevel {
  if (confidence === undefined || confidence === null) return "unknown";
  if (confidence >= 0.85) return "high";
  if (confidence >= 0.60) return "medium";
  return "low";
}
