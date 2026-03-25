/**
 * Country Risk Score API — Cross-domain service for other agents.
 *
 * Exposes geopolitical risk scores per country/region, consumable by:
 * - M-Agent (supply chain risk: supplier country → NMPG scoring)
 * - H-Agent (financial models: country risk premium → WACC adjustment)
 * - P-Agent (document enrichment: contract mentions country → risk overlay)
 *
 * Uses the confidence framework and spatial utilities.
 *
 * Synergie #1: S-Agent → M-Agent
 * Synergie #6: S-Agent + P-Agent
 *
 * S-Agent — Product quality + cross-project integration
 */

import { calculateConfidence, crossValidateConfidence } from "./confidence";
import { isInBounds } from "./spatial";
import type { GDELTEvent, ConflictEvent } from "@/types";

// ── Watch regions ───────────────────────────────────────────────────────────

export interface WatchRegion {
  id: string;
  name: string;
  bounds: { north: number; south: number; east: number; west: number };
  countries: Set<string>;
  riskWeight: number;       // contribution to global risk (0-1)
  crpMultiplier: number;    // % per risk unit for Country Risk Premium
}

export const WATCH_REGIONS: WatchRegion[] = [
  {
    id: "middle_east",
    name: "Middle East & Persian Gulf",
    bounds: { north: 42, south: 12, east: 63, west: 25 },
    countries: new Set(["IRQ", "IRN", "SYR", "YEM", "SAU", "KWT", "BHR", "QAT", "ARE", "OMN",
                        "Iraq", "Iran", "Syria", "Yemen", "Saudi Arabia"]),
    riskWeight: 0.40,
    crpMultiplier: 0.30,
  },
  {
    id: "europe_conflict",
    name: "Europe (conflict zones)",
    bounds: { north: 56, south: 44, east: 42, west: 22 },
    countries: new Set(["UKR", "RUS", "BLR", "POL", "ROU", "MDA",
                        "Ukraine", "Russia", "Belarus"]),
    riskWeight: 0.35,
    crpMultiplier: 0.25,
  },
  {
    id: "asia_pacific",
    name: "Asia-Pacific (Taiwan Strait, Korean Peninsula)",
    bounds: { north: 42, south: 18, east: 145, west: 100 },
    countries: new Set(["TWN", "CHN", "KOR", "PRK", "JPN", "PHL",
                        "Taiwan", "China", "South Korea", "North Korea"]),
    riskWeight: 0.25,
    crpMultiplier: 0.20,
  },
];

// ── Risk scoring ────────────────────────────────────────────────────────────

export interface CountryRiskResult {
  country: string;
  regionId: string;
  regionName: string;
  riskScore: number;        // 0-10
  eventCount: number;
  criticalCount: number;
  confidence: number;
  crpPercent: number;       // Country Risk Premium in %
}

export interface GlobalRiskResult {
  globalScore: number;
  regions: Record<string, { score: number; eventCount: number }>;
  countries: CountryRiskResult[];
  crpPercent: number;
  confidence: number;
}

/**
 * Compute country risk score from GDELT + ACLED events.
 * Consumable by M-Agent (supplier risk) and H-Agent (WACC adjustment).
 */
export function computeCountryRisk(
  gdeltEvents: GDELTEvent[],
  conflicts: ConflictEvent[],
): GlobalRiskResult {
  // Aggregate events by region
  const regionEvents: Record<string, { events: number; critical: number; goldsteinSum: number }> = {};
  const countryEvents: Record<string, { events: number; critical: number; goldsteinSum: number; regionId: string }> = {};

  for (const region of WATCH_REGIONS) {
    regionEvents[region.id] = { events: 0, critical: 0, goldsteinSum: 0 };
  }

  // Process GDELT events
  for (const event of gdeltEvents) {
    for (const region of WATCH_REGIONS) {
      if (region.countries.has(event.country) ||
          isInBounds(event.latitude, event.longitude, region.bounds)) {
        regionEvents[region.id].events++;
        regionEvents[region.id].goldsteinSum += event.goldsteinScale;
        if (event.goldsteinScale < -7) regionEvents[region.id].critical++;

        if (!countryEvents[event.country]) {
          countryEvents[event.country] = { events: 0, critical: 0, goldsteinSum: 0, regionId: region.id };
        }
        countryEvents[event.country].events++;
        countryEvents[event.country].goldsteinSum += event.goldsteinScale;
        if (event.goldsteinScale < -7) countryEvents[event.country].critical++;
      }
    }
  }

  // Process ACLED conflicts
  const severityGoldstein: Record<string, number> = { critical: -9, high: -6, medium: -3, low: -1 };
  for (const conflict of conflicts) {
    for (const region of WATCH_REGIONS) {
      if (region.countries.has(conflict.country)) {
        const gs = severityGoldstein[conflict.severity] ?? -3;
        regionEvents[region.id].events++;
        regionEvents[region.id].goldsteinSum += gs;
        if (conflict.severity === "critical") regionEvents[region.id].critical++;

        if (!countryEvents[conflict.country]) {
          countryEvents[conflict.country] = { events: 0, critical: 0, goldsteinSum: 0, regionId: region.id };
        }
        countryEvents[conflict.country].events++;
        countryEvents[conflict.country].goldsteinSum += gs;
        if (conflict.severity === "critical") countryEvents[conflict.country].critical++;
      }
    }
  }

  // Compute regional risk scores (0-10)
  const regionScores: Record<string, { score: number; eventCount: number }> = {};
  let globalScore = 0;

  for (const region of WATCH_REGIONS) {
    const data = regionEvents[region.id];
    // Score = weighted combination of event count and severity
    const severityScore = data.events > 0
      ? Math.abs(data.goldsteinSum / data.events) * 1.5
      : 0;
    const countScore = Math.min(5, data.events * 0.5);
    const criticalBoost = data.critical * 1.0;
    const score = Math.min(10, severityScore + countScore + criticalBoost);

    regionScores[region.id] = { score, eventCount: data.events };
    globalScore += score * region.riskWeight;
  }

  // Compute per-country results
  const countries: CountryRiskResult[] = [];
  for (const [country, data] of Object.entries(countryEvents)) {
    const region = WATCH_REGIONS.find((r) => r.id === data.regionId);
    const regionData = regionScores[data.regionId];
    const confidence = calculateConfidence("GDELT", { numSources: data.events });

    countries.push({
      country,
      regionId: data.regionId,
      regionName: region?.name ?? "Unknown",
      riskScore: Math.min(10, Math.abs(data.goldsteinSum / Math.max(1, data.events)) + data.critical * 2),
      eventCount: data.events,
      criticalCount: data.critical,
      confidence,
      crpPercent: (region?.crpMultiplier ?? 0.2) * (regionData?.score ?? 0),
    });
  }

  // Global CRP
  const globalCrp = WATCH_REGIONS.reduce((sum, r) => {
    const rs = regionScores[r.id];
    return sum + (rs?.score ?? 0) * r.crpMultiplier * r.riskWeight;
  }, 0);

  return {
    globalScore: Math.min(10, globalScore),
    regions: regionScores,
    countries: countries.sort((a, b) => b.riskScore - a.riskScore),
    crpPercent: globalCrp,
    confidence: countries.length > 0
      ? countries.reduce((s, c) => s + c.confidence, 0) / countries.length
      : 0.5,
  };
}

/**
 * Get risk score for a specific country.
 * This is the API that M-Agent consumes for supplier risk scoring.
 */
export function getCountryRiskScore(
  country: string,
  gdeltEvents: GDELTEvent[],
  conflicts: ConflictEvent[],
): CountryRiskResult | null {
  const result = computeCountryRisk(gdeltEvents, conflicts);
  return result.countries.find((c) => c.country === country) ?? null;
}
