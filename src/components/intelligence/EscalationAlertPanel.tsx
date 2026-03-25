"use client";

/**
 * EscalationAlertPanel — Displays agentic escalation alerts with reasoning.
 *
 * Each alert shows:
 * - Severity badge (color-coded)
 * - Pattern type (temporal, critical mass, corroboration, spillover)
 * - Human-readable reasoning (WHY this is an escalation)
 * - Evidence list
 * - Analyst recommendation
 * - Confidence badge
 *
 * S-Agent — Agentic UI for Satellite-Spy
 */

import { useState } from "react";
import type { EscalationAlert, EscalationPattern } from "@/lib/escalation-detector";

const SEVERITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: "#E6394620", text: "#E63946", border: "#E63946" },
  high:     { bg: "#E76F5120", text: "#E76F51", border: "#E76F51" },
  medium:   { bg: "#F2CC8F20", text: "#F2CC8F", border: "#F2CC8F" },
  low:      { bg: "#2D6A4F20", text: "#2D6A4F", border: "#264653" },
};

const PATTERN_LABELS: Record<EscalationPattern, { icon: string; label: string }> = {
  temporal_escalation: { icon: "↗", label: "Temporal Escalation" },
  critical_mass: { icon: "◉", label: "Critical Mass" },
  cross_source_corroboration: { icon: "✓✓", label: "Cross-Source Verified" },
  spillover_risk: { icon: "↔", label: "Spillover Risk" },
  anomalous_calm: { icon: "◇", label: "Anomalous Calm" },
};

interface EscalationAlertPanelProps {
  alerts: EscalationAlert[];
  className?: string;
  onAlertClick?: (alert: EscalationAlert) => void;
}

export default function EscalationAlertPanel({
  alerts,
  className,
  onAlertClick,
}: EscalationAlertPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (alerts.length === 0) {
    return (
      <div className={`bg-[#1A1A2E] rounded-lg p-4 ${className || ""}`}>
        <h3 className="text-sm font-semibold text-[#9CA3AF]">Escalation Alerts</h3>
        <p className="text-xs text-[#666] mt-2">No escalation patterns detected in current data.</p>
      </div>
    );
  }

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const highCount = alerts.filter((a) => a.severity === "high").length;

  return (
    <div className={`bg-[#1A1A2E] rounded-lg overflow-hidden ${className || ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#16213E] border-b border-[#264653]/30">
        <h3 className="text-sm font-semibold text-[#E8E8E8]">
          Escalation Alerts
          <span className="ml-2 text-xs text-[#9CA3AF]">{alerts.length} detected</span>
        </h3>
        <div className="flex gap-2 text-[10px]">
          {criticalCount > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-[#E6394630] text-[#E63946] font-mono animate-pulse">
              {criticalCount} CRITICAL
            </span>
          )}
          {highCount > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-[#E76F5130] text-[#E76F51] font-mono">
              {highCount} HIGH
            </span>
          )}
        </div>
      </div>

      {/* Alert list */}
      <div className="overflow-auto max-h-[400px]">
        {alerts.map((alert) => {
          const severity = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.medium;
          const pattern = PATTERN_LABELS[alert.pattern] || { icon: "?", label: alert.pattern };
          const isExpanded = expandedId === alert.id;

          return (
            <div key={alert.id} className="border-b border-[#264653]/20">
              {/* Summary row */}
              <div
                className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-[#16213E]/50 transition-colors"
                style={{ borderLeft: `3px solid ${severity.border}` }}
                onClick={() => {
                  setExpandedId(isExpanded ? null : alert.id);
                  onAlertClick?.(alert);
                }}
              >
                {/* Severity badge */}
                <span
                  className="shrink-0 text-[9px] font-mono px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: severity.bg, color: severity.text }}
                >
                  {alert.severity.toUpperCase()}
                </span>

                {/* Pattern icon */}
                <span className="text-xs text-[#9CA3AF] shrink-0 w-5 text-center font-mono">
                  {pattern.icon}
                </span>

                {/* Title */}
                <span className="text-xs text-[#E8E8E8] flex-1 truncate">
                  {alert.title}
                </span>

                {/* Confidence */}
                <span className="text-[10px] font-mono text-[#9CA3AF] shrink-0">
                  {(alert.confidence * 100).toFixed(0)}%
                </span>

                {/* Expand indicator */}
                <span className="text-[10px] text-[#666] shrink-0">
                  {isExpanded ? "▼" : "▶"}
                </span>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="px-6 py-3 bg-[#0F3460]/20 space-y-2">
                  {/* Pattern type */}
                  <div className="text-[10px] text-[#9CA3AF]">
                    Pattern: <span className="text-[#E8E8E8]">{pattern.label}</span>
                    {" | "}Region: <span className="text-[#E8E8E8]">{alert.region}</span>
                  </div>

                  {/* Reasoning */}
                  <div className="text-xs text-[#E8E8E8] leading-relaxed border-l-2 border-[#264653] pl-3">
                    {alert.reasoning}
                  </div>

                  {/* Evidence */}
                  <div>
                    <div className="text-[10px] text-[#9CA3AF] font-semibold mb-1">Evidence:</div>
                    <ul className="space-y-0.5">
                      {alert.evidence.map((ev, i) => (
                        <li key={i} className="text-[10px] text-[#9CA3AF] flex items-start gap-1">
                          <span className="text-[#264653] shrink-0 mt-0.5">-</span>
                          {ev}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommendation */}
                  <div className="text-[10px] px-2 py-1.5 rounded bg-[#264653]/20 border border-[#264653]/30">
                    <span className="text-[#264653] font-semibold">Recommendation: </span>
                    <span className="text-[#E8E8E8]">{alert.recommendation}</span>
                  </div>

                  {/* Meta */}
                  <div className="text-[9px] text-[#666] flex gap-3">
                    <span>Events: {alert.eventIds.length}</span>
                    <span>Confidence: {(alert.confidence * 100).toFixed(0)}%</span>
                    <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
