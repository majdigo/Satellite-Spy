import { NextRequest, NextResponse } from "next/server";
import { computeCountryRisk, getCountryRiskScore } from "@/lib/country-risk";
import type { GDELTEvent, ConflictEvent } from "@/types";

/**
 * GET /api/intelligence/risk
 *
 * Cross-domain API — returns geopolitical risk scores per country/region.
 * Consumable by:
 * - M-Agent: supplier country risk for NMPG scoring
 * - H-Agent: country risk premium for WACC adjustment
 *
 * Query params:
 *   ?country=IRQ     → single country risk score
 *   (no params)      → global risk + all regions + all countries
 *
 * S-Agent — Satellite-Spy | Synergie #1 (S→M) + #6 (S+P)
 */

async function fetchGDELT(baseUrl: string): Promise<GDELTEvent[]> {
  try {
    const res = await fetch(`${baseUrl}/api/gdelt?timespan=24h&maxpoints=200`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.events || [];
  } catch {
    return [];
  }
}

async function fetchACLED(baseUrl: string): Promise<ConflictEvent[]> {
  try {
    const res = await fetch(`${baseUrl}/api/acled?limit=200`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.conflicts || [];
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  const country = request.nextUrl.searchParams.get("country");
  const baseUrl = request.nextUrl.origin;

  const [gdeltEvents, conflicts] = await Promise.all([
    fetchGDELT(baseUrl),
    fetchACLED(baseUrl),
  ]);

  if (country) {
    const risk = getCountryRiskScore(country, gdeltEvents, conflicts);
    if (!risk) {
      return NextResponse.json({
        error: `No risk data for country: ${country}`,
        country,
        riskScore: 0,
        crpPercent: 0,
        confidence: 0,
      }, { status: 404 });
    }
    return NextResponse.json(risk);
  }

  const result = computeCountryRisk(gdeltEvents, conflicts);
  return NextResponse.json({
    ...result,
    fetchedAt: new Date().toISOString(),
    sources: {
      gdelt: gdeltEvents.length,
      acled: conflicts.length,
    },
  });
}
