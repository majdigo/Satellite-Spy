"use client";

/**
 * IntelligenceDashboard — Page template for OSINT intelligence monitoring.
 *
 * Layout:
 * - Top (70%): GlobeView with AnomalyHeatmap overlay
 * - Bottom-left: IntelligenceGrid (GDELT/ACLED events)
 * - Bottom-right: EntityCard of selected marker + provenance
 * - Filter bar: date range, country, event type, confidence threshold
 *
 * Dark theme with accent teal #264653.
 *
 * S-Agent T5 — Agentic Cognitive UI Sprint
 */

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useDataFetcher } from "@/hooks/useDataFetcher";
import { useAppStore } from "@/store";
import IntelligenceGrid from "@/components/intelligence/IntelligenceGrid";
import GeoEventForceGraph from "@/components/intelligence/GeoEventForceGraph";
import TruthLayerTag from "@/components/quantum/TruthLayerTag";
import ConfidenceBadge from "@/components/quantum/ConfidenceBadge";
import ProvenanceChip from "@/components/quantum/ProvenanceChip";
import type { GeoEventBucket } from "@/models/GeoEventBucket";
import { projectToVisual } from "@/models/GeoEventBucket";

const GlobeViewer = dynamic(() => import("@/components/globe/GlobeViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#0a1a0a] flex items-center justify-center">
      <div className="text-xs font-mono text-[#264653] animate-pulse">Loading Globe...</div>
    </div>
  ),
});

const AnomalyHeatmap = dynamic(() => import("@/components/globe/AnomalyHeatmap"), {
  ssr: false,
});

// ── Truth layer colors for EntityCard ───────────────────────────────────────
const TRUTH_BADGE: Record<string, { bg: string; text: string }> = {
  OBSERVED:         { bg: "#2D6A4F", text: "#E8F5E9" },
  COMPUTED:         { bg: "#1B4965", text: "#E3F2FD" },
  ESTIMATED:        { bg: "#E76F51", text: "#FFF3E0" },
  MARKET_REFERENCE: { bg: "#6C567B", text: "#F3E5F5" },
};

export default function IntelligenceDashboard() {
  useDataFetcher();

  const { gdeltEvents, conflicts, layers, toggleLayer, setHighlightedEntityId, setFocusLocation } = useAppStore();

  // Filters
  const [filterCountry, setFilterCountry] = useState("");
  const [filterEventType, setFilterEventType] = useState("");
  const [filterMinConfidence, setFilterMinConfidence] = useState(0);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [bottomView, setBottomView] = useState<"table" | "graph">("table");

  // Selected event — synced to store for Globe cross-selection
  const [selectedBucket, setSelectedBucket] = useState<GeoEventBucket | null>(null);

  const handleEventSelect = useCallback((bucket: GeoEventBucket) => {
    setSelectedBucket(bucket);
    // Sync to globe: highlight the corresponding entity and fly to location
    setHighlightedEntityId(bucket.id);
    setFocusLocation({
      lat: bucket.properties.lat,
      lon: bucket.properties.lon,
      zoom: 500,
    });
  }, [setHighlightedEntityId, setFocusLocation]);

  const heatmapLayer = layers.find((l) => l.id === "heatmap");

  return (
    <div className="flex flex-col w-screen h-screen bg-[#0a0a12] text-[#E8E8E8]">
      {/* Filter bar */}
      <div className="flex items-center gap-3 px-4 py-2 bg-[#1A1A2E] border-b border-[#264653]/30 shrink-0">
        <h1 className="text-sm font-semibold text-[#264653] tracking-wide mr-4">
          INTELLIGENCE DASHBOARD
        </h1>

        <input
          type="text"
          placeholder="Filter country..."
          value={filterCountry}
          onChange={(e) => setFilterCountry(e.target.value)}
          className="bg-[#16213E] text-xs text-[#E8E8E8] rounded px-2 py-1 border border-[#264653]/30 w-32 focus:outline-none focus:border-[#264653]"
        />

        <input
          type="text"
          placeholder="Event type..."
          value={filterEventType}
          onChange={(e) => setFilterEventType(e.target.value)}
          className="bg-[#16213E] text-xs text-[#E8E8E8] rounded px-2 py-1 border border-[#264653]/30 w-32 focus:outline-none focus:border-[#264653]"
        />

        <label className="flex items-center gap-1 text-xs text-[#9CA3AF]">
          Min confidence:
          <input
            type="range"
            min={0}
            max={100}
            value={filterMinConfidence * 100}
            onChange={(e) => setFilterMinConfidence(Number(e.target.value) / 100)}
            className="w-20 accent-[#264653]"
          />
          <span className="font-mono w-8">{(filterMinConfidence * 100).toFixed(0)}%</span>
        </label>

        <button
          onClick={() => setShowHeatmap((h) => !h)}
          className={`text-xs px-3 py-1 rounded border transition-colors ${
            showHeatmap
              ? "bg-[#264653] border-[#264653] text-white"
              : "bg-transparent border-[#264653]/30 text-[#9CA3AF] hover:bg-[#264653]/20"
          }`}
        >
          {showHeatmap ? "Heatmap ON" : "Heatmap OFF"}
        </button>

        {/* Table | Graph toggle */}
        <div className="flex rounded border border-[#264653]/30 overflow-hidden">
          <button
            onClick={() => setBottomView("table")}
            className={`text-xs px-3 py-1 transition-colors ${
              bottomView === "table"
                ? "bg-[#264653] text-white"
                : "text-[#9CA3AF] hover:bg-[#264653]/20"
            }`}
          >
            Table
          </button>
          <button
            onClick={() => setBottomView("graph")}
            className={`text-xs px-3 py-1 transition-colors ${
              bottomView === "graph"
                ? "bg-[#264653] text-white"
                : "text-[#9CA3AF] hover:bg-[#264653]/20"
            }`}
          >
            Graph
          </button>
        </div>

        <div className="ml-auto text-[10px] text-[#9CA3AF] font-mono">
          {gdeltEvents.length} GDELT + {conflicts.length} ACLED events
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Globe (70% height) */}
        <div className="relative" style={{ height: "70%" }}>
          <GlobeViewer className="w-full h-full" />
          {showHeatmap && (
            <div className="absolute bottom-4 right-4 w-64 h-40 opacity-80 pointer-events-none">
              <AnomalyHeatmap
                gdeltEvents={gdeltEvents}
                conflicts={conflicts}
                visible={showHeatmap}
                className="w-full h-full"
              />
            </div>
          )}
        </div>

        {/* Bottom panels (30% height) */}
        <div className="flex" style={{ height: "30%" }}>
          {/* Bottom-left: Table or Graph (switchable) */}
          <div className="flex-1 border-t border-r border-[#264653]/30 overflow-hidden">
            {bottomView === "table" ? (
              <IntelligenceGrid
                gdeltEvents={gdeltEvents}
                conflicts={conflicts}
                onEventSelect={handleEventSelect}
                filterCountry={filterCountry || undefined}
                filterEventType={filterEventType || undefined}
                filterMinConfidence={filterMinConfidence}
                className="h-full"
              />
            ) : (
              <GeoEventForceGraph
                gdeltEvents={gdeltEvents}
                conflicts={conflicts}
                onNodeSelect={handleEventSelect}
                maxNodes={60}
                className="h-full"
              />
            )}
          </div>

          {/* Bottom-right: EntityCard of selected event */}
          <div className="w-80 border-t border-[#264653]/30 bg-[#1A1A2E] overflow-auto p-3">
            {selectedBucket ? (
              <EntityCard bucket={selectedBucket} />
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-[#9CA3AF]">
                Click an event to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── EntityCard — Shows full DataBucket details + provenance ────────────────

function EntityCard({ bucket }: { bucket: GeoEventBucket }) {
  const visual = projectToVisual(bucket);

  return (
    <div className="space-y-3">
      {/* Header with quantum components */}
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-[#E8E8E8] leading-tight">
          {bucket.label}
        </h4>
        <TruthLayerTag truthLayer={bucket.truthLayer} showMaqam />
      </div>

      {/* Confidence + Provenance row */}
      <div className="flex items-center gap-3">
        <ConfidenceBadge confidence={bucket.confidence} size={32} showLabel />
        <ProvenanceChip interactions={bucket.interactions} maxSteps={4} />
      </div>

      {/* Properties */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
        <div className="text-[#9CA3AF]">Severity</div>
        <div
          className="font-mono"
          style={{ color: bucket.properties.severity === "critical" ? "#E63946" : "#E8E8E8" }}
        >
          {(bucket.properties.severity as string).toUpperCase()}
        </div>

        <div className="text-[#9CA3AF]">Goldstein</div>
        <div className="font-mono" style={{ color: visual.color }}>
          {bucket.properties.goldsteinScale.toFixed(1)}
        </div>

        <div className="text-[#9CA3AF]">Location</div>
        <div className="font-mono text-[10px]">
          {bucket.properties.lat.toFixed(2)}, {bucket.properties.lon.toFixed(2)}
        </div>

        <div className="text-[#9CA3AF]">Country</div>
        <div>{bucket.properties.country}</div>

        <div className="text-[#9CA3AF]">Actors</div>
        <div className="text-[10px]">{bucket.properties.actors.join(", ") || "—"}</div>

        <div className="text-[#9CA3AF]">Event Type</div>
        <div className="text-[10px]">{bucket.properties.eventType.replace(/_/g, " ")}</div>

        <div className="text-[#9CA3AF]">Source</div>
        <div>{bucket.properties.sourceFeed}</div>

        <div className="text-[#9CA3AF]">Modality</div>
        <div>{bucket.modality}</div>
      </div>

      {/* Provenance trail (detailed) */}
      <div className="border-t border-[#264653]/30 pt-2">
        <div className="text-[10px] font-semibold text-[#9CA3AF] mb-1">Interaction Journal</div>
        <div className="space-y-1">
          {bucket.interactions.map((ix) => (
            <div key={ix.interactionId} className="flex items-center gap-2 text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-[#264653]" />
              <span className="text-[#E8E8E8]">{ix.interactionType}</span>
              <span className="text-[#9CA3AF]">by {ix.agentId}</span>
              <span className="text-[#9CA3AF] ml-auto font-mono">
                {ix.confidenceAfter > 0 ? `${(ix.confidenceAfter * 100).toFixed(0)}%` : ""}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Active/recent indicator */}
      {visual.pulse && (
        <div className="flex items-center gap-2 text-[10px] text-[#E63946] animate-pulse">
          <span className="w-2 h-2 rounded-full bg-[#E63946]" />
          Active / Recent event
        </div>
      )}
    </div>
  );
}
