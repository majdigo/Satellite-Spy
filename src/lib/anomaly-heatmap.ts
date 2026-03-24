/**
 * AnomalyHeatmap computation logic.
 * Pure functions — no React, no JSX.
 *
 * S-Agent T4 — Agentic Cognitive UI Sprint
 */

import type { GDELTEvent, ConflictEvent } from "@/types";

const GRID_RESOLUTION = 2; // degrees per cell

export interface HeatmapCell {
  lat: number;
  lon: number;
  intensity: number;
  eventCount: number;
  avgGoldstein: number;
  maxSeverity: "low" | "medium" | "high" | "critical";
}

/**
 * Compute heatmap cells from GDELT events and ACLED conflicts.
 */
export function computeHeatmap(
  gdeltEvents: GDELTEvent[],
  conflicts: ConflictEvent[],
): HeatmapCell[] {
  const grid = new Map<string, { events: number; goldsteinSum: number; maxSeverity: number }>();

  const severityRank: Record<string, number> = { low: 0, medium: 1, high: 2, critical: 3 };
  const severityName = ["low", "medium", "high", "critical"] as const;

  function addToGrid(lat: number, lon: number, goldstein: number, severity: string) {
    const cellLat = Math.floor((lat + 90) / GRID_RESOLUTION) * GRID_RESOLUTION - 90 + GRID_RESOLUTION / 2;
    const cellLon = Math.floor((lon + 180) / GRID_RESOLUTION) * GRID_RESOLUTION - 180 + GRID_RESOLUTION / 2;
    const key = `${cellLat},${cellLon}`;

    const existing = grid.get(key) || { events: 0, goldsteinSum: 0, maxSeverity: 0 };
    existing.events += 1;
    existing.goldsteinSum += goldstein;
    existing.maxSeverity = Math.max(existing.maxSeverity, severityRank[severity] ?? 0);
    grid.set(key, existing);
  }

  for (const event of gdeltEvents) {
    const severity = event.goldsteinScale < -7 ? "critical"
      : event.goldsteinScale < -3 ? "high"
      : event.goldsteinScale < 0 ? "medium"
      : "low";
    addToGrid(event.latitude, event.longitude, event.goldsteinScale, severity);
  }

  for (const conflict of conflicts) {
    const goldsteinMap: Record<string, number> = { critical: -9, high: -6, medium: -3, low: -1 };
    addToGrid(conflict.latitude, conflict.longitude, goldsteinMap[conflict.severity] ?? -3, conflict.severity);
  }

  let maxEvents = 0;
  for (const cell of grid.values()) {
    maxEvents = Math.max(maxEvents, cell.events);
  }

  const cells: HeatmapCell[] = [];
  for (const [key, data] of grid.entries()) {
    const [lat, lon] = key.split(",").map(Number);
    cells.push({
      lat,
      lon,
      intensity: maxEvents > 0 ? data.events / maxEvents : 0,
      eventCount: data.events,
      avgGoldstein: data.events > 0 ? data.goldsteinSum / data.events : 0,
      maxSeverity: severityName[data.maxSeverity] || "low",
    });
  }

  return cells;
}

/**
 * Heatmap color from intensity (0-1).
 * Green → Orange → Red
 */
export function heatmapColor(intensity: number): string {
  if (intensity < 0.33) return "#2D6A4F";
  if (intensity < 0.66) return "#E76F51";
  return "#E63946";
}

/**
 * Heatmap opacity from intensity.
 */
export function heatmapOpacity(intensity: number): number {
  return 0.15 + intensity * 0.55;
}

export { GRID_RESOLUTION };
