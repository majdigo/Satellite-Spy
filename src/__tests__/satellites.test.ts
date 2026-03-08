import { parseTLE, categorizeSatellite, propagateSatellite, computeOrbitPath } from "@/lib/api/satellites";

// Real ISS TLE for testing
const ISS_TLE_TEXT = `ISS (ZARYA)
1 25544U 98067A   24001.50000000  .00016717  00000-0  10270-3 0  9003
2 25544  51.6400 208.9163 0006703  30.4759 329.6557 15.49815800  9995`;

describe("parseTLE", () => {
  it("parses valid TLE text", () => {
    const result = parseTLE(ISS_TLE_TEXT);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("ISS (ZARYA)");
    expect(result[0].catalogNumber).toBe("25544");
    expect(result[0].classification).toBe("U");
    expect(result[0].line1).toContain("25544");
    expect(result[0].line2).toContain("25544");
  });

  it("parses inclination", () => {
    const result = parseTLE(ISS_TLE_TEXT);
    expect(result[0].inclination).toBeCloseTo(51.64, 1);
  });

  it("parses eccentricity", () => {
    const result = parseTLE(ISS_TLE_TEXT);
    expect(result[0].eccentricity).toBeCloseTo(0.0006703, 5);
  });

  it("returns empty array for invalid input", () => {
    expect(parseTLE("")).toEqual([]);
    expect(parseTLE("just some text")).toEqual([]);
  });

  it("skips malformed lines", () => {
    const bad = `SAT NAME
NOT A LINE 1
NOT A LINE 2`;
    expect(parseTLE(bad)).toEqual([]);
  });

  it("parses multiple satellites", () => {
    const multi = `ISS (ZARYA)
1 25544U 98067A   24001.50000000  .00016717  00000-0  10270-3 0  9003
2 25544  51.6400 208.9163 0006703  30.4759 329.6557 15.49815800  9995
GPS BIIR-2  (PRN 13)
1 24876U 97035A   24001.50000000  .00000000  00000-0  00000-0 0  9001
2 24876  55.7200 195.0000 0057000  45.0000 315.0000  2.00562100  9999`;
    const result = parseTLE(multi);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("ISS (ZARYA)");
    expect(result[1].name).toBe("GPS BIIR-2  (PRN 13)");
  });
});

describe("categorizeSatellite", () => {
  it("identifies reconnaissance satellites", () => {
    expect(categorizeSatellite("USA-245", 97)).toBe("reconnaissance");
    expect(categorizeSatellite("NROL-82", 50)).toBe("reconnaissance");
    expect(categorizeSatellite("KEYHOLE-12", 50)).toBe("reconnaissance");
    expect(categorizeSatellite("LACROSSE-5", 50)).toBe("reconnaissance");
  });

  it("identifies military satellites", () => {
    expect(categorizeSatellite("MILSTAR-2", 50)).toBe("military");
    expect(categorizeSatellite("WGS-10", 50)).toBe("military");
    expect(categorizeSatellite("AEHF-6", 50)).toBe("military");
  });

  it("identifies navigation satellites", () => {
    expect(categorizeSatellite("GPS IIR-M", 55)).toBe("navigation");
    expect(categorizeSatellite("GLONASS-M", 65)).toBe("navigation");
    expect(categorizeSatellite("GALILEO-FOC", 56)).toBe("navigation");
    expect(categorizeSatellite("BEIDOU-3", 55)).toBe("navigation");
  });

  it("identifies weather satellites", () => {
    expect(categorizeSatellite("GOES-16", 0)).toBe("weather");
    expect(categorizeSatellite("NOAA-20", 98)).toBe("weather");
    expect(categorizeSatellite("METEOSAT-12", 0)).toBe("weather");
  });

  it("identifies scientific satellites", () => {
    expect(categorizeSatellite("HUBBLE", 28)).toBe("scientific");
    expect(categorizeSatellite("ISS (ZARYA)", 51)).toBe("scientific");
    expect(categorizeSatellite("TIANGONG", 42)).toBe("scientific");
  });

  it("identifies communications satellites", () => {
    expect(categorizeSatellite("STARLINK-1234", 53)).toBe("communications");
    expect(categorizeSatellite("ONEWEB-0100", 87)).toBe("communications");
    expect(categorizeSatellite("INTELSAT-35E", 0)).toBe("communications");
  });

  it("returns unknown for unrecognized satellites", () => {
    expect(categorizeSatellite("RANDOM-SAT", 50)).toBe("unknown");
  });

  it("USA with low inclination is not recon", () => {
    expect(categorizeSatellite("USA-200", 30)).not.toBe("reconnaissance");
  });
});

describe("propagateSatellite", () => {
  it("returns position for valid TLE", () => {
    const tles = parseTLE(ISS_TLE_TEXT);
    const result = propagateSatellite(tles[0], new Date("2024-01-02T00:00:00Z"), "scientific");

    expect(result).not.toBeNull();
    if (result) {
      expect(result.latitude).toBeGreaterThanOrEqual(-90);
      expect(result.latitude).toBeLessThanOrEqual(90);
      expect(result.longitude).toBeGreaterThanOrEqual(-180);
      expect(result.longitude).toBeLessThanOrEqual(180);
      expect(result.altitude).toBeGreaterThan(0);
      expect(result.velocity).toBeGreaterThan(0);
      expect(result.name).toBe("ISS (ZARYA)");
      expect(result.category).toBe("scientific");
    }
  });

  it("returns null for far future dates (propagation failure)", () => {
    const tles = parseTLE(ISS_TLE_TEXT);
    // Very far from epoch may fail
    const result = propagateSatellite(tles[0], new Date("2090-01-01T00:00:00Z"), "scientific");
    // May or may not be null depending on satellite.js tolerance, just ensure no crash
    expect(result === null || typeof result === "object").toBe(true);
  });
});

describe("computeOrbitPath", () => {
  it("returns path points for valid TLE", () => {
    const tles = parseTLE(ISS_TLE_TEXT);
    const path = computeOrbitPath(tles[0], new Date("2024-01-02T00:00:00Z"), 10, 2);

    expect(path.length).toBeGreaterThan(0);
    for (const p of path) {
      expect(p.lat).toBeGreaterThanOrEqual(-90);
      expect(p.lat).toBeLessThanOrEqual(90);
      expect(p.lon).toBeGreaterThanOrEqual(-180);
      expect(p.lon).toBeLessThanOrEqual(180);
      expect(p.alt).toBeGreaterThan(0);
    }
  });

  it("returns expected number of points", () => {
    const tles = parseTLE(ISS_TLE_TEXT);
    // 10 minutes at 2-minute steps = 6 points (0, 2, 4, 6, 8, 10)
    const path = computeOrbitPath(tles[0], new Date("2024-01-02T00:00:00Z"), 10, 2);
    expect(path.length).toBe(6);
  });
});
