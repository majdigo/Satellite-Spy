import { NextRequest, NextResponse } from "next/server";
import { parseTLE } from "@/lib/api/satellites";

const TLE_SOURCES: Record<string, string> = {
  reconnaissance: "https://celestrak.org/NORAD/elements/gp.php?GROUP=intel&FORMAT=tle",
  military: "https://celestrak.org/NORAD/elements/gp.php?GROUP=military&FORMAT=tle",
  communications: "https://celestrak.org/NORAD/elements/gp.php?GROUP=geo&FORMAT=tle",
  navigation: "https://celestrak.org/NORAD/elements/gp.php?GROUP=gnss&FORMAT=tle",
  weather: "https://celestrak.org/NORAD/elements/gp.php?GROUP=weather&FORMAT=tle",
  scientific: "https://celestrak.org/NORAD/elements/gp.php?GROUP=science&FORMAT=tle",
  stations: "https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle",
};

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category") || "reconnaissance";
  const url = TLE_SOURCES[category];

  if (!url) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`CelesTrak returned ${response.status}`);
    }

    const text = await response.text();
    const tles = parseTLE(text);

    return NextResponse.json({
      category,
      count: tles.length,
      tles,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`Failed to fetch TLE data for ${category}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch satellite data", category },
      { status: 502 }
    );
  }
}
