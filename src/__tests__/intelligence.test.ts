import { generateIntelReports } from "@/lib/api/intelligence";
import type {
  ConflictEvent,
  GDELTEvent,
  NaturalDisaster,
  EconomicIndicator,
  EventCorrelation,
} from "@/types";

function makeCorrelation(overrides: Partial<EventCorrelation> = {}): EventCorrelation {
  return {
    id: "cor-1",
    events: ["e1", "e2"],
    correlationType: "escalation",
    strength: 0.7,
    description: "Test correlation",
    predictedOutcome: "Test outcome",
    confidence: 70,
    timeframe: "2-4 weeks",
    ...overrides,
  };
}

function makeConflict(overrides: Partial<ConflictEvent> = {}): ConflictEvent {
  return {
    id: "c1",
    date: new Date().toISOString(),
    eventType: "battle",
    subEventType: "Armed clash",
    actors: ["Group A", "Group B"],
    location: "TestCity",
    latitude: 33.0,
    longitude: 44.0,
    country: "IQ",
    region: "Baghdad",
    fatalities: 5,
    source: "ACLED",
    severity: "medium",
    notes: "Test notes",
    ...overrides,
  };
}

function makeGDELT(overrides: Partial<GDELTEvent> = {}): GDELTEvent {
  return {
    globalEventId: "g1",
    date: new Date().toISOString(),
    sourceUrl: "http://example.com",
    title: "Test",
    latitude: 33.0,
    longitude: 44.0,
    country: "Iran",
    avgTone: -7,
    goldsteinScale: -5,
    numMentions: 10,
    numSources: 3,
    quadClass: "material_conflict",
    actor1: "GOV",
    actor2: "REB",
    ...overrides,
  };
}

describe("generateIntelReports", () => {
  it("generates military reports from escalation correlations", () => {
    const conflicts = [
      makeConflict({ id: "c1", fatalities: 20 }),
      makeConflict({ id: "c2", fatalities: 30 }),
    ];
    const correlations = [
      makeCorrelation({
        correlationType: "escalation",
        events: ["c1", "c2"],
      }),
    ];

    const reports = generateIntelReports({
      gdeltEvents: [],
      conflicts,
      disasters: [],
      economicData: [],
      correlations,
    });

    expect(reports.length).toBeGreaterThan(0);
    const milReport = reports.find((r) => r.category === "military_movement");
    expect(milReport).toBeDefined();
    expect(milReport!.title).toContain("Military Escalation");
    expect(milReport!.sources).toContain("ACLED");
  });

  it("generates political instability reports from thematic correlations", () => {
    const gdeltEvents = [
      makeGDELT({ globalEventId: "g1", country: "Iran", avgTone: -9 }),
      makeGDELT({ globalEventId: "g2", country: "Iran", avgTone: -8 }),
    ];
    const correlations = [
      makeCorrelation({
        correlationType: "thematic",
        events: ["g1", "g2"],
        confidence: 75,
      }),
    ];

    const reports = generateIntelReports({
      gdeltEvents,
      conflicts: [],
      disasters: [],
      economicData: [],
      correlations,
    });

    const polReport = reports.find((r) => r.category === "political_instability");
    expect(polReport).toBeDefined();
    expect(polReport!.title).toContain("Political Instability");
    expect(polReport!.sources).toContain("GDELT");
  });

  it("generates economic crisis reports from causal correlations", () => {
    const correlations = [
      makeCorrelation({
        id: "econ-conf-IQ",
        correlationType: "causal",
        description: "High inflation in IQ: 25%",
        predictedOutcome: "Social unrest risk",
        strength: 0.8,
      }),
    ];

    const reports = generateIntelReports({
      gdeltEvents: [],
      conflicts: [],
      disasters: [],
      economicData: [],
      correlations,
    });

    const econReport = reports.find((r) => r.category === "economic_crisis");
    expect(econReport).toBeDefined();
    expect(econReport!.sources).toContain("World Bank");
  });

  it("generates humanitarian crisis reports from spatial correlations", () => {
    const correlations = [
      makeCorrelation({
        correlationType: "spatial",
        description: "Earthquake near active conflict zone: Test",
        predictedOutcome: "Humanitarian crisis risk elevated",
      }),
    ];

    const reports = generateIntelReports({
      gdeltEvents: [],
      conflicts: [],
      disasters: [],
      economicData: [],
      correlations,
    });

    const humReport = reports.find((r) => r.category === "humanitarian_crisis");
    expect(humReport).toBeDefined();
    expect(humReport!.severity).toBe("high");
  });

  it("generates critical incident reports for high-fatality conflicts", () => {
    const conflicts = [
      makeConflict({
        id: "crit1",
        severity: "critical",
        fatalities: 50,
        eventType: "battle",
        country: "SY",
      }),
    ];

    const reports = generateIntelReports({
      gdeltEvents: [],
      conflicts,
      disasters: [],
      economicData: [],
      correlations: [],
    });

    expect(reports.length).toBeGreaterThan(0);
    expect(reports[0].severity).toBe("critical");
    expect(reports[0].country).toBe("SY");
  });

  it("sorts reports by severity (critical first)", () => {
    const conflicts = [
      makeConflict({ id: "c1", severity: "critical", fatalities: 50, country: "SY" }),
      makeConflict({ id: "c2", severity: "critical", fatalities: 15, country: "IQ" }),
    ];
    const correlations = [
      makeCorrelation({
        id: "econ-conf-LB",
        correlationType: "causal",
        description: "Economic stress in LB",
        strength: 0.3,
      }),
    ];

    const reports = generateIntelReports({
      gdeltEvents: [],
      conflicts,
      disasters: [],
      economicData: [],
      correlations,
    });

    // Critical reports should come first
    const criticalIdx = reports.findIndex((r) => r.severity === "critical");
    const mediumIdx = reports.findIndex((r) => r.severity === "medium");
    if (criticalIdx >= 0 && mediumIdx >= 0) {
      expect(criticalIdx).toBeLessThan(mediumIdx);
    }
  });

  it("returns empty for empty input", () => {
    const reports = generateIntelReports({
      gdeltEvents: [],
      conflicts: [],
      disasters: [],
      economicData: [],
      correlations: [],
    });
    expect(reports).toEqual([]);
  });

  it("limits output to 50 reports", () => {
    // Generate many critical conflicts from different countries
    const countries = Array.from({ length: 60 }, (_, i) => `C${i}`);
    const conflicts = countries.map((c, i) =>
      makeConflict({
        id: `crit-${i}`,
        severity: "critical",
        fatalities: 20,
        country: c,
      })
    );

    const reports = generateIntelReports({
      gdeltEvents: [],
      conflicts,
      disasters: [],
      economicData: [],
      correlations: [],
    });

    expect(reports.length).toBeLessThanOrEqual(50);
  });
});
