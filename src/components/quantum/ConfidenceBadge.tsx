"use client";

/**
 * ConfidenceBadge — Ring indicator showing confidence level.
 *
 * High (>=90%) → Bayati green ring
 * Medium (60-89%) → Hijaz amber ring
 * Low (<60%) → Saba red ring
 * Unknown → gray ring
 *
 * S-Agent Phase 2 — Agentic Cognitive UI
 */

interface ConfidenceBadgeProps {
  confidence: number | undefined;
  size?: number;  // px
  showLabel?: boolean;
  className?: string;
}

type ConfidenceLevel = "high" | "medium" | "low" | "unknown";

function getLevel(c: number | undefined): ConfidenceLevel {
  if (c === undefined || c === null) return "unknown";
  if (c >= 0.9) return "high";
  if (c >= 0.6) return "medium";
  return "low";
}

const LEVEL_COLORS: Record<ConfidenceLevel, { ring: string; text: string; label: string }> = {
  high:    { ring: "#2D6A4F", text: "#2D6A4F", label: "High" },
  medium:  { ring: "#E76F51", text: "#E76F51", label: "Medium" },
  low:     { ring: "#E63946", text: "#E63946", label: "Low" },
  unknown: { ring: "#9E9E9E", text: "#9E9E9E", label: "Unknown" },
};

export default function ConfidenceBadge({
  confidence,
  size = 24,
  showLabel = false,
  className,
}: ConfidenceBadgeProps) {
  const level = getLevel(confidence);
  const colors = LEVEL_COLORS[level];
  const pct = confidence !== undefined ? Math.round(confidence * 100) : 0;
  const radius = (size - 4) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - (confidence ?? 0));

  return (
    <span className={`inline-flex items-center gap-1 ${className || ""}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#333"
          strokeWidth={2}
        />
        {/* Confidence arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.ring}
          strokeWidth={2}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        {/* Center text */}
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill={colors.text}
          fontSize={size * 0.32}
          fontFamily="monospace"
        >
          {pct}
        </text>
      </svg>
      {showLabel && (
        <span className="text-[10px] font-mono" style={{ color: colors.text }}>
          {colors.label}
        </span>
      )}
    </span>
  );
}

export { getLevel, LEVEL_COLORS };
export type { ConfidenceLevel };
