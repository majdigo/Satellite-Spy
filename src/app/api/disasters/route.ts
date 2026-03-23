import { NextResponse } from "next/server";
import { countryToCoords } from "@/lib/api/country-coords";
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

          // Use shared country-coords lookup (covers 75+ countries)
          const coords = countryToCoords(country) || { lat: 0, lon: 0 };

          disasters.push({
            id: `rw-${item.id}`,
            type: mapReliefWebType(type),
            title: fields.name || `${type} in ${country}`,
            description: fields.description || `${type} affecting ${country}`,
            date: fields.date?.created || new Date().toISOString(),
            latitude: coords.lat,
            longitude: coords.lon,
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
