"use client";

/**
 * IntelligenceGrid — QuantumGrid specialized for GDELT/ACLED events.
 *
 * Each cell is a QuantumCell colored by truth layer.
 * Supports sorting, filtering, and drill-down to source articles.
 *
 * S-Agent T3 — Agentic Cognitive UI Sprint
 */

import { useState, useMemo, useCallback } from "react";
import { gdeltToBucket, acledToBucket, projectToVisual } from "@/models/GeoEventBucket";
import type { GeoEventBucket } from "@/models/GeoEventBucket";
import type { GDELTEvent, ConflictEvent, SeverityLevel } from "@/types";

// ── Truth layer colors (from quantum-design-system.ts) ─────────────────────
const TRUTH_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  OBSERVED:         { bg: "#E8F5E9", text: "#2D6A4F", border: "#66BB6A" },
  COMPUTED:         { bg: "#E3F2FD", text: "#1B4965", border: "#42A5F5" },
  ESTIMATED:        { bg: "#FFF3E0", text: "#E76F51", border: "#FF9800" },
  MARKET_REFERENCE: { bg: "#F3E5F5", text: "#6C567B", border: "#AB47BC" },
};

const SEVERITY_BG: Record<SeverityLevel, string> = {
  low: "#2D6A4F20",
  medium: "#E76F5130",
  high: "#E6394640",
  critical: "#E6394660",
};

type SortKey = "date" | "location" | "type" | "goldstein" | "confidence" | "severity";
type SortDir = "asc" | "desc";

interface IntelligenceGridProps {
  gdeltEvents: GDELTEvent[];
  conflicts: ConflictEvent[];
  onEventSelect?: (bucket: GeoEventBucket) => void;
  filterCountry?: string;
  filterEventType?: string;
  filterMinConfidence?: number;
  className?: string;
}

interface GridRow {
  bucket: GeoEventBucket;
  date: string;
  location: string;
  eventType: string;
  actors: string;
  goldstein: number;
  confidence: number;
  severity: SeverityLevel;
  source: string;
  sourceUrl?: string;
}

export default function IntelligenceGrid({
  gdeltEvents,
  conflicts,
  onEventSelect,
  filterCountry,
  filterEventType,
  filterMinConfidence = 0,
  className,
}: IntelligenceGridProps) {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Convert all events to GeoEventBuckets → grid rows
  const rows = useMemo(() => {
    const allRows: GridRow[] = [];

    for (const event of gdeltEvents) {
      const bucket = gdeltToBucket(event);
      allRows.push({
        bucket,
        date: event.dateAdded?.substring(0, 10) ?? "—",
        location: `${event.location || event.country}`,
        eventType: event.quadClass.replace(/_/g, " "),
        actors: bucket.properties.actors.join(" vs "),
        goldstein: event.goldsteinScale,
        confidence: bucket.confidence,
        severity: bucket.properties.severity as SeverityLevel,
        source: "GDELT",
        sourceUrl: event.sourceUrl,
      });
    }

    for (const conflict of conflicts) {
      const bucket = acledToBucket(conflict);
      allRows.push({
        bucket,
        date: conflict.date?.substring(0, 10) ?? "—",
        location: `${conflict.location}, ${conflict.country}`,
        eventType: conflict.eventType.replace(/_/g, " "),
        actors: conflict.actors.join(" vs "),
        goldstein: bucket.properties.goldsteinScale,
        confidence: bucket.confidence,
        severity: conflict.severity,
        source: "ACLED",
      });
    }

    return allRows;
  }, [gdeltEvents, conflicts]);

  // Apply filters
  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filterCountry && !r.location.toLowerCase().includes(filterCountry.toLowerCase())) return false;
      if (filterEventType && !r.eventType.toLowerCase().includes(filterEventType.toLowerCase())) return false;
      if (r.confidence < filterMinConfidence) return false;
      return true;
    });
  }, [rows, filterCountry, filterEventType, filterMinConfidence]);

  // Sort
  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "date": cmp = a.date.localeCompare(b.date); break;
        case "location": cmp = a.location.localeCompare(b.location); break;
        case "type": cmp = a.eventType.localeCompare(b.eventType); break;
        case "goldstein": cmp = a.goldstein - b.goldstein; break;
        case "confidence": cmp = a.confidence - b.confidence; break;
        case "severity": {
          const order: Record<string, number> = { low: 0, medium: 1, high: 2, critical: 3 };
          cmp = (order[a.severity] ?? 0) - (order[b.severity] ?? 0);
          break;
        }
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }, [sortKey]);

  const handleRowClick = useCallback((row: GridRow) => {
    onEventSelect?.(row.bucket);
  }, [onEventSelect]);

  const handleRowDoubleClick = useCallback((row: GridRow) => {
    setExpandedRow((prev) => (prev === row.bucket.id ? null : row.bucket.id));
  }, []);

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return " ↕";
    return sortDir === "asc" ? " ↑" : " ↓";
  };

  // QuantumCell: truth-layer colored cell
  const QuantumCell = ({ value, truthLayer, confidence }: { value: string | number; truthLayer: string; confidence: number }) => {
    const colors = TRUTH_COLORS[truthLayer] || TRUTH_COLORS.OBSERVED;
    const opacity = 0.4 + Math.min(1, Math.max(0, confidence)) * 0.6;
    return (
      <span
        className="inline-block px-2 py-0.5 rounded text-xs font-mono"
        style={{
          backgroundColor: colors.bg,
          color: colors.text,
          borderLeft: `3px solid ${colors.border}`,
          opacity,
        }}
      >
        {value}
      </span>
    );
  };

  return (
    <div className={`flex flex-col bg-[#1A1A2E] rounded-lg overflow-hidden ${className || ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#16213E] border-b border-[#264653]/30">
        <h3 className="text-sm font-semibold text-[#E8E8E8]">
          Intelligence Feed
          <span className="ml-2 text-xs text-[#9CA3AF]">
            {sorted.length} events
          </span>
        </h3>
        <div className="flex gap-2 text-xs text-[#9CA3AF]">
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#2D6A4F]" /> OBSERVED
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#1B4965]" /> COMPUTED
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#E76F51]" /> ESTIMATED
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto max-h-[400px] scrollbar-thin scrollbar-thumb-[#264653]">
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10 bg-[#1A1A2E]">
            <tr className="text-[#9CA3AF] border-b border-[#264653]/30">
              {[
                { key: "date" as const, label: "Date" },
                { key: "location" as const, label: "Location" },
                { key: "type" as const, label: "Type" },
                { key: "goldstein" as const, label: "Goldstein" },
                { key: "confidence" as const, label: "Confidence" },
                { key: "severity" as const, label: "Severity" },
              ].map(({ key, label }) => (
                <th
                  key={key}
                  className="px-3 py-2 text-left cursor-pointer hover:text-white select-none"
                  onClick={() => handleSort(key)}
                >
                  {label}{sortIcon(key)}
                </th>
              ))}
              <th className="px-3 py-2 text-left">Actors</th>
              <th className="px-3 py-2 text-left">Source</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => {
              const visual = projectToVisual(row.bucket);
              const isExpanded = expandedRow === row.bucket.id;
              const rowBorder = i > 0 && i % 3 === 0 ? "border-t border-[#264653]/40" : "";

              return (
                <tr key={row.bucket.id}>
                  <td colSpan={8} className="p-0">
                    <div
                      className={`grid grid-cols-[80px_120px_120px_80px_80px_70px_1fr_60px] px-3 py-1.5 cursor-pointer hover:bg-[#16213E]/60 transition-colors ${rowBorder}`}
                      style={{ backgroundColor: SEVERITY_BG[row.severity] }}
                      onClick={() => handleRowClick(row)}
                      onDoubleClick={() => handleRowDoubleClick(row)}
                    >
                      <span className="font-mono text-[#9CA3AF]">{row.date}</span>
                      <span className="text-[#E8E8E8] truncate">{row.location}</span>
                      <QuantumCell value={row.eventType} truthLayer={row.bucket.truthLayer} confidence={row.confidence} />
                      <span
                        className="font-mono"
                        style={{ color: row.goldstein < -3 ? "#E63946" : row.goldstein < 0 ? "#E76F51" : "#2D6A4F" }}
                      >
                        {row.goldstein.toFixed(1)}
                      </span>
                      <span className="font-mono" style={{ opacity: visual.opacity, color: visual.color }}>
                        {(row.confidence * 100).toFixed(0)}%
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded text-center font-mono text-[10px]"
                        style={{ backgroundColor: SEVERITY_BG[row.severity], color: row.severity === "critical" ? "#E63946" : "#E8E8E8" }}
                      >
                        {row.severity.toUpperCase()}
                      </span>
                      <span className="text-[#9CA3AF] truncate">{row.actors}</span>
                      <span className="text-[#9CA3AF]">{row.source}</span>
                    </div>
                    {/* Expanded detail (double-click) */}
                    {isExpanded && (
                      <div className="px-6 py-3 bg-[#0F3460]/30 border-t border-[#264653]/20 text-[#9CA3AF]">
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <p><strong className="text-[#E8E8E8]">Bucket ID:</strong> {row.bucket.id}</p>
                            <p><strong className="text-[#E8E8E8]">Truth Layer:</strong> {row.bucket.truthLayer}</p>
                            <p><strong className="text-[#E8E8E8]">Modality:</strong> {row.bucket.modality}</p>
                            <p><strong className="text-[#E8E8E8]">Coordinates:</strong> {row.bucket.properties.lat.toFixed(3)}, {row.bucket.properties.lon.toFixed(3)}</p>
                          </div>
                          <div>
                            <p><strong className="text-[#E8E8E8]">Interactions:</strong> {row.bucket.interactions.length}</p>
                            <p><strong className="text-[#E8E8E8]">Created by:</strong> {row.bucket.createdBy}</p>
                            {row.sourceUrl && (
                              <p>
                                <strong className="text-[#E8E8E8]">Source:</strong>{" "}
                                <a href={row.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[#42A5F5] hover:underline">
                                  Article link
                                </a>
                              </p>
                            )}
                          </div>
                        </div>
                        {/* Provenance trail */}
                        <div className="mt-2 flex gap-2 items-center">
                          <span className="text-[10px] text-[#E8E8E8] font-semibold">Provenance:</span>
                          {row.bucket.interactions.map((ix, j) => (
                            <span key={ix.interactionId} className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-[#264653]/40">
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: TRUTH_COLORS[row.bucket.truthLayer]?.border || "#9CA3AF" }} />
                              {ix.interactionType} by {ix.agentId}
                              {j < row.bucket.interactions.length - 1 && <span className="ml-1 text-[#9CA3AF]">→</span>}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {sorted.length === 0 && (
        <div className="flex items-center justify-center h-24 text-sm text-[#9CA3AF]">
          No events match the current filters
        </div>
      )}
    </div>
  );
}
