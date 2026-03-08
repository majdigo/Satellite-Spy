import type { AircraftPosition, AircraftCategory } from "@/types";

// Military aircraft identifiers (partial list)
const MILITARY_CALLSIGNS = [
  "RCH", "REACH", "DUKE", "EVAC", "JAKE", "TOPCAT", "DOOM", "RAGE",
  "SPAR", "SAM", "VENUS", "BISON", "COBRA", "VIPER", "HAWK", "EAGLE",
  "FORTE", "GLOBAL", "DRAGN", "REAPER", "PREDATOR", "SIGINT",
];

const GOVERNMENT_CALLSIGNS = ["AF1", "AF2", "EXEC", "SAM", "SPAR", "NIGHTWATCH"];

export function categorizeAircraft(callsign: string): AircraftCategory {
  const upper = callsign.toUpperCase().trim();
  if (GOVERNMENT_CALLSIGNS.some((g) => upper.startsWith(g))) return "government";
  if (MILITARY_CALLSIGNS.some((m) => upper.startsWith(m))) return "military";
  return "civilian";
}

export function parseOpenSkyData(data: unknown): AircraftPosition[] {
  const raw = data as { states?: unknown[][] };
  if (!raw?.states) return [];

  return raw.states
    .filter((s) => s[5] != null && s[6] != null)
    .map((s) => {
      const callsign = ((s[1] as string) || "").trim();
      return {
        icao24: s[0] as string,
        callsign,
        originCountry: s[2] as string,
        latitude: s[6] as number,
        longitude: s[5] as number,
        altitude: (s[7] as number) || (s[13] as number) || 0,
        velocity: (s[9] as number) || 0,
        heading: (s[10] as number) || 0,
        verticalRate: (s[11] as number) || 0,
        onGround: s[8] as boolean,
        category: categorizeAircraft(callsign),
        timestamp: (s[3] as number) || Date.now() / 1000,
      };
    });
}

export async function fetchAircraftData(): Promise<AircraftPosition[]> {
  try {
    const resp = await fetch("/api/aircraft");
    if (!resp.ok) return [];
    const data = await resp.json();
    return data.aircraft || [];
  } catch {
    return [];
  }
}

export function getMilitaryAircraft(aircraft: AircraftPosition[]): AircraftPosition[] {
  return aircraft.filter(
    (a) => a.category === "military" || a.category === "government"
  );
}

export function getAircraftInRegion(
  aircraft: AircraftPosition[],
  bounds: { north: number; south: number; east: number; west: number }
): AircraftPosition[] {
  return aircraft.filter(
    (a) =>
      a.latitude >= bounds.south &&
      a.latitude <= bounds.north &&
      a.longitude >= bounds.west &&
      a.longitude <= bounds.east
  );
}
