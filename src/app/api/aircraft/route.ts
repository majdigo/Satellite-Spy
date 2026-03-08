import { NextResponse } from "next/server";
import { parseOpenSkyData } from "@/lib/api/aircraft";

const OPENSKY_API = "https://opensky-network.org/api/states/all";

export async function GET() {
  try {
    const headers: Record<string, string> = {};

    // Use credentials if available
    const username = process.env.OPENSKY_USERNAME;
    const password = process.env.OPENSKY_PASSWORD;
    if (username && password) {
      headers["Authorization"] =
        "Basic " + Buffer.from(`${username}:${password}`).toString("base64");
    }

    const response = await fetch(OPENSKY_API, {
      headers,
      next: { revalidate: 10 }, // Cache for 10 seconds
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
    return NextResponse.json(
      { error: "Failed to fetch aircraft data", aircraft: [] },
      { status: 502 }
    );
  }
}
