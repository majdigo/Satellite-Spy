/**
 * Temporal Density Engine — S1-06
 *
 * Aggregates events into spatial grid cells for heatmap visualization.
 * Supports 24h, 7d, 30d time windows.
 */

import type { GDELTEvent, ConflictEvent, NaturalDisaster } from "@/types";

export type TimeWindow = "24h" | "7d" | "30d";

const TIME_WINDOW_MS: Record<TimeWindow, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

export interface DensityCell {
  lat: number;
  lon: number;
  count: number;
  maxSeverity: "low" | "medium" | "high" | "critical";
  conflictCount: number;
  gdeltCount: number;
  disasterCount: number;
  /** Normalized intensity 0-1 for rendering */
  intensity: number;
}

export interface DensityGrid {
  cells: DensityCell[];
  timeWindow: TimeWindow;
  totalEvents: number;
  maxCount: number;
  gridResolution: number;
}

/**
 * Build a spatial density grid from events within a time window.
 * Grid resolution in degrees (default 2° ~= 222km at equator).
 */
export function buildDensityGrid(
  data: {
    gdeltEvents: GDELTEvent[];
    conflicts: ConflictEvent[];
    disasters: NaturalDisaster[];
  },
  timeWindow: TimeWindow = "24h",
  resolution: number = 2,
): DensityGrid {
  const now = Date.now();
  const cutoff = now - TIME_WINDOW_MS[timeWindow];

  // Collect all events with timestamps
  const points: Array<{
    lat: number;
    lon: number;
    severity: "low" | "medium" | "high" | "critical";
    type: "gdelt" | "conflict" | "disaster";
  }> = [];

  for (const ev of data.gdeltEvents) {
    const t = new Date(ev.dateAdded).getTime();
    if (t >= cutoff && ev.latitude && ev.longitude) {
      const severity = ev.goldsteinScale < -7 ? "critical"
        : ev.goldsteinScale < -3 ? "high"
        : ev.goldsteinScale < 0 ? "medium"
        : "low";
      points.push({ lat: ev.latitude, lon: ev.longitude, severity, type: "gdelt" });
    }
  }

  for (const c of data.conflicts) {
    const t = new Date(c.date).getTime();
    if (t >= cutoff && c.latitude && c.longitude) {
      points.push({ lat: c.latitude, lon: c.longitude, severity: c.severity, type: "conflict" });
    }
  }

  for (const d of data.disasters) {
    const t = new Date(d.date).getTime();
    if (t >= cutoff && d.latitude && d.longitude) {
      points.push({ lat: d.latitude, lon: d.longitude, severity: d.severity, type: "disaster" });
    }
  }

  // Aggregate into grid cells
  const cellMap = new Map<string, DensityCell>();

  for (const p of points) {
    const cellLat = Math.floor(p.lat / resolution) * resolution + resolution / 2;
    const cellLon = Math.floor(p.lon / resolution) * resolution + resolution / 2;
    const key = `${cellLat},${cellLon}`;

    let cell = cellMap.get(key);
    if (!cell) {
      cell = {
        lat: cellLat,
        lon: cellLon,
        count: 0,
        maxSeverity: "low",
        conflictCount: 0,
        gdeltCount: 0,
        disasterCount: 0,
        intensity: 0,
      };
      cellMap.set(key, cell);
    }

    cell.count++;
    if (p.type === "conflict") cell.conflictCount++;
    else if (p.type === "gdelt") cell.gdeltCount++;
    else cell.disasterCount++;

    // Update max severity
    const severityRank = { low: 0, medium: 1, high: 2, critical: 3 };
    if (severityRank[p.severity] > severityRank[cell.maxSeverity]) {
      cell.maxSeverity = p.severity;
    }
  }

  const cells = Array.from(cellMap.values());
  const maxCount = Math.max(1, ...cells.map((c) => c.count));

  // Normalize intensity
  for (const cell of cells) {
    cell.intensity = cell.count / maxCount;
  }

  return {
    cells,
    timeWindow,
    totalEvents: points.length,
    maxCount,
    gridResolution: resolution,
  };
}
