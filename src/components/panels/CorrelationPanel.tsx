"use client";

import { useAppStore } from "@/store";
import { generateCorrelations } from "@/lib/api/correlation";
import { useMemo } from "react";

const CORRELATION_ICONS: Record<string, string> = {
  escalation: "📈",
  causal: "🔗",
  spatial: "📍",
  temporal: "⏰",
  thematic: "📰",
};

const STRENGTH_COLORS = [
  "bg-green-500",
  "bg-yellow-500",
  "bg-orange-500",
  "bg-red-500",
];

export default function CorrelationPanel() {
  const { gdeltEvents, conflicts, disasters, economicData } = useAppStore();

  const correlations = useMemo(() => {
    return generateCorrelations({
      gdeltEvents,
      conflicts,
      disasters,
      economicData,
    }).sort((a, b) => b.strength - a.strength);
  }, [gdeltEvents, conflicts, disasters, economicData]);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="text-[10px] font-mono text-gray-600 uppercase tracking-wider">
          Event Correlations & Predictions
        </div>
        <span className="text-[10px] font-mono text-military-green">
          {correlations.length} found
        </span>
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin">
        {correlations.map((corr) => (
          <div
            key={corr.id}
            className="border border-gray-800 p-2 space-y-1.5 hover:border-gray-700 transition-all"
          >
            <div className="flex items-start gap-2">
              <span className="text-sm">
                {CORRELATION_ICONS[corr.correlationType] || "●"}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-mono text-gray-500 uppercase">
                    {corr.correlationType}
                  </span>
                  {/* Strength indicator */}
                  <div className="flex gap-0.5">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full ${
                          corr.strength > i * 0.25
                            ? STRENGTH_COLORS[Math.min(3, Math.floor(corr.strength * 4))]
                            : "bg-gray-800"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="text-[10px] font-mono text-gray-300">
                  {corr.description}
                </div>
              </div>
            </div>

            {corr.predictedOutcome && (
              <div className="ml-6 text-[9px] font-mono text-military-amber bg-military-amber/5 border border-military-amber/20 px-2 py-1">
                <span className="text-military-amber mr-1">PREDICTION:</span>
                {corr.predictedOutcome}
              </div>
            )}

            <div className="ml-6 flex items-center gap-3 text-[9px] font-mono text-gray-600">
              <span>
                Confidence: {corr.confidence}%
              </span>
              {corr.timeframe && (
                <span>
                  Window: {corr.timeframe}
                </span>
              )}
              <span>
                Events: {corr.events.length}
              </span>
            </div>
          </div>
        ))}

        {correlations.length === 0 && (
          <div className="text-center text-[10px] font-mono text-gray-700 py-8">
            ANALYZING PATTERNS...
            <div className="mt-2 text-gray-800">
              Requires multiple data sources active
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
