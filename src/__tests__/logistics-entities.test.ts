/**
 * Logistics Entity Tests
 * Tests the extended WorldModel with fleet, warehouse, shipment, route types
 */

import { buildWorldModel } from "@/lib/engine/world-model";
import type { WorldModelInput } from "@/lib/engine/world-model";

function emptyInput(): WorldModelInput {
  return {
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
}

describe("Logistics Entities in WorldModel", () => {
  const wm = buildWorldModel(emptyInput());

  describe("entity types", () => {
    it("should contain logistics entities", () => {
      const types = new Set<string>();
      for (const [, entity] of wm.entities) {
        types.add(entity.type);
      }
      expect(types.has("port")).toBe(true);
      expect(types.has("warehouse")).toBe(true);
      expect(types.has("fleet")).toBe(true);
      expect(types.has("route")).toBe(true);
    });

    it("should contain Rotterdam port", () => {
      const rotterdam = wm.entities.get("port-rotterdam");
      expect(rotterdam).toBeDefined();
      expect(rotterdam!.name).toBe("Port of Rotterdam");
      expect(rotterdam!.type).toBe("port");
      expect(rotterdam!.location).toBeDefined();
      expect(rotterdam!.location!.lat).toBeCloseTo(51.95, 1);
    });

    it("should contain Jebel Ali port", () => {
      const jebelAli = wm.entities.get("port-jebel-ali");
      expect(jebelAli).toBeDefined();
      expect(jebelAli!.name).toBe("Jebel Ali Port (Dubai)");
      expect(jebelAli!.country).toBe("ARE");
    });

    it("should contain Rotterdam tank farm warehouse", () => {
      const warehouse = wm.entities.get("warehouse-rotterdam-tank");
      expect(warehouse).toBeDefined();
      expect(warehouse!.type).toBe("warehouse");
      expect(warehouse!.properties.capacityMbarrels).toBe(60);
      expect(warehouse!.properties.commodities).toContain("oil");
    });

    it("should contain Maersk fleet", () => {
      const fleet = wm.entities.get("fleet-maersk-gulf");
      expect(fleet).toBeDefined();
      expect(fleet!.type).toBe("fleet");
      expect(fleet!.properties.vessels).toBe(45);
      expect(fleet!.properties.operator).toBe("Maersk");
    });

    it("should contain Hormuz→Rotterdam oil route", () => {
      const route = wm.entities.get("route-hormuz-rotterdam");
      expect(route).toBeDefined();
      expect(route!.type).toBe("route");
      const waypoints = route!.properties.waypoints as Array<{ name: string; lat: number; lon: number }>;
      expect(waypoints).toHaveLength(5);
      expect(waypoints[0].name).toBe("Strait of Hormuz");
      expect(waypoints[4].name).toBe("Rotterdam");
      expect(route!.properties.distanceNm).toBe(6500);
      expect(route!.properties.transitDays).toBe(21);
    });
  });

  describe("logistics relations", () => {
    it("should have stores_at relation (oil → warehouse)", () => {
      const storesAt = wm.relations.filter((r) => r.type === "stores_at");
      expect(storesAt.length).toBeGreaterThan(0);
      const oilWarehouse = storesAt.find(
        (r) => r.sourceId === "commodity-oil" && r.targetId === "warehouse-rotterdam-tank"
      );
      expect(oilWarehouse).toBeDefined();
      expect(oilWarehouse!.strength).toBe(0.7);
    });

    it("should have ships_via relations (route → chokepoints)", () => {
      const shipsVia = wm.relations.filter((r) => r.type === "ships_via");
      expect(shipsVia.length).toBeGreaterThanOrEqual(2);
      
      const viaHormuz = shipsVia.find(
        (r) => r.sourceId === "route-hormuz-rotterdam" && r.targetId === "chokepoint-hormuz"
      );
      expect(viaHormuz).toBeDefined();
      expect(viaHormuz!.strength).toBe(0.95);

      const viaSuez = shipsVia.find(
        (r) => r.sourceId === "route-hormuz-rotterdam" && r.targetId === "chokepoint-suez"
      );
      expect(viaSuez).toBeDefined();
    });

    it("should have delivers_to relation (fleet → port)", () => {
      const deliversTo = wm.relations.filter((r) => r.type === "delivers_to");
      expect(deliversTo.length).toBeGreaterThan(0);
      const fleetToRotterdam = deliversTo.find(
        (r) => r.sourceId === "fleet-maersk-gulf" && r.targetId === "port-rotterdam"
      );
      expect(fleetToRotterdam).toBeDefined();
    });

    it("should have Jebel Ali depending on Hormuz", () => {
      const dep = wm.relations.find(
        (r) => r.type === "depends_on" && r.sourceId === "port-jebel-ali" && r.targetId === "chokepoint-hormuz"
      );
      expect(dep).toBeDefined();
      expect(dep!.strength).toBe(0.9);
    });

    it("should have route impacting oil commodity", () => {
      const impact = wm.relations.find(
        (r) => r.type === "impacts" && r.sourceId === "route-hormuz-rotterdam" && r.targetId === "commodity-oil"
      );
      expect(impact).toBeDefined();
      expect(impact!.strength).toBe(0.8);
    });
  });

  describe("entity counts", () => {
    it("should have correct total entity count", () => {
      const total = wm.entities.size;
      // 6 chokepoints + 5 commodities + 8 countries + 5 logistics = 24
      expect(total).toBe(24);
    });

    it("should have correct total relation count", () => {
      // 14 strategic + 6 logistics = 20 static relations (plus dynamic satellite ones)
      const staticRelations = wm.relations.filter(
        (r) => r.id.startsWith("rel-static-") || r.id.startsWith("rel-logistics-")
      );
      expect(staticRelations.length).toBe(20);
    });
  });

  describe("logistics entities have default status", () => {
    it("all logistics entities should start as normal", () => {
      const logisticsTypes = ["port", "warehouse", "fleet", "route"];
      for (const [, entity] of wm.entities) {
        if (logisticsTypes.includes(entity.type)) {
          expect(entity.status).toBe("normal");
        }
      }
    });
  });
});
