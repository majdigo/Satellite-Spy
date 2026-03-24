"use client";

import { useAppStore } from "@/store";
import { useMemo, useState, useCallback } from "react";
import { buildWorldModel } from "@/lib/engine/world-model";
import { generateDecisions, type Decision, type DecisionUrgency } from "@/lib/engine/decision-engine";
import { matchScenarioPatterns } from "@/lib/api/scenario-patterns";
import {
  runSimulation,
  SIMULATION_SCENARIOS,
  type SimulationResult,
} from "@/lib/engine/simulation-engine";
import { exportToGeoJSON, downloadGeoJSON } from "@/lib/api/export-geojson";

type ViewMode = "decisions" | "worldmodel" | "simulate" | "export";

export default function ActionCenterPanel() {
  const {
    conflicts, gdeltEvents, satellites, aircraft, disasters,
    marketData, marketAnomalies, economicData, crossIntelAlerts,
  } = useAppStore();

  const [view, setView] = useState<ViewMode>("decisions");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);

  // Build world model from live data
  const worldModel = useMemo(
    () =>
      buildWorldModel({
        conflicts, gdeltEvents, satellites, aircraft, disasters,
        marketData, marketAnomalies, economicIndicators: economicData, crossIntelAlerts,
      }),
    [conflicts, gdeltEvents, satellites, aircraft, disasters, marketData, marketAnomalies, economicData, crossIntelAlerts]
  );

  // Generate decisions
  const decisions = useMemo(() => {
    const scenarioMatches = matchScenarioPatterns({
      market: marketData, conflicts, gdeltEvents, satellites, aircraft,
    });
    return generateDecisions({ worldModel, crossIntelAlerts, scenarioMatches });
  }, [worldModel, crossIntelAlerts, marketData, conflicts, gdeltEvents, satellites, aircraft]);

  // Run simulation
  const handleSimulate = useCallback(
    (scenarioId: string) => {
      const scenario = SIMULATION_SCENARIOS.find((s) => s.id === scenarioId);
      if (!scenario) return;
      const result = runSimulation(scenario, worldModel);
      setSimResult(result);
    },
    [worldModel]
  );

  // Entity counts by status
  const entityStats = useMemo(() => {
    const stats = { normal: 0, stressed: 0, disrupted: 0, critical: 0 };
    for (const [, e] of worldModel.entities) {
      stats[e.status]++;
    }
    return stats;
  }, [worldModel]);

  return (
    <div className="space-y-3">
      {/* Header status bar */}
      <div className="border border-gray-800 p-2 bg-gray-950/50">
        <div className="text-[8px] font-mono text-gray-600 uppercase mb-1">World Model Status</div>
        <div className="flex gap-2 text-[9px] font-mono">
          <span className="text-green-500">{entityStats.normal} NORMAL</span>
          <span className="text-yellow-500">{entityStats.stressed} STRESSED</span>
          <span className="text-orange-400">{entityStats.disrupted} DISRUPTED</span>
          <span className="text-red-400">{entityStats.critical} CRITICAL</span>
        </div>
        <div className="text-[8px] font-mono text-gray-700 mt-0.5">
          {worldModel.entities.size} entities | {worldModel.relations.length} relations | {worldModel.causalChains.length} causal chains
        </div>
      </div>

      {/* View toggle */}
      <div className="flex gap-1">
        {([
          ["decisions", "DECISIONS"],
          ["worldmodel", "WORLD MODEL"],
          ["simulate", "SIMULATE"],
          ["export", "EXPORT"],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={`flex-1 text-[8px] font-mono py-1 border ${
              view === id
                ? "border-military-green/40 text-military-green bg-military-green/5"
                : "border-gray-800 text-gray-600 hover:text-gray-400"
            }`}
          >
            {label}
            {id === "decisions" && decisions.length > 0 && (
              <span className="ml-1 text-red-400">({decisions.length})</span>
            )}
          </button>
        ))}
      </div>

      {/* DECISIONS VIEW */}
      {view === "decisions" && (
        <div className="space-y-1.5 max-h-[calc(100vh-300px)] overflow-y-auto">
          {decisions.length === 0 && (
            <div className="text-center py-8 text-[10px] font-mono text-gray-700">
              NO ACTIONABLE DECISIONS
              <div className="text-[8px] text-gray-800 mt-1">
                All monitored entities are in normal state
              </div>
            </div>
          )}

          {decisions.map((decision) => (
            <DecisionCard
              key={decision.id}
              decision={decision}
              expanded={expandedId === decision.id}
              onToggle={() =>
                setExpandedId(expandedId === decision.id ? null : decision.id)
              }
            />
          ))}
        </div>
      )}

      {/* WORLD MODEL VIEW */}
      {view === "worldmodel" && (
        <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
          {/* Group by entity type */}
          {(["chokepoint", "commodity", "country"] as const).map((type) => {
            const entities = Array.from(worldModel.entities.values()).filter(
              (e) => e.type === type
            );
            if (entities.length === 0) return null;

            return (
              <div key={type}>
                <div className="text-[8px] font-mono text-gray-600 uppercase tracking-wider mb-1">
                  {type === "chokepoint" ? "Strategic Chokepoints" : type === "commodity" ? "Commodities" : "Key Countries"}
                </div>
                {entities.map((entity) => (
                  <div
                    key={entity.id}
                    className={`border p-1.5 mb-1 cursor-pointer ${
                      entity.status === "critical"
                        ? "border-red-600/50 bg-red-950/20"
                        : entity.status === "disrupted"
                        ? "border-orange-500/40 bg-orange-950/15"
                        : entity.status === "stressed"
                        ? "border-yellow-500/30 bg-yellow-950/10"
                        : "border-gray-800/50"
                    }`}
                    onClick={() =>
                      setExpandedId(
                        expandedId === entity.id ? null : entity.id
                      )
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            entity.status === "critical"
                              ? "bg-red-500 animate-pulse"
                              : entity.status === "disrupted"
                              ? "bg-orange-500"
                              : entity.status === "stressed"
                              ? "bg-yellow-500"
                              : "bg-green-600"
                          }`}
                        />
                        <span className="text-[9px] font-mono text-gray-300">
                          {entity.name}
                        </span>
                      </div>
                      <span
                        className={`text-[7px] font-mono uppercase ${
                          entity.status === "critical"
                            ? "text-red-400"
                            : entity.status === "disrupted"
                            ? "text-orange-400"
                            : entity.status === "stressed"
                            ? "text-yellow-400"
                            : "text-green-600"
                        }`}
                      >
                        {entity.status}
                      </span>
                    </div>

                    {expandedId === entity.id && (
                      <div className="mt-1.5 space-y-1 border-t border-gray-800 pt-1.5">
                        {entity.statusReason && (
                          <div className="text-[8px] font-mono text-gray-500">
                            {entity.statusReason}
                          </div>
                        )}
                        {entity.metrics.map((m, i) => (
                          <div
                            key={i}
                            className="flex justify-between text-[8px] font-mono"
                          >
                            <span className="text-gray-600">{m.name}</span>
                            <span
                              className={
                                m.anomaly
                                  ? "text-military-amber"
                                  : "text-gray-500"
                              }
                            >
                              {m.value} {m.unit}{" "}
                              {m.anomaly && "!"}
                            </span>
                          </div>
                        ))}
                        {/* Show relations */}
                        {worldModel.relations
                          .filter(
                            (r) =>
                              r.sourceId === entity.id ||
                              r.targetId === entity.id
                          )
                          .slice(0, 5)
                          .map((rel, i) => {
                            const otherId =
                              rel.sourceId === entity.id
                                ? rel.targetId
                                : rel.sourceId;
                            const other = worldModel.entities.get(otherId);
                            const isSource = rel.sourceId === entity.id;
                            return (
                              <div
                                key={i}
                                className="text-[7px] font-mono text-gray-600"
                              >
                                {isSource ? "→" : "←"}{" "}
                                {rel.type.replace(/_/g, " ")}{" "}
                                <span className="text-gray-500">
                                  {other?.name || otherId}
                                </span>{" "}
                                <span className="text-gray-700">
                                  ({(rel.strength * 100).toFixed(0)}%)
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}

          {/* Causal Chains */}
          {worldModel.causalChains.length > 0 && (
            <div>
              <div className="text-[8px] font-mono text-red-400 uppercase tracking-wider mb-1">
                Active Causal Chains
              </div>
              {worldModel.causalChains.map((chain) => (
                <div
                  key={chain.id}
                  className="border border-red-800/30 bg-red-950/10 p-1.5 mb-1"
                >
                  <div className="text-[9px] font-mono text-red-300 font-bold">
                    {chain.trigger}
                  </div>
                  <div className="text-[7px] font-mono text-gray-600 mt-0.5">
                    {chain.steps.length} steps | {chain.totalTimeframe} | {chain.confidence}% confidence
                  </div>
                  {chain.steps.map((step, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-1 mt-0.5 text-[7px] font-mono"
                    >
                      <span className="text-gray-700">{step.order}.</span>
                      <span
                        className={
                          step.impact === "critical"
                            ? "text-red-400"
                            : step.impact === "cascading"
                            ? "text-orange-400"
                            : "text-gray-500"
                        }
                      >
                        {step.entityName}: {step.description.substring(0, 80)}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* EXPORT VIEW */}
      {view === "export" && (
        <div className="space-y-2">
          <div className="text-[8px] font-mono text-gray-600 uppercase tracking-wider">
            Export Current Data as GeoJSON
          </div>
          <div className="text-[8px] font-mono text-gray-500">
            Exports all visible entities (satellites, aircraft, events, conflicts, disasters) as a standard GeoJSON FeatureCollection. Importable in QGIS, Mapbox, deck.gl.
          </div>
          <div className="grid grid-cols-2 gap-1 text-[8px] font-mono">
            <div className="border border-gray-800 p-1.5">
              <span className="text-cyan-400">{satellites.length}</span> <span className="text-gray-600">satellites</span>
            </div>
            <div className="border border-gray-800 p-1.5">
              <span className="text-blue-400">{aircraft.length}</span> <span className="text-gray-600">aircraft</span>
            </div>
            <div className="border border-gray-800 p-1.5">
              <span className="text-amber-400">{gdeltEvents.length}</span> <span className="text-gray-600">GDELT events</span>
            </div>
            <div className="border border-gray-800 p-1.5">
              <span className="text-red-400">{conflicts.length}</span> <span className="text-gray-600">conflicts</span>
            </div>
            <div className="border border-gray-800 p-1.5 col-span-2">
              <span className="text-orange-400">{disasters.length}</span> <span className="text-gray-600">disasters</span>
            </div>
          </div>
          <button
            onClick={() => {
              const geojson = exportToGeoJSON({
                satellites, aircraft, gdeltEvents, conflicts, disasters,
              });
              downloadGeoJSON(geojson);
            }}
            className="w-full text-[9px] font-mono font-bold text-military-green border border-military-green/40 py-2 hover:bg-military-green/10 transition-colors"
          >
            DOWNLOAD GEOJSON ({satellites.length + aircraft.length + gdeltEvents.length + conflicts.length + disasters.length} features)
          </button>
        </div>
      )}

      {/* SIMULATE VIEW */}
      {view === "simulate" && (
        <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
          <div className="text-[8px] font-mono text-gray-600 uppercase tracking-wider">
            What-If Scenarios
          </div>

          {SIMULATION_SCENARIOS.map((scenario) => (
            <div
              key={scenario.id}
              className="border border-gray-800 p-2 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[9px] font-mono text-gray-300 font-bold">
                    {scenario.name}
                  </div>
                  <div className="text-[8px] font-mono text-gray-600 mt-0.5">
                    {scenario.description}
                  </div>
                </div>
                <button
                  onClick={() => handleSimulate(scenario.id)}
                  className="text-[8px] font-mono text-military-green border border-military-green/30 px-2 py-1 hover:bg-military-green/10 transition-colors shrink-0"
                >
                  RUN
                </button>
              </div>
            </div>
          ))}

          {/* Simulation Result */}
          {simResult && (
            <div className="border border-military-green/30 bg-military-green/5 p-2 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-mono text-military-green font-bold">
                  SIMULATION RESULT: {simResult.scenario.name}
                </div>
                <button
                  onClick={() => setSimResult(null)}
                  className="text-[8px] font-mono text-gray-600 hover:text-gray-400"
                >
                  [x]
                </button>
              </div>

              <div className="flex gap-2 text-[8px] font-mono">
                <span className={`${simResult.overallSeverity === "critical" ? "text-red-400" : "text-orange-400"}`}>
                  SEVERITY: {simResult.overallSeverity.toUpperCase()}
                </span>
                <span className="text-gray-600">|</span>
                <span className="text-gray-500">
                  PROBABILITY: {simResult.probability}%
                </span>
                <span className="text-gray-600">|</span>
                <span className="text-gray-500">
                  ENTITIES AFFECTED: {simResult.affectedEntities.length}
                </span>
              </div>

              {/* Timeline */}
              <div>
                <div className="text-[8px] font-mono text-gray-600 uppercase mb-1">
                  Cascade Timeline
                </div>
                {simResult.timeline.map((event, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-[8px] font-mono mb-0.5"
                  >
                    <span className="text-military-green w-10 shrink-0">
                      {event.timeOffset}
                    </span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${
                        event.impact === "critical"
                          ? "bg-red-500"
                          : event.impact === "cascading"
                          ? "bg-orange-500"
                          : "bg-yellow-500"
                      }`}
                    />
                    <span className="text-gray-400">
                      <span className="text-gray-300">{event.entityName}</span>
                      : {event.description.substring(0, 60)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Market Predictions */}
              {simResult.marketPredictions.length > 0 && (
                <div>
                  <div className="text-[8px] font-mono text-gray-600 uppercase mb-1">
                    Market Impact Predictions
                  </div>
                  {simResult.marketPredictions.map((pred, i) => (
                    <div
                      key={i}
                      className="flex justify-between text-[8px] font-mono mb-0.5"
                    >
                      <span className="text-gray-400">{pred.name}</span>
                      <span
                        className={
                          pred.direction === "up"
                            ? "text-green-400"
                            : pred.direction === "down"
                            ? "text-red-400"
                            : "text-yellow-400"
                        }
                      >
                        {pred.expectedChange} ({pred.confidence}%)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Decision Card Component
// ============================================================================

const URGENCY_STYLES: Record<
  DecisionUrgency,
  { border: string; bg: string; text: string; label: string }
> = {
  immediate: { border: "border-red-600/50", bg: "bg-red-950/20", text: "text-red-400", label: "IMMEDIATE" },
  urgent: { border: "border-orange-500/40", bg: "bg-orange-950/15", text: "text-orange-400", label: "URGENT" },
  monitor: { border: "border-yellow-500/30", bg: "bg-yellow-950/10", text: "text-yellow-400", label: "MONITOR" },
  routine: { border: "border-gray-700", bg: "bg-gray-900/20", text: "text-gray-500", label: "ROUTINE" },
};

const DOMAIN_ICONS: Record<string, string> = {
  military: "M",
  economic: "$",
  humanitarian: "H",
  diplomatic: "D",
  logistics: "L",
  intelligence: "I",
};

function DecisionCard({
  decision,
  expanded,
  onToggle,
}: {
  decision: Decision;
  expanded: boolean;
  onToggle: () => void;
}) {
  const style = URGENCY_STYLES[decision.urgency];

  return (
    <div
      className={`border p-2 cursor-pointer transition-all ${style.border} ${style.bg}`}
      onClick={onToggle}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-1.5 flex-1">
          <span className="text-[8px] font-mono border border-gray-700 w-4 h-4 flex items-center justify-center text-gray-500 shrink-0 mt-0.5">
            {DOMAIN_ICONS[decision.domain] || "?"}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[9px] font-mono text-gray-200 font-bold truncate">
              {decision.title}
            </div>
            <div className="text-[8px] font-mono text-gray-500 mt-0.5 line-clamp-2">
              {decision.situation.substring(0, 120)}
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className={`text-[7px] font-mono font-bold ${style.text}`}>
            {style.label}
          </span>
          <div className="text-[7px] font-mono text-gray-700">
            {decision.decisionWindow}
          </div>
        </div>
      </div>

      {/* Expanded view */}
      {expanded && (
        <div className="mt-2 space-y-2 border-t border-gray-800 pt-2">
          {/* Situation */}
          <div>
            <div className="text-[8px] font-mono text-gray-600 uppercase">Situation</div>
            <div className="text-[8px] font-mono text-gray-400 mt-0.5">
              {decision.situation}
            </div>
          </div>

          {/* Impact */}
          <div>
            <div className="text-[8px] font-mono text-gray-600 uppercase">Impact Assessment</div>
            <div className="text-[8px] font-mono text-gray-500 mt-0.5 space-y-0.5">
              <div>Scope: {decision.impact.scope.toUpperCase()}</div>
              {decision.impact.affectedEntities.length > 0 && (
                <div>Affected: {decision.impact.affectedEntities.join(", ")}</div>
              )}
              {decision.impact.marketImpact && <div>Market: {decision.impact.marketImpact}</div>}
              {decision.impact.supplyChainImpact && <div>Supply Chain: {decision.impact.supplyChainImpact}</div>}
            </div>
          </div>

          {/* Actions */}
          <div>
            <div className="text-[8px] font-mono text-military-green uppercase">
              Recommended Actions
            </div>
            {decision.actions.map((action, i) => (
              <div
                key={i}
                className="flex items-start gap-1.5 mt-1 text-[8px] font-mono"
              >
                <span className="text-military-green shrink-0">
                  {action.priority}.
                </span>
                <div>
                  <div className="text-gray-300">{action.action}</div>
                  <div className="text-gray-600 mt-0.5">
                    {action.rationale} | {action.timeframe} | Risk: {action.risk}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Inaction risk */}
          <div className="border-t border-gray-800 pt-1.5">
            <div className="text-[8px] font-mono text-red-400 uppercase">
              Risk of Inaction
            </div>
            <div className="text-[8px] font-mono text-red-300/70 mt-0.5">
              {decision.inactionRisk}
            </div>
          </div>

          {/* Evidence */}
          <div className="flex justify-between text-[7px] font-mono text-gray-700">
            <span>{decision.evidence.length} evidence sources</span>
            <span>Confidence: {decision.confidence}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
