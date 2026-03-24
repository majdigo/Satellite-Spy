/**
 * Alert Threshold System — S1-07
 *
 * Configurable thresholds that emit CrossIntelAlerts when conditions are met.
 * Evaluated on each data refresh cycle.
 */

import type { GDELTEvent, ConflictEvent, MarketData, CrossIntelligenceAlert, SeverityLevel } from "@/types";

// ── Threshold configuration ─────────────────────────────────────────────────

export interface AlertThreshold {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: ThresholdCondition[];
  severity: SeverityLevel;
  cooldownMs: number; // Minimum time between alerts of this type
}

export type ThresholdCondition =
  | { type: "goldstein_below"; value: number }
  | { type: "goldstein_above"; value: number }
  | { type: "mentions_above"; value: number }
  | { type: "tone_below"; value: number }
  | { type: "fatalities_above"; value: number }
  | { type: "conflict_count_above"; value: number; regionFilter?: string }
  | { type: "market_change_above"; value: number; symbol?: string }
  | { type: "volume_ratio_above"; value: number };

// Default thresholds (inspired by intelligence analyst best practices)
export const DEFAULT_THRESHOLDS: AlertThreshold[] = [
  {
    id: "th-escalation",
    name: "Conflict Escalation",
    description: "GDELT event with Goldstein < -5 AND > 50 mentions",
    enabled: true,
    conditions: [
      { type: "goldstein_below", value: -5 },
      { type: "mentions_above", value: 50 },
    ],
    severity: "high",
    cooldownMs: 300_000, // 5 min
  },
  {
    id: "th-critical-conflict",
    name: "Critical Conflict",
    description: "GDELT event with Goldstein < -8 (use of force, war)",
    enabled: true,
    conditions: [
      { type: "goldstein_below", value: -8 },
    ],
    severity: "critical",
    cooldownMs: 600_000, // 10 min
  },
  {
    id: "th-media-surge",
    name: "Media Surge",
    description: "Event with > 200 mentions (viral geopolitical event)",
    enabled: true,
    conditions: [
      { type: "mentions_above", value: 200 },
    ],
    severity: "medium",
    cooldownMs: 600_000,
  },
  {
    id: "th-mass-casualty",
    name: "Mass Casualty Event",
    description: "Conflict event with > 10 fatalities",
    enabled: true,
    conditions: [
      { type: "fatalities_above", value: 10 },
    ],
    severity: "critical",
    cooldownMs: 900_000, // 15 min
  },
  {
    id: "th-negative-sentiment",
    name: "Extreme Negative Sentiment",
    description: "GDELT event with tone < -8",
    enabled: true,
    conditions: [
      { type: "tone_below", value: -8 },
    ],
    severity: "medium",
    cooldownMs: 600_000,
  },
  {
    id: "th-market-shock",
    name: "Market Shock",
    description: "Commodity/index moves > 5% in one cycle",
    enabled: true,
    conditions: [
      { type: "market_change_above", value: 5 },
    ],
    severity: "high",
    cooldownMs: 300_000,
  },
  {
    id: "th-volume-anomaly",
    name: "Suspicious Volume",
    description: "Trading volume > 3x average (possible insider activity)",
    enabled: true,
    conditions: [
      { type: "volume_ratio_above", value: 3 },
    ],
    severity: "high",
    cooldownMs: 600_000,
  },
];

// ── Evaluation engine ───────────────────────────────────────────────────────

const lastAlertTimes = new Map<string, number>();

export interface ThresholdEvalInput {
  gdeltEvents: GDELTEvent[];
  conflicts: ConflictEvent[];
  marketData: MarketData[];
}

export interface ThresholdAlert {
  thresholdId: string;
  thresholdName: string;
  severity: SeverityLevel;
  title: string;
  description: string;
  matchedConditions: string[];
  timestamp: Date;
}

/**
 * Evaluate all enabled thresholds against current data.
 * Returns alerts for thresholds that are triggered and not in cooldown.
 */
export function evaluateThresholds(
  input: ThresholdEvalInput,
  thresholds: AlertThreshold[] = DEFAULT_THRESHOLDS,
): ThresholdAlert[] {
  const alerts: ThresholdAlert[] = [];
  const now = Date.now();

  for (const threshold of thresholds) {
    if (!threshold.enabled) continue;

    // Check cooldown
    const lastFired = lastAlertTimes.get(threshold.id) || 0;
    if (now - lastFired < threshold.cooldownMs) continue;

    const matches = evaluateConditions(threshold.conditions, input);
    if (matches.length > 0) {
      alerts.push({
        thresholdId: threshold.id,
        thresholdName: threshold.name,
        severity: threshold.severity,
        title: `THRESHOLD: ${threshold.name}`,
        description: `${threshold.description}. Matched: ${matches.join("; ")}`,
        matchedConditions: matches,
        timestamp: new Date(),
      });
      lastAlertTimes.set(threshold.id, now);
    }
  }

  return alerts;
}

function evaluateConditions(
  conditions: ThresholdCondition[],
  input: ThresholdEvalInput,
): string[] {
  const matches: string[] = [];

  for (const cond of conditions) {
    switch (cond.type) {
      case "goldstein_below": {
        const events = input.gdeltEvents.filter((e) => e.goldsteinScale < cond.value);
        if (events.length > 0) {
          matches.push(`${events.length} events with Goldstein < ${cond.value} (worst: ${Math.min(...events.map((e) => e.goldsteinScale)).toFixed(1)})`);
        }
        break;
      }
      case "goldstein_above": {
        const events = input.gdeltEvents.filter((e) => e.goldsteinScale > cond.value);
        if (events.length > 0) {
          matches.push(`${events.length} events with Goldstein > ${cond.value}`);
        }
        break;
      }
      case "mentions_above": {
        const events = input.gdeltEvents.filter((e) => e.numMentions > cond.value);
        if (events.length > 0) {
          matches.push(`${events.length} events with > ${cond.value} mentions (max: ${Math.max(...events.map((e) => e.numMentions))})`);
        }
        break;
      }
      case "tone_below": {
        const events = input.gdeltEvents.filter((e) => e.avgTone < cond.value);
        if (events.length > 0) {
          matches.push(`${events.length} events with tone < ${cond.value}`);
        }
        break;
      }
      case "fatalities_above": {
        const conflicts = input.conflicts.filter((c) => c.fatalities > cond.value);
        if (conflicts.length > 0) {
          matches.push(`${conflicts.length} conflicts with > ${cond.value} fatalities (max: ${Math.max(...conflicts.map((c) => c.fatalities))})`);
        }
        break;
      }
      case "conflict_count_above": {
        const filtered = cond.regionFilter
          ? input.conflicts.filter((c) => c.region === cond.regionFilter)
          : input.conflicts;
        if (filtered.length > cond.value) {
          matches.push(`${filtered.length} conflicts (threshold: ${cond.value})`);
        }
        break;
      }
      case "market_change_above": {
        const movers = cond.symbol
          ? input.marketData.filter((m) => m.symbol === cond.symbol && Math.abs(m.changePercent) > cond.value)
          : input.marketData.filter((m) => Math.abs(m.changePercent) > cond.value);
        if (movers.length > 0) {
          matches.push(`${movers.length} symbols moved > ${cond.value}% (${movers.map((m) => `${m.symbol}: ${m.changePercent.toFixed(1)}%`).join(", ")})`);
        }
        break;
      }
      case "volume_ratio_above": {
        const suspicious = input.marketData.filter((m) => m.volumeAnomaly > cond.value);
        if (suspicious.length > 0) {
          matches.push(`${suspicious.length} symbols with volume > ${cond.value}x avg (${suspicious.map((m) => `${m.symbol}: ${m.volumeAnomaly.toFixed(1)}x`).join(", ")})`);
        }
        break;
      }
    }
  }

  // ALL conditions must match for the threshold to fire (AND logic)
  return matches.length === conditions.length ? matches : [];
}

/**
 * Reset cooldowns (useful for testing).
 */
export function resetThresholdCooldowns(): void {
  lastAlertTimes.clear();
}
