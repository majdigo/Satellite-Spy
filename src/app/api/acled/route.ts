import { NextRequest, NextResponse } from "next/server";
import type { ConflictEvent, ConflictEventType, SeverityLevel } from "@/types";
import { acledToQuantumData } from "@/types/geo-event-quantum";

const ACLED_API = "https://api.acleddata.com/acled/read";

function mapEventType(type: string): ConflictEventType {
  const lower = type.toLowerCase();
  if (lower.includes("battle")) return "battle";
  if (lower.includes("explosion") || lower.includes("remote")) return "explosion";
  if (lower.includes("violence against")) return "violence_against_civilians";
  if (lower.includes("protest")) return "protest";
  if (lower.includes("riot")) return "riot";
  return "strategic_development";
}

function assessSeverity(fatalities: number, eventType: ConflictEventType): SeverityLevel {
  if (fatalities > 50 || eventType === "battle") return "critical";
  if (fatalities > 10) return "high";
  if (fatalities > 0) return "medium";
  return "low";
}

export async function GET(request: NextRequest) {
  const country = request.nextUrl.searchParams.get("country") || "";
  const countries = request.nextUrl.searchParams.get("countries") || "";
  const limit = request.nextUrl.searchParams.get("limit") || "500";

  const apiKey = process.env.ACLED_API_KEY;
  const email = process.env.ACLED_EMAIL;

  if (!apiKey || !email) {
    // Return sample data if no API key configured
    return NextResponse.json({
      message: "ACLED API key not configured. Using sample data.",
      count: 0,
      conflicts: [],
    });
  }

  try {
    let url = `${ACLED_API}?key=${apiKey}&email=${encodeURIComponent(email)}&limit=${limit}`;
    if (country) {
      url += `&country=${encodeURIComponent(country)}`;
    } else if (countries) {
      // Support comma-separated ISO country codes from watch regions
      const countryList = countries.split(",").map((c: string) => c.trim()).filter(Boolean);
      if (countryList.length > 0) {
        url += `&iso=${countryList.join("|")}`;
      }
    }
    url += `&event_date=${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}|${new Date().toISOString().split("T")[0]}&event_date_where=BETWEEN`;

    const response = await fetch(url, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) throw new Error(`ACLED returned ${response.status}`);

    const data = await response.json();

    const conflicts: ConflictEvent[] = (data.data || []).map(
      (item: Record<string, unknown>) => {
        const eventType = mapEventType(item.event_type as string);
        const fatalities = parseInt(item.fatalities as string) || 0;
        return {
          id: item.data_id as string,
          date: item.event_date as string,
          eventType,
          subEventType: item.sub_event_type as string,
          actors: [item.actor1 as string, item.actor2 as string].filter(Boolean),
          location: item.location as string,
          latitude: parseFloat(item.latitude as string),
          longitude: parseFloat(item.longitude as string),
          country: item.country as string,
          region: item.admin1 as string,
          fatalities,
          notes: item.notes as string,
          source: item.source as string,
          severity: assessSeverity(fatalities, eventType),
        };
      }
    );

    // Return GeoEventQuantumData format if requested
    const format = request.nextUrl.searchParams.get("format");
    if (format === "quantum") {
      const quantumEvents = conflicts.map(acledToQuantumData);
      return NextResponse.json({
        count: quantumEvents.length,
        quantumData: quantumEvents,
        fetchedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      count: conflicts.length,
      conflicts,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to fetch ACLED data:", error);
    return NextResponse.json(
      { error: "Failed to fetch ACLED data", conflicts: [] },
      { status: 502 }
    );
  }
}
