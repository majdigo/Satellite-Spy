/**
 * Export current dashboard state as GeoJSON FeatureCollection.
 * Importable in QGIS, Mapbox, deck.gl, or any GIS tool.
 *
 * S1-10: Export to GeoJSON
 */

import type {
  SatellitePosition,
  AircraftPosition,
  GDELTEvent,
  ConflictEvent,
  NaturalDisaster,
} from "@/types";

interface GeoJSONFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number, number?];
  };
  properties: Record<string, unknown>;
}

interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  metadata: {
    exported: string;
    platform: string;
    featureCount: number;
    layers: string[];
  };
  features: GeoJSONFeature[];
}

export function exportToGeoJSON(data: {
  satellites?: SatellitePosition[];
  aircraft?: AircraftPosition[];
  gdeltEvents?: GDELTEvent[];
  conflicts?: ConflictEvent[];
  disasters?: NaturalDisaster[];
}): GeoJSONFeatureCollection {
  const features: GeoJSONFeature[] = [];
  const layers: string[] = [];

  // Satellites
  if (data.satellites?.length) {
    layers.push("satellites");
    for (const sat of data.satellites) {
      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [sat.longitude, sat.latitude, sat.altitude * 1000],
        },
        properties: {
          layer: "satellite",
          id: sat.id,
          name: sat.name,
          category: sat.category,
          country: sat.country,
          altitude_km: sat.altitude,
          velocity_kms: sat.velocity,
          timestamp: sat.timestamp,
        },
      });
    }
  }

  // Aircraft
  if (data.aircraft?.length) {
    layers.push("aircraft");
    for (const ac of data.aircraft) {
      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [ac.longitude, ac.latitude, ac.altitude],
        },
        properties: {
          layer: "aircraft",
          id: ac.icao24,
          callsign: ac.callsign,
          category: ac.category,
          country: ac.originCountry,
          altitude_m: ac.altitude,
          velocity_ms: ac.velocity,
          heading: ac.heading,
          on_ground: ac.onGround,
        },
      });
    }
  }

  // GDELT events
  if (data.gdeltEvents?.length) {
    layers.push("gdelt");
    for (const ev of data.gdeltEvents) {
      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [ev.longitude, ev.latitude],
        },
        properties: {
          layer: "gdelt",
          id: ev.globalEventId,
          title: ev.title,
          tone: ev.tone,
          goldstein_scale: ev.goldsteinScale,
          num_mentions: ev.numMentions,
          num_sources: ev.numSources,
          quad_class: ev.quadClass,
          event_code: ev.eventCode,
          country: ev.country,
          actor1: ev.actor1?.name,
          actor2: ev.actor2?.name,
          date_added: ev.dateAdded,
          source_url: ev.sourceUrl,
        },
      });
    }
  }

  // ACLED conflicts
  if (data.conflicts?.length) {
    layers.push("conflicts");
    for (const c of data.conflicts) {
      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [c.longitude, c.latitude],
        },
        properties: {
          layer: "conflict",
          id: c.id,
          event_type: c.eventType,
          sub_event_type: c.subEventType,
          severity: c.severity,
          fatalities: c.fatalities,
          actors: c.actors,
          country: c.country,
          region: c.region,
          location: c.location,
          date: c.date,
          source: c.source,
        },
      });
    }
  }

  // Natural disasters
  if (data.disasters?.length) {
    layers.push("disasters");
    for (const d of data.disasters) {
      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [d.longitude, d.latitude],
        },
        properties: {
          layer: "disaster",
          id: d.id,
          type: d.type,
          title: d.title,
          severity: d.severity,
          status: d.status,
          country: d.country,
          affected_population: d.affectedPopulation,
          date: d.date,
          source: d.source,
        },
      });
    }
  }

  return {
    type: "FeatureCollection",
    metadata: {
      exported: new Date().toISOString(),
      platform: "Satellite-Spy OSINT",
      featureCount: features.length,
      layers,
    },
    features,
  };
}

/**
 * Trigger a browser download of the GeoJSON file.
 */
export function downloadGeoJSON(geojson: GeoJSONFeatureCollection, filename?: string): void {
  const json = JSON.stringify(geojson, null, 2);
  const blob = new Blob([json], { type: "application/geo+json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `satellite-spy-export-${new Date().toISOString().slice(0, 10)}.geojson`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
