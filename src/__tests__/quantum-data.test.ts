// ============================================================================
// Tests — QuantumData TypeScript port + GeoEventQuantumData
// ============================================================================

import { createQuantumData } from "@/types/quantum-data";
import type { QuantumData, TruthLayer } from "@/types/quantum-data";
import { gdeltToQuantumData, acledToQuantumData } from "@/types/geo-event-quantum";
import type { GeoEventQuantumData, PLOVEREventType } from "@/types/geo-event-quantum";

// ── QuantumData base tests ──────────────────────────────────────────────────

describe("QuantumData", () => {
  test("createQuantumData produces valid defaults", () => {
    const qd = createQuantumData({
      id: "test-1",
      label: "Test Datum",
      value: 42,
    });

    expect(qd.id).toBe("test-1");
    expect(qd.label).toBe("Test Datum");
    expect(qd.value).toBe(42);
    expect(qd.truthLayer).toBe("OBSERVED");
    expect(qd.confidence).toBe(1.0);
    expect(qd.createdBy).toBe("satellite-spy");
    expect(qd.inputs).toEqual([]);
    expect(qd.links).toEqual([]);
    expect(qd.createdAt).toBeTruthy();
  });

  test("createQuantumData allows override of all fields", () => {
    const qd = createQuantumData({
      id: "comp-1",
      label: "Computed Value",
      value: 100,
      truthLayer: "COMPUTED",
      confidence: 0.85,
      formula: "A + B",
      inputs: ["a-1", "b-1"],
      source: { document: "Test Doc", page: 5 },
      concept: "test:ComputedMetric",
      period: "2024-FY",
      explanation: "Sum of A and B",
      createdBy: "test-agent",
    });

    expect(qd.truthLayer).toBe("COMPUTED");
    expect(qd.confidence).toBe(0.85);
    expect(qd.formula).toBe("A + B");
    expect(qd.inputs).toEqual(["a-1", "b-1"]);
    expect(qd.source?.document).toBe("Test Doc");
    expect(qd.concept).toBe("test:ComputedMetric");
    expect(qd.period).toBe("2024-FY");
    expect(qd.createdBy).toBe("test-agent");
  });

  test("all 4 TruthLayer values are valid", () => {
    const layers: TruthLayer[] = ["OBSERVED", "COMPUTED", "ESTIMATED", "MARKET_REFERENCE"];
    layers.forEach((layer) => {
      const qd = createQuantumData({
        id: `test-${layer}`,
        label: `Test ${layer}`,
        value: 1,
        truthLayer: layer,
      });
      expect(qd.truthLayer).toBe(layer);
    });
  });

  test("QuantumData supports complex value types", () => {
    const withObject = createQuantumData({
      id: "obj-1",
      label: "Object Value",
      value: { nested: true, count: 5 },
    });
    expect((withObject.value as Record<string, unknown>).nested).toBe(true);

    const withArray = createQuantumData({
      id: "arr-1",
      label: "Array Value",
      value: [1, 2, 3],
    });
    expect((withArray.value as number[]).length).toBe(3);

    const withString = createQuantumData({
      id: "str-1",
      label: "String Value",
      value: "hello",
    });
    expect(withString.value).toBe("hello");
  });

  test("QuantumData children create a composable tree", () => {
    const child1 = createQuantumData({ id: "c1", label: "Child 1", value: 10 });
    const child2 = createQuantumData({ id: "c2", label: "Child 2", value: 20 });
    const parent = createQuantumData({
      id: "p1",
      label: "Parent",
      value: 30,
      truthLayer: "COMPUTED",
      formula: "c1 + c2",
      inputs: ["c1", "c2"],
      children: [child1, child2],
      aggregation: "SUM",
    });

    expect(parent.children).toHaveLength(2);
    expect(parent.children![0].label).toBe("Child 1");
    expect(parent.aggregation).toBe("SUM");
  });

  test("QuantumData links connect to other nodes", () => {
    const qd = createQuantumData({
      id: "linked-1",
      label: "Linked Node",
      value: 50,
      links: [
        { target: "node-2", relation: "COMPOSES" },
        { target: "node-3", relation: "DEPENDS_ON" },
      ],
    });

    expect(qd.links).toHaveLength(2);
    expect(qd.links![0].target).toBe("node-2");
    expect(qd.links![0].relation).toBe("COMPOSES");
  });
});

// ── GeoEventQuantumData tests ───────────────────────────────────────────────

describe("GeoEventQuantumData", () => {
  describe("gdeltToQuantumData", () => {
    const sampleGDELT = {
      globalEventId: "123456789",
      title: "Military Tensions in Eastern Mediterranean",
      latitude: 35.5,
      longitude: 24.0,
      country: "GR",
      location: "Crete, Greece",
      tone: -5.2,
      goldsteinScale: -7.0,
      numMentions: 150,
      numSources: 25,
      numArticles: 80,
      avgTone: -4.8,
      eventCode: "18",
      eventDescription: "Use of conventional military force",
      quadClass: "material_conflict",
      sourceUrl: "https://example.com/article",
      dateAdded: "2024-03-22",
    };

    test("converts GDELT event to valid GeoEventQuantumData", () => {
      const qd = gdeltToQuantumData(sampleGDELT);

      expect(qd.id).toBe("gdelt-123456789");
      expect(qd.label).toBe("Military Tensions in Eastern Mediterranean");
      expect(qd.truthLayer).toBe("OBSERVED");
      expect(qd.latitude).toBe(35.5);
      expect(qd.longitude).toBe(24.0);
      expect(qd.country).toBe("GR");
      expect(qd.sourceFeed).toBe("GDELT");
      expect(qd.goldsteinScale).toBe(-7.0);
      expect(qd.source?.feed).toBe("GDELT");
      expect(qd.createdBy).toBe("satellite-spy:gdelt-ingest");
    });

    test("maps CAMEO event code to PLOVER type", () => {
      const qd = gdeltToQuantumData(sampleGDELT);
      expect(qd.eventType).toBe("FIGHT"); // CAMEO 18 → FIGHT
    });

    test("classifies severity from goldstein + mentions", () => {
      const qd = gdeltToQuantumData(sampleGDELT);
      // goldstein -7.0 (abs >= 5) → high or critical
      expect(["high", "critical"]).toContain(qd.severity);
    });

    test("computes confidence from sources and mentions", () => {
      const qd = gdeltToQuantumData(sampleGDELT);
      expect(qd.confidence).toBeGreaterThan(0.3);
      expect(qd.confidence).toBeLessThanOrEqual(0.95);
    });

    test("sets ontological concept as plover:TYPE", () => {
      const qd = gdeltToQuantumData(sampleGDELT);
      expect(qd.concept).toMatch(/^plover:/);
    });

    test("handles low-intensity events", () => {
      const lowEvent = {
        ...sampleGDELT,
        goldsteinScale: -1.0,
        numMentions: 5,
        numSources: 2,
        eventCode: "7",
      };
      const qd = gdeltToQuantumData(lowEvent);
      expect(qd.severity).toBe("low");
      expect(qd.eventType).toBe("CONSULT"); // CAMEO 7
    });

    test("handles cooperation events", () => {
      const coopEvent = {
        ...sampleGDELT,
        goldsteinScale: 5.0,
        eventCode: "9",
        quadClass: "verbal_cooperation",
      };
      const qd = gdeltToQuantumData(coopEvent);
      expect(qd.eventType).toBe("AGREE"); // CAMEO 9
    });
  });

  describe("acledToQuantumData", () => {
    const sampleACLED = {
      id: "ACL-2024-001",
      date: "2024-03-20",
      eventType: "battle",
      subEventType: "Armed clash",
      actors: ["Government forces", "Rebel group"],
      location: "Aleppo",
      latitude: 36.2,
      longitude: 37.16,
      country: "Syria",
      region: "Aleppo Governorate",
      fatalities: 12,
      notes: "Clashes between government forces and rebel groups in eastern Aleppo",
      source: "ACLED field researcher",
      severity: "high" as const,
    };

    test("converts ACLED event to valid GeoEventQuantumData", () => {
      const qd = acledToQuantumData(sampleACLED);

      expect(qd.id).toBe("acled-ACL-2024-001");
      expect(qd.truthLayer).toBe("OBSERVED");
      expect(qd.confidence).toBe(0.9); // ACLED = high confidence
      expect(qd.latitude).toBe(36.2);
      expect(qd.longitude).toBe(37.16);
      expect(qd.country).toBe("Syria");
      expect(qd.sourceFeed).toBe("ACLED");
      expect(qd.fatalities).toBe(12);
      expect(qd.actors).toEqual(["Government forces", "Rebel group"]);
      expect(qd.createdBy).toBe("satellite-spy:acled-ingest");
    });

    test("maps ACLED event type to PLOVER", () => {
      const qd = acledToQuantumData(sampleACLED);
      expect(qd.eventType).toBe("FIGHT"); // battle → FIGHT
    });

    test("maps protest type correctly", () => {
      const protest = { ...sampleACLED, eventType: "protest", fatalities: 0, severity: "low" as const };
      const qd = acledToQuantumData(protest);
      expect(qd.eventType).toBe("PROTEST");
    });

    test("maps explosion type correctly", () => {
      const explosion = { ...sampleACLED, eventType: "explosion", severity: "critical" as const };
      const qd = acledToQuantumData(explosion);
      expect(qd.eventType).toBe("ASSAULT"); // explosion → ASSAULT
    });

    test("value is fatality count", () => {
      const qd = acledToQuantumData(sampleACLED);
      expect(qd.value).toBe(12);
      expect(qd.unit).toBe("fatalities");
    });

    test("source references ACLED database", () => {
      const qd = acledToQuantumData(sampleACLED);
      expect(qd.source?.document).toBe("ACLED Conflict Database");
      expect(qd.source?.feed).toBe("ACLED");
    });
  });

  describe("PLOVER ontology coverage", () => {
    const ploverTypes: PLOVEREventType[] = [
      "AGREE", "CONSULT", "SUPPORT", "COOPERATE", "AID",
      "PROTEST", "REJECT", "THREATEN", "SANCTION", "MOBILIZE",
      "COERCE", "ASSAULT", "FIGHT", "SEIZE", "FORCE", "UNKNOWN",
    ];

    test("all 16 PLOVER types are defined", () => {
      expect(ploverTypes).toHaveLength(16);
    });

    test("CAMEO codes 1-20 all map to valid PLOVER types", () => {
      for (let code = 1; code <= 20; code++) {
        const event = {
          globalEventId: `test-${code}`,
          title: "Test",
          latitude: 0, longitude: 0,
          country: "XX", location: "Test",
          tone: 0, goldsteinScale: 0,
          numMentions: 1, numSources: 1, numArticles: 1,
          avgTone: 0, eventCode: String(code),
          eventDescription: "Test", quadClass: "verbal_cooperation",
          sourceUrl: "", dateAdded: "2024-01-01",
        };
        const qd = gdeltToQuantumData(event);
        expect(ploverTypes).toContain(qd.eventType);
      }
    });
  });
});
