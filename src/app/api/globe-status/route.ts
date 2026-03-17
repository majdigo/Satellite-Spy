/**
 * GET /api/globe-status
 * 
 * Consolidated endpoint for Globe Sentinel (ESP32 hardware) and e-ink displays.
 * Returns a compact JSON with 6-12 indicators formatted for LED colors + e-ink text.
 * 
 * Consumer: ESP32 polling every 60s via HTTP GET
 * Response: ~500 bytes JSON (optimized for constrained devices)
 */

import { NextResponse } from "next/server";
import { useAppStore } from "@/store";

// LED color mapping for ESP32 WS2812B
type LedColor = "green" | "yellow" | "orange" | "red" | "white" | "blue" | "off";

interface GlobeIndicator {
  id: string;
  label: string;         // Short label for e-ink (max 16 chars)
  value: string;         // Display value (e.g., "+2.3%", "43", "CRITICAL")
  color: LedColor;       // LED color for this indicator
  blink: boolean;        // Whether LED should blink
  priority: number;      // 1-5, higher = more urgent
}

interface GlobeStatus {
  globalThreat: "low" | "moderate" | "elevated" | "high" | "critical";
  globalColor: LedColor;
  globalBlink: boolean;
  indicators: GlobeIndicator[];
  alertCount: number;
  lastUpdate: string;
}

export async function GET() {
  const state = useAppStore.getState();
  const indicators: GlobeIndicator[] = [];

  // --- 1. Market health (oil, gold, VIX, S&P) ---
  const keySymbols = ["CL=F", "GC=F", "^VIX", "^GSPC"];
  for (const sym of keySymbols) {
    const item = state.marketData.find((m) => m.symbol === sym);
    if (item) {
      const change = item.changePercent;
      const absChange = Math.abs(change);
      let color: LedColor = "green";
      let blink = false;
      let priority = 1;

      if (sym === "^VIX") {
        // VIX: higher = more fear
        if (change > 20) { color = "red"; blink = true; priority = 5; }
        else if (change > 10) { color = "orange"; priority = 3; }
        else if (change > 5) { color = "yellow"; priority = 2; }
      } else if (sym === "CL=F") {
        // Oil: big moves = geopolitical signal
        if (absChange > 5) { color = "red"; blink = true; priority = 5; }
        else if (absChange > 3) { color = "orange"; priority = 3; }
        else if (absChange > 1) { color = "yellow"; priority = 2; }
      } else {
        if (absChange > 5) { color = "red"; priority = 4; }
        else if (absChange > 2) { color = change > 0 ? "green" : "orange"; priority = 2; }
      }

      indicators.push({
        id: sym,
        label: item.name.slice(0, 16),
        value: `${change > 0 ? "+" : ""}${change.toFixed(1)}%`,
        color,
        blink,
        priority,
      });
    }
  }

  // --- 2. Conflict level ---
  const criticalConflicts = state.conflicts.filter((c) => c.severity === "critical").length;
  const totalConflicts = state.conflicts.length;
  let conflictColor: LedColor = "green";
  let conflictBlink = false;
  let conflictPriority = 1;

  if (criticalConflicts > 5) { conflictColor = "red"; conflictBlink = true; conflictPriority = 5; }
  else if (criticalConflicts > 0) { conflictColor = "orange"; conflictPriority = 3; }
  else if (totalConflicts > 20) { conflictColor = "yellow"; conflictPriority = 2; }

  indicators.push({
    id: "conflicts",
    label: "Conflicts",
    value: criticalConflicts > 0 ? `${criticalConflicts} CRIT` : `${totalConflicts} active`,
    color: conflictColor,
    blink: conflictBlink,
    priority: conflictPriority,
  });

  // --- 3. Disaster level ---
  const recentDisasters = state.disasters.filter(
    (d) => d.severity === "high" || d.severity === "critical"
  ).length;

  indicators.push({
    id: "disasters",
    label: "Disasters",
    value: recentDisasters > 0 ? `${recentDisasters} severe` : "Calm",
    color: recentDisasters > 3 ? "red" : recentDisasters > 0 ? "orange" : "green",
    blink: recentDisasters > 5,
    priority: recentDisasters > 3 ? 4 : recentDisasters > 0 ? 2 : 1,
  });

  // --- 4. Intelligence alerts ---
  const criticalAlerts = state.crossIntelAlerts.filter((a) => a.severity === "critical").length;
  const highAlerts = state.crossIntelAlerts.filter((a) => a.severity === "high").length;

  indicators.push({
    id: "intel",
    label: "Intel Alerts",
    value: criticalAlerts > 0 ? `${criticalAlerts} CRITICAL` : `${highAlerts} high`,
    color: criticalAlerts > 0 ? "red" : highAlerts > 2 ? "orange" : "green",
    blink: criticalAlerts > 0,
    priority: criticalAlerts > 0 ? 5 : highAlerts > 2 ? 3 : 1,
  });

  // --- 5. Satellite surveillance ---
  const reconSats = state.satellites.filter(
    (s) => s.category === "reconnaissance" || s.category === "military"
  ).length;

  indicators.push({
    id: "recon-sats",
    label: "Recon Sats",
    value: `${reconSats} tracked`,
    color: reconSats > 50 ? "yellow" : "blue",
    blink: false,
    priority: 1,
  });

  // --- 6. Aircraft (military watch) ---
  const totalAircraft = state.aircraft.length;

  indicators.push({
    id: "aircraft",
    label: "Aircraft",
    value: `${totalAircraft.toLocaleString()} live`,
    color: "blue",
    blink: false,
    priority: 1,
  });

  // --- Compute global threat level ---
  const maxPriority = Math.max(...indicators.map((i) => i.priority), 1);
  let globalThreat: GlobeStatus["globalThreat"] = "low";
  let globalColor: LedColor = "green";
  let globalBlink = false;

  if (maxPriority >= 5) { globalThreat = "critical"; globalColor = "red"; globalBlink = true; }
  else if (maxPriority >= 4) { globalThreat = "high"; globalColor = "orange"; globalBlink = true; }
  else if (maxPriority >= 3) { globalThreat = "elevated"; globalColor = "orange"; }
  else if (maxPriority >= 2) { globalThreat = "moderate"; globalColor = "yellow"; }

  const status: GlobeStatus = {
    globalThreat,
    globalColor,
    globalBlink,
    indicators: indicators.sort((a, b) => b.priority - a.priority),
    alertCount: state.alerts.length,
    lastUpdate: new Date().toISOString(),
  };

  return NextResponse.json(status, {
    headers: {
      "Cache-Control": "public, max-age=30", // ESP32 can cache for 30s
      "Access-Control-Allow-Origin": "*",     // ESP32 cross-origin
    },
  });
}
