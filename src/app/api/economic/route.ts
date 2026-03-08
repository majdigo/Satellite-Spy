import { NextResponse } from "next/server";
import {
  MONITORED_COUNTRIES,
  parseWorldBankData,
  getWorldBankUrl,
} from "@/lib/api/economic";
import type { EconomicIndicator, EconomicIndicatorType } from "@/types";

const INDICATORS: EconomicIndicatorType[] = [
  "gdp_growth",
  "inflation",
  "unemployment",
];

export async function GET() {
  const allIndicators: EconomicIndicator[] = [];

  // Fetch for top 5 strategic countries to limit API calls
  const priorityCountries = MONITORED_COUNTRIES.slice(0, 5);

  const fetches = priorityCountries.flatMap((country) =>
    INDICATORS.map(async (indicator) => {
      const url = getWorldBankUrl(country.code, indicator, 3);
      if (!url) return;

      try {
        const resp = await fetch(url, { next: { revalidate: 86400 } }); // Cache 24h
        if (!resp.ok) return;
        const data = await resp.json();
        const parsed = parseWorldBankData(data, indicator);
        allIndicators.push(...parsed);
      } catch {
        // Skip failed fetches
      }
    })
  );

  await Promise.all(fetches);

  return NextResponse.json({
    count: allIndicators.length,
    indicators: allIndicators,
    fetchedAt: new Date().toISOString(),
  });
}
