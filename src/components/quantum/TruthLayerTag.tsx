"use client";

/**
 * TruthLayerTag — Maqam-colored pill showing the truth layer.
 *
 * S-Agent Phase 2 — Agentic Cognitive UI
 */

import type { TruthLayer } from "@/types/quantum-data";

const TRUTH_TAG: Record<string, { bg: string; text: string; label: string; maqam: string }> = {
  OBSERVED:         { bg: "#2D6A4F", text: "#E8F5E9", label: "Observed", maqam: "Bayati" },
  COMPUTED:         { bg: "#1B4965", text: "#E3F2FD", label: "Computed", maqam: "Rast" },
  ESTIMATED:        { bg: "#E76F51", text: "#FFF3E0", label: "Estimated", maqam: "Hijaz" },
  MARKET_REFERENCE: { bg: "#6C567B", text: "#F3E5F5", label: "Market Ref", maqam: "Nahawand" },
};

interface TruthLayerTagProps {
  truthLayer: TruthLayer;
  showMaqam?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export default function TruthLayerTag({
  truthLayer,
  showMaqam = false,
  size = "sm",
  className,
}: TruthLayerTagProps) {
  const tag = TRUTH_TAG[truthLayer] || TRUTH_TAG.OBSERVED;
  const sizeClass = size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-1";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded font-mono ${sizeClass} ${className || ""}`}
      style={{ backgroundColor: tag.bg, color: tag.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tag.text }} />
      {tag.label}
      {showMaqam && <span className="opacity-70">({tag.maqam})</span>}
    </span>
  );
}

export { TRUTH_TAG };
