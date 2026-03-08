import {
  findConflictEscalations,
  findConflictDisasterCorrelations,
  findEconomicConflictCorrelations,
  findGDELTToneShifts,
  generateCorrelations,
  generateThreatAssessment,
} from "@/lib/api/correlation";
import type {
  ConflictEvent,
  NaturalDisaster,
  EconomicIndicator,
  GDELTEvent,
} from "@/types";

function makeConflict(overrides: Partial<ConflictEvent> = {}): ConflictEvent {
  return {
    id: "c1",
    date: new Date().toISOString(),
    eventType: "battle",
    subEventType: "Armed clash",
    actors: ["Group A"],
    location: "TestCity",
    latitude: 33.0,
    longitude: 44.0,
    country: "IQ",
    region: "Baghdad",
    fatalities: 5,
    source: "ACLED",
    severity: "medium",
    notes: "",
    ...overrides,
  };
}

function makeDisaster(overrides: Partial<NaturalDisaster> = {}): NaturalDisaster {
  return {
    id: "d1",
    title: "Earthquake",
    type: "earthquake",
    date: new Date().toISOString(),
    latitude: 33.1,
    longitude: 44.1,
    magnitude: 5.0,
    country: "IQ",
    status: "ongoing",
    source: "USGS",
    severity: "medium",
    ...overrides,
  };
}

function makeEconomic(overrides: Partial<EconomicIndicator> = {}): EconomicIndicator {
  return {
    countryCode: "IQ",
    countryName: "Iraq",
    indicator: "inflation",
    value: 20,
    year: 2024,
    source: "World Bank",
    riskLevel: "high",
    ...overrides,
  };
}

function makeGDELT(overrides: Partial<GDELTEvent> = {}): GDELTEvent {
  return {
    globalEventId: "g1",
    date: new Date().toISOString(),
    sourceUrl: "http://example.com",
    title: "Test Event",
    latitude: 33.0,
    longitude: 44.0,
    country: "Iraq",
    avgTone: -6,
    goldsteinScale: -5,
    numMentions: 10,
    numSources: 3,
    quadClass: "material_conflict",
    actor1: "GOV",
    actor2: "REB",
    ...overrides,
  };
}

describe("findConflictEscalations", () => {
  it("returns empty for fewer than 3 events in a region", () => {
    const conflicts = [makeConflict({ id: "c1" }), makeConflict({ id: "c2" })];
    expect(findConflictEscalations(conflicts)).toEqual([]);
  });

  it("detects escalation when recent fatalities exceed older", () => {
    const now = Date.now();
    const conflicts = [
      // Older events with low fatalities
      makeConflict({ id: "c1", date: new Date(now - 10 * 86400000).toISOString(), fatalities: 1 }),
      makeConflict({ id: "c2", date: new Date(now - 9 * 86400000).toISOString(), fatalities: 1 }),
      makeConflict({ id: "c3", date: new Date(now - 8 * 86400000).toISOString(), fatalities: 1 }),
      makeConflict({ id: "c4", date: new Date(now - 7 * 86400000).toISOString(), fatalities: 1 }),
      makeConflict({ id: "c5", date: new Date(now - 6 * 86400000).toISOString(), fatalities: 1 }),
      // Recent events with higher fatalities
      makeConflict({ id: "c6", date: new Date(now - 4 * 86400000).toISOString(), fatalities: 10 }),
      makeConflict({ id: "c7", date: new Date(now - 3 * 86400000).toISOString(), fatalities: 10 }),
      makeConflict({ id: "c8", date: new Date(now - 2 * 86400000).toISOString(), fatalities: 10 }),
      makeConflict({ id: "c9", date: new Date(now - 1 * 86400000).toISOString(), fatalities: 10 }),
      makeConflict({ id: "c10", date: new Date(now).toISOString(), fatalities: 10 }),
    ];

    const result = findConflictEscalations(conflicts);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].correlationType).toBe("escalation");
    expect(result[0].description).toContain("Escalating conflict");
  });

  it("does not flag when fatalities are not increasing", () => {
    const now = Date.now();
    const conflicts = Array.from({ length: 6 }, (_, i) =>
      makeConflict({
        id: `c${i}`,
        date: new Date(now - i * 86400000).toISOString(),
        fatalities: 2,
      })
    );
    const result = findConflictEscalations(conflicts);
    expect(result).toEqual([]);
  });
});

describe("findConflictDisasterCorrelations", () => {
  it("finds correlation when disaster is near conflicts", () => {
    const conflicts = [
      makeConflict({ id: "c1", latitude: 33.0, longitude: 44.0 }),
      makeConflict({ id: "c2", latitude: 33.05, longitude: 44.05 }),
    ];
    const disasters = [
      makeDisaster({ latitude: 33.1, longitude: 44.1 }),
    ];

    const result = findConflictDisasterCorrelations(conflicts, disasters);
    expect(result.length).toBe(1);
    expect(result[0].correlationType).toBe("spatial");
    expect(result[0].description).toContain("conflict zone");
  });

  it("returns empty when disaster is far from conflicts", () => {
    const conflicts = [
      makeConflict({ id: "c1", latitude: 33.0, longitude: 44.0 }),
      makeConflict({ id: "c2", latitude: 33.05, longitude: 44.05 }),
    ];
    const disasters = [
      makeDisaster({ latitude: 60.0, longitude: 10.0 }),
    ];

    const result = findConflictDisasterCorrelations(conflicts, disasters);
    expect(result).toEqual([]);
  });

  it("returns empty when fewer than 2 nearby conflicts", () => {
    const conflicts = [makeConflict({ id: "c1", latitude: 33.0, longitude: 44.0 })];
    const disasters = [makeDisaster({ latitude: 33.1, longitude: 44.1 })];

    const result = findConflictDisasterCorrelations(conflicts, disasters);
    expect(result).toEqual([]);
  });
});

describe("findEconomicConflictCorrelations", () => {
  it("detects correlation with high inflation and conflicts", () => {
    const econ = [makeEconomic({ indicator: "inflation", value: 20 })];
    const conflicts = [makeConflict({ country: "IQ" })];

    const result = findEconomicConflictCorrelations(econ, conflicts);
    expect(result.length).toBe(1);
    expect(result[0].correlationType).toBe("causal");
    expect(result[0].description).toContain("high inflation");
  });

  it("detects negative GDP correlation", () => {
    const econ = [makeEconomic({ indicator: "gdp_growth", value: -5 })];
    const conflicts = [makeConflict({ country: "IQ" })];

    const result = findEconomicConflictCorrelations(econ, conflicts);
    expect(result.length).toBe(1);
    expect(result[0].description).toContain("GDP contraction");
  });

  it("returns empty when no economic stress", () => {
    const econ = [makeEconomic({ indicator: "inflation", value: 2 })];
    const conflicts = [makeConflict({ country: "IQ" })];

    const result = findEconomicConflictCorrelations(econ, conflicts);
    expect(result).toEqual([]);
  });

  it("returns empty when no conflicts in country", () => {
    const econ = [makeEconomic({ indicator: "inflation", value: 20, countryCode: "IQ" })];
    const conflicts = [makeConflict({ country: "SY" })];

    const result = findEconomicConflictCorrelations(econ, conflicts);
    expect(result).toEqual([]);
  });
});

describe("findGDELTToneShifts", () => {
  it("detects negative tone shift with high conflict ratio", () => {
    const events = Array.from({ length: 6 }, (_, i) =>
      makeGDELT({
        globalEventId: `g${i}`,
        country: "Iran",
        avgTone: -7,
        quadClass: "material_conflict",
      })
    );

    const result = findGDELTToneShifts(events);
    expect(result.length).toBe(1);
    expect(result[0].correlationType).toBe("thematic");
    expect(result[0].description).toContain("negative media tone");
  });

  it("returns empty for positive tone", () => {
    const events = Array.from({ length: 6 }, (_, i) =>
      makeGDELT({
        globalEventId: `g${i}`,
        country: "Sweden",
        avgTone: 3,
        quadClass: "verbal_cooperation",
      })
    );

    const result = findGDELTToneShifts(events);
    expect(result).toEqual([]);
  });

  it("returns empty for fewer than 5 events", () => {
    const events = [
      makeGDELT({ globalEventId: "g1", country: "Iran", avgTone: -8 }),
    ];
    expect(findGDELTToneShifts(events)).toEqual([]);
  });
});

describe("generateCorrelations", () => {
  it("aggregates all correlation types", () => {
    const input = {
      gdeltEvents: Array.from({ length: 6 }, (_, i) =>
        makeGDELT({ globalEventId: `g${i}`, country: "Iran", avgTone: -7, quadClass: "material_conflict" })
      ),
      conflicts: [],
      disasters: [],
      economicData: [],
    };

    const result = generateCorrelations(input);
    // Should at least have GDELT tone shifts
    expect(result.length).toBeGreaterThan(0);
  });

  it("returns empty for empty input", () => {
    const result = generateCorrelations({
      gdeltEvents: [],
      conflicts: [],
      disasters: [],
      economicData: [],
    });
    expect(result).toEqual([]);
  });
});

describe("generateThreatAssessment", () => {
  it("generates assessment with conflict data", () => {
    const input = {
      gdeltEvents: [makeGDELT({ country: "IQ", quadClass: "material_conflict" })],
      conflicts: [
        makeConflict({ country: "IQ", eventType: "battle", fatalities: 20 }),
        makeConflict({ country: "IQ", eventType: "violence_against_civilians", fatalities: 5 }),
      ],
      disasters: [makeDisaster({ country: "IQ", status: "ongoing" })],
      economicData: [
        makeEconomic({ indicator: "inflation", value: 25 }),
        makeEconomic({ indicator: "gdp_growth", value: -3 }),
      ],
    };

    const result = generateThreatAssessment("Iraq", "IQ", input);

    expect(result.region).toBe("Iraq");
    expect(result.country).toBe("IQ");
    expect(result.militaryThreat).toBeGreaterThan(0);
    expect(result.economicRisk).toBeGreaterThan(0);
    expect(result.humanitarianRisk).toBeGreaterThan(0);
    expect(result.environmentalRisk).toBeGreaterThan(0);
    expect(["critical", "high", "medium", "low"]).toContain(result.overallRisk);
    expect(["escalating", "stable", "de-escalating"]).toContain(result.trendDirection);
    expect(result.keyIndicators.length).toBeGreaterThan(0);
  });

  it("returns low risk for empty data", () => {
    const input = {
      gdeltEvents: [],
      conflicts: [],
      disasters: [],
      economicData: [],
    };

    const result = generateThreatAssessment("Nowhere", "NW", input);
    expect(result.overallRisk).toBe("low");
    expect(result.militaryThreat).toBe(0);
  });
});
