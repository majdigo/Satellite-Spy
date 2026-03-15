import { NextRequest, NextResponse } from "next/server";
import type {
  CrossIntelligenceAlert,
  MarketAnomaly,
  ConflictEvent,
  MarketData,
} from "@/types";

interface ReportRequest {
  crossIntelAlerts: CrossIntelligenceAlert[];
  marketAnomalies: MarketAnomaly[];
  conflicts: ConflictEvent[];
  marketData: MarketData[];
  scenarioMatches: Array<{
    name: string;
    matchPercentage: number;
    severity: string;
    category: string;
    expectedOutcome: string;
    historicalExamples: string[];
    affectedSymbols: string[];
  }>;
  generatedAt: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ReportRequest = await request.json();
    const report = generateReport(body);
    return NextResponse.json({ report });
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}

function generateReport(data: ReportRequest): string {
  const now = new Date(data.generatedAt || Date.now());
  const timestamp = now.toISOString().replace("T", " ").substring(0, 19) + " UTC";

  const lines: string[] = [];
  const hr = "═".repeat(72);
  const hr2 = "─".repeat(72);

  // Header
  lines.push(hr);
  lines.push("  SATELLITE SPY — CROSS-INTELLIGENCE BRIEF");
  lines.push(`  Generated: ${timestamp}`);
  lines.push(`  Classification: OPEN SOURCE INTELLIGENCE (OSINT)`);
  lines.push(hr);
  lines.push("");

  // Executive Summary
  lines.push("1. EXECUTIVE SUMMARY");
  lines.push(hr2);

  const criticalAlerts = data.crossIntelAlerts.filter((a) => a.severity === "critical");
  const highAlerts = data.crossIntelAlerts.filter((a) => a.severity === "high");
  const suspiciousAlerts = data.crossIntelAlerts.filter(
    (a) => a.suspicionLevel === "high" || a.suspicionLevel === "very_high"
  );

  lines.push(`  Total Cross-Intel Alerts:  ${data.crossIntelAlerts.length}`);
  lines.push(`  Critical:                  ${criticalAlerts.length}`);
  lines.push(`  High:                      ${highAlerts.length}`);
  lines.push(`  Suspicious Activity:       ${suspiciousAlerts.length}`);
  lines.push(`  Market Anomalies:          ${data.marketAnomalies.length}`);
  lines.push(`  Active Conflicts:          ${data.conflicts.length}`);
  lines.push(`  Scenario Matches:          ${data.scenarioMatches.length}`);
  lines.push("");

  // Threat Level
  let threatLevel = "LOW";
  if (criticalAlerts.length > 0) threatLevel = "CRITICAL";
  else if (highAlerts.length > 2) threatLevel = "HIGH";
  else if (highAlerts.length > 0 || suspiciousAlerts.length > 0) threatLevel = "ELEVATED";

  lines.push(`  >>> OVERALL THREAT LEVEL: ${threatLevel} <<<`);
  lines.push("");

  // Active Scenario Matches
  if (data.scenarioMatches.length > 0) {
    lines.push("2. ACTIVE SCENARIO PATTERNS");
    lines.push(hr2);
    for (const scenario of data.scenarioMatches) {
      lines.push(`  [${scenario.severity.toUpperCase()}] ${scenario.name} — ${scenario.matchPercentage}% match`);
      lines.push(`    Category: ${scenario.category.replace(/_/g, " ").toUpperCase()}`);
      lines.push(`    Expected: ${scenario.expectedOutcome}`);
      lines.push(`    Symbols:  ${scenario.affectedSymbols.join(", ")}`);
      if (scenario.historicalExamples.length > 0) {
        lines.push(`    Precedent: ${scenario.historicalExamples[0]}`);
      }
      lines.push("");
    }
  }

  // Critical & High Priority Alerts
  const priorityAlerts = data.crossIntelAlerts
    .filter((a) => a.severity === "critical" || a.severity === "high")
    .slice(0, 15);

  if (priorityAlerts.length > 0) {
    lines.push("3. PRIORITY ALERTS");
    lines.push(hr2);
    for (const alert of priorityAlerts) {
      lines.push(`  [${alert.severity.toUpperCase()}] ${alert.title}`);
      lines.push(`    Category:   ${alert.category.replace(/_/g, " ").toUpperCase()}`);
      lines.push(`    Region:     ${alert.region}`);
      lines.push(`    Confidence: ${alert.confidence}%`);
      lines.push(`    Suspicion:  ${alert.suspicionLevel.toUpperCase()}`);
      lines.push(`    Summary:    ${alert.summary.substring(0, 200)}`);
      if (alert.marketImpact) {
        lines.push(`    Market:     ${alert.marketImpact.symbols.join(", ")} — ${alert.marketImpact.direction} ${alert.marketImpact.magnitude}`);
      }
      if (alert.recommendations.length > 0) {
        lines.push(`    Action:     ${alert.recommendations[0]}`);
      }
      lines.push("");
    }
  }

  // Market Anomalies
  if (data.marketAnomalies.length > 0) {
    lines.push("4. MARKET ANOMALIES");
    lines.push(hr2);
    for (const anomaly of data.marketAnomalies.slice(0, 10)) {
      const dir = anomaly.priceChange > 0 ? "+" : "";
      lines.push(`  ${anomaly.symbol} — ${dir}${anomaly.priceChange.toFixed(2)}% | Volume: ${anomaly.volumeRatio.toFixed(1)}x avg`);
      lines.push(`    Type: ${anomaly.anomalyType.replace(/_/g, " ").toUpperCase()}`);
      lines.push(`    Note: ${anomaly.description}`);
      lines.push("");
    }
  }

  // Market Overview
  if (data.marketData.length > 0) {
    lines.push("5. MARKET OVERVIEW");
    lines.push(hr2);

    const categories = ["energy", "defense", "metals", "agriculture", "indices", "currency"];
    for (const cat of categories) {
      const items = data.marketData.filter((m) => m.category === cat);
      if (items.length === 0) continue;
      lines.push(`  ${cat.toUpperCase()}`);
      for (const item of items) {
        const dir = item.changePercent > 0 ? "+" : "";
        const vol = item.volumeAnomaly > 1.5 ? ` [VOL ${item.volumeAnomaly.toFixed(1)}x]` : "";
        lines.push(`    ${item.name.padEnd(25)} ${dir}${item.changePercent.toFixed(2)}%${vol}`);
      }
      lines.push("");
    }
  }

  // Active Conflicts
  if (data.conflicts.length > 0) {
    lines.push("6. ACTIVE CONFLICTS");
    lines.push(hr2);
    for (const conflict of data.conflicts.slice(0, 10)) {
      lines.push(`  [${conflict.severity.toUpperCase()}] ${conflict.country} — ${conflict.eventType}`);
      lines.push(`    Location: ${conflict.latitude.toFixed(3)}, ${conflict.longitude.toFixed(3)}`);
      lines.push(`    Source:   ${conflict.source}`);
      lines.push(`    Date:     ${new Date(conflict.date).toISOString().substring(0, 10)}`);
      lines.push("");
    }
  }

  // Footer
  lines.push(hr);
  lines.push("  END OF REPORT");
  lines.push(`  Satellite Spy Cross-Intelligence Platform`);
  lines.push(`  This report is generated from OSINT sources for analytical purposes.`);
  lines.push(hr);

  return lines.join("\n");
}
