/**
 * GDELT Integration Tests
 * Validates the GDELT data pipeline: raw API response → parsed events → QuantumData
 *
 * Tests both GEO API (legacy, may be down) and DOC API (fallback) parsers.
 */
import { parseGDELTGeoJSON, getConflictEvents, calculateInstabilityScore, getEventsByRegion } from "@/lib/api/gdelt";
import { countryToCoords, COUNTRY_COORDS } from "@/lib/api/country-coords";
import { gdeltToQuantumData } from "@/types/geo-event-quantum";
import { GDELT_GEO_RESPONSE, GDELT_DOC_RESPONSE } from "./fixtures/gdelt-sample";
import type { GDELTEvent } from "@/types";

// ==========================================================================
// GEO API Parser Tests
// ==========================================================================

describe("GDELT GEO API Parser", () => {
  const events = parseGDELTGeoJSON(GDELT_GEO_RESPONSE);

  test("parses GeoJSON features into GDELTEvent[]", () => {
    expect(events).toHaveLength(2);
  });

  test("extracts coordinates correctly (lon/lat → lat/lon)", () => {
    // GeoJSON is [lon, lat], our type is { latitude, longitude }
    expect(events[0].latitude).toBeCloseTo(36.2, 1);
    expect(events[0].longitude).toBeCloseTo(37.16, 1);
  });

  test("extracts tone and goldstein scale", () => {
    expect(events[0].tone).toBe(-6.5);
    expect(events[0].goldsteinScale).toBe(-8.0);
    expect(events[1].tone).toBe(4.2);
    expect(events[1].goldsteinScale).toBe(6.0);
  });

  test("maps quadClass correctly", () => {
    expect(events[0].quadClass).toBe("material_conflict");  // quadclass: 4
    expect(events[1].quadClass).toBe("material_cooperation"); // quadclass: 2
  });

  test("extracts actors", () => {
    expect(events[0].actor1.name).toBe("Syrian Government");
    expect(events[0].actor1.countryCode).toBe("SYR");
    expect(events[0].actor2.name).toBe("Opposition Forces");
  });

  test("extracts mention/source/article counts", () => {
    expect(events[1].numMentions).toBe(89);
    expect(events[1].numSources).toBe(34);
    expect(events[1].numArticles).toBe(67);
  });

  test("handles empty/null GeoJSON gracefully", () => {
    expect(parseGDELTGeoJSON({ type: "FeatureCollection", features: [] })).toEqual([]);
    expect(parseGDELTGeoJSON(null as unknown as { type: string; features: [] })).toEqual([]);
    expect(parseGDELTGeoJSON(undefined as unknown as { type: string; features: [] })).toEqual([]);
  });
});

// ==========================================================================
// Country Coordinates Lookup Tests
// ==========================================================================

describe("Country Coordinates Lookup", () => {
  test("resolves major countries", () => {
    const us = countryToCoords("United States");
    expect(us).toBeTruthy();
    expect(us!.lat).toBeCloseTo(39.8, 0);
    expect(us!.lon).toBeCloseTo(-98.6, 0);
  });

  test("resolves case-insensitively", () => {
    expect(countryToCoords("ukraine")).toBeTruthy();
    expect(countryToCoords("UKRAINE")).toBeTruthy();
  });

  test("resolves partial match", () => {
    expect(countryToCoords("Korea")).toBeTruthy(); // matches South Korea
  });

  test("returns null for unknown country", () => {
    expect(countryToCoords("Atlantis")).toBeNull();
    expect(countryToCoords("Zzyzx")).toBeNull();
  });

  test("has coordinates for all major conflict regions", () => {
    const conflictRegions = [
      "Ukraine", "Russia", "Israel", "Palestine", "Syria",
      "Iran", "Iraq", "Yemen", "Sudan", "Myanmar",
      "Taiwan", "North Korea", "Somalia", "Nigeria",
    ];
    for (const region of conflictRegions) {
      expect(countryToCoords(region)).toBeTruthy();
    }
  });

  test("covers at least 70 countries", () => {
    expect(Object.keys(COUNTRY_COORDS).length).toBeGreaterThanOrEqual(70);
  });
});

// ==========================================================================
// DOC API → GDELTEvent Conversion Tests
// ==========================================================================

describe("GDELT DOC API Parsing", () => {
  // Simulate DOC → GDELTEvent conversion (same logic as route.ts)
  function parseDocArticles(articles: typeof GDELT_DOC_RESPONSE.articles): GDELTEvent[] {
    return articles
      .map((article, idx) => {
        const coords = countryToCoords(article.sourcecountry);
        if (!coords) return null;
        return {
          globalEventId: `gdelt-doc-${idx}`,
          dateAdded: article.seendate,
          sourceUrl: article.url,
          title: article.title,
          tone: 0,
          goldsteinScale: 0,
          numMentions: 1,
          numSources: 1,
          numArticles: 1,
          avgTone: 0,
          actor1: { name: article.sourcecountry, countryCode: "", type: "media" },
          actor2: { name: "Unknown", countryCode: "", type: "" },
          eventCode: "",
          eventDescription: article.title,
          quadClass: "verbal_conflict" as const,
          latitude: coords.lat,
          longitude: coords.lon,
          country: article.sourcecountry,
          location: article.sourcecountry,
        } satisfies GDELTEvent;
      })
      .filter((e): e is GDELTEvent => e !== null);
  }

  test("converts DOC articles to GDELTEvent format", () => {
    const events = parseDocArticles(GDELT_DOC_RESPONSE.articles);
    // "Atlantis" should be filtered out (no coords)
    expect(events).toHaveLength(4);
  });

  test("filters articles from unknown countries", () => {
    const events = parseDocArticles(GDELT_DOC_RESPONSE.articles);
    expect(events.every(e => e.country !== "Atlantis")).toBe(true);
  });

  test("assigns correct coordinates per country", () => {
    const events = parseDocArticles(GDELT_DOC_RESPONSE.articles);
    const ukraine = events.find(e => e.country === "Ukraine");
    expect(ukraine).toBeTruthy();
    expect(ukraine!.latitude).toBeCloseTo(48.4, 0);
    expect(ukraine!.longitude).toBeCloseTo(31.2, 0);
  });

  test("preserves article metadata", () => {
    const events = parseDocArticles(GDELT_DOC_RESPONSE.articles);
    expect(events[0].sourceUrl).toContain("lajmi.net");
    expect(events[0].title).toContain("Iran");
  });
});

// ==========================================================================
// Analysis Functions Tests
// ==========================================================================

describe("GDELT Analysis Functions", () => {
  const events = parseGDELTGeoJSON(GDELT_GEO_RESPONSE);

  test("filters conflict events", () => {
    const conflicts = getConflictEvents(events);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].quadClass).toBe("material_conflict");
  });

  test("calculates instability score", () => {
    const score = calculateInstabilityScore(events);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  test("instability of empty events is 0", () => {
    expect(calculateInstabilityScore([])).toBe(0);
  });

  test("filters events by region (bounding box)", () => {
    // Syria bounding box (roughly)
    const syriaEvents = getEventsByRegion(events, {
      north: 38, south: 33, east: 42, west: 35,
    });
    expect(syriaEvents).toHaveLength(1);
    expect(syriaEvents[0].location).toContain("Aleppo");
  });

  test("returns empty for region with no events", () => {
    const antarctic = getEventsByRegion(events, {
      north: -60, south: -90, east: 180, west: -180,
    });
    expect(antarctic).toHaveLength(0);
  });
});

// ==========================================================================
// QuantumData Conversion Tests
// ==========================================================================

describe("GDELT → GeoEventQuantumData", () => {
  const events = parseGDELTGeoJSON(GDELT_GEO_RESPONSE);

  test("converts GDELTEvent to GeoEventQuantumData", () => {
    const qd = gdeltToQuantumData(events[0]);
    expect(qd.id).toMatch(/^gdelt-/);
    expect(qd.label).toContain("fighting");
    expect(qd.truthLayer).toBe("OBSERVED");
    expect(qd.source?.feed?.toLowerCase()).toBe("gdelt");
  });

  test("preserves coordinates in quantum format", () => {
    const qd = gdeltToQuantumData(events[0]);
    expect(qd.latitude).toBeCloseTo(36.2, 1);
    expect(qd.longitude).toBeCloseTo(37.16, 1);
  });

  test("assigns severity based on goldstein scale", () => {
    const conflict = gdeltToQuantumData(events[0]); // goldstein -8.0
    expect(conflict.severity).toBe("critical"); // goldstein < -7

    const cooperation = gdeltToQuantumData(events[1]); // goldstein 6.0, absGold=6 >= 5
    expect(cooperation.severity).toBe("high"); // positive goldstein still has high magnitude
  });

  test("sets confidence based on source count", () => {
    const qd = gdeltToQuantumData(events[1]); // 34 sources
    expect(qd.confidence).toBeGreaterThan(0.5); // many sources = higher confidence
  });
});
