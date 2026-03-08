"use client";

import { useAppStore } from "@/store";

export default function WatchRegionsPanel() {
  const {
    watchRegions,
    activeRegion,
    setActiveRegion,
    setFocusLocation,
    gdeltEvents,
    conflicts,
    disasters,
  } = useAppStore();

  const activateRegion = (regionId: string) => {
    const region = watchRegions.find((r) => r.id === regionId);
    if (!region) return;

    if (activeRegion?.id === regionId) {
      // Deactivate
      setActiveRegion(null);
    } else {
      setActiveRegion(region);
      setFocusLocation({
        lat: region.center.lat,
        lon: region.center.lon,
        zoom: region.zoom,
      });
    }
  };

  // Count events per region
  const getRegionStats = (region: typeof watchRegions[0]) => {
    const regionEvents = gdeltEvents.filter((e) =>
      region.countries.includes(e.country) ||
      region.watchKeywords.some((kw) =>
        e.title?.toLowerCase().includes(kw) ||
        e.location?.toLowerCase().includes(kw)
      )
    );
    const regionConflicts = conflicts.filter((c) =>
      region.countries.includes(c.country)
    );
    const regionDisasters = disasters.filter((d) =>
      region.countries.some((cc) => d.country.includes(cc))
    );
    const criticalCount = regionConflicts.filter((c) => c.severity === "critical").length;

    return {
      events: regionEvents.length,
      conflicts: regionConflicts.length,
      disasters: regionDisasters.length,
      critical: criticalCount,
    };
  };

  return (
    <div className="space-y-2">
      <div className="text-[10px] font-mono text-gray-600 uppercase tracking-wider">
        Watch Regions & Scenarios
      </div>

      {activeRegion && (
        <div className="border border-military-green/40 bg-military-green/5 p-2 mb-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-military-green font-bold">
              ACTIVE: {activeRegion.name}
            </span>
            <button
              onClick={() => setActiveRegion(null)}
              className="text-[9px] font-mono text-gray-600 hover:text-red-400"
            >
              [DEACTIVATE]
            </button>
          </div>
          <div className="text-[9px] font-mono text-gray-500 mt-1">
            Data feeds are filtered to this region. Keywords: {activeRegion.watchKeywords.slice(0, 5).join(", ")}...
          </div>
        </div>
      )}

      <div className="space-y-1">
        {watchRegions.map((region) => {
          const stats = getRegionStats(region);
          const isActive = activeRegion?.id === region.id;

          return (
            <button
              key={region.id}
              onClick={() => activateRegion(region.id)}
              className={`w-full text-left border p-2 transition-all ${
                isActive
                  ? "border-military-green/40 bg-military-green/5"
                  : "border-gray-800 hover:border-gray-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-mono ${
                    isActive ? "text-military-green" : "text-gray-300"
                  }`}
                >
                  {region.name}
                </span>
                {stats.critical > 0 && (
                  <span className="text-[8px] font-mono text-red-400 bg-red-950/50 px-1.5 py-0.5 animate-pulse">
                    {stats.critical} CRITICAL
                  </span>
                )}
              </div>
              <div className="text-[9px] font-mono text-gray-600 mt-0.5">
                {region.description}
              </div>
              <div className="flex gap-3 mt-1 text-[8px] font-mono">
                <span className="text-cyan-400/60">
                  {stats.events} events
                </span>
                <span className="text-red-400/60">
                  {stats.conflicts} conflicts
                </span>
                <span className="text-yellow-400/60">
                  {stats.disasters} disasters
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
