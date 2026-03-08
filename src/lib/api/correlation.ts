import type {
  GDELTEvent,
  ConflictEvent,
  NaturalDisaster,
  EconomicIndicator,
  EventCorrelation,
  ThreatAssessment,
  SeverityLevel,
  CorrelationType,
} from "@/types";

// ============================================================================
// Event Correlation & Anticipation Engine
// ============================================================================

interface CorrelationInput {
  gdeltEvents: GDELTEvent[];
  conflicts: ConflictEvent[];
  disasters: NaturalDisaster[];
  economicData: EconomicIndicator[];
}

// Distance threshold in degrees for spatial correlation (~100km)
const SPATIAL_THRESHOLD = 1.0;
// Time threshold in milliseconds for temporal correlation (7 days)
const TEMPORAL_THRESHOLD = 7 * 24 * 60 * 60 * 1000;

function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function areSpatiallyCorrelated(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
  thresholdKm: number = 100
): boolean {
  return haversineDistance(lat1, lon1, lat2, lon2) < thresholdKm;
}

function areTemporallyCorrelated(date1: string, date2: string): boolean {
  return Math.abs(new Date(date1).getTime() - new Date(date2).getTime()) < TEMPORAL_THRESHOLD;
}

export function findConflictEscalations(conflicts: ConflictEvent[]): EventCorrelation[] {
  const correlations: EventCorrelation[] = [];
  const regionGroups = new Map<string, ConflictEvent[]>();

  for (const c of conflicts) {
    const key = `${c.country}-${c.region}`;
    if (!regionGroups.has(key)) regionGroups.set(key, []);
    regionGroups.get(key)!.push(c);
  }

  for (const [region, events] of regionGroups) {
    if (events.length < 3) continue;

    const sorted = events.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const recentFatalities = sorted.slice(-5).reduce((s, e) => s + e.fatalities, 0);
    const olderFatalities = sorted.slice(0, 5).reduce((s, e) => s + e.fatalities, 0);

    if (recentFatalities > olderFatalities * 1.5 && recentFatalities > 0) {
      correlations.push({
        id: `esc-${region}`,
        events: sorted.slice(-5).map((e) => e.id),
        correlationType: "escalation",
        strength: Math.min(1, recentFatalities / (olderFatalities || 1) / 3),
        description: `Escalating conflict in ${region}: fatalities increasing`,
        predictedOutcome: "Continued escalation likely without intervention",
        confidence: Math.min(90, 40 + sorted.length * 5),
        timeframe: "2-4 weeks",
      });
    }
  }

  return correlations;
}

export function findConflictDisasterCorrelations(
  conflicts: ConflictEvent[],
  disasters: NaturalDisaster[]
): EventCorrelation[] {
  const correlations: EventCorrelation[] = [];

  for (const disaster of disasters) {
    const nearbyConflicts = conflicts.filter(
      (c) =>
        areSpatiallyCorrelated(c.latitude, c.longitude, disaster.latitude, disaster.longitude, 200) &&
        areTemporallyCorrelated(c.date, disaster.date)
    );

    if (nearbyConflicts.length >= 2) {
      correlations.push({
        id: `dis-conf-${disaster.id}`,
        events: [disaster.id, ...nearbyConflicts.map((c) => c.id)],
        correlationType: "spatial",
        strength: Math.min(1, nearbyConflicts.length / 5),
        description: `${disaster.type} near active conflict zone: ${disaster.title}`,
        predictedOutcome: "Humanitarian crisis risk elevated — compound disaster-conflict scenario",
        confidence: 60 + nearbyConflicts.length * 10,
        timeframe: "1-2 weeks",
      });
    }
  }

  return correlations;
}

export function findEconomicConflictCorrelations(
  economicData: EconomicIndicator[],
  conflicts: ConflictEvent[]
): EventCorrelation[] {
  const correlations: EventCorrelation[] = [];
  const countryEcon = new Map<string, EconomicIndicator[]>();

  for (const ind of economicData) {
    if (!countryEcon.has(ind.countryCode)) countryEcon.set(ind.countryCode, []);
    countryEcon.get(ind.countryCode)!.push(ind);
  }

  for (const [countryCode, indicators] of countryEcon) {
    const highInflation = indicators.find(
      (i) => i.indicator === "inflation" && i.value > 15
    );
    const negativeGDP = indicators.find(
      (i) => i.indicator === "gdp_growth" && i.value < -2
    );
    const highUnemployment = indicators.find(
      (i) => i.indicator === "unemployment" && i.value > 15
    );

    const countryConflicts = conflicts.filter((c) => c.country === countryCode);

    if ((highInflation || negativeGDP || highUnemployment) && countryConflicts.length > 0) {
      const factors = [
        highInflation && `high inflation (${highInflation.value.toFixed(1)}%)`,
        negativeGDP && `GDP contraction (${negativeGDP.value.toFixed(1)}%)`,
        highUnemployment && `high unemployment (${highUnemployment.value.toFixed(1)}%)`,
      ].filter(Boolean);

      correlations.push({
        id: `econ-conf-${countryCode}`,
        events: countryConflicts.slice(0, 5).map((c) => c.id),
        correlationType: "causal",
        strength: Math.min(1, factors.length / 3),
        description: `Economic stress factors in ${countryCode}: ${factors.join(", ")} — correlating with ${countryConflicts.length} conflict events`,
        predictedOutcome: "Social unrest and political instability risk elevated",
        confidence: 50 + factors.length * 15,
        timeframe: "1-3 months",
      });
    }
  }

  return correlations;
}

export function findGDELTToneShifts(events: GDELTEvent[]): EventCorrelation[] {
  const correlations: EventCorrelation[] = [];
  const countryGroups = new Map<string, GDELTEvent[]>();

  for (const e of events) {
    if (!e.country) continue;
    if (!countryGroups.has(e.country)) countryGroups.set(e.country, []);
    countryGroups.get(e.country)!.push(e);
  }

  for (const [country, evts] of countryGroups) {
    if (evts.length < 5) continue;

    const avgTone = evts.reduce((s, e) => s + e.avgTone, 0) / evts.length;
    const conflictRatio = evts.filter(
      (e) => e.quadClass === "material_conflict" || e.quadClass === "verbal_conflict"
    ).length / evts.length;

    if (avgTone < -5 && conflictRatio > 0.6) {
      correlations.push({
        id: `tone-${country}`,
        events: evts.slice(0, 5).map((e) => e.globalEventId),
        correlationType: "thematic",
        strength: Math.min(1, Math.abs(avgTone) / 10),
        description: `Strongly negative media tone in ${country} (avg: ${avgTone.toFixed(1)}) with ${(conflictRatio * 100).toFixed(0)}% conflict events`,
        predictedOutcome: "Tensions likely to intensify based on media sentiment trajectory",
        confidence: 55 + Math.min(30, evts.length),
        timeframe: "1-2 weeks",
      });
    }
  }

  return correlations;
}

export function generateCorrelations(input: CorrelationInput): EventCorrelation[] {
  return [
    ...findConflictEscalations(input.conflicts),
    ...findConflictDisasterCorrelations(input.conflicts, input.disasters),
    ...findEconomicConflictCorrelations(input.economicData, input.conflicts),
    ...findGDELTToneShifts(input.gdeltEvents),
  ];
}

export function generateThreatAssessment(
  country: string,
  countryCode: string,
  input: CorrelationInput
): ThreatAssessment {
  const countryConflicts = input.conflicts.filter((c) => c.country === countryCode);
  const countryEvents = input.gdeltEvents.filter((e) => e.country === countryCode);
  const countryEcon = input.economicData.filter((e) => e.countryCode === countryCode);
  const countryDisasters = input.disasters.filter((d) => d.country === countryCode);

  // Military threat
  const militaryThreat = Math.min(
    100,
    countryConflicts.filter((c) => c.eventType === "battle").length * 15 +
    countryConflicts.reduce((s, c) => s + c.fatalities, 0) * 0.5
  );

  // Political instability
  const conflictEvents = countryEvents.filter(
    (e) => e.quadClass === "material_conflict" || e.quadClass === "verbal_conflict"
  );
  const politicalInstability = Math.min(
    100,
    (conflictEvents.length / Math.max(1, countryEvents.length)) * 100
  );

  // Economic risk
  const inflation = countryEcon.find((e) => e.indicator === "inflation");
  const gdp = countryEcon.find((e) => e.indicator === "gdp_growth");
  let economicRisk = 0;
  if (inflation) economicRisk += Math.min(40, inflation.value * 3);
  if (gdp && gdp.value < 0) economicRisk += Math.min(40, Math.abs(gdp.value) * 10);
  economicRisk = Math.min(100, economicRisk);

  // Humanitarian risk
  const humanitarianRisk = Math.min(
    100,
    countryConflicts.filter((c) => c.eventType === "violence_against_civilians").length * 20 +
    countryDisasters.filter((d) => d.status === "ongoing").length * 25
  );

  // Environmental risk
  const environmentalRisk = Math.min(
    100,
    countryDisasters.length * 20
  );

  const overall = (militaryThreat + politicalInstability + economicRisk + humanitarianRisk + environmentalRisk) / 5;

  let overallRisk: SeverityLevel = "low";
  if (overall > 70) overallRisk = "critical";
  else if (overall > 50) overallRisk = "high";
  else if (overall > 25) overallRisk = "medium";

  // Trend
  const recentConflicts = countryConflicts.filter(
    (c) => new Date(c.date).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
  ).length;
  const olderConflicts = countryConflicts.filter(
    (c) => {
      const t = new Date(c.date).getTime();
      return t > Date.now() - 14 * 24 * 60 * 60 * 1000 && t <= Date.now() - 7 * 24 * 60 * 60 * 1000;
    }
  ).length;

  let trendDirection: "escalating" | "stable" | "de-escalating" = "stable";
  if (recentConflicts > olderConflicts * 1.3) trendDirection = "escalating";
  else if (recentConflicts < olderConflicts * 0.7) trendDirection = "de-escalating";

  return {
    region: country,
    country: countryCode,
    overallRisk,
    militaryThreat,
    politicalInstability,
    economicRisk,
    humanitarianRisk,
    environmentalRisk,
    trendDirection,
    keyIndicators: [
      `${countryConflicts.length} active conflicts`,
      `${conflictEvents.length} conflict events in media`,
      inflation ? `Inflation: ${inflation.value.toFixed(1)}%` : "",
      gdp ? `GDP Growth: ${gdp.value.toFixed(1)}%` : "",
    ].filter(Boolean),
    lastUpdated: new Date(),
  };
}
