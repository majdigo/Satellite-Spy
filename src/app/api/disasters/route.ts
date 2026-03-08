import { NextResponse } from "next/server";
import type { NaturalDisaster, SeverityLevel, DisasterType } from "@/types";

// USGS Earthquake API — real-time GeoJSON feed
const USGS_EARTHQUAKE_URL =
  "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson";

// ReliefWeb API — recent disasters
const RELIEFWEB_URL =
  "https://api.reliefweb.int/v1/disasters?appname=satellite-spy&preset=latest&limit=50&fields[include][]=name&fields[include][]=date&fields[include][]=type&fields[include][]=country&fields[include][]=status&fields[include][]=description";

function earthquakeSeverity(magnitude: number): SeverityLevel {
  if (magnitude >= 7) return "critical";
  if (magnitude >= 5.5) return "high";
  if (magnitude >= 4) return "medium";
  return "low";
}

function mapReliefWebType(type: string): DisasterType {
  const t = type.toLowerCase();
  if (t.includes("earthquake")) return "earthquake";
  if (t.includes("flood")) return "flood";
  if (t.includes("cyclone") || t.includes("hurricane") || t.includes("typhoon")) return "hurricane";
  if (t.includes("fire") || t.includes("wildfire")) return "wildfire";
  if (t.includes("tsunami")) return "tsunami";
  if (t.includes("volcano") || t.includes("eruption")) return "volcanic_eruption";
  if (t.includes("drought")) return "drought";
  if (t.includes("landslide") || t.includes("mudslide")) return "landslide";
  return "earthquake"; // fallback
}

export async function GET() {
  const disasters: NaturalDisaster[] = [];

  // Fetch USGS earthquakes
  try {
    const resp = await fetch(USGS_EARTHQUAKE_URL, { next: { revalidate: 300 } });
    if (resp.ok) {
      const data = await resp.json();
      if (data.features) {
        for (const feature of data.features.slice(0, 100)) {
          const props = feature.properties;
          const [lon, lat, depth] = feature.geometry.coordinates;
          const magnitude = props.mag || 0;

          disasters.push({
            id: `usgs-${feature.id}`,
            type: "earthquake",
            title: `M${magnitude.toFixed(1)} Earthquake — ${props.place || "Unknown location"}`,
            description: `Magnitude ${magnitude.toFixed(1)}, Depth ${(depth || 0).toFixed(0)}km. ${props.place || ""}`,
            date: new Date(props.time).toISOString(),
            latitude: lat,
            longitude: lon,
            country: props.place?.split(", ").pop() || "Unknown",
            severity: earthquakeSeverity(magnitude),
            status: props.status === "reviewed" ? "resolved" : "monitoring",
            source: "USGS",
          });
        }
      }
    }
  } catch {
    console.error("Failed to fetch USGS earthquake data");
  }

  // Fetch ReliefWeb disasters
  try {
    const resp = await fetch(RELIEFWEB_URL, { next: { revalidate: 3600 } });
    if (resp.ok) {
      const data = await resp.json();
      if (data.data) {
        for (const item of data.data.slice(0, 50)) {
          const fields = item.fields;
          if (!fields) continue;

          const country = fields.country?.[0]?.name || "Unknown";
          const type = fields.type?.[0]?.name || "Unknown";
          const status = fields.status || "ongoing";

          // ReliefWeb doesn't provide lat/lon directly; use country centroids
          const countryCoords = getCountryCentroid(country);

          disasters.push({
            id: `rw-${item.id}`,
            type: mapReliefWebType(type),
            title: fields.name || `${type} in ${country}`,
            description: fields.description || `${type} affecting ${country}`,
            date: fields.date?.created || new Date().toISOString(),
            latitude: countryCoords.lat,
            longitude: countryCoords.lon,
            country,
            severity: status === "ongoing" ? "high" : "medium",
            status: status === "ongoing" ? "ongoing" : "monitoring",
            source: "ReliefWeb",
          });
        }
      }
    }
  } catch {
    console.error("Failed to fetch ReliefWeb data");
  }

  return NextResponse.json({
    count: disasters.length,
    disasters,
    fetchedAt: new Date().toISOString(),
  });
}

function getCountryCentroid(country: string): { lat: number; lon: number } {
  const centroids: Record<string, { lat: number; lon: number }> = {
    "United States": { lat: 39.8, lon: -98.6 },
    "China": { lat: 35.9, lon: 104.2 },
    "Russia": { lat: 61.5, lon: 105.3 },
    "India": { lat: 20.6, lon: 79.0 },
    "Japan": { lat: 36.2, lon: 138.3 },
    "Indonesia": { lat: -0.8, lon: 113.9 },
    "Turkey": { lat: 38.9, lon: 35.2 },
    "Iran": { lat: 32.4, lon: 53.7 },
    "Philippines": { lat: 12.9, lon: 122.0 },
    "Pakistan": { lat: 30.4, lon: 69.3 },
    "Afghanistan": { lat: 33.9, lon: 67.7 },
    "Syria": { lat: 34.8, lon: 39.0 },
    "Iraq": { lat: 33.2, lon: 43.7 },
    "Yemen": { lat: 15.6, lon: 48.5 },
    "Ethiopia": { lat: 9.1, lon: 40.5 },
    "Sudan": { lat: 12.9, lon: 30.2 },
    "Nigeria": { lat: 9.1, lon: 8.7 },
    "Mexico": { lat: 23.6, lon: -102.6 },
    "Chile": { lat: -35.7, lon: -71.5 },
    "Nepal": { lat: 28.4, lon: 84.1 },
    "Haiti": { lat: 19.1, lon: -72.3 },
    "Bangladesh": { lat: 23.7, lon: 90.4 },
    "Myanmar": { lat: 21.9, lon: 95.9 },
    "Colombia": { lat: 4.6, lon: -74.3 },
    "Brazil": { lat: -14.2, lon: -51.9 },
  };
  return centroids[country] || { lat: 0, lon: 0 };
}
