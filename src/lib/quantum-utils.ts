/**
 * Quantum component utility functions — pure logic, no JSX.
 * Extracted for testability.
 *
 * S-Agent Phase 2 — Agentic Cognitive UI
 */

// ── Confidence levels ───────────────────────────────────────────────────────

export type ConfidenceLevel = "high" | "medium" | "low" | "unknown";

export function getConfidenceLevel(c: number | undefined): ConfidenceLevel {
  if (c === undefined || c === null) return "unknown";
  if (c >= 0.9) return "high";
  if (c >= 0.6) return "medium";
  return "low";
}

export const CONFIDENCE_COLORS: Record<ConfidenceLevel, { ring: string; text: string; label: string }> = {
  high:    { ring: "#2D6A4F", text: "#2D6A4F", label: "High" },
  medium:  { ring: "#E76F51", text: "#E76F51", label: "Medium" },
  low:     { ring: "#E63946", text: "#E63946", label: "Low" },
  unknown: { ring: "#9E9E9E", text: "#9E9E9E", label: "Unknown" },
};

// ── Truth layer tags ────────────────────────────────────────────────────────

export const TRUTH_TAG: Record<string, { bg: string; text: string; label: string; maqam: string }> = {
  OBSERVED:         { bg: "#2D6A4F", text: "#E8F5E9", label: "Observed", maqam: "Bayati" },
  COMPUTED:         { bg: "#1B4965", text: "#E3F2FD", label: "Computed", maqam: "Rast" },
  ESTIMATED:        { bg: "#E76F51", text: "#FFF3E0", label: "Estimated", maqam: "Hijaz" },
  MARKET_REFERENCE: { bg: "#6C567B", text: "#F3E5F5", label: "Market Ref", maqam: "Nahawand" },
};

// ── Confidence opacity ──────────────────────────────────────────────────────

export function confidenceOpacity(confidence: number): number {
  return 0.4 + Math.min(1, Math.max(0, confidence)) * 0.6;
}

// ── Anomaly border ──────────────────────────────────────────────────────────

export type AnomalySeverity = "CRITICAL" | "WARNING" | "INFO";

export function anomalyBorder(anomalies?: Array<{ severity: AnomalySeverity }>): string {
  if (!anomalies || anomalies.length === 0) return "none";
  const worst = anomalies[0].severity;
  if (worst === "CRITICAL") return "2px solid #E63946";
  if (worst === "WARNING") return "2px solid #F2CC8F";
  return "1px dashed #9E9E9E";
}
