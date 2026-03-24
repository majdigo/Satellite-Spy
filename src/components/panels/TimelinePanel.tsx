"use client";

import { useAppStore } from "@/store";
import { useMemo, useState } from "react";
import { SEVERITY_COLORS } from "@/lib/design/geo-severity-colors";
import type { GeoSeverity } from "@/types/geo-event-quantum";

type TimelineMode = "events" | "cross-intel" | "combined";

export default function TimelinePanel() {
  const {
    gdeltEvents, conflicts, disasters,
    marketData, crossIntelAlerts, marketAnomalies,
  } = useAppStore();

  const [mode, setMode] = useState<TimelineMode>("combined");

  // Build timeline data bucketed by hour over the last 24h
  const timelineData = useMemo(() => {
    const now = Date.now();
    const buckets: Array<{
      hour: string;
      hourIndex: number;
      conflicts: number;
      events: number;
      disasters: number;
      maxSeverity: string;
      // Market overlay
      marketAlerts: number;
      crossIntelCount: number;
    }> = [];

    for (let h = 23; h >= 0; h--) {
      const start = now - (h + 1) * 3600000;
      const end = now - h * 3600000;
      const hourLabel = new Date(end).toLocaleTimeString("en-US", {
        hour: "2-digit",
        hour12: false,
      });

      const hourConflicts = conflicts.filter((c) => {
        const t = new Date(c.date).getTime();
        return t >= start && t < end;
      });

      const hourEvents = gdeltEvents.filter((e) => {
        const t = new Date(e.dateAdded).getTime();
        return t >= start && t < end;
      });

      const hourDisasters = disasters.filter((d) => {
        const t = new Date(d.date).getTime();
        return t >= start && t < end;
      });

      const hourMarketAlerts = marketAnomalies.filter((a) => {
        const t = new Date(a.timestamp).getTime();
        return t >= start && t < end;
      });

      const hourCrossIntel = crossIntelAlerts.filter((a) => {
        const t = new Date(a.timestamp).getTime();
        return t >= start && t < end;
      });

      let maxSeverity = "low";
      if (hourConflicts.some((c) => c.severity === "critical") || hourCrossIntel.some((a) => a.severity === "critical")) maxSeverity = "critical";
      else if (hourConflicts.some((c) => c.severity === "high") || hourCrossIntel.some((a) => a.severity === "high")) maxSeverity = "high";
      else if (hourConflicts.some((c) => c.severity === "medium")) maxSeverity = "medium";

      buckets.push({
        hour: hourLabel,
        hourIndex: 23 - h,
        conflicts: hourConflicts.length,
        events: hourEvents.length,
        disasters: hourDisasters.length,
        maxSeverity,
        marketAlerts: hourMarketAlerts.length,
        crossIntelCount: hourCrossIntel.length,
      });
    }

    return buckets;
  }, [gdeltEvents, conflicts, disasters, marketAnomalies, crossIntelAlerts]);

  // Market price mini-sparkline for key commodities
  const marketSummary = useMemo(() => {
    if (marketData.length === 0) return [];
    const keySymbols = ["CL=F", "GC=F", "^VIX", "LMT"];
    return marketData
      .filter((m) => keySymbols.includes(m.symbol))
      .map((m) => ({
        symbol: m.symbol,
        name: m.name.length > 12 ? m.name.substring(0, 12) : m.name,
        change: m.changePercent,
        volAnomaly: m.volumeAnomaly,
      }));
  }, [marketData]);

  const maxTotal = Math.max(
    1,
    ...timelineData.map((d) => {
      if (mode === "events") return d.conflicts + d.events + d.disasters;
      if (mode === "cross-intel") return d.marketAlerts + d.crossIntelCount;
      return d.conflicts + d.events + d.disasters + d.marketAlerts + d.crossIntelCount;
    })
  );

  return (
    <div className="space-y-1">
      {/* Header with mode toggle + market tickers */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-gray-600 uppercase tracking-wider">
            24H Timeline
          </span>
          <div className="flex gap-px">
            {(["combined", "events", "cross-intel"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`text-[7px] font-mono px-1.5 py-0.5 ${
                  mode === m
                    ? "text-military-green bg-military-green/10 border border-military-green/30"
                    : "text-gray-700 hover:text-gray-500"
                }`}
              >
                {m === "combined" ? "ALL" : m === "events" ? "GEO" : "MKT"}
              </button>
            ))}
          </div>
        </div>

        {/* Market tickers */}
        <div className="flex gap-2 text-[8px] font-mono">
          {marketSummary.map((m) => (
            <span
              key={m.symbol}
              className={
                m.change > 0
                  ? "text-green-500"
                  : m.change < 0
                  ? "text-red-400"
                  : "text-gray-600"
              }
            >
              {m.name}{" "}
              <span className="font-bold">
                {m.change > 0 ? "+" : ""}
                {m.change.toFixed(1)}%
              </span>
              {m.volAnomaly > 2 && (
                <span className="text-military-amber ml-0.5">
                  V{m.volAnomaly.toFixed(1)}x
                </span>
              )}
            </span>
          ))}

          {/* Legend */}
          <span className="text-gray-800 ml-1">|</span>
          {(mode === "events" || mode === "combined") && (
            <>
              <span><span className="inline-block w-1.5 h-1.5 bg-red-500 mr-0.5" />Conflict</span>
              <span><span className="inline-block w-1.5 h-1.5 bg-cyan-500 mr-0.5" />News</span>
            </>
          )}
          {(mode === "cross-intel" || mode === "combined") && (
            <>
              <span><span className="inline-block w-1.5 h-1.5 bg-military-amber mr-0.5" />Market</span>
              <span><span className="inline-block w-1.5 h-1.5 bg-purple-500 mr-0.5" />X-Intel</span>
            </>
          )}
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-px h-14">
        {timelineData.map((bucket, i) => {
          const geoTotal = bucket.conflicts + bucket.events + bucket.disasters;
          const mktTotal = bucket.marketAlerts + bucket.crossIntelCount;

          let displayTotal: number;
          if (mode === "events") displayTotal = geoTotal;
          else if (mode === "cross-intel") displayTotal = mktTotal;
          else displayTotal = geoTotal + mktTotal;

          const height = (displayTotal / maxTotal) * 100;

          // Determine if this bucket has a suspicious overlap (market + conflict in same hour)
          const hasOverlap = bucket.marketAlerts > 0 && bucket.conflicts > 0;
          const hasCrossIntel = bucket.crossIntelCount > 0;

          let barGradient: string;
          if (hasCrossIntel) {
            barGradient = `linear-gradient(to top, #9333ea88, #9333ea22)`; // purple for x-intel
          } else if (hasOverlap) {
            barGradient = `linear-gradient(to top, #ff333388, #ffb00088, #ffb00022)`; // red→amber gradient
          } else {
            const sevColor = SEVERITY_COLORS[(bucket.maxSeverity || "low") as GeoSeverity]?.fill ?? "#00cc00";
            barGradient = `linear-gradient(to top, ${sevColor}88, ${sevColor}22)`;
          }

          return (
            <div
              key={i}
              className="flex-1 flex flex-col justify-end group relative"
            >
              {/* Cross-intel marker on top */}
              {hasCrossIntel && (
                <div className="w-full h-0.5 bg-purple-500 animate-pulse mb-px" />
              )}

              <div
                className="w-full transition-all duration-300 hover:opacity-80"
                style={{
                  height: `${Math.max(2, height)}%`,
                  background: barGradient,
                }}
              />

              {/* Overlap indicator — suspicious! */}
              {hasOverlap && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-military-amber rounded-full animate-pulse" />
              )}

              {/* Tooltip */}
              {displayTotal > 0 && (
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block z-50">
                  <div className="bg-gray-900 border border-gray-700 px-2 py-1 text-[8px] font-mono text-gray-300 whitespace-nowrap space-y-0.5">
                    <div className="text-gray-500">{bucket.hour}:00</div>
                    {bucket.conflicts > 0 && <div className="text-red-400">{bucket.conflicts} conflicts</div>}
                    {bucket.events > 0 && <div className="text-cyan-400">{bucket.events} GDELT events</div>}
                    {bucket.disasters > 0 && <div className="text-yellow-400">{bucket.disasters} disasters</div>}
                    {bucket.marketAlerts > 0 && <div className="text-military-amber">{bucket.marketAlerts} market anomalies</div>}
                    {bucket.crossIntelCount > 0 && <div className="text-purple-400">{bucket.crossIntelCount} cross-intel alerts</div>}
                    {hasOverlap && (
                      <div className="text-military-amber font-bold border-t border-gray-700 pt-0.5 mt-0.5">
                        MARKET + CONFLICT OVERLAP
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Hour labels */}
      <div className="flex justify-between text-[7px] font-mono text-gray-800">
        <span>{timelineData[0]?.hour || "00"}</span>
        <span>{timelineData[6]?.hour || "06"}</span>
        <span>{timelineData[12]?.hour || "12"}</span>
        <span>{timelineData[18]?.hour || "18"}</span>
        <span>NOW</span>
      </div>
    </div>
  );
}
