import {
  detectMarketAnomalies,
  detectSatelliteSurveillancePatterns,
  detectMilitaryAircraftPatterns,
  generateCrossIntelligenceAlerts,
} from "@/lib/api/cross-intelligence";
import type {
  MarketData,
  ConflictEvent,
  GDELTEvent,
  SatellitePosition,
  AircraftPosition,
  NaturalDisaster,
  WatchRegion,
} from "@/types";

// ── Factories ────────────────────────────────────────────────────────────

function makeMarketData(overrides: Partial<MarketData> = {}): MarketData {
  return {
    symbol: "CL=F",
    name: "Crude Oil (WTI)",
    category: "energy",
    price: 82,
    previousClose: 78,
    changePercent: 5.1,
    volume: 3000000,
    avgVolume: 1000000,
    volumeAnomaly: 3.0,
    high52w: 95,
    low52w: 65,
    timestamp: new Date().toISOString(),
    source: "Test",
    ...overrides,
  };
}

function makeConflict(overrides: Partial<ConflictEvent> = {}): ConflictEvent {
  return {
    id: "c1",
    date: new Date().toISOString(),
    eventType: "battle",
    subEventType: "Armed clash",
    actors: ["Group A"],
    location: "Tehran",
    latitude: 35.7,
    longitude: 51.4,
    country: "IRN",
    region: "Tehran",
    fatalities: 15,
    source: "ACLED",
    severity: "high",
    notes: "",
    ...overrides,
  };
}

function makeGDELT(overrides: Partial<GDELTEvent> = {}): GDELTEvent {
  return {
    globalEventId: "g1",
    date: new Date().toISOString(),
    sourceUrl: "http://example.com",
    title: "Iran conflict escalation",
    latitude: 35.7,
    longitude: 51.4,
    country: "IRN",
    avgTone: -7,
    goldsteinScale: -8,
    numMentions: 50,
    numSources: 10,
    quadClass: "material_conflict",
    actor1: "GOV",
    actor2: "MIL",
    ...overrides,
  };
}

function makeSatellite(overrides: Partial<SatellitePosition> = {}): SatellitePosition {
  return {
    id: "sat1",
    name: "USA-326",
    latitude: 32,
    longitude: 44,
    altitude: 400,
    velocity: 7.5,
    category: "reconnaissance",
    country: "US",
    timestamp: new Date(),
    tle: { name: "USA-326", line1: "", line2: "", catalogNumber: "99001", classification: "C", intlDesignator: "", epochYear: 2024, epochDay: 1, inclination: 97, eccentricity: 0, period: 90 },
    ...overrides,
  };
}

function makeAircraft(overrides: Partial<AircraftPosition> = {}): AircraftPosition {
  return {
    icao24: "ac1",
    callsign: "RCH001",
    originCountry: "United States",
    latitude: 32,
    longitude: 44,
    altitude: 12000,
    velocity: 250,
    heading: 90,
    verticalRate: 0,
    onGround: false,
    category: "military",
    timestamp: Date.now() / 1000,
    ...overrides,
  };
}

const testWatchRegion: WatchRegion = {
  id: "middle-east",
  name: "Middle East & Persian Gulf",
  description: "Test region",
  bounds: { north: 42, south: 12, east: 63, west: 25 },
  center: { lat: 32, lon: 44 },
  zoom: 3000,
  countries: ["IRN", "IRQ", "SYR", "ISR", "YEM", "SAU"],
  watchKeywords: ["iran", "israel"],
  active: true,
};

// ── Market Anomaly Detection ─────────────────────────────────────────────

describe("detectMarketAnomalies", () => {
  it("detects volume spikes in energy commodities", () => {
    const market = [makeMarketData({ volumeAnomaly: 3.5 })];
    const conflicts = [makeConflict()];
    const result = detectMarketAnomalies(market, conflicts, []);

    expect(result.length).toBeGreaterThan(0);
    const volumeAnomaly = result.find((a) => a.anomalyType === "pre_event_movement" || a.anomalyType === "volume_spike");
    expect(volumeAnomaly).toBeDefined();
    expect(volumeAnomaly!.severity).toBe("high");
  });

  it("detects price surges exceeding threshold", () => {
    const market = [makeMarketData({ changePercent: 6.5, volumeAnomaly: 1.0 })];
    const result = detectMarketAnomalies(market, [], []);

    const priceSurge = result.find((a) => a.anomalyType === "price_surge");
    expect(priceSurge).toBeDefined();
    expect(priceSurge!.description).toContain("surge");
  });

  it("detects price crashes", () => {
    const market = [makeMarketData({ changePercent: -7.2, volumeAnomaly: 1.0 })];
    const result = detectMarketAnomalies(market, [], []);

    const crash = result.find((a) => a.anomalyType === "price_crash");
    expect(crash).toBeDefined();
  });

  it("flags defense sector rotation during conflicts", () => {
    const market = [makeMarketData({
      symbol: "LMT", name: "Lockheed Martin", category: "defense",
      changePercent: 4.5, volumeAnomaly: 1.2,
    })];
    const conflicts = [makeConflict()];
    const result = detectMarketAnomalies(market, conflicts, []);

    const sectorRotation = result.find((a) => a.anomalyType === "sector_rotation");
    expect(sectorRotation).toBeDefined();
    expect(sectorRotation!.description).toContain("Lockheed Martin");
  });

  it("flags VIX above 25", () => {
    const market = [makeMarketData({
      symbol: "^VIX", name: "VIX", category: "index",
      price: 32, changePercent: 15, volumeAnomaly: 1.0,
    })];
    const result = detectMarketAnomalies(market, [], []);

    const vixAlert = result.find((a) => a.symbol === "^VIX");
    expect(vixAlert).toBeDefined();
    expect(vixAlert!.description).toContain("VIX");
  });

  it("returns empty for normal market conditions", () => {
    const market = [makeMarketData({
      changePercent: 0.5, volumeAnomaly: 0.9,
    })];
    const result = detectMarketAnomalies(market, [], []);
    expect(result).toEqual([]);
  });
});

// ── Satellite Surveillance Pattern Detection ─────────────────────────────

describe("detectSatelliteSurveillancePatterns", () => {
  it("detects recon satellites over conflict watch regions", () => {
    const sats = [
      makeSatellite({ id: "s1", name: "USA-326", category: "reconnaissance", country: "US" }),
      makeSatellite({ id: "s2", name: "USA-327", category: "military", country: "US", latitude: 33 }),
    ];
    const conflicts = [makeConflict({ country: "IRQ" })];

    const result = detectSatelliteSurveillancePatterns(sats, conflicts, [testWatchRegion]);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].targetRegion).toBe("Middle East & Persian Gulf");
    expect(result[0].ownerCountries).toContain("US");
  });

  it("identifies pre-event phase when conflicts exist but not recent", () => {
    const sats = [makeSatellite({ category: "reconnaissance" })];
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const conflicts = [makeConflict({ country: "IRQ", date: weekAgo })];

    const result = detectSatelliteSurveillancePatterns(sats, conflicts, [testWatchRegion]);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].phase).toBe("pre_event");
  });

  it("identifies during_event phase for very recent conflicts", () => {
    const sats = [makeSatellite({ category: "reconnaissance" })];
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const conflicts = [makeConflict({ country: "IRQ", date: oneHourAgo })];

    const result = detectSatelliteSurveillancePatterns(sats, conflicts, [testWatchRegion]);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].phase).toBe("during_event");
  });

  it("returns empty when no sats are over watch regions", () => {
    const sats = [makeSatellite({ latitude: 60, longitude: -100 })]; // over Canada
    const result = detectSatelliteSurveillancePatterns(sats, [], [testWatchRegion]);
    expect(result).toEqual([]);
  });

  it("ignores civilian satellites", () => {
    const sats = [makeSatellite({ category: "weather" })];
    const result = detectSatelliteSurveillancePatterns(sats, [], [testWatchRegion]);
    expect(result).toEqual([]);
  });
});

// ── Military Aircraft Pattern Detection ──────────────────────────────────

describe("detectMilitaryAircraftPatterns", () => {
  it("detects high-altitude military aircraft (AWACS/bomber)", () => {
    const aircraft = [
      makeAircraft({ icao24: "a1", altitude: 12000 }),
      makeAircraft({ icao24: "a2", altitude: 15000 }),
    ];
    const result = detectMilitaryAircraftPatterns(aircraft, [], [testWatchRegion]);

    const highAlt = result.find((p) => p.patternType === "awacs_orbit" || p.patternType === "bomber_deployment");
    expect(highAlt).toBeDefined();
  });

  it("detects civilian avoidance in conflict zones", () => {
    const militaryAC = [makeAircraft({ category: "military" })];
    const conflicts = [makeConflict({ country: "IRQ" })];

    // No civilian aircraft in region
    const result = detectMilitaryAircraftPatterns(militaryAC, conflicts, [testWatchRegion]);

    const avoidance = result.find((p) => p.patternType === "civilian_avoidance");
    expect(avoidance).toBeDefined();
    expect(avoidance!.description).toContain("No civilian air traffic");
  });

  it("detects transport surge with many military aircraft", () => {
    const aircraft = Array.from({ length: 6 }, (_, i) =>
      makeAircraft({ icao24: `ac${i}`, latitude: 30 + i * 0.5, altitude: 8000 })
    );
    const result = detectMilitaryAircraftPatterns(aircraft, [], [testWatchRegion]);

    const surge = result.find((p) => p.patternType === "transport_surge");
    expect(surge).toBeDefined();
    expect(surge!.count).toBe(6);
  });

  it("returns empty for civilian aircraft only", () => {
    const aircraft = [makeAircraft({ category: "civilian" })];
    const result = detectMilitaryAircraftPatterns(aircraft, [], [testWatchRegion]);
    expect(result).toEqual([]);
  });
});

// ── Full Cross-Intelligence Correlation ──────────────────────────────────

describe("generateCrossIntelligenceAlerts", () => {
  it("generates alert when energy market anomaly coincides with regional conflict", () => {
    const input = {
      market: [
        makeMarketData({ symbol: "CL=F", changePercent: 5, volumeAnomaly: 2.5 }),
        makeMarketData({ symbol: "BZ=F", name: "Brent Crude", changePercent: 4.5, volumeAnomaly: 2.0 }),
      ],
      conflicts: [makeConflict({ country: "IRN", date: new Date().toISOString() })],
      gdeltEvents: [makeGDELT({ country: "IRN" })],
      satellites: [],
      aircraft: [],
      disasters: [],
      watchRegions: [testWatchRegion],
    };

    const alerts = generateCrossIntelligenceAlerts(input);

    expect(alerts.length).toBeGreaterThan(0);
    const marketConflictAlert = alerts.find((a) => a.title.includes("IRN"));
    expect(marketConflictAlert).toBeDefined();
    expect(marketConflictAlert!.signals.length).toBeGreaterThan(0);
    expect(marketConflictAlert!.marketImpact).toBeDefined();
  });

  it("detects suspicious defense sector activity without public conflict news", () => {
    const defenseStocks = [
      makeMarketData({ symbol: "LMT", name: "Lockheed Martin", category: "defense", changePercent: 4, volumeAnomaly: 2.0 }),
      makeMarketData({ symbol: "RTX", name: "RTX Corp", category: "defense", changePercent: 3.5, volumeAnomaly: 1.8 }),
      makeMarketData({ symbol: "NOC", name: "Northrop Grumman", category: "defense", changePercent: 3, volumeAnomaly: 1.6 }),
    ];

    const input = {
      market: defenseStocks,
      conflicts: [],
      gdeltEvents: [], // No public conflict news
      satellites: [],
      aircraft: [],
      disasters: [],
      watchRegions: [],
    };

    const alerts = generateCrossIntelligenceAlerts(input);

    const insiderAlert = alerts.find(
      (a) => a.category === "insider_trading_suspicion"
    );
    expect(insiderAlert).toBeDefined();
    expect(insiderAlert!.suspicionLevel).not.toBe("none");
    expect(insiderAlert!.narrative).toContain("defense sector");
  });

  it("combines satellite surveillance + conflict + market signals", () => {
    const input = {
      market: [makeMarketData({ symbol: "CL=F", changePercent: 4, volumeAnomaly: 2.5 })],
      conflicts: [makeConflict({ country: "IRQ", date: new Date().toISOString() })],
      gdeltEvents: [],
      satellites: [makeSatellite({ category: "reconnaissance", latitude: 32, longitude: 44 })],
      aircraft: [makeAircraft({ category: "military", latitude: 32, longitude: 44 })],
      disasters: [],
      watchRegions: [testWatchRegion],
    };

    const alerts = generateCrossIntelligenceAlerts(input);

    // Should have alerts from multiple correlation types
    expect(alerts.length).toBeGreaterThan(0);

    // Check that signals span multiple domains
    const multiDomainAlert = alerts.find(
      (a) => a.signals.some((s) => s.source === "satellite") || a.signals.some((s) => s.source === "market")
    );
    expect(multiDomainAlert).toBeDefined();
  });

  it("returns empty for normal conditions", () => {
    const input = {
      market: [makeMarketData({ changePercent: 0.2, volumeAnomaly: 0.8 })],
      conflicts: [],
      gdeltEvents: [],
      satellites: [],
      aircraft: [],
      disasters: [],
      watchRegions: [],
    };

    const alerts = generateCrossIntelligenceAlerts(input);
    expect(alerts).toEqual([]);
  });

  it("assigns higher suspicion when volume precedes conflict", () => {
    const input = {
      market: [makeMarketData({ symbol: "CL=F", changePercent: 5, volumeAnomaly: 4.0 })],
      conflicts: [makeConflict({ country: "IRN", date: new Date().toISOString(), fatalities: 30 })],
      gdeltEvents: [makeGDELT({ country: "IRN", avgTone: -9 })],
      satellites: [],
      aircraft: [],
      disasters: [],
      watchRegions: [testWatchRegion],
    };

    const alerts = generateCrossIntelligenceAlerts(input);

    const highSuspicion = alerts.find(
      (a) => a.suspicionLevel === "high" || a.suspicionLevel === "very_high"
    );
    expect(highSuspicion).toBeDefined();
  });
});
