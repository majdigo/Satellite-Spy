"use client";

/**
 * AnomalyHeatmap — Heatmap overlay on the CesiumJS globe.
 *
 * Aggregates GeoEventBuckets spatially and renders a gradient layer:
 * green (calm) → orange (tension) → red (conflict).
 * Supports toggle on/off and temporal replay animation.
 *
 * S-Agent T4 — Agentic Cognitive UI Sprint
 */

import { useMemo } from "react";
import { computeHeatmap, heatmapColor, heatmapOpacity, GRID_RESOLUTION } from "@/lib/anomaly-heatmap";
import type { GDELTEvent, ConflictEvent } from "@/types";

// Re-export for convenience
export { computeHeatmap, heatmapColor, heatmapOpacity } from "@/lib/anomaly-heatmap";
export type { HeatmapCell } from "@/lib/anomaly-heatmap";

// ── React component (SVG overlay or Cesium entity generation) ──────────────

interface AnomalyHeatmapProps {
  gdeltEvents: GDELTEvent[];
  conflicts: ConflictEvent[];
  visible: boolean;
  className?: string;
}

/**
 * AnomalyHeatmap renders an HTML-based heatmap overlay.
 *
 * For actual CesiumJS integration, the `computeHeatmap()` function
 * should be called from the GlobeViewer to create Cesium rectangle entities.
 * This component provides a 2D minimap view + the computation logic.
 */
export default function AnomalyHeatmap({
  gdeltEvents,
  conflicts,
  visible,
  className,
}: AnomalyHeatmapProps) {
  const cells = useMemo(
    () => computeHeatmap(gdeltEvents, conflicts),
    [gdeltEvents, conflicts],
  );

  if (!visible || cells.length === 0) return null;

  // SVG minimap: Mercator-like projection for the heatmap overlay
  const viewBoxWidth = 360;
  const viewBoxHeight = 180;

  return (
    <div className={`relative ${className || ""}`}>
      <div className="absolute top-2 right-2 bg-[#1A1A2E]/90 rounded px-2 py-1 text-[10px] text-[#9CA3AF] z-10">
        Anomaly Heatmap — {cells.length} zones
      </div>
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Background */}
        <rect width={viewBoxWidth} height={viewBoxHeight} fill="#0a1a0a" />

        {/* Heatmap cells */}
        {cells.map((cell) => {
          const x = cell.lon + 180;
          const y = 90 - cell.lat;
          const color = heatmapColor(cell.intensity);
          const opacity = heatmapOpacity(cell.intensity);

          return (
            <rect
              key={`${cell.lat},${cell.lon}`}
              x={x - GRID_RESOLUTION / 2}
              y={y - GRID_RESOLUTION / 2}
              width={GRID_RESOLUTION}
              height={GRID_RESOLUTION}
              fill={color}
              opacity={opacity}
              rx={0.5}
            >
              <title>
                {`${cell.eventCount} events | Avg Goldstein: ${cell.avgGoldstein.toFixed(1)} | ${cell.maxSeverity.toUpperCase()}`}
              </title>
            </rect>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-2 left-2 flex items-center gap-2 text-[10px] text-[#9CA3AF]">
        <span className="w-3 h-3 rounded-sm bg-[#2D6A4F]" />
        <span>Calm</span>
        <span className="w-3 h-3 rounded-sm bg-[#E76F51]" />
        <span>Tension</span>
        <span className="w-3 h-3 rounded-sm bg-[#E63946]" />
        <span>Conflict</span>
      </div>
    </div>
  );
}
