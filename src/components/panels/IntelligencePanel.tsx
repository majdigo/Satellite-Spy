"use client";

import { useAppStore } from "@/store";
import { severityBgClass, getTimeAgo } from "@/lib/utils/helpers";
import { useState, useCallback } from "react";
import { matchScenarioPatterns } from "@/lib/api/scenario-patterns";

const CATEGORY_ICONS: Record<string, string> = {
  military_movement: "⚔",
  political_instability: "⚡",
  economic_crisis: "📉",
  humanitarian_crisis: "🆘",
  infrastructure: "🏗",
  cyber_threat: "🔒",
  environmental: "🌍",
};

export default function IntelligencePanel() {
  const {
    intelReports, setFocusLocation,
    crossIntelAlerts, marketAnomalies, conflicts, marketData,
    satellites, aircraft, gdeltEvents,
  } = useAppStore();
  const [exporting, setExporting] = useState(false);

  const exportReport = useCallback(async () => {
    setExporting(true);
    try {
      const scenarioMatches = matchScenarioPatterns({
        market: marketData,
        conflicts,
        gdeltEvents,
        satellites,
        aircraft,
      });

      const resp = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crossIntelAlerts: crossIntelAlerts.slice(0, 30),
          marketAnomalies: marketAnomalies.slice(0, 20),
          conflicts: conflicts.slice(0, 20),
          marketData,
          scenarioMatches: scenarioMatches.map((m) => ({
            name: m.pattern.name,
            matchPercentage: m.matchPercentage,
            severity: m.pattern.severity,
            category: m.pattern.category,
            expectedOutcome: m.pattern.expectedOutcome,
            historicalExamples: m.pattern.historicalExamples,
            affectedSymbols: m.pattern.affectedSymbols,
          })),
          generatedAt: new Date().toISOString(),
        }),
      });

      const data = await resp.json();
      if (data.report) {
        const blob = new Blob([data.report], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `satellite-spy-brief-${new Date().toISOString().substring(0, 10)}.txt`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  }, [crossIntelAlerts, marketAnomalies, conflicts, marketData, satellites, aircraft, gdeltEvents]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-mono text-gray-600 uppercase tracking-wider">
          Intelligence Reports ({intelReports.length})
        </div>
        <button
          onClick={exportReport}
          disabled={exporting}
          className="text-[8px] font-mono text-military-green border border-military-green/30 px-2 py-0.5 hover:bg-military-green/10 transition-colors disabled:opacity-50"
        >
          {exporting ? "EXPORTING..." : "EXPORT BRIEF"}
        </button>
      </div>

      {intelReports.length === 0 ? (
        <div className="text-center text-[10px] font-mono text-gray-700 py-8">
          <div className="text-lg mb-2 opacity-30">◈</div>
          GENERATING INTELLIGENCE REPORTS...
          <div className="text-[8px] text-gray-800 mt-1">
            Requires conflict and event data to cross-reference
          </div>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-96 overflow-y-auto">
          {intelReports.map((report) => (
            <div
              key={report.id}
              className="border border-gray-800 hover:border-gray-700 p-2 cursor-pointer transition-all group"
              onClick={() => {
                if (report.location.latitude !== 0) {
                  setFocusLocation({
                    lat: report.location.latitude,
                    lon: report.location.longitude,
                    zoom: 800,
                  });
                }
              }}
            >
              {/* Header */}
              <div className="flex items-start gap-2">
                <span className="text-sm mt-0.5">
                  {CATEGORY_ICONS[report.category] || "◈"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${severityBgClass(report.severity)}`}
                    />
                    <span className="text-[10px] font-mono text-gray-200 font-bold truncate">
                      {report.title}
                    </span>
                  </div>

                  {/* Summary */}
                  <div className="text-[9px] font-mono text-gray-500 mt-1 leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all">
                    {report.summary}
                  </div>

                  {/* Indicators */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {report.indicators.slice(0, 3).map((ind, i) => (
                      <span
                        key={i}
                        className="text-[7px] font-mono text-gray-600 bg-gray-900 px-1 py-0.5"
                      >
                        {ind}
                      </span>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-1.5 text-[8px] font-mono text-gray-700">
                    <div className="flex items-center gap-2">
                      <span>
                        CONF: {report.confidence}%
                      </span>
                      <span className="text-gray-800">|</span>
                      <span>
                        {report.sources.join(", ")}
                      </span>
                    </div>
                    <span>{getTimeAgo(report.timestamp)}</span>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {report.tags.slice(0, 4).map((tag, i) => (
                      <span
                        key={i}
                        className="text-[7px] font-mono text-military-green/40 border border-military-green/20 px-1"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
