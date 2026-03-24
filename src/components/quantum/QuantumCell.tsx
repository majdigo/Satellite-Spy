"use client";

/**
 * QuantumCell — Atomic component displaying a single DataBucket value.
 *
 * Visual channels:
 *   COLOR     → Truth Layer (provenance via maqam)
 *   OPACITY   → Confidence (certainty)
 *   BORDER    → Anomaly severity (dissonance)
 *   ANIMATION → Recency (pulse = recent change)
 *
 * S-Agent Phase 2 — local implementation pending H-Agent shared version.
 */

import { useMemo } from "react";
import type { TruthLayer } from "@/types/quantum-data";

// ── Truth layer color sets (from quantum-design-system.ts) ─────────────────

const TRUTH_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  OBSERVED:         { bg: "#E8F5E9", text: "#2D6A4F", border: "#66BB6A" },
  COMPUTED:         { bg: "#E3F2FD", text: "#1B4965", border: "#42A5F5" },
  ESTIMATED:        { bg: "#FFF3E0", text: "#E76F51", border: "#FF9800" },
  MARKET_REFERENCE: { bg: "#F3E5F5", text: "#6C567B", border: "#AB47BC" },
};

export interface AnomalyInfo {
  type: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  message: string;
}

export interface QuantumCellProps {
  value: string | number;
  unit?: string;
  truthLayer: TruthLayer;
  confidence: number;
  anomalies?: AnomalyInfo[];
  label?: string;
  lastModified?: Date;
  onClick?: () => void;
  className?: string;
  mono?: boolean;
}

function confidenceOpacity(confidence: number): number {
  return 0.4 + Math.min(1, Math.max(0, confidence)) * 0.6;
}

function anomalyBorder(anomalies?: AnomalyInfo[]): string {
  if (!anomalies || anomalies.length === 0) return "none";
  const worst = anomalies[0].severity;
  if (worst === "CRITICAL") return "2px solid #E63946";
  if (worst === "WARNING") return "2px solid #F2CC8F";
  return "1px dashed #9E9E9E";
}

function anomalyGlow(anomalies?: AnomalyInfo[]): string {
  if (!anomalies || anomalies.length === 0) return "none";
  if (anomalies[0].severity === "CRITICAL") return "0 0 8px #E6394640";
  return "none";
}

function recentAnimation(lastModified?: Date): string {
  if (!lastModified) return "none";
  const ageMs = Date.now() - lastModified.getTime();
  if (ageMs < 60_000) return "qd-pulse-fast 1s infinite";
  if (ageMs < 300_000) return "qd-pulse-slow 3s infinite";
  return "none";
}

export default function QuantumCell({
  value,
  unit,
  truthLayer,
  confidence,
  anomalies,
  label,
  lastModified,
  onClick,
  className,
  mono = true,
}: QuantumCellProps) {
  const colors = TRUTH_COLORS[truthLayer] || TRUTH_COLORS.OBSERVED;
  const opacity = confidenceOpacity(confidence);
  const border = anomalyBorder(anomalies);
  const glow = anomalyGlow(anomalies);
  const animation = recentAnimation(lastModified);

  const style = useMemo(() => ({
    backgroundColor: colors.bg,
    color: colors.text,
    borderLeft: `3px solid ${colors.border}`,
    border: border !== "none" ? border : undefined,
    borderLeftWidth: border === "none" ? "3px" : undefined,
    borderLeftStyle: border === "none" ? ("solid" as const) : undefined,
    borderLeftColor: border === "none" ? colors.border : undefined,
    opacity,
    boxShadow: glow,
    animation: animation !== "none" ? animation : undefined,
  }), [colors, opacity, border, glow, animation]);

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${mono ? "font-mono" : ""} ${onClick ? "cursor-pointer hover:brightness-110" : ""} ${className || ""}`}
      style={style}
      onClick={onClick}
      title={label ? `${label}: ${value}${unit ? ` ${unit}` : ""} (${truthLayer}, ${(confidence * 100).toFixed(0)}%)` : undefined}
    >
      {value}
      {unit && <span className="text-[10px] opacity-70">{unit}</span>}
    </span>
  );
}
