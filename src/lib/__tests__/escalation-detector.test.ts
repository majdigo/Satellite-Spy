/**
 * Tests for Agentic Escalation Detector.
 * Validates autonomous threat pattern detection.
 */

import { detectEscalations } from "../escalation-detector";
import type { EscalationAlert } from "../escalation-detector";
import type { GDELTEvent, ConflictEvent } from "@/types";

const now = new Date().toISOString();

function makeGDELT(id: string, goldstein: number, country: string, lat = 33.3, lon = 44.4, sources = 8): GDELTEvent {
  return {
    globalEventId: id, dateAdded: now, sourceUrl: "", title: `Event ${id}`,
    tone: goldstein * 0.5, goldsteinScale: goldstein, numMentions: 10, numSources: sources,
    numArticles: 3, avgTone: goldstein * 0.5,
    actor1: { name: "Actor A", countryCode: country, type: "GOV" },
    actor2: { name: "Actor B", countryCode: "", type: "" },
    eventCode: "190", eventDescription: "Force", quadClass: "material_conflict",
    latitude: lat, longitude: lon, country, location: country,
  };
}

function makeConflict(id: string, severity: "low" | "medium" | "high" | "critical", country: string, lat = 33.3, lon = 44.4): ConflictEvent {
  return {
    id, date: now, eventType: "battle", subEventType: "clash",
    actors: ["Group A"], location: country,
    latitude: lat, longitude: lon, country, region: "test",
    fatalities: severity === "critical" ? 10 : 1, notes: "", source: "ACLED", severity,
  };
}

describe("Escalation Detector", () => {
  describe("temporal escalation", () => {
    test("detects worsening goldstein trend", () => {
      // Early events: mild (-2, -3), Later events: severe (-7, -8, -9)
      const events = [
        { ...makeGDELT("g1", -2, "IRQ"), dateAdded: new Date(Date.now() - 20 * 3600000).toISOString() },
        { ...makeGDELT("g2", -3, "IRQ"), dateAdded: new Date(Date.now() - 15 * 3600000).toISOString() },
        { ...makeGDELT("g3", -7, "IRQ"), dateAdded: new Date(Date.now() - 5 * 3600000).toISOString() },
        { ...makeGDELT("g4", -8, "IRQ"), dateAdded: new Date(Date.now() - 2 * 3600000).toISOString() },
        { ...makeGDELT("g5", -9, "IRQ"), dateAdded: new Date(Date.now() - 1 * 3600000).toISOString() },
      ];

      const alerts = detectEscalations(events, []);
      const temporal = alerts.filter((a) => a.pattern === "temporal_escalation");
      expect(temporal.length).toBeGreaterThanOrEqual(1);
      expect(temporal[0].region).toBe("IRQ");
      expect(temporal[0].reasoning).toContain("shifted");
    });

    test("does not flag stable situation", () => {
      const events = [
        { ...makeGDELT("g1", -3, "IRQ"), dateAdded: new Date(Date.now() - 10 * 3600000).toISOString() },
        { ...makeGDELT("g2", -3, "IRQ"), dateAdded: new Date(Date.now() - 5 * 3600000).toISOString() },
        { ...makeGDELT("g3", -3, "IRQ"), dateAdded: new Date(Date.now() - 1 * 3600000).toISOString() },
      ];

      const alerts = detectEscalations(events, []);
      const temporal = alerts.filter((a) => a.pattern === "temporal_escalation");
      expect(temporal.length).toBe(0);
    });
  });

  describe("critical mass", () => {
    test("detects when threshold exceeded in a region", () => {
      const events = Array.from({ length: 6 }, (_, i) =>
        makeGDELT(`g${i}`, -8, "IRQ")
      );

      const alerts = detectEscalations(events, [], { criticalMassThreshold: 5 });
      const mass = alerts.filter((a) => a.pattern === "critical_mass");
      expect(mass.length).toBeGreaterThanOrEqual(1);
      expect(mass[0].severity).toBe("high");
    });

    test("cross-source boosts confidence", () => {
      const gdelt = [makeGDELT("g1", -8, "IRQ"), makeGDELT("g2", -9, "IRQ")];
      const acled = [
        makeConflict("c1", "critical", "IRQ"),
        makeConflict("c2", "critical", "IRQ"),
        makeConflict("c3", "critical", "IRQ"),
      ];

      const alerts = detectEscalations(gdelt, acled, { criticalMassThreshold: 4 });
      const mass = alerts.filter((a) => a.pattern === "critical_mass");
      expect(mass.length).toBeGreaterThanOrEqual(1);
      // Cross-source should give higher confidence
      expect(mass[0].confidence).toBeGreaterThan(0.7);
    });
  });

  describe("cross-source corroboration", () => {
    test("detects GDELT + ACLED same event", () => {
      const gdelt = [makeGDELT("g1", -7, "IRQ", 33.3, 44.4, 12)];
      const acled = [makeConflict("c1", "critical", "IRQ", 33.31, 44.41)]; // <50km

      const alerts = detectEscalations(gdelt, acled);
      const corr = alerts.filter((a) => a.pattern === "cross_source_corroboration");
      expect(corr.length).toBeGreaterThanOrEqual(1);
      expect(corr[0].reasoning).toContain("corroborated");
      expect(corr[0].confidence).toBeGreaterThan(0.85); // boosted
    });

    test("does not corroborate distant events", () => {
      const gdelt = [makeGDELT("g1", -7, "IRQ", 33.3, 44.4)];
      const acled = [makeConflict("c1", "critical", "UKR", 48.5, 37.5)]; // far away

      const alerts = detectEscalations(gdelt, acled);
      const corr = alerts.filter((a) => a.pattern === "cross_source_corroboration");
      expect(corr.length).toBe(0);
    });
  });

  describe("spillover risk", () => {
    test("detects conflict spreading near borders", () => {
      // Hot country (IRQ) with many events + nearby event in different country
      const gdelt = [
        makeGDELT("g1", -8, "IRQ", 33.3, 44.4),
        makeGDELT("g2", -7, "IRQ", 33.5, 44.6),
        makeGDELT("g3", -9, "IRQ", 33.1, 44.2),
        makeGDELT("g4", -5, "SYR", 35.0, 43.0), // near Iraq border
      ];

      const alerts = detectEscalations(gdelt, []);
      const spill = alerts.filter((a) => a.pattern === "spillover_risk");
      expect(spill.length).toBeGreaterThanOrEqual(1);
      expect(spill[0].reasoning).toContain("spillover");
    });
  });

  describe("alert quality", () => {
    test("all alerts have reasoning", () => {
      const events = Array.from({ length: 6 }, (_, i) => makeGDELT(`g${i}`, -8, "IRQ"));
      const alerts = detectEscalations(events, []);

      for (const alert of alerts) {
        expect(alert.reasoning.length).toBeGreaterThan(20);
        expect(alert.evidence.length).toBeGreaterThan(0);
        expect(alert.recommendation.length).toBeGreaterThan(10);
        expect(alert.confidence).toBeGreaterThan(0);
        expect(alert.confidence).toBeLessThanOrEqual(1);
      }
    });

    test("alerts sorted by severity then confidence", () => {
      const gdelt = [
        ...Array.from({ length: 6 }, (_, i) => makeGDELT(`g${i}`, -8, "IRQ")),
        ...Array.from({ length: 4 }, (_, i) => makeGDELT(`e${i}`, -6, "UKR", 48.5, 37.5)),
      ];
      const acled = [makeConflict("c1", "critical", "IRQ", 33.31, 44.41)];

      const alerts = detectEscalations(gdelt, acled, { criticalMassThreshold: 3 });
      const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

      for (let i = 0; i < alerts.length - 1; i++) {
        const a = severityOrder[alerts[i].severity] ?? 3;
        const b = severityOrder[alerts[i + 1].severity] ?? 3;
        expect(a).toBeLessThanOrEqual(b);
      }
    });

    test("empty input produces no alerts", () => {
      const alerts = detectEscalations([], []);
      expect(alerts).toEqual([]);
    });
  });
});
