import { NextRequest, NextResponse } from "next/server";
import { buildGDELTGeoUrl, parseGDELTGeoJSON } from "@/lib/api/gdelt";
import { gdeltToQuantumData } from "@/types/geo-event-quantum";
import { countryToCoords } from "@/lib/api/country-coords";
import type { GDELTEvent } from "@/types";

const GDELT_DOC_API = "https://api.gdeltproject.org/api/v2/doc/doc";

interface GDELTArticle {
  url: string;
  url_mobile: string;
  title: string;
  seendate: string;
  socialimage: string;
  domain: string;
  language: string;
  sourcecountry: string;
}

/**
 * Parse GDELT DOC API articles into GDELTEvent format.
 * Uses country centroid coordinates since DOC API doesn't provide lat/lon.
 */
function parseDocArticles(articles: GDELTArticle[]): GDELTEvent[] {
  return articles
    .map((article, idx) => {
      const coords = countryToCoords(article.sourcecountry);
      if (!coords) return null;

      // Add slight jitter to prevent all events from same country stacking
      const jitter = () => (Math.random() - 0.5) * 2;

      return {
        globalEventId: `gdelt-doc-${idx}-${Date.now()}`,
        dateAdded: article.seendate || new Date().toISOString(),
        sourceUrl: article.url || "",
        title: article.title || "Unknown Event",
        tone: 0,
        goldsteinScale: 0,
        numMentions: 1,
        numSources: 1,
        numArticles: 1,
        avgTone: 0,
        actor1: {
          name: article.sourcecountry || "Unknown",
          countryCode: "",
          type: "media",
        },
        actor2: {
          name: "Unknown",
          countryCode: "",
          type: "",
        },
        eventCode: "",
        eventDescription: article.title || "",
        quadClass: "verbal_conflict" as const,
        latitude: coords.lat + jitter(),
        longitude: coords.lon + jitter(),
        country: article.sourcecountry || "",
        location: article.sourcecountry || "",
      } satisfies GDELTEvent;
    })
    .filter((e): e is GDELTEvent => e !== null);
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query") || "conflict OR crisis OR military";
  const timespan = request.nextUrl.searchParams.get("timespan") || "24h";
  const maxpoints = parseInt(request.nextUrl.searchParams.get("maxpoints") || "500");
  const format = request.nextUrl.searchParams.get("format"); // "quantum" for QuantumData format

  let events: GDELTEvent[] = [];
  let source = "none";

  // Strategy 1: Try GEO API first (returns precise coordinates)
  try {
    const geoUrl = buildGDELTGeoUrl({
      query,
      mode: "pointdata",
      format: "geojson",
      timespan,
      maxpoints,
    });

    const geoResponse = await fetch(geoUrl, {
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(10000),
    });

    if (geoResponse.ok) {
      const geojson = await geoResponse.json();
      events = parseGDELTGeoJSON(geojson);
      if (events.length > 0) {
        source = "geo-api";
      }
    }
  } catch {
    // GEO API failed — expected (API may be down)
  }

  // Strategy 2: Fall back to DOC API (returns articles with country, no coords)
  if (events.length === 0) {
    try {
      const maxrecords = Math.min(maxpoints, 250); // DOC API limit
      const docUrl = `${GDELT_DOC_API}?query=${encodeURIComponent(query)}&mode=artlist&format=json&timespan=${timespan}&maxrecords=${maxrecords}&sort=datedesc`;

      const docResponse = await fetch(docUrl, {
        next: { revalidate: 900 },
        signal: AbortSignal.timeout(15000),
      });

      if (docResponse.ok) {
        const contentType = docResponse.headers.get("content-type") || "";
        if (contentType.includes("json")) {
          const data = await docResponse.json();
          if (data.articles && Array.isArray(data.articles)) {
            events = parseDocArticles(data.articles);
            source = "doc-api";
          }
        }
      }
    } catch {
      // DOC API also failed
    }
  }

  // Return results (empty array if both APIs failed — graceful degradation)
  if (format === "quantum") {
    const quantumEvents = events.map(gdeltToQuantumData);
    return NextResponse.json({
      query,
      timespan,
      count: quantumEvents.length,
      quantumData: quantumEvents,
      source,
      fetchedAt: new Date().toISOString(),
    });
  }

  return NextResponse.json({
    query,
    timespan,
    count: events.length,
    events,
    source,
    fetchedAt: new Date().toISOString(),
  });
}
