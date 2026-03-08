import { NextRequest, NextResponse } from "next/server";
import { buildGDELTGeoUrl, parseGDELTGeoJSON } from "@/lib/api/gdelt";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query") || "conflict OR crisis OR military";
  const timespan = request.nextUrl.searchParams.get("timespan") || "24h";
  const maxpoints = parseInt(request.nextUrl.searchParams.get("maxpoints") || "500");

  try {
    const url = buildGDELTGeoUrl({
      query,
      mode: "pointdata",
      format: "geojson",
      timespan,
      maxpoints,
    });

    const response = await fetch(url, {
      next: { revalidate: 900 }, // Cache for 15 minutes
    });

    if (!response.ok) {
      throw new Error(`GDELT returned ${response.status}`);
    }

    const geojson = await response.json();
    const events = parseGDELTGeoJSON(geojson);

    return NextResponse.json({
      query,
      timespan,
      count: events.length,
      events,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to fetch GDELT data:", error);
    return NextResponse.json(
      { error: "Failed to fetch GDELT data", events: [] },
      { status: 502 }
    );
  }
}
