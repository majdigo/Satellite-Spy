import {
  evaluateThresholds,
  resetThresholdCooldowns,
  DEFAULT_THRESHOLDS,
  type AlertThreshold,
} from "@/lib/api/alert-thresholds";
import type { GDELTEvent, ConflictEvent, MarketData } from "@/types";

// Reset cooldowns between tests
beforeEach(() => resetThresholdCooldowns());

const makeGDELTEvent = (overrides: Partial<GDELTEvent> = {}): GDELTEvent => ({
  globalEventId: "ev-1",
  dateAdded: "2026-03-22",
  sourceUrl: "https://example.com",
  title: "Test event",
  tone: -3,
  goldsteinScale: -2,
  numMentions: 10,
  numSources: 5,
  numArticles: 3,
  avgTone: -3,
  actor1: { name: "A", countryCode: "AAA", type: "GOV" },
  actor2: { name: "B", countryCode: "BBB", type: "GOV" },
  eventCode: "190",
  eventDescription: "Test",
  quadClass: "material_conflict",
  latitude: 35,
  longitude: 45,
  country: "IRQ",
  location: "Baghdad",
  ...overrides,
});

const makeConflict = (overrides: Partial<ConflictEvent> = {}): ConflictEvent => ({
  id: "c-1",
  date: "2026-03-22",
  eventType: "battle",
  subEventType: "Armed clash",
  actors: ["A", "B"],
  location: "Mosul",
  latitude: 36,
  longitude: 43,
  country: "Iraq",
  region: "Middle East",
  fatalities: 2,
  notes: "",
  source: "ACLED",
  severity: "medium",
  ...overrides,
});

const makeMarket = (overrides: Partial<MarketData> = {}): MarketData => ({
  symbol: "CL=F",
  name: "Crude Oil",
  category: "energy",
  price: 85,
  previousClose: 80,
  changePercent: 1.5,
  volume: 100000,
  avgVolume: 90000,
  volumeAnomaly: 1.1,
  high52w: 95,
  low52w: 65,
  timestamp: "2026-03-22",
  source: "Yahoo",
  ...overrides,
});

describe("Alert Threshold System (S1-07)", () => {
  test("default thresholds are all enabled", () => {
    expect(DEFAULT_THRESHOLDS.every((t) => t.enabled)).toBe(true);
    expect(DEFAULT_THRESHOLDS.length).toBeGreaterThanOrEqual(5);
  });

  test("no alerts for normal data", () => {
    const alerts = evaluateThresholds({
      gdeltEvents: [makeGDELTEvent()], // goldstein -2, mentions 10
      conflicts: [makeConflict()],      // fatalities 2
      marketData: [makeMarket()],       // change 1.5%
    });
    expect(alerts).toHaveLength(0);
  });

  test("triggers on Goldstein < -8 (critical conflict)", () => {
    const alerts = evaluateThresholds({
      gdeltEvents: [makeGDELTEvent({ goldsteinScale: -9.5 })],
      conflicts: [],
      marketData: [],
    });
    const critical = alerts.find((a) => a.thresholdId === "th-critical-conflict");
    expect(critical).toBeDefined();
    expect(critical!.severity).toBe("critical");
    expect(critical!.matchedConditions[0]).toContain("Goldstein < -8");
  });

  test("triggers on escalation (Goldstein < -5 AND mentions > 50)", () => {
    const alerts = evaluateThresholds({
      gdeltEvents: [makeGDELTEvent({ goldsteinScale: -6, numMentions: 80 })],
      conflicts: [],
      marketData: [],
    });
    const escalation = alerts.find((a) => a.thresholdId === "th-escalation");
    expect(escalation).toBeDefined();
    expect(escalation!.severity).toBe("high");
    expect(escalation!.matchedConditions).toHaveLength(2); // Both conditions matched
  });

  test("does NOT trigger escalation if only one condition met", () => {
    // Goldstein bad but not enough mentions
    const alerts = evaluateThresholds({
      gdeltEvents: [makeGDELTEvent({ goldsteinScale: -6, numMentions: 20 })],
      conflicts: [],
      marketData: [],
    });
    const escalation = alerts.find((a) => a.thresholdId === "th-escalation");
    expect(escalation).toBeUndefined();
  });

  test("triggers on mass casualty (fatalities > 10)", () => {
    const alerts = evaluateThresholds({
      gdeltEvents: [],
      conflicts: [makeConflict({ fatalities: 25 })],
      marketData: [],
    });
    const massCasualty = alerts.find((a) => a.thresholdId === "th-mass-casualty");
    expect(massCasualty).toBeDefined();
    expect(massCasualty!.severity).toBe("critical");
  });

  test("triggers on market shock (> 5% change)", () => {
    const alerts = evaluateThresholds({
      gdeltEvents: [],
      conflicts: [],
      marketData: [makeMarket({ changePercent: 7.5, symbol: "GC=F" })],
    });
    const shock = alerts.find((a) => a.thresholdId === "th-market-shock");
    expect(shock).toBeDefined();
    expect(shock!.matchedConditions[0]).toContain("GC=F");
  });

  test("triggers on suspicious volume (> 3x avg)", () => {
    const alerts = evaluateThresholds({
      gdeltEvents: [],
      conflicts: [],
      marketData: [makeMarket({ volumeAnomaly: 4.2, symbol: "CL=F" })],
    });
    const vol = alerts.find((a) => a.thresholdId === "th-volume-anomaly");
    expect(vol).toBeDefined();
    expect(vol!.matchedConditions[0]).toContain("CL=F");
  });

  test("triggers on media surge (> 200 mentions)", () => {
    const alerts = evaluateThresholds({
      gdeltEvents: [makeGDELTEvent({ numMentions: 350 })],
      conflicts: [],
      marketData: [],
    });
    const surge = alerts.find((a) => a.thresholdId === "th-media-surge");
    expect(surge).toBeDefined();
    expect(surge!.severity).toBe("medium");
  });

  test("cooldown prevents duplicate alerts", () => {
    const input = {
      gdeltEvents: [makeGDELTEvent({ goldsteinScale: -9.5 })],
      conflicts: [],
      marketData: [],
    };
    const first = evaluateThresholds(input);
    expect(first.length).toBeGreaterThan(0);

    // Second evaluation should be in cooldown
    const second = evaluateThresholds(input);
    const criticalSecond = second.find((a) => a.thresholdId === "th-critical-conflict");
    expect(criticalSecond).toBeUndefined();
  });

  test("custom thresholds work", () => {
    const custom: AlertThreshold[] = [
      {
        id: "custom-1",
        name: "Custom High Mentions",
        description: "Custom test",
        enabled: true,
        conditions: [{ type: "mentions_above", value: 5 }],
        severity: "low",
        cooldownMs: 0,
      },
    ];
    const alerts = evaluateThresholds(
      { gdeltEvents: [makeGDELTEvent({ numMentions: 10 })], conflicts: [], marketData: [] },
      custom,
    );
    expect(alerts).toHaveLength(1);
    expect(alerts[0].thresholdId).toBe("custom-1");
  });

  test("disabled thresholds are skipped", () => {
    const disabled: AlertThreshold[] = [
      {
        id: "disabled-1",
        name: "Disabled",
        description: "Should not fire",
        enabled: false,
        conditions: [{ type: "mentions_above", value: 1 }],
        severity: "critical",
        cooldownMs: 0,
      },
    ];
    const alerts = evaluateThresholds(
      { gdeltEvents: [makeGDELTEvent({ numMentions: 999 })], conflicts: [], marketData: [] },
      disabled,
    );
    expect(alerts).toHaveLength(0);
  });
});
