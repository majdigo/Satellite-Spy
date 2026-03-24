import { exportToGeoJSON } from "@/lib/api/export-geojson";
import type { SatellitePosition, GDELTEvent, ConflictEvent, NaturalDisaster } from "@/types";

describe("GeoJSON Export (S1-10)", () => {
  const mockSatellite: SatellitePosition = {
    id: "sat-1",
    name: "ISS",
    latitude: 28.5,
    longitude: -80.6,
    altitude: 408,
    velocity: 7.66,
    category: "scientific",
    country: "INTL",
    timestamp: new Date("2026-03-22"),
    tle: {
      name: "ISS",
      line1: "1 25544U ...",
      line2: "2 25544 ...",
      catalogNumber: "25544",
      classification: "U",
      intlDesignator: "98067A",
      epochYear: 2026,
      epochDay: 81,
      inclination: 51.6,
      eccentricity: 0.0001,
      period: 92.9,
    },
  };

  const mockGDELT: GDELTEvent = {
    globalEventId: "gdelt-001",
    dateAdded: "2026-03-22",
    sourceUrl: "https://example.com/article",
    title: "Military buildup near border",
    tone: -5.2,
    goldsteinScale: -7.0,
    numMentions: 45,
    numSources: 12,
    numArticles: 8,
    avgTone: -4.8,
    actor1: { name: "Country A", countryCode: "AAA", type: "GOV" },
    actor2: { name: "Country B", countryCode: "BBB", type: "MIL" },
    eventCode: "190",
    eventDescription: "Use of force",
    quadClass: "material_conflict",
    latitude: 35.0,
    longitude: 45.0,
    country: "IRQ",
    location: "Baghdad",
  };

  const mockConflict: ConflictEvent = {
    id: "conf-001",
    date: "2026-03-22",
    eventType: "battle",
    subEventType: "Armed clash",
    actors: ["Group A", "Group B"],
    location: "Mosul",
    latitude: 36.34,
    longitude: 43.13,
    country: "Iraq",
    region: "Middle East",
    fatalities: 5,
    notes: "Armed clash between factions",
    source: "ACLED",
    severity: "high",
  };

  const mockDisaster: NaturalDisaster = {
    id: "dis-001",
    type: "earthquake",
    title: "M6.2 earthquake",
    description: "Major earthquake near populated area",
    date: "2026-03-22",
    latitude: 38.0,
    longitude: 46.0,
    country: "Iran",
    severity: "critical",
    status: "ongoing",
    affectedPopulation: 50000,
    source: "USGS",
  };

  test("creates valid GeoJSON FeatureCollection", () => {
    const result = exportToGeoJSON({
      satellites: [mockSatellite],
      gdeltEvents: [mockGDELT],
      conflicts: [mockConflict],
      disasters: [mockDisaster],
    });

    expect(result.type).toBe("FeatureCollection");
    expect(result.features).toHaveLength(4);
    expect(result.metadata.featureCount).toBe(4);
    expect(result.metadata.layers).toEqual(["satellites", "gdelt", "conflicts", "disasters"]);
    expect(result.metadata.platform).toBe("Satellite-Spy OSINT");
  });

  test("satellite features have 3D coordinates (altitude)", () => {
    const result = exportToGeoJSON({ satellites: [mockSatellite] });
    const feature = result.features[0];
    expect(feature.geometry.type).toBe("Point");
    expect(feature.geometry.coordinates).toEqual([-80.6, 28.5, 408000]); // lon, lat, alt in meters
    expect(feature.properties.layer).toBe("satellite");
    expect(feature.properties.name).toBe("ISS");
    expect(feature.properties.altitude_km).toBe(408);
  });

  test("GDELT features include tone and goldstein scale", () => {
    const result = exportToGeoJSON({ gdeltEvents: [mockGDELT] });
    const feature = result.features[0];
    expect(feature.properties.layer).toBe("gdelt");
    expect(feature.properties.tone).toBe(-5.2);
    expect(feature.properties.goldstein_scale).toBe(-7.0);
    expect(feature.properties.quad_class).toBe("material_conflict");
    expect(feature.properties.country).toBe("IRQ");
  });

  test("conflict features include severity and fatalities", () => {
    const result = exportToGeoJSON({ conflicts: [mockConflict] });
    const feature = result.features[0];
    expect(feature.properties.layer).toBe("conflict");
    expect(feature.properties.severity).toBe("high");
    expect(feature.properties.fatalities).toBe(5);
    expect(feature.properties.event_type).toBe("battle");
  });

  test("disaster features include affected population", () => {
    const result = exportToGeoJSON({ disasters: [mockDisaster] });
    const feature = result.features[0];
    expect(feature.properties.layer).toBe("disaster");
    expect(feature.properties.severity).toBe("critical");
    expect(feature.properties.affected_population).toBe(50000);
    expect(feature.properties.status).toBe("ongoing");
  });

  test("empty data produces empty FeatureCollection", () => {
    const result = exportToGeoJSON({});
    expect(result.type).toBe("FeatureCollection");
    expect(result.features).toHaveLength(0);
    expect(result.metadata.featureCount).toBe(0);
    expect(result.metadata.layers).toEqual([]);
  });

  test("mixed data merges all layers", () => {
    const result = exportToGeoJSON({
      satellites: [mockSatellite, mockSatellite],
      gdeltEvents: [mockGDELT],
      conflicts: [mockConflict, mockConflict, mockConflict],
    });
    expect(result.features).toHaveLength(6);
    expect(result.metadata.layers).toEqual(["satellites", "gdelt", "conflicts"]);
    const layers = result.features.map((f) => f.properties.layer);
    expect(layers.filter((l) => l === "satellite")).toHaveLength(2);
    expect(layers.filter((l) => l === "gdelt")).toHaveLength(1);
    expect(layers.filter((l) => l === "conflict")).toHaveLength(3);
  });
});
