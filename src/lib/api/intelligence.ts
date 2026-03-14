import type {
  GDELTEvent,
  ConflictEvent,
  NaturalDisaster,
  EconomicIndicator,
  EventCorrelation,
  IntelligenceReport,
  IntelligenceCategory,
  SeverityLevel,
  CrossIntelligenceAlert,
  MarketAnomaly,
  SatelliteSurveillancePattern,
} from "@/types";

interface IntelInput {
  gdeltEvents: GDELTEvent[];
  conflicts: ConflictEvent[];
  disasters: NaturalDisaster[];
  economicData: EconomicIndicator[];
  correlations: EventCorrelation[];
  crossIntelAlerts?: CrossIntelligenceAlert[];
  marketAnomalies?: MarketAnomaly[];
  satSurveillancePatterns?: SatelliteSurveillancePattern[];
}

export function generateIntelReports(input: IntelInput): IntelligenceReport[] {
  const reports: IntelligenceReport[] = [];

  // 1. Military Movement Reports — from conflict escalations
  const escalations = input.correlations.filter((c) => c.correlationType === "escalation");
  for (const esc of escalations) {
    const relatedConflicts = input.conflicts.filter((c) => esc.events.includes(c.id));
    if (relatedConflicts.length === 0) continue;

    const country = relatedConflicts[0].country;
    const region = relatedConflicts[0].region;
    const totalFatalities = relatedConflicts.reduce((s, c) => s + c.fatalities, 0);
    const actors = [...new Set(relatedConflicts.flatMap((c) => c.actors))].slice(0, 5);

    reports.push({
      id: `intel-mil-${esc.id}`,
      title: `Military Escalation: ${region}, ${country}`,
      summary: `Detected escalating military conflict in ${region}. ${relatedConflicts.length} incidents recorded with ${totalFatalities} total fatalities. Key actors: ${actors.join(", ") || "Unknown"}. Trend suggests continued escalation within ${esc.timeframe || "2-4 weeks"}.`,
      category: "military_movement",
      severity: totalFatalities > 50 ? "critical" : totalFatalities > 10 ? "high" : "medium",
      confidence: esc.confidence,
      timestamp: new Date(),
      location: { latitude: relatedConflicts[0].latitude, longitude: relatedConflicts[0].longitude },
      country,
      relatedEvents: esc.events,
      indicators: [
        `${relatedConflicts.length} conflict events`,
        `${totalFatalities} fatalities`,
        `Escalation strength: ${(esc.strength * 100).toFixed(0)}%`,
      ],
      sources: ["ACLED"],
      tags: ["escalation", "military", country.toLowerCase()],
    });
  }

  // 2. Political Instability Reports — from GDELT negative tone clusters
  const toneClusters = input.correlations.filter((c) => c.correlationType === "thematic");
  for (const cluster of toneClusters) {
    const countryEvents = input.gdeltEvents.filter((e) =>
      cluster.events.includes(e.globalEventId)
    );
    if (countryEvents.length === 0) continue;

    const country = countryEvents[0].country;
    const avgTone = countryEvents.reduce((s, e) => s + e.avgTone, 0) / countryEvents.length;
    const materialConflicts = countryEvents.filter((e) => e.quadClass === "material_conflict");

    reports.push({
      id: `intel-pol-${cluster.id}`,
      title: `Political Instability Warning: ${country}`,
      summary: `Media sentiment analysis indicates strongly negative tone (avg: ${avgTone.toFixed(1)}) across ${countryEvents.length} articles about ${country}. ${materialConflicts.length} material conflict events detected. ${cluster.predictedOutcome || "Situation warrants close monitoring."}`,
      category: "political_instability",
      severity: avgTone < -8 ? "critical" : avgTone < -5 ? "high" : "medium",
      confidence: cluster.confidence,
      timestamp: new Date(),
      location: { latitude: countryEvents[0].latitude, longitude: countryEvents[0].longitude },
      country,
      relatedEvents: cluster.events,
      indicators: [
        `Avg tone: ${avgTone.toFixed(1)}`,
        `${materialConflicts.length} material conflict events`,
        `${countryEvents.length} total media events`,
      ],
      sources: ["GDELT"],
      tags: ["political", "instability", "media", country.toLowerCase()],
    });
  }

  // 3. Economic Crisis Reports — from economic-conflict correlations
  const econCorrelations = input.correlations.filter((c) => c.correlationType === "causal");
  for (const ec of econCorrelations) {
    reports.push({
      id: `intel-econ-${ec.id}`,
      title: `Economic Stress Alert`,
      summary: ec.description + ". " + (ec.predictedOutcome || ""),
      category: "economic_crisis",
      severity: ec.strength > 0.7 ? "high" : "medium",
      confidence: ec.confidence,
      timestamp: new Date(),
      location: { latitude: 0, longitude: 0 },
      country: ec.id.split("-").pop() || "",
      relatedEvents: ec.events,
      indicators: [ec.description],
      sources: ["World Bank", "ACLED"],
      tags: ["economic", "stress"],
    });
  }

  // 4. Humanitarian Crisis Reports — from disaster-conflict intersections
  const disasterCorrelations = input.correlations.filter(
    (c) => c.correlationType === "spatial" && c.description.includes("conflict zone")
  );
  for (const dc of disasterCorrelations) {
    reports.push({
      id: `intel-hum-${dc.id}`,
      title: `Humanitarian Crisis Risk`,
      summary: dc.description + ". " + (dc.predictedOutcome || "Compound disaster-conflict scenario detected."),
      category: "humanitarian_crisis",
      severity: "high",
      confidence: dc.confidence,
      timestamp: new Date(),
      location: { latitude: 0, longitude: 0 },
      country: "",
      relatedEvents: dc.events,
      indicators: [dc.description],
      sources: ["USGS", "ReliefWeb", "ACLED"],
      tags: ["humanitarian", "disaster", "compound"],
    });
  }

  // 5. Direct critical conflict reports (even without correlation)
  const criticalConflicts = input.conflicts.filter(
    (c) => c.severity === "critical" && c.fatalities >= 10
  );
  const countriesReported = new Set(reports.map((r) => r.country));

  for (const cc of criticalConflicts) {
    if (countriesReported.has(cc.country)) continue; // Avoid duplicates
    countriesReported.add(cc.country);

    reports.push({
      id: `intel-crit-${cc.id}`,
      title: `Critical Incident: ${cc.eventType.replace(/_/g, " ")} in ${cc.country}`,
      summary: `${cc.subEventType} in ${cc.location}, ${cc.country}. ${cc.fatalities} fatalities reported. Actors: ${cc.actors.join(", ")}. ${cc.notes}`,
      category: classifyConflictCategory(cc),
      severity: "critical",
      confidence: 85,
      timestamp: new Date(cc.date),
      location: { latitude: cc.latitude, longitude: cc.longitude },
      country: cc.country,
      relatedEvents: [cc.id],
      indicators: [`${cc.fatalities} fatalities`, cc.subEventType],
      sources: [cc.source],
      tags: [cc.eventType, cc.country.toLowerCase()],
    });
  }

  // 6. Cross-Intelligence Market Reports — from cross-intel engine
  if (input.crossIntelAlerts && input.crossIntelAlerts.length > 0) {
    for (const alert of input.crossIntelAlerts) {
      if (alert.suspicionLevel === "none" || alert.suspicionLevel === "low") continue;

      const category: IntelligenceCategory =
        alert.category === "military_buildup" || alert.category === "surveillance_escalation"
          ? "military_movement"
          : alert.category === "insider_trading_suspicion" || alert.category === "market_manipulation"
          ? "economic_crisis"
          : "infrastructure";

      reports.push({
        id: `intel-xint-${alert.id}`,
        title: `CROSS-INTEL: ${alert.title}`,
        summary: alert.narrative,
        category,
        severity: alert.severity,
        confidence: alert.confidence,
        timestamp: new Date(),
        location: { latitude: 0, longitude: 0 },
        country: alert.countries[0] || "",
        relatedEvents: alert.signals.filter((s) => s.dataPointId).map((s) => s.dataPointId!),
        indicators: [
          `Suspicion: ${alert.suspicionLevel}`,
          ...alert.signals.slice(0, 3).map((s) => `[${s.source.toUpperCase()}] ${s.description}`),
          ...(alert.marketImpact
            ? [`Market: ${alert.marketImpact.direction} ${alert.marketImpact.magnitude} — ${alert.marketImpact.symbols.join(", ")}`]
            : []),
        ],
        sources: [...new Set(alert.signals.map((s) => s.source))],
        tags: ["cross-intel", alert.category, alert.suspicionLevel, ...alert.countries.map((c) => c.toLowerCase())],
      });
    }
  }

  // 7. Satellite Surveillance Reports
  if (input.satSurveillancePatterns && input.satSurveillancePatterns.length > 0) {
    for (const pattern of input.satSurveillancePatterns) {
      if (pattern.anomalyScore < 50) continue;

      reports.push({
        id: `intel-surv-${pattern.id}`,
        title: `Satellite Surveillance: ${pattern.targetRegion}`,
        summary: pattern.description,
        category: "military_movement",
        severity: pattern.anomalyScore > 70 ? "high" : "medium",
        confidence: Math.min(85, pattern.anomalyScore),
        timestamp: new Date(),
        location: { latitude: pattern.targetCoordinates.lat, longitude: pattern.targetCoordinates.lon },
        country: pattern.ownerCountries[0] || "",
        relatedEvents: pattern.relatedConflictIds || [],
        indicators: [
          `Phase: ${pattern.phase.replace(/_/g, " ")}`,
          `Pattern: ${pattern.patternType.replace(/_/g, " ")}`,
          `Anomaly score: ${pattern.anomalyScore}`,
          `Satellites: ${pattern.satelliteNames.join(", ")}`,
        ],
        sources: ["CelesTrak", "Satellite Intelligence"],
        tags: ["surveillance", "satellite", pattern.phase, ...pattern.ownerCountries.map((c) => c.toLowerCase())],
      });
    }
  }

  // Sort by severity then timestamp
  const severityOrder: Record<SeverityLevel, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };
  reports.sort(
    (a, b) =>
      severityOrder[b.severity] - severityOrder[a.severity] ||
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return reports.slice(0, 50);
}

function classifyConflictCategory(conflict: ConflictEvent): IntelligenceCategory {
  switch (conflict.eventType) {
    case "battle":
      return "military_movement";
    case "violence_against_civilians":
      return "humanitarian_crisis";
    case "protest":
    case "riot":
      return "political_instability";
    default:
      return "military_movement";
  }
}
