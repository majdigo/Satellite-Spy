import { NextRequest, NextResponse } from "next/server";
import { parseOpenSkyData } from "@/lib/api/aircraft";

const OPENSKY_API = "https://opensky-network.org/api/states/all";

export async function GET(request: NextRequest) {
  try {
    const headers: Record<string, string> = {};

    const username = process.env.OPENSKY_USERNAME;
    const password = process.env.OPENSKY_PASSWORD;
    if (username && password) {
      headers["Authorization"] =
        "Basic " + Buffer.from(`${username}:${password}`).toString("base64");
    }

    // Support bounding box filtering
    let url = OPENSKY_API;
    const lamin = request.nextUrl.searchParams.get("lamin");
    const lomin = request.nextUrl.searchParams.get("lomin");
    const lamax = request.nextUrl.searchParams.get("lamax");
    const lomax = request.nextUrl.searchParams.get("lomax");

    if (lamin && lomin && lamax && lomax) {
      url += `?lamin=${lamin}&lomin=${lomin}&lamax=${lamax}&lomax=${lomax}`;
    }

    const response = await fetch(url, {
      headers,
      next: { revalidate: 10 },
    });

    if (!response.ok) {
      throw new Error(`OpenSky returned ${response.status}`);
    }

    const data = await response.json();
    const aircraft = parseOpenSkyData(data);

    return NextResponse.json({
      count: aircraft.length,
      aircraft,
      timestamp: data.time,
    });
  } catch (error) {
    console.error("Failed to fetch aircraft data:", error);
    return NextResponse.json({
      count: 0,
      aircraft: [],
      timestamp: Math.floor(Date.now() / 1000),
      error: "Failed to fetch aircraft data — OpenSky may be unavailable",
    });
  }
}
