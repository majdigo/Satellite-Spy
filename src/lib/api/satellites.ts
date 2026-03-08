import type { SatellitePosition, SatelliteCategory, TLEData } from "@/types";
import * as satellite from "satellite.js";

// CelesTrak TLE data sources
const TLE_SOURCES: Record<string, string> = {
  reconnaissance: "https://celestrak.org/NORAD/elements/gp.php?GROUP=intel&FORMAT=tle",
  military: "https://celestrak.org/NORAD/elements/gp.php?GROUP=military&FORMAT=tle",
  communications: "https://celestrak.org/NORAD/elements/gp.php?GROUP=geo&FORMAT=tle",
  navigation: "https://celestrak.org/NORAD/elements/gp.php?GROUP=gnss&FORMAT=tle",
  weather: "https://celestrak.org/NORAD/elements/gp.php?GROUP=weather&FORMAT=tle",
  scientific: "https://celestrak.org/NORAD/elements/gp.php?GROUP=science&FORMAT=tle",
  active: "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle",
  stations: "https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle",
};

// Country identification from international designator
const COUNTRY_CODES: Record<string, string> = {
  US: "United States",
  CZ: "China",
  SU: "Russia/USSR",
  IN: "India",
  JP: "Japan",
  FR: "France",
  UK: "United Kingdom",
  IL: "Israel",
  IT: "Italy",
  DE: "Germany",
  KR: "South Korea",
  IR: "Iran",
};

export function parseTLE(tleText: string): TLEData[] {
  const lines = tleText.trim().split("\n");
  const tles: TLEData[] = [];

  for (let i = 0; i < lines.length - 2; i += 3) {
    const name = lines[i].trim();
    const line1 = lines[i + 1]?.trim();
    const line2 = lines[i + 2]?.trim();

    if (!line1?.startsWith("1") || !line2?.startsWith("2")) continue;

    tles.push({
      name,
      line1,
      line2,
      catalogNumber: line1.substring(2, 7).trim(),
      classification: line1.charAt(7),
      intlDesignator: line1.substring(9, 17).trim(),
      epochYear: parseInt(line1.substring(18, 20)),
      epochDay: parseFloat(line1.substring(20, 32)),
      inclination: parseFloat(line2.substring(8, 16)),
      eccentricity: parseFloat("0." + line2.substring(26, 33).trim()),
      period: (2 * Math.PI) / (parseFloat(line2.substring(52, 63)) * ((2 * Math.PI) / 86400)),
    });
  }

  return tles;
}

export function propagateSatellite(
  tle: TLEData,
  time: Date,
  category: SatelliteCategory
): SatellitePosition | null {
  try {
    const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
    const positionAndVelocity = satellite.propagate(satrec, time);

    if (!positionAndVelocity.position || typeof positionAndVelocity.position === "boolean") {
      return null;
    }

    const positionEci = positionAndVelocity.position;
    const gmst = satellite.gstime(time);
    const positionGd = satellite.eciToGeodetic(positionEci, gmst);

    const longitude = satellite.degreesLong(positionGd.longitude);
    const latitude = satellite.degreesLat(positionGd.latitude);
    const altitude = positionGd.height;

    let velocity = 0;
    if (positionAndVelocity.velocity && typeof positionAndVelocity.velocity !== "boolean") {
      const v = positionAndVelocity.velocity;
      velocity = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    }

    const countryPrefix = tle.intlDesignator.substring(0, 2);
    const country = COUNTRY_CODES[countryPrefix] || "Unknown";

    return {
      id: tle.catalogNumber,
      name: tle.name,
      latitude,
      longitude,
      altitude,
      velocity,
      category,
      country,
      timestamp: time,
      tle,
    };
  } catch {
    return null;
  }
}

export function computeOrbitPath(
  tle: TLEData,
  startTime: Date,
  minutes: number = 90,
  stepMinutes: number = 1
): Array<{ lat: number; lon: number; alt: number }> {
  const path: Array<{ lat: number; lon: number; alt: number }> = [];

  try {
    const satrec = satellite.twoline2satrec(tle.line1, tle.line2);

    for (let m = 0; m <= minutes; m += stepMinutes) {
      const time = new Date(startTime.getTime() + m * 60000);
      const pv = satellite.propagate(satrec, time);

      if (!pv.position || typeof pv.position === "boolean") continue;

      const gmst = satellite.gstime(time);
      const gd = satellite.eciToGeodetic(pv.position, gmst);

      path.push({
        lat: satellite.degreesLat(gd.latitude),
        lon: satellite.degreesLong(gd.longitude),
        alt: gd.height,
      });
    }
  } catch {
    // Skip errors
  }

  return path;
}

export async function fetchTLEData(
  categories: SatelliteCategory[] = ["reconnaissance", "military", "communications"]
): Promise<TLEData[]> {
  const allTLEs: TLEData[] = [];

  const fetches = categories.map(async (cat) => {
    const url = TLE_SOURCES[cat];
    if (!url) return;

    try {
      const resp = await fetch(`/api/satellites?category=${cat}`);
      if (!resp.ok) return;
      const data = await resp.json();
      allTLEs.push(...data.tles);
    } catch {
      // Silently skip failed fetches
    }
  });

  await Promise.all(fetches);
  return allTLEs;
}

export function categorizeSatellite(name: string, inclination: number): SatelliteCategory {
  const lower = name.toLowerCase();
  if (lower.includes("usa") && inclination > 60) return "reconnaissance";
  if (lower.includes("nrol") || lower.includes("keyhole") || lower.includes("lacrosse")) return "reconnaissance";
  if (lower.includes("milstar") || lower.includes("wgs") || lower.includes("aehf")) return "military";
  if (lower.includes("gps") || lower.includes("glonass") || lower.includes("galileo") || lower.includes("beidou")) return "navigation";
  if (lower.includes("goes") || lower.includes("noaa") || lower.includes("meteosat")) return "weather";
  if (lower.includes("hubble") || lower.includes("iss") || lower.includes("tiangong")) return "scientific";
  if (lower.includes("starlink") || lower.includes("oneweb") || lower.includes("intelsat")) return "communications";
  return "unknown";
}
