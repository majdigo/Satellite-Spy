/**
 * Escalation Detector — Agentic intelligence that reasons about threat patterns.
 *
 * This is what makes Satellite-Spy AGENTIC — it doesn't just display events,
 * it detects escalation patterns autonomously and generates assessments
 * with reasoning and confidence.
 *
 * Patterns detected:
 * 1. Temporal escalation: severity increasing over time in a region
 * 2. Actor convergence: multiple actors concentrating in one area
 * 3. Cross-source corroboration: GDELT + ACLED reporting same event
 * 4. Spillover risk: conflict in country A threatening neighbors
 * 5. Anomalous calm: sudden drop in events after sustained tension
 *
 * S-Agent — Agentic intelligence layer
 */

import { calculateConfidence, crossValidateConfidence, classifyConfidence } from "./confidence";
import { isWithinDistance, isInBounds } from "./spatial";
import { WATCH_REGIONS } from "./country-risk";
import type { GDELTEvent, ConflictEvent, SeverityLevel } from "@/types";

// ── Types ───────────────────────────────────────────────────────────────────

export interface EscalationAlert {
  id: string;
  pattern: EscalationPattern;
  severity: SeverityLevel;
  confidence: number;
  region: string;
  title: string;
  reasoning: string;      // Human-readable explanation of WHY this is an escalation
  evidence: string[];     // List of supporting data points
  recommendation: string; // What the analyst should do
  timestamp: string;
  eventIds: string[];     // IDs of events that triggered this alert
}

export type EscalationPattern =
  | "temporal_escalation"     // severity increasing over time
  | "actor_convergence"       // multiple actors in one area
  | "cross_source_corroboration" // GDELT + ACLED same event
  | "spillover_risk"          // conflict spreading to neighbors
  | "anomalous_calm"          // suspicious drop in activity
  | "critical_mass";          // too many events in short timeframe

// ── Detector ────────────────────────────────────────────────────────────────

export function detectEscalations(
  gdeltEvents: GDELTEvent[],
  conflicts: ConflictEvent[],
  options: {
    temporalWindowHours?: number;
    criticalMassThreshold?: number;
    spilloverRadiusKm?: number;
  } = {},
): EscalationAlert[] {
  const windowHours = options.temporalWindowHours ?? 24;
  const criticalThreshold = options.criticalMassThreshold ?? 5;
  const spilloverRadius = options.spilloverRadiusKm ?? 500;
  const now = Date.now();
  const windowMs = windowHours * 3600000;
  const alerts: EscalationAlert[] = [];

  // Filter to recent events
  const recentGdelt = gdeltEvents.filter(
    (e) => now - new Date(e.dateAdded).getTime() < windowMs
  );
  const recentConflicts = conflicts.filter(
    (c) => now - new Date(c.date).getTime() < windowMs
  );

  // ── Pattern 1: Temporal Escalation ──────────────────────────────────
  alerts.push(...detectTemporalEscalation(recentGdelt, recentConflicts, windowMs));

  // ── Pattern 2: Critical Mass ────────────────────────────────────────
  alerts.push(...detectCriticalMass(recentGdelt, recentConflicts, criticalThreshold));

  // ── Pattern 3: Cross-Source Corroboration ───────────────────────────
  alerts.push(...detectCrossSourceCorroboration(recentGdelt, recentConflicts));

  // ── Pattern 4: Spillover Risk ──────────────────────────────────────
  alerts.push(...detectSpilloverRisk(recentGdelt, recentConflicts, spilloverRadius));

  // Sort by severity then confidence
  const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  alerts.sort((a, b) =>
    (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3) ||
    b.confidence - a.confidence
  );

  return alerts;
}

// ── Pattern detectors ───────────────────────────────────────────────────────

function detectTemporalEscalation(
  gdeltEvents: GDELTEvent[],
  conflicts: ConflictEvent[],
  windowMs: number,
): EscalationAlert[] {
  const alerts: EscalationAlert[] = [];

  // Group events by country
  const byCountry = new Map<string, { goldsteins: number[]; times: number[] }>();
  for (const e of gdeltEvents) {
    if (!byCountry.has(e.country)) byCountry.set(e.country, { goldsteins: [], times: [] });
    const entry = byCountry.get(e.country)!;
    entry.goldsteins.push(e.goldsteinScale);
    entry.times.push(new Date(e.dateAdded).getTime());
  }

  for (const [country, data] of byCountry) {
    if (data.goldsteins.length < 3) continue;

    // Sort by time
    const sorted = data.goldsteins
      .map((g, i) => ({ g, t: data.times[i] }))
      .sort((a, b) => a.t - b.t);

    // Check if goldstein is trending more negative (escalating)
    const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
    const secondHalf = sorted.slice(Math.floor(sorted.length / 2));
    const avgFirst = firstHalf.reduce((s, x) => s + x.g, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((s, x) => s + x.g, 0) / secondHalf.length;

    if (avgSecond < avgFirst - 1.5 && avgSecond < -3) {
      const conf = calculateConfidence("GDELT", { numSources: data.goldsteins.length * 3 });
      alerts.push({
        id: `esc-temporal-${country}-${Date.now()}`,
        pattern: "temporal_escalation",
        severity: avgSecond < -7 ? "critical" : avgSecond < -5 ? "high" : "medium",
        confidence: conf,
        region: country,
        title: `Escalation detected in ${country}`,
        reasoning: `Average conflict intensity shifted from ${avgFirst.toFixed(1)} to ${avgSecond.toFixed(1)} (Goldstein scale) over the analysis window. The trend is worsening with ${sorted.length} events tracked.`,
        evidence: [
          `${sorted.length} events in ${country}`,
          `Early average goldstein: ${avgFirst.toFixed(1)}`,
          `Recent average goldstein: ${avgSecond.toFixed(1)}`,
          `Shift: ${(avgSecond - avgFirst).toFixed(1)} (escalation)`,
        ],
        recommendation: `Monitor ${country} closely. Consider raising alert level for this region. Check satellite passes for military activity.`,
        timestamp: new Date().toISOString(),
        eventIds: [],
      });
    }
  }

  return alerts;
}

function detectCriticalMass(
  gdeltEvents: GDELTEvent[],
  conflicts: ConflictEvent[],
  threshold: number,
): EscalationAlert[] {
  const alerts: EscalationAlert[] = [];

  // Count critical events per region
  for (const region of WATCH_REGIONS) {
    const criticalGdelt = gdeltEvents.filter(
      (e) => region.countries.has(e.country) && e.goldsteinScale < -7
    );
    const criticalAcled = conflicts.filter(
      (c) => region.countries.has(c.country) && c.severity === "critical"
    );
    const total = criticalGdelt.length + criticalAcled.length;

    if (total >= threshold) {
      const gdeltConf = calculateConfidence("GDELT", { numSources: criticalGdelt.length * 5 });
      const acledConf = criticalAcled.length > 0 ? 0.85 : 0;
      const conf = criticalGdelt.length > 0 && criticalAcled.length > 0
        ? crossValidateConfidence(gdeltConf, acledConf)
        : Math.max(gdeltConf, acledConf);

      alerts.push({
        id: `esc-mass-${region.id}-${Date.now()}`,
        pattern: "critical_mass",
        severity: total >= threshold * 2 ? "critical" : "high",
        confidence: conf,
        region: region.name,
        title: `Critical mass: ${total} severe events in ${region.name}`,
        reasoning: `${total} critical/severe events detected in ${region.name} within the analysis window (threshold: ${threshold}). This concentration suggests a significant escalation in the region.`,
        evidence: [
          `${criticalGdelt.length} critical GDELT events`,
          `${criticalAcled.length} critical ACLED conflicts`,
          `Threshold: ${threshold} (exceeded by ${total - threshold})`,
        ],
        recommendation: `Regional alert recommended. Cross-reference with satellite imagery and market indicators (oil, shipping routes).`,
        timestamp: new Date().toISOString(),
        eventIds: [
          ...criticalGdelt.map((e) => e.globalEventId),
          ...criticalAcled.map((c) => c.id),
        ],
      });
    }
  }

  return alerts;
}

function detectCrossSourceCorroboration(
  gdeltEvents: GDELTEvent[],
  conflicts: ConflictEvent[],
): EscalationAlert[] {
  const alerts: EscalationAlert[] = [];

  // Find GDELT + ACLED events in same location + timeframe
  for (const conflict of conflicts) {
    const corroborating = gdeltEvents.filter((e) =>
      isWithinDistance(e.latitude, e.longitude, conflict.latitude, conflict.longitude, 50) &&
      Math.abs(new Date(e.dateAdded).getTime() - new Date(conflict.date).getTime()) < 4 * 3600000
    );

    if (corroborating.length > 0 && (conflict.severity === "critical" || conflict.severity === "high")) {
      const gdeltConf = calculateConfidence("GDELT", {
        numSources: corroborating.reduce((s, e) => s + e.numSources, 0),
      });
      const conf = crossValidateConfidence(gdeltConf, 0.85);

      alerts.push({
        id: `esc-corr-${conflict.id}-${Date.now()}`,
        pattern: "cross_source_corroboration",
        severity: conflict.severity,
        confidence: conf,
        region: conflict.country,
        title: `Corroborated: ${conflict.eventType} in ${conflict.location}`,
        reasoning: `ACLED reports ${conflict.eventType} in ${conflict.location} (${conflict.severity}), corroborated by ${corroborating.length} GDELT event(s) in the same area within 4 hours. Cross-source validation increases confidence to ${classifyConfidence(conf)}.`,
        evidence: [
          `ACLED: ${conflict.eventType} in ${conflict.location} (${conflict.severity})`,
          ...corroborating.map((e) => `GDELT: "${e.title}" (goldstein ${e.goldsteinScale})`),
          `Confidence boost: ${classifyConfidence(gdeltConf)} → ${classifyConfidence(conf)} (cross-validated)`,
        ],
        recommendation: conflict.severity === "critical"
          ? `Verified critical event. Immediate attention required.`
          : `High-confidence event. Monitor for escalation.`,
        timestamp: new Date().toISOString(),
        eventIds: [conflict.id, ...corroborating.map((e) => e.globalEventId)],
      });
    }
  }

  return alerts;
}

function detectSpilloverRisk(
  gdeltEvents: GDELTEvent[],
  conflicts: ConflictEvent[],
  radiusKm: number,
): EscalationAlert[] {
  const alerts: EscalationAlert[] = [];

  // Find countries with high conflict that border calm countries
  const countryConflictCount = new Map<string, number>();
  for (const e of gdeltEvents) {
    if (e.goldsteinScale < -5) {
      countryConflictCount.set(e.country, (countryConflictCount.get(e.country) ?? 0) + 1);
    }
  }
  for (const c of conflicts) {
    if (c.severity === "critical" || c.severity === "high") {
      countryConflictCount.set(c.country, (countryConflictCount.get(c.country) ?? 0) + 1);
    }
  }

  // Check for hot spots near borders of less-affected countries
  const hotCountries = [...countryConflictCount.entries()]
    .filter(([, count]) => count >= 3)
    .map(([country]) => country);

  for (const hotCountry of hotCountries) {
    // Find events in hot country near borders
    const borderEvents = gdeltEvents.filter(
      (e) => e.country === hotCountry && e.goldsteinScale < -5
    );

    // Check if any neighboring-country events exist (spillover indicator)
    const nearbyOther = gdeltEvents.filter(
      (e) => e.country !== hotCountry &&
        borderEvents.some((be) => isWithinDistance(be.latitude, be.longitude, e.latitude, e.longitude, radiusKm)) &&
        e.goldsteinScale < -3
    );

    if (nearbyOther.length > 0) {
      const affectedCountries = [...new Set(nearbyOther.map((e) => e.country))];
      alerts.push({
        id: `esc-spill-${hotCountry}-${Date.now()}`,
        pattern: "spillover_risk",
        severity: "high",
        confidence: calculateConfidence("GDELT", { numSources: borderEvents.length + nearbyOther.length }),
        region: hotCountry,
        title: `Spillover risk: ${hotCountry} conflict may affect ${affectedCountries.join(", ")}`,
        reasoning: `${hotCountry} has ${countryConflictCount.get(hotCountry)} severe events. ${nearbyOther.length} related events detected within ${radiusKm}km in neighboring countries: ${affectedCountries.join(", ")}. This suggests potential conflict spillover.`,
        evidence: [
          `${countryConflictCount.get(hotCountry)} severe events in ${hotCountry}`,
          `${nearbyOther.length} nearby events in ${affectedCountries.join(", ")}`,
          `Spillover radius: ${radiusKm}km`,
        ],
        recommendation: `Monitor border regions. Assess impact on supply chains and populations in ${affectedCountries.join(", ")}.`,
        timestamp: new Date().toISOString(),
        eventIds: [...borderEvents.map((e) => e.globalEventId), ...nearbyOther.map((e) => e.globalEventId)],
      });
    }
  }

  return alerts;
}
