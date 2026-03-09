"use client";

import { useAppStore } from "@/store";
import { useState, useCallback } from "react";
import type { CrossIntelligenceAlert, SeverityLevel } from "@/types";

const SEVERITY_COLORS: Record<SeverityLevel, string> = {
  critical: "border-red-500 bg-red-500/5",
  high: "border-military-amber bg-military-amber/5",
  medium: "border-yellow-600 bg-yellow-600/5",
  low: "border-gray-600 bg-gray-900/50",
};

const SEVERITY_TEXT: Record<SeverityLevel, string> = {
  critical: "text-red-400",
  high: "text-military-amber",
  medium: "text-yellow-500",
  low: "text-gray-500",
};

const SUSPICION_COLORS: Record<string, string> = {
  very_high: "text-red-400 bg-red-500/10",
  high: "text-military-amber bg-military-amber/10",
  moderate: "text-yellow-500 bg-yellow-500/10",
  low: "text-gray-400 bg-gray-500/10",
  none: "text-gray-600 bg-gray-800/30",
};

const CATEGORY_LABELS: Record<string, string> = {
  market_manipulation: "MARKET MANIPULATION",
  insider_trading_suspicion: "INSIDER TRADING",
  conflict_profiteering: "CONFLICT PROFITEERING",
  sanctions_evasion: "SANCTIONS EVASION",
  resource_warfare: "RESOURCE WARFARE",
  preemptive_positioning: "PRE-EMPTIVE POSITIONING",
  surveillance_escalation: "SURVEILLANCE ESCALATION",
  military_buildup: "MILITARY BUILDUP",
};

const SOURCE_ICONS: Record<string, string> = {
  satellite: "🛰️",
  aircraft: "✈️",
  market: "📊",
  conflict: "⚔️",
  gdelt: "📰",
  economic: "💹",
  disaster: "🌊",
};

export default function CrossIntelligencePanel() {
  const {
    crossIntelAlerts,
    marketData,
    marketAnomalies,
    satSurveillancePatterns,
    militaryAircraftPatterns,
    llmAnalysisResults,
    addLlmAnalysisResult,
  } = useAppStore();

  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"alerts" | "market" | "surveillance" | "ai">("alerts");
  const [llmQuery, setLlmQuery] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const runLlmAnalysis = useCallback(async () => {
    if (!llmQuery.trim()) return;
    setIsAnalyzing(true);

    try {
      const state = useAppStore.getState();
      const resp = await fetch("/api/llm-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: llmQuery,
          context: {
            crossIntelAlerts: state.crossIntelAlerts.slice(0, 10),
            marketAnomalies: state.marketAnomalies.slice(0, 10),
            recentConflicts: state.conflicts.slice(0, 10),
            satPatterns: state.satSurveillancePatterns.slice(0, 5),
            acPatterns: state.militaryAircraftPatterns.slice(0, 5),
          },
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        addLlmAnalysisResult({
          id: `llm-${Date.now()}`,
          query: llmQuery,
          result: data.analysis,
          timestamp: new Date(),
        });
      }
    } catch (err) {
      addLlmAnalysisResult({
        id: `llm-err-${Date.now()}`,
        query: llmQuery,
        result: `Analysis engine unavailable: ${String(err)}. Configure OPENROUTER_API_KEY in .env to enable LLM reasoning.`,
        timestamp: new Date(),
      });
    } finally {
      setIsAnalyzing(false);
      setLlmQuery("");
    }
  }, [llmQuery, addLlmAnalysisResult]);

  return (
    <div className="space-y-2">
      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-gray-800 pb-1">
        {(["alerts", "market", "surveillance", "ai"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-[9px] font-mono uppercase px-2 py-1 transition-all ${
              activeTab === tab
                ? "text-military-green border-b border-military-green"
                : "text-gray-600 hover:text-gray-400"
            }`}
          >
            {tab === "alerts" && `Alerts (${crossIntelAlerts.length})`}
            {tab === "market" && `Market (${marketAnomalies.length})`}
            {tab === "surveillance" && `SIGINT (${satSurveillancePatterns.length})`}
            {tab === "ai" && `AI Brain (${llmAnalysisResults.length})`}
          </button>
        ))}
      </div>

      {/* ALERTS TAB */}
      {activeTab === "alerts" && (
        <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-thin">
          {crossIntelAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              expanded={expandedAlert === alert.id}
              onToggle={() => setExpandedAlert(expandedAlert === alert.id ? null : alert.id)}
            />
          ))}
          {crossIntelAlerts.length === 0 && (
            <EmptyState text="CROSS-INTELLIGENCE ENGINE ACTIVE" subtext="Correlating satellite, market, conflict & SIGINT data..." />
          )}
        </div>
      )}

      {/* MARKET TAB */}
      {activeTab === "market" && (
        <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-thin">
          {/* Market Overview */}
          <div className="grid grid-cols-2 gap-1">
            {marketData.slice(0, 12).map((m) => (
              <div
                key={m.symbol}
                className={`border px-2 py-1 text-[9px] font-mono ${
                  m.changePercent > 0
                    ? "border-green-900/50 text-green-400"
                    : m.changePercent < 0
                    ? "border-red-900/50 text-red-400"
                    : "border-gray-800 text-gray-400"
                }`}
              >
                <div className="flex justify-between">
                  <span className="text-gray-500 truncate mr-1">{m.name}</span>
                  <span>{m.changePercent > 0 ? "+" : ""}{m.changePercent.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between text-[8px] text-gray-600">
                  <span>${m.price.toFixed(2)}</span>
                  {m.volumeAnomaly > 1.5 && (
                    <span className="text-military-amber">VOL {m.volumeAnomaly.toFixed(1)}x</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Anomalies */}
          {marketAnomalies.length > 0 && (
            <>
              <div className="text-[9px] font-mono text-military-amber uppercase mt-2">
                Anomalies Detected ({marketAnomalies.length})
              </div>
              {marketAnomalies.map((a) => (
                <div key={a.id} className="border border-military-amber/30 bg-military-amber/5 px-2 py-1">
                  <div className="text-[9px] font-mono text-military-amber">{a.description}</div>
                  <div className="text-[8px] font-mono text-gray-600 mt-0.5">
                    Type: {a.anomalyType.replace(/_/g, " ")} | Severity: {a.severity}
                    {a.relatedCountries?.length ? ` | Regions: ${a.relatedCountries.join(", ")}` : ""}
                  </div>
                </div>
              ))}
            </>
          )}

          {marketData.length === 0 && (
            <EmptyState text="FETCHING MARKET DATA..." subtext="Oil, gas, gold, defense stocks, VIX, currencies" />
          )}
        </div>
      )}

      {/* SURVEILLANCE TAB */}
      {activeTab === "surveillance" && (
        <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-thin">
          {satSurveillancePatterns.length > 0 && (
            <>
              <div className="text-[9px] font-mono text-military-green uppercase">
                Satellite Surveillance Patterns ({satSurveillancePatterns.length})
              </div>
              {satSurveillancePatterns.map((p) => (
                <div key={p.id} className="border border-military-green/30 bg-military-green/5 px-2 py-1.5">
                  <div className="text-[9px] font-mono text-military-green">{p.description}</div>
                  <div className="flex gap-2 mt-1 text-[8px] font-mono text-gray-500">
                    <span>Phase: {p.phase.replace(/_/g, " ")}</span>
                    <span>Score: {p.anomalyScore}</span>
                    <span>Sats: {p.satelliteNames.length}</span>
                  </div>
                  <div className="text-[8px] font-mono text-gray-600 mt-0.5">
                    {p.satelliteNames.join(", ")}
                  </div>
                </div>
              ))}
            </>
          )}

          {militaryAircraftPatterns.length > 0 && (
            <>
              <div className="text-[9px] font-mono text-military-blue uppercase mt-2">
                Military Aircraft Patterns ({militaryAircraftPatterns.length})
              </div>
              {militaryAircraftPatterns.map((p) => (
                <div key={p.id} className="border border-military-blue/30 bg-military-blue/5 px-2 py-1.5">
                  <div className="text-[9px] font-mono text-military-blue">{p.description}</div>
                  <div className="flex gap-2 mt-1 text-[8px] font-mono text-gray-500">
                    <span>Type: {p.patternType.replace(/_/g, " ")}</span>
                    <span>Count: {p.count}</span>
                  </div>
                </div>
              ))}
            </>
          )}

          {satSurveillancePatterns.length === 0 && militaryAircraftPatterns.length === 0 && (
            <EmptyState text="SCANNING..." subtext="Monitoring satellite passes & military aircraft over watch regions" />
          )}
        </div>
      )}

      {/* AI BRAIN TAB */}
      {activeTab === "ai" && (
        <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-thin">
          <div className="text-[9px] font-mono text-gray-500 bg-gray-900/50 p-2 border border-gray-800">
            Ask the AI to analyze patterns, generate hypotheses, or investigate suspicious correlations.
            Requires <span className="text-military-green">OPENROUTER_API_KEY</span> in .env
          </div>

          <div className="flex gap-1">
            <input
              type="text"
              value={llmQuery}
              onChange={(e) => setLlmQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runLlmAnalysis()}
              placeholder="e.g. Are there suspicious oil trades before Iran strikes?"
              className="flex-1 bg-black border border-gray-800 text-[9px] font-mono text-gray-300 px-2 py-1 focus:border-military-green outline-none"
            />
            <button
              onClick={runLlmAnalysis}
              disabled={isAnalyzing || !llmQuery.trim()}
              className="px-2 py-1 text-[9px] font-mono bg-military-green/10 text-military-green border border-military-green/30 hover:bg-military-green/20 disabled:opacity-30"
            >
              {isAnalyzing ? "ANALYZING..." : "ANALYZE"}
            </button>
          </div>

          {/* Quick analysis buttons */}
          <div className="flex flex-wrap gap-1">
            {[
              "Detect insider trading patterns",
              "Correlate Iran conflict with oil",
              "Satellite surveillance anomalies",
              "Defense stock manipulation check",
            ].map((q) => (
              <button
                key={q}
                onClick={() => { setLlmQuery(q); }}
                className="text-[8px] font-mono text-gray-500 border border-gray-800 px-1.5 py-0.5 hover:text-military-green hover:border-military-green/30"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Results */}
          {llmAnalysisResults.map((r) => (
            <div key={r.id} className="border border-gray-800 p-2 space-y-1">
              <div className="text-[9px] font-mono text-military-green">
                Q: {r.query}
              </div>
              <div className="text-[9px] font-mono text-gray-300 whitespace-pre-wrap">
                {r.result}
              </div>
              <div className="text-[8px] font-mono text-gray-700">
                {new Date(r.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AlertCard({
  alert,
  expanded,
  onToggle,
}: {
  alert: CrossIntelligenceAlert;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`border ${SEVERITY_COLORS[alert.severity]} p-2 cursor-pointer transition-all hover:opacity-90`}
      onClick={onToggle}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className={`text-[8px] font-mono uppercase px-1 ${SUSPICION_COLORS[alert.suspicionLevel]}`}>
              {alert.suspicionLevel !== "none" ? `⚠ ${alert.suspicionLevel}` : "NOMINAL"}
            </span>
            <span className={`text-[8px] font-mono uppercase ${SEVERITY_TEXT[alert.severity]}`}>
              {alert.severity}
            </span>
            <span className="text-[8px] font-mono text-gray-600">
              {CATEGORY_LABELS[alert.category] || alert.category}
            </span>
          </div>
          <div className="text-[10px] font-mono text-gray-200 font-semibold">
            {alert.title}
          </div>
          <div className="text-[9px] font-mono text-gray-400 mt-0.5">
            {alert.summary}
          </div>
        </div>
        <div className="text-[9px] font-mono text-gray-600">
          {alert.confidence}%
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="mt-2 pt-2 border-t border-gray-800 space-y-2">
          {/* Signals */}
          <div className="text-[8px] font-mono text-gray-500 uppercase">Intelligence Signals</div>
          {alert.signals.map((signal, idx) => (
            <div key={idx} className="flex items-start gap-1.5 ml-1">
              <span className="text-[10px]">{SOURCE_ICONS[signal.source] || "●"}</span>
              <div className="flex-1">
                <div className="text-[9px] font-mono text-gray-300">{signal.description}</div>
                <div className="text-[8px] font-mono text-gray-600">
                  {signal.source.toUpperCase()} | {signal.severity}
                </div>
              </div>
            </div>
          ))}

          {/* Market Impact */}
          {alert.marketImpact && (
            <div className="bg-black/50 border border-gray-800 px-2 py-1">
              <div className="text-[8px] font-mono text-gray-500 uppercase">Market Impact</div>
              <div className="text-[9px] font-mono text-gray-300">
                Direction: <span className={alert.marketImpact.direction === "bullish" ? "text-green-400" : alert.marketImpact.direction === "bearish" ? "text-red-400" : "text-military-amber"}>
                  {alert.marketImpact.direction.toUpperCase()}
                </span>
                {" | "}Magnitude: {alert.marketImpact.magnitude}
                {" | "}Symbols: {alert.marketImpact.symbols.join(", ")}
              </div>
            </div>
          )}

          {/* Narrative */}
          <div className="text-[9px] font-mono text-gray-400 italic bg-gray-900/50 px-2 py-1 border-l-2 border-military-green/30">
            {alert.narrative}
          </div>

          {/* Recommendations */}
          <div className="text-[8px] font-mono text-gray-500 uppercase">Recommendations</div>
          <ul className="space-y-0.5 ml-2">
            {alert.recommendations.map((rec, idx) => (
              <li key={idx} className="text-[8px] font-mono text-gray-400">
                ▸ {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function EmptyState({ text, subtext }: { text: string; subtext: string }) {
  return (
    <div className="text-center py-8">
      <div className="text-[10px] font-mono text-gray-700">{text}</div>
      <div className="text-[9px] font-mono text-gray-800 mt-1">{subtext}</div>
      <div className="mt-3 flex justify-center">
        <div className="w-4 h-4 border-t border-military-green/30 rounded-full animate-spin" />
      </div>
    </div>
  );
}
