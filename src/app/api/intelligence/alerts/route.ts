import { NextRequest, NextResponse } from "next/server";
import { detectEscalations } from "@/lib/escalation-detector";
import type { GDELTEvent, ConflictEvent } from "@/types";

/**
 * GET /api/intelligence/alerts
 *
 * Agentic endpoint — autonomously detects escalation patterns
 * and returns structured alerts with reasoning.
 *
 * Returns: EscalationAlert[] sorted by severity + confidence
 *
 * S-Agent — Satellite-Spy
 */

async function fetchGDELT(baseUrl: string): Promise<GDELTEvent[]> {
  try {
    const res = await fetch(`${baseUrl}/api/gdelt?timespan=24h&maxpoints=300`, {
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
  const baseUrl = request.nextUrl.origin;
  const windowHours = parseInt(request.nextUrl.searchParams.get("window") || "24");
  const threshold = parseInt(request.nextUrl.searchParams.get("threshold") || "5");

  const [gdeltEvents, conflicts] = await Promise.all([
    fetchGDELT(baseUrl),
    fetchACLED(baseUrl),
  ]);

  const alerts = detectEscalations(gdeltEvents, conflicts, {
    temporalWindowHours: windowHours,
    criticalMassThreshold: threshold,
  });

  return NextResponse.json({
    alerts,
    count: alerts.length,
    critical: alerts.filter((a) => a.severity === "critical").length,
    high: alerts.filter((a) => a.severity === "high").length,
    sources: { gdelt: gdeltEvents.length, acled: conflicts.length },
    analyzedAt: new Date().toISOString(),
  });
}
