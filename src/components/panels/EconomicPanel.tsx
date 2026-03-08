"use client";

import { useAppStore } from "@/store";
import { useMemo } from "react";

export default function EconomicPanel() {
  const { economicData } = useAppStore();

  const grouped = useMemo(() => {
    const map = new Map<string, typeof economicData>();
    for (const item of economicData) {
      if (!map.has(item.country)) map.set(item.country, []);
      map.get(item.country)!.push(item);
    }
    return Array.from(map.entries()).slice(0, 10);
  }, [economicData]);

  const trendArrow = { up: "▲", down: "▼", stable: "━" };
  const trendColor = {
    up: "text-green-400",
    down: "text-red-400",
    stable: "text-gray-400",
  };

  return (
    <div className="space-y-2">
      <div className="text-[10px] font-mono text-gray-600 uppercase tracking-wider">
        Economic Indicators Monitor
      </div>

      {grouped.length === 0 ? (
        <div className="text-center text-[10px] font-mono text-gray-700 py-8">
          LOADING ECONOMIC DATA...
        </div>
      ) : (
        <div className="space-y-1 max-h-72 overflow-y-auto scrollbar-thin">
          {grouped.map(([country, indicators]) => (
            <div
              key={country}
              className="border border-gray-800 p-2 hover:border-gray-700 transition-all"
            >
              <div className="text-xs font-mono text-gray-300 mb-1">
                {country}
              </div>
              <div className="grid grid-cols-3 gap-1">
                {indicators.slice(0, 3).map((ind) => {
                  // For inflation, up = bad, so invert color logic
                  const isNegativeIndicator =
                    ind.indicator === "inflation" || ind.indicator === "unemployment" || ind.indicator === "debt_to_gdp";
                  const displayTrendColor = isNegativeIndicator
                    ? ind.trend === "up"
                      ? "text-red-400"
                      : ind.trend === "down"
                      ? "text-green-400"
                      : "text-gray-400"
                    : trendColor[ind.trend];

                  return (
                    <div key={ind.indicator} className="text-center">
                      <div className="text-[8px] text-gray-600 uppercase">
                        {ind.indicator.replace(/_/g, " ").slice(0, 8)}
                      </div>
                      <div className={`text-xs font-mono ${displayTrendColor}`}>
                        {ind.value.toFixed(1)}%
                        <span className="ml-0.5">{trendArrow[ind.trend]}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
