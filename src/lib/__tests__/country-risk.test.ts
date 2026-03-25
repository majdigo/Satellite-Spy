/**
 * Tests for Country Risk Score API.
 * Validates the cross-domain service for M-Agent and H-Agent consumption.
 */

import { computeCountryRisk, getCountryRiskScore, WATCH_REGIONS } from "../country-risk";
import type { GDELTEvent, ConflictEvent } from "@/types";

const mockGDELT: GDELTEvent[] = [
  {
    globalEventId: "g1", dateAdded: "2026-03-26", sourceUrl: "", title: "Clash Baghdad",
    tone: -5, goldsteinScale: -8, numMentions: 20, numSources: 10, numArticles: 5, avgTone: -5,
    actor1: { name: "Iraq Gov", countryCode: "IRQ", type: "GOV" },
    actor2: { name: "Militia", countryCode: "IRQ", type: "MIL" },
    eventCode: "190", eventDescription: "Force", quadClass: "material_conflict",
    latitude: 33.3, longitude: 44.4, country: "IRQ", location: "Baghdad",
  },
  {
    globalEventId: "g2", dateAdded: "2026-03-26", sourceUrl: "", title: "Ukraine strike",
    tone: -7, goldsteinScale: -9, numMentions: 50, numSources: 15, numArticles: 10, avgTone: -7,
    actor1: { name: "Ukraine", countryCode: "UKR", type: "GOV" },
    actor2: { name: "Russia", countryCode: "RUS", type: "MIL" },
    eventCode: "190", eventDescription: "Force", quadClass: "material_conflict",
    latitude: 48.5, longitude: 37.5, country: "UKR", location: "Donetsk",
  },
  {
    globalEventId: "g3", dateAdded: "2026-03-26", sourceUrl: "", title: "Trade Paris",
    tone: 4, goldsteinScale: 3.5, numMentions: 5, numSources: 3, numArticles: 2, avgTone: 4,
    actor1: { name: "EU", countryCode: "EUR", type: "IGO" },
    actor2: { name: "Japan", countryCode: "JPN", type: "GOV" },
    eventCode: "050", eventDescription: "Cooperate", quadClass: "material_cooperation",
    latitude: 48.8, longitude: 2.3, country: "FRA", location: "Paris",
  },
];

const mockConflicts: ConflictEvent[] = [
  {
    id: "c1", date: "2026-03-26", eventType: "battle", subEventType: "Armed clash",
    actors: ["Group A", "Group B"], location: "Mosul",
    latitude: 36.3, longitude: 43.1, country: "IRQ", region: "Middle East",
    fatalities: 5, notes: "", source: "ACLED", severity: "high",
  },
];

describe("Country Risk Score API", () => {
  describe("computeCountryRisk", () => {
    test("computes global risk score", () => {
      const result = computeCountryRisk(mockGDELT, mockConflicts);
      expect(result.globalScore).toBeGreaterThan(0);
      expect(result.globalScore).toBeLessThanOrEqual(10);
    });

    test("Middle East has higher risk than Asia-Pacific", () => {
      const result = computeCountryRisk(mockGDELT, mockConflicts);
      const me = result.regions["middle_east"]?.score ?? 0;
      const ap = result.regions["asia_pacific"]?.score ?? 0;
      expect(me).toBeGreaterThan(ap);
    });

    test("Iraq has events counted", () => {
      const result = computeCountryRisk(mockGDELT, mockConflicts);
      const irq = result.countries.find((c) => c.country === "IRQ");
      expect(irq).toBeDefined();
      expect(irq!.eventCount).toBeGreaterThanOrEqual(2); // 1 GDELT + 1 ACLED
    });

    test("produces CRP percentage", () => {
      const result = computeCountryRisk(mockGDELT, mockConflicts);
      expect(result.crpPercent).toBeGreaterThan(0);
    });

    test("countries sorted by risk score descending", () => {
      const result = computeCountryRisk(mockGDELT, mockConflicts);
      for (let i = 0; i < result.countries.length - 1; i++) {
        expect(result.countries[i].riskScore).toBeGreaterThanOrEqual(result.countries[i + 1].riskScore);
      }
    });

    test("France not in any watch region (no risk)", () => {
      const result = computeCountryRisk(mockGDELT, mockConflicts);
      const fra = result.countries.find((c) => c.country === "FRA");
      // France is not in watch regions so shouldn't appear
      expect(fra).toBeUndefined();
    });

    test("empty input gives zero risk", () => {
      const result = computeCountryRisk([], []);
      expect(result.globalScore).toBe(0);
      expect(result.countries).toHaveLength(0);
    });
  });

  describe("getCountryRiskScore", () => {
    test("returns risk for known country", () => {
      const risk = getCountryRiskScore("IRQ", mockGDELT, mockConflicts);
      expect(risk).not.toBeNull();
      expect(risk!.country).toBe("IRQ");
      expect(risk!.riskScore).toBeGreaterThan(0);
    });

    test("returns null for country not in events", () => {
      const risk = getCountryRiskScore("BRA", mockGDELT, mockConflicts);
      expect(risk).toBeNull();
    });

    test("includes CRP for M-Agent consumption", () => {
      const risk = getCountryRiskScore("IRQ", mockGDELT, mockConflicts);
      expect(risk!.crpPercent).toBeGreaterThan(0);
      expect(risk!.regionName).toContain("Middle East");
    });
  });

  describe("WATCH_REGIONS", () => {
    test("3 regions defined", () => {
      expect(WATCH_REGIONS).toHaveLength(3);
    });

    test("weights sum to 1.0", () => {
      const totalWeight = WATCH_REGIONS.reduce((s, r) => s + r.riskWeight, 0);
      expect(totalWeight).toBeCloseTo(1.0);
    });
  });
});
