"use client";

import { useAppStore } from "@/store";
import { useMemo, useState } from "react";
import {
  SCENARIO_PATTERNS,
  matchScenarioPatterns,
  type ScenarioMatch,
  type ScenarioPattern,
} from "@/lib/api/scenario-patterns";

export default function ScenarioPanel() {
  const {
    marketData, conflicts, gdeltEvents, satellites, aircraft,
  } = useAppStore();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"active" | "library">("active");

  // Run scenario matching against live data
  const activeMatches = useMemo(() => {
    if (marketData.length === 0 && conflicts.length === 0) return [];
    return matchScenarioPatterns({
      market: marketData,
      conflicts,
      gdeltEvents,
      satellites,
      aircraft,
    });
  }, [marketData, conflicts, gdeltEvents, satellites, aircraft]);

  // Categorize all patterns by status
  const matchedIds = new Set(activeMatches.map((m) => m.pattern.id));

  const categoryLabel: Record<string, string> = {
    energy_conflict: "ENERGY",
    food_crisis: "FOOD",
    defense_surge: "DEFENSE",
    currency_crisis: "CURRENCY",
    safe_haven: "SAFE HAVEN",
    supply_chain: "SUPPLY CHAIN",
    sanctions: "SANCTIONS",
  };

  const severityStyles: Record<string, string> = {
    critical: "border-red-600/50 bg-red-950/20",
    high: "border-orange-500/40 bg-orange-950/15",
    medium: "border-yellow-500/30 bg-yellow-950/10",
    low: "border-gray-700 bg-gray-900/20",
  };

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex gap-1">
        <button
          onClick={() => setViewMode("active")}
          className={`flex-1 text-[9px] font-mono py-1 border ${
            viewMode === "active"
              ? "border-military-green/40 text-military-green bg-military-green/5"
              : "border-gray-800 text-gray-600 hover:text-gray-400"
          }`}
        >
          ACTIVE MATCHES ({activeMatches.length})
        </button>
        <button
          onClick={() => setViewMode("library")}
          className={`flex-1 text-[9px] font-mono py-1 border ${
            viewMode === "library"
              ? "border-military-green/40 text-military-green bg-military-green/5"
              : "border-gray-800 text-gray-600 hover:text-gray-400"
          }`}
        >
          PATTERN LIBRARY ({SCENARIO_PATTERNS.length})
        </button>
      </div>

      {/* Active matches view */}
      {viewMode === "active" && (
        <div className="space-y-2">
          {activeMatches.length === 0 && (
            <div className="text-center py-8">
              <div className="text-[10px] font-mono text-gray-700">
                NO ACTIVE SCENARIO MATCHES
              </div>
              <div className="text-[8px] font-mono text-gray-800 mt-1">
                Monitoring {SCENARIO_PATTERNS.length} patterns against live data
              </div>
            </div>
          )}

          {activeMatches.map((match) => (
            <ScenarioMatchCard
              key={match.pattern.id}
              match={match}
              expanded={expandedId === match.pattern.id}
              onToggle={() =>
                setExpandedId(
                  expandedId === match.pattern.id ? null : match.pattern.id
                )
              }
              categoryLabel={categoryLabel}
              severityStyles={severityStyles}
            />
          ))}
        </div>
      )}

      {/* Library view */}
      {viewMode === "library" && (
        <div className="space-y-2">
          {SCENARIO_PATTERNS.map((pattern) => (
            <ScenarioLibraryCard
              key={pattern.id}
              pattern={pattern}
              isActive={matchedIds.has(pattern.id)}
              activeMatch={activeMatches.find(
                (m) => m.pattern.id === pattern.id
              )}
              expanded={expandedId === pattern.id}
              onToggle={() =>
                setExpandedId(
                  expandedId === pattern.id ? null : pattern.id
                )
              }
              categoryLabel={categoryLabel}
              severityStyles={severityStyles}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function ScenarioMatchCard({
  match,
  expanded,
  onToggle,
  categoryLabel,
  severityStyles,
}: {
  match: ScenarioMatch;
  expanded: boolean;
  onToggle: () => void;
  categoryLabel: Record<string, string>;
  severityStyles: Record<string, string>;
}) {
  const { pattern, matchedTriggers, totalTriggers, matchPercentage } = match;

  return (
    <div
      className={`border p-2 cursor-pointer transition-all ${
        severityStyles[pattern.severity] || severityStyles.low
      }`}
      onClick={onToggle}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`text-[7px] font-mono px-1 py-0.5 border ${
                pattern.severity === "critical"
                  ? "border-red-600 text-red-400"
                  : pattern.severity === "high"
                  ? "border-orange-500 text-orange-400"
                  : "border-yellow-500 text-yellow-400"
              }`}
            >
              {categoryLabel[pattern.category] || pattern.category.toUpperCase()}
            </span>
            <span className="text-[10px] font-mono text-gray-200 font-bold">
              {pattern.name}
            </span>
          </div>
        </div>
        {/* Match gauge */}
        <div className="text-right">
          <div
            className={`text-[11px] font-mono font-bold ${
              matchPercentage > 80
                ? "text-red-400"
                : matchPercentage > 60
                ? "text-orange-400"
                : "text-yellow-400"
            }`}
          >
            {matchPercentage}%
          </div>
          <div className="text-[7px] font-mono text-gray-600">
            {matchedTriggers}/{totalTriggers} TRIGGERS
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-1.5 h-1 bg-gray-900 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${
            matchPercentage > 80
              ? "bg-red-500"
              : matchPercentage > 60
              ? "bg-orange-500"
              : "bg-yellow-500"
          }`}
          style={{ width: `${matchPercentage}%` }}
        />
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="mt-2 space-y-2 border-t border-gray-800 pt-2">
          <div className="text-[9px] font-mono text-gray-400">
            {pattern.description}
          </div>

          {/* Trigger status */}
          <div className="space-y-1">
            <div className="text-[8px] font-mono text-gray-600 uppercase">
              Trigger Status
            </div>
            {pattern.triggers.map((trigger, i) => {
              const isMatched = i < matchedTriggers; // Approximation
              return (
                <div
                  key={i}
                  className="flex items-start gap-1.5 text-[8px] font-mono"
                >
                  <span
                    className={
                      isMatched ? "text-green-400" : "text-gray-700"
                    }
                  >
                    {isMatched ? "[+]" : "[ ]"}
                  </span>
                  <span
                    className={
                      isMatched ? "text-gray-300" : "text-gray-600"
                    }
                  >
                    {trigger.condition}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Historical precedents */}
          <div className="space-y-1">
            <div className="text-[8px] font-mono text-gray-600 uppercase">
              Historical Precedents
            </div>
            {pattern.historicalExamples.map((ex, i) => (
              <div
                key={i}
                className="text-[8px] font-mono text-military-amber/80 pl-2 border-l border-military-amber/30"
              >
                {ex}
              </div>
            ))}
          </div>

          {/* Expected outcome */}
          <div className="space-y-0.5">
            <div className="text-[8px] font-mono text-gray-600 uppercase">
              Expected Outcome
            </div>
            <div className="text-[8px] font-mono text-gray-400">
              {pattern.expectedOutcome}
            </div>
          </div>

          {/* Affected symbols */}
          <div className="flex flex-wrap gap-1">
            {pattern.affectedSymbols.map((sym) => (
              <span
                key={sym}
                className="text-[7px] font-mono text-cyan-400 border border-cyan-800/40 px-1 py-0.5"
              >
                {sym}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScenarioLibraryCard({
  pattern,
  isActive,
  activeMatch,
  expanded,
  onToggle,
  categoryLabel,
  severityStyles,
}: {
  pattern: ScenarioPattern;
  isActive: boolean;
  activeMatch?: ScenarioMatch;
  expanded: boolean;
  onToggle: () => void;
  categoryLabel: Record<string, string>;
  severityStyles: Record<string, string>;
}) {
  return (
    <div
      className={`border p-2 cursor-pointer transition-all ${
        isActive
          ? severityStyles[pattern.severity] || severityStyles.low
          : "border-gray-800/50 bg-gray-950/30 opacity-60 hover:opacity-80"
      }`}
      onClick={onToggle}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isActive
                ? pattern.severity === "critical"
                  ? "bg-red-500 animate-pulse"
                  : "bg-orange-500"
                : "bg-gray-700"
            }`}
          />
          <span
            className={`text-[7px] font-mono px-1 py-0.5 border ${
              isActive
                ? "border-military-green/40 text-military-green"
                : "border-gray-800 text-gray-600"
            }`}
          >
            {categoryLabel[pattern.category] || pattern.category.toUpperCase()}
          </span>
          <span
            className={`text-[9px] font-mono font-bold ${
              isActive ? "text-gray-200" : "text-gray-500"
            }`}
          >
            {pattern.name}
          </span>
        </div>
        {isActive && activeMatch && (
          <span className="text-[9px] font-mono text-red-400 font-bold">
            {activeMatch.matchPercentage}%
          </span>
        )}
        {!isActive && (
          <span className="text-[7px] font-mono text-gray-700">
            {pattern.triggers.length} triggers
          </span>
        )}
      </div>

      {expanded && (
        <div className="mt-2 space-y-1.5 border-t border-gray-800 pt-2">
          <div className="text-[8px] font-mono text-gray-500">
            {pattern.description}
          </div>
          <div className="text-[8px] font-mono text-gray-600">
            Severity: {pattern.severity.toUpperCase()} | Min triggers: {pattern.minTriggersToActivate}/{pattern.triggers.length}
          </div>
          <div className="flex flex-wrap gap-1">
            {pattern.affectedSymbols.slice(0, 5).map((sym) => (
              <span
                key={sym}
                className="text-[7px] font-mono text-gray-500 border border-gray-800 px-1"
              >
                {sym}
              </span>
            ))}
          </div>
          {pattern.historicalExamples.length > 0 && (
            <div className="text-[8px] font-mono text-gray-600 italic">
              e.g. {pattern.historicalExamples[0]}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
