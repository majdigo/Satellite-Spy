"use client";

/**
 * ProvenanceChip — Compact trajectory view showing 3-5 agent steps.
 *
 * Displays the DataBucket's interaction journey as a horizontal timeline
 * of colored dots with agent labels.
 *
 * S-Agent Phase 2 — Agentic Cognitive UI
 */

import type { Interaction } from "@/models/GeoEventBucket";

const INTERACTION_COLORS: Record<string, string> = {
  created:    "#2D6A4F",
  computed:   "#1B4965",
  enriched:   "#457B9D",
  converted:  "#6C567B",
  validated:  "#A7C957",
  corrected:  "#F2CC8F",
  aggregated: "#1B4965",
  projected:  "#9CA3AF",
  queried:    "#9CA3AF",
  propagated: "#E76F51",
  archived:   "#666",
};

const AGENT_ICONS: Record<string, string> = {
  "S-Agent":    "S",
  "GDELT-feed": "G",
  "ACLED-feed": "A",
  "USGS-feed":  "U",
  user:         "H",
  algorithm:    "A",
};

interface ProvenanceChipProps {
  interactions: Interaction[];
  maxSteps?: number;
  className?: string;
}

export default function ProvenanceChip({
  interactions,
  maxSteps = 5,
  className,
}: ProvenanceChipProps) {
  const visible = interactions.slice(-maxSteps);

  if (visible.length === 0) return null;

  return (
    <div className={`inline-flex items-center gap-0.5 ${className || ""}`}>
      {interactions.length > maxSteps && (
        <span className="text-[9px] text-[#9CA3AF] mr-0.5">+{interactions.length - maxSteps}</span>
      )}
      {visible.map((ix, i) => {
        const color = INTERACTION_COLORS[ix.interactionType] || "#9CA3AF";
        const icon = AGENT_ICONS[ix.agentId] || ix.agentId.charAt(0).toUpperCase();

        return (
          <span key={ix.interactionId} className="inline-flex items-center">
            <span
              className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[8px] font-bold text-white"
              style={{ backgroundColor: color }}
              title={`${ix.interactionType} by ${ix.agentId} (${ix.method}) — conf: ${(ix.confidenceAfter * 100).toFixed(0)}%`}
            >
              {icon}
            </span>
            {i < visible.length - 1 && (
              <span className="text-[#9CA3AF] text-[8px] mx-0.5">→</span>
            )}
          </span>
        );
      })}
    </div>
  );
}
