import type { GDELTEvent, QuadClass } from "@/types";

const GDELT_GEO_API = "https://api.gdeltproject.org/api/v2/geo/geo";
const GDELT_DOC_API = "https://api.gdeltproject.org/api/v2/doc/doc";

interface GDELTGeoQuery {
  query?: string;
  mode?: "pointdata" | "artlist" | "tonechart" | "wordcloud";
  format?: "geojson" | "csv" | "html";
  timespan?: string; // e.g., "24h", "7d", "30d"
  maxpoints?: number;
  domain?: string;
  country?: string;
}

function mapQuadClass(code: number): QuadClass {
  switch (code) {
    case 1: return "verbal_cooperation";
    case 2: return "material_cooperation";
    case 3: return "verbal_conflict";
    case 4: return "material_conflict";
    default: return "verbal_cooperation";
  }
}

export function parseGDELTGeoJSON(geojson: {
  type: string;
  features: Array<{
    properties: Record<string, unknown>;
    geometry: { coordinates: number[] };
  }>;
}): GDELTEvent[] {
  if (!geojson?.features) return [];

  return geojson.features.map((feature, idx) => {
    const p = feature.properties;
    const coords = feature.geometry?.coordinates || [0, 0];

    return {
      globalEventId: (p.url_mobile as string) || `gdelt-${idx}`,
      dateAdded: (p.date as string) || new Date().toISOString(),
      sourceUrl: (p.url as string) || "",
      title: (p.name as string) || (p.title as string) || "Unknown Event",
      tone: (p.tone as number) || 0,
      goldsteinScale: (p.goldstein as number) || 0,
      numMentions: (p.mentioncount as number) || 1,
      numSources: (p.sourcecount as number) || 1,
      numArticles: (p.artcount as number) || 1,
      avgTone: (p.avgtone as number) || (p.tone as number) || 0,
      actor1: {
        name: (p.actor1name as string) || "Unknown",
        countryCode: (p.actor1countrycode as string) || "",
        type: (p.actor1type as string) || "",
      },
      actor2: {
        name: (p.actor2name as string) || "Unknown",
        countryCode: (p.actor2countrycode as string) || "",
        type: (p.actor2type as string) || "",
      },
      eventCode: (p.eventcode as string) || "",
      eventDescription: (p.name as string) || "",
      quadClass: mapQuadClass((p.quadclass as number) || 1),
      latitude: coords[1] || 0,
      longitude: coords[0] || 0,
      country: (p.countrycode as string) || "",
      location: (p.locationname as string) || "",
    };
  });
}

export function buildGDELTGeoUrl(params: GDELTGeoQuery): string {
  const query = params.query || "";
  const mode = params.mode || "pointdata";
  const format = params.format || "geojson";
  const timespan = params.timespan || "24h";
  const maxpoints = params.maxpoints || 500;

  let url = `${GDELT_GEO_API}?query=${encodeURIComponent(query)}&mode=${mode}&format=${format}&timespan=${timespan}&maxpoints=${maxpoints}`;

  if (params.domain) url += `&domain=${encodeURIComponent(params.domain)}`;
  if (params.country) url += `&sourcecountry=${encodeURIComponent(params.country)}`;

  return url;
}

export function buildGDELTDocUrl(params: {
  query: string;
  mode?: string;
  format?: string;
  timespan?: string;
  maxrecords?: number;
  sort?: string;
}): string {
  const mode = params.mode || "artlist";
  const format = params.format || "json";
  const timespan = params.timespan || "24h";
  const maxrecords = params.maxrecords || 75;
  const sort = params.sort || "datedesc";

  return `${GDELT_DOC_API}?query=${encodeURIComponent(params.query)}&mode=${mode}&format=${format}&timespan=${timespan}&maxrecords=${maxrecords}&sort=${sort}`;
}

export async function fetchGDELTEvents(
  query: string = "conflict OR crisis OR military",
  timespan: string = "24h"
): Promise<GDELTEvent[]> {
  try {
    const resp = await fetch(
      `/api/gdelt?query=${encodeURIComponent(query)}&timespan=${timespan}`
    );
    if (!resp.ok) return [];
    const data = await resp.json();
    return data.events || [];
  } catch {
    return [];
  }
}

export function getConflictEvents(events: GDELTEvent[]): GDELTEvent[] {
  return events.filter(
    (e) =>
      e.quadClass === "material_conflict" || e.quadClass === "verbal_conflict"
  );
}

export function getEventsByRegion(
  events: GDELTEvent[],
  bounds: { north: number; south: number; east: number; west: number }
): GDELTEvent[] {
  return events.filter(
    (e) =>
      e.latitude >= bounds.south &&
      e.latitude <= bounds.north &&
      e.longitude >= bounds.west &&
      e.longitude <= bounds.east
  );
}

export function calculateInstabilityScore(events: GDELTEvent[]): number {
  if (events.length === 0) return 0;
  const conflictEvents = events.filter(
    (e) => e.quadClass === "material_conflict" || e.quadClass === "verbal_conflict"
  );
  const avgTone = conflictEvents.reduce((sum, e) => sum + Math.abs(e.avgTone), 0) / (conflictEvents.length || 1);
  const conflictRatio = conflictEvents.length / events.length;
  return Math.min(100, conflictRatio * 50 + avgTone * 5);
}
