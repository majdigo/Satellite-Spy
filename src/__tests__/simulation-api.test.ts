/**
 * Simulation API tests
 * Tests the simulation engine via the formats used by the API route
 */

import { runSimulation, SIMULATION_SCENARIOS } from "@/lib/engine/simulation-engine";
import { buildWorldModel } from "@/lib/engine/world-model";
import type { WorldModelInput } from "@/lib/engine/world-model";

// Build a world model with no live data (static entities only)
function buildTestWorldModel() {
  const emptyInput: WorldModelInput = {
    conflicts: [],
    gdeltEvents: [],
    satellites: [],
    aircraft: [],
    disasters: [],
    marketData: [],
    marketAnomalies: [],
    economicIndicators: [],
    crossIntelAlerts: [],
  };
  return buildWorldModel(emptyInput);
}

describe("Simulation Export API", () => {
  describe("scenario listing", () => {
    it("should have 6 pre-built scenarios", () => {
      expect(SIMULATION_SCENARIOS).toHaveLength(6);
    });

    it("should have all required scenario IDs", () => {
      const ids = SIMULATION_SCENARIOS.map((s) => s.id);
      expect(ids).toContain("sim-hormuz-closure");
      expect(ids).toContain("sim-taiwan-invasion");
      expect(ids).toContain("sim-suez-blockage");
      expect(ids).toContain("sim-russia-gas-cutoff");
      expect(ids).toContain("sim-iran-sanctions");
      expect(ids).toContain("sim-ukraine-escalation");
    });
  });

  describe("Hormuz closure simulation", () => {
    it("should produce timeline entries", () => {
      const wm = buildTestWorldModel();
      const scenario = SIMULATION_SCENARIOS.find((s) => s.id === "sim-hormuz-closure")!;
      const result = runSimulation(scenario, wm);

      expect(result.timeline.length).toBeGreaterThan(0);
      expect(result.timeline[0].timeOffset).toBe("T+0h");
      expect(result.timeline[0].impact).toBe("critical");
    });

    it("should produce market predictions", () => {
      const wm = buildTestWorldModel();
      const scenario = SIMULATION_SCENARIOS.find((s) => s.id === "sim-hormuz-closure")!;
      const result = runSimulation(scenario, wm);

      expect(result.marketPredictions.length).toBeGreaterThan(0);
      // Oil should be predicted to go up
      const oilPrediction = result.marketPredictions.find((p) => p.symbol === "CL=F");
      expect(oilPrediction).toBeDefined();
      expect(oilPrediction!.direction).toBe("up");
    });

    it("should produce affected entities", () => {
      const wm = buildTestWorldModel();
      const scenario = SIMULATION_SCENARIOS.find((s) => s.id === "sim-hormuz-closure")!;
      const result = runSimulation(scenario, wm);

      expect(result.affectedEntities.length).toBeGreaterThan(0);
      // The chokepoint itself should be affected
      const hormuz = result.affectedEntities.find((e) => e.entityId === "chokepoint-hormuz");
      expect(hormuz).toBeDefined();
      expect(hormuz!.newStatus).toBe("critical");
    });

    it("should have a narrative summary", () => {
      const wm = buildTestWorldModel();
      const scenario = SIMULATION_SCENARIOS.find((s) => s.id === "sim-hormuz-closure")!;
      const result = runSimulation(scenario, wm);

      expect(result.narrative).toBeTruthy();
      expect(typeof result.narrative).toBe("string");
      expect(result.narrative.length).toBeGreaterThan(20);
    });

    it("should have overall severity and probability", () => {
      const wm = buildTestWorldModel();
      const scenario = SIMULATION_SCENARIOS.find((s) => s.id === "sim-hormuz-closure")!;
      const result = runSimulation(scenario, wm);

      expect(["low", "medium", "high", "critical"]).toContain(result.overallSeverity);
      expect(result.probability).toBeGreaterThan(0);
      expect(result.probability).toBeLessThanOrEqual(100);
    });
  });

  describe("SimulationXREvent format", () => {
    it("should produce XR-compatible timeline with entity types", () => {
      const wm = buildTestWorldModel();
      const scenario = SIMULATION_SCENARIOS.find((s) => s.id === "sim-hormuz-closure")!;
      const result = runSimulation(scenario, wm);

      // Map to XR format (as the API route does)
      const xrTimeline = result.timeline.map((event) => {
        const entity = wm.entities.get(event.entityId);
        return {
          timeOffset: event.timeOffset,
          entityName: event.entityName,
          entityType: entity?.type || "unknown",
          impact: event.impact,
          confidence: event.confidence,
          position: entity?.location || undefined,
        };
      });

      expect(xrTimeline.length).toBeGreaterThan(0);

      // First entry should be the chokepoint itself
      const first = xrTimeline[0];
      expect(first.entityType).toBe("chokepoint");
      expect(first.position).toBeDefined();
      expect(first.position!.lat).toBeCloseTo(26.5, 0);
      expect(first.position!.lon).toBeCloseTo(56.3, 0);
    });
  });

  describe("all scenarios run without error", () => {
    for (const scenario of SIMULATION_SCENARIOS) {
      it(`should run ${scenario.name} successfully`, () => {
        const wm = buildTestWorldModel();
        const result = runSimulation(scenario, wm);

        expect(result).toBeDefined();
        expect(result.timeline.length).toBeGreaterThan(0);
        expect(result.overallSeverity).toBeTruthy();
        expect(result.narrative).toBeTruthy();
      });
    }
  });
});
