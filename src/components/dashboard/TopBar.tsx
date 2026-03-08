"use client";

import { useAppStore } from "@/store";
import { useState, useEffect } from "react";
import VisualFilters from "@/components/filters/VisualFilters";

export default function TopBar() {
  const {
    satellites,
    aircraft,
    gdeltEvents,
    conflicts,
    disasters,
    alerts,
    activeRegion,
    searchQuery,
    setSearchQuery,
    searchResultCount,
    setSearchResultCount,
    setFocusLocation,
    setHighlightedEntityId,
  } = useAppStore();

  const [clock, setClock] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setClock(now.toISOString().replace("T", " ").substring(0, 19) + "Z");
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResultCount(null);
      return;
    }

    const q = searchQuery.toLowerCase();
    let found = false;

    const sat = satellites.find((s) => s.name.toLowerCase().includes(q));
    if (sat) {
      setFocusLocation({ lat: sat.latitude, lon: sat.longitude, zoom: sat.altitude + 200 });
      setHighlightedEntityId(`sat-${sat.id}`);
      setSearchResultCount(satellites.filter((s) => s.name.toLowerCase().includes(q)).length);
      found = true;
    }

    if (!found) {
      const event = gdeltEvents.find(
        (e) => e.title?.toLowerCase().includes(q) || e.location?.toLowerCase().includes(q) || e.country?.toLowerCase().includes(q)
      );
      if (event) {
        setFocusLocation({ lat: event.latitude, lon: event.longitude, zoom: 500 });
        setSearchResultCount(gdeltEvents.filter((e) => e.title?.toLowerCase().includes(q) || e.location?.toLowerCase().includes(q)).length);
        found = true;
      }
    }

    if (!found) {
      const conflict = conflicts.find(
        (c) => c.location.toLowerCase().includes(q) || c.country.toLowerCase().includes(q) || c.actors.some((a) => a.toLowerCase().includes(q))
      );
      if (conflict) {
        setFocusLocation({ lat: conflict.latitude, lon: conflict.longitude, zoom: 500 });
        setSearchResultCount(conflicts.filter((c) => c.location.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)).length);
        found = true;
      }
    }

    if (!found) {
      const disaster = disasters.find((d) => d.title.toLowerCase().includes(q) || d.country.toLowerCase().includes(q));
      if (disaster) {
        setFocusLocation({ lat: disaster.latitude, lon: disaster.longitude, zoom: 500 });
        setSearchResultCount(1);
        found = true;
      }
    }

    if (!found) setSearchResultCount(0);
  };

  const unackedAlerts = alerts.filter((a) => !a.acknowledged).length;

  return (
    <div className="fixed top-0 left-0 right-0 h-14 bg-military-dark/95 border-b border-gray-800 z-40 flex items-center px-4 gap-4">
      {/* Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-8 h-8 border border-military-green/50 flex items-center justify-center">
          <span className="text-military-green text-lg font-mono">*</span>
        </div>
        <div>
          <div className="text-sm font-mono font-bold text-military-green tracking-wider">SATELLITE SPY</div>
          <div className="text-[8px] font-mono text-gray-600 uppercase">
            {activeRegion ? `WATCHING: ${activeRegion.name}` : "Spatial Intelligence Dashboard"}
          </div>
        </div>
      </div>

      {/* Status indicators */}
      <div className="hidden md:flex items-center gap-3 text-[10px] font-mono">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-glow" />
          <span className="text-gray-500">SAT</span>
          <span className="text-military-green">{satellites.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse-glow" />
          <span className="text-gray-500">AIR</span>
          <span className="text-blue-400">{aircraft.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${conflicts.length > 0 ? "bg-red-500 animate-pulse-glow" : "bg-gray-600"}`} />
          <span className="text-gray-500">CONF</span>
          <span className="text-red-400">{conflicts.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span className="text-gray-500">EVT</span>
          <span className="text-cyan-400">{gdeltEvents.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
          <span className="text-gray-500">DIS</span>
          <span className="text-yellow-400">{disasters.length}</span>
        </div>
        {unackedAlerts > 0 && (
          <div className="flex items-center gap-1 ml-1 px-1.5 py-0.5 bg-red-950/50 border border-red-600/30 animate-pulse">
            <span className="text-red-400 font-bold">{unackedAlerts} ALERT{unackedAlerts > 1 ? "S" : ""}</span>
          </div>
        )}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-xs">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); if (!e.target.value) setSearchResultCount(null); }}
            placeholder="Search satellite, location, event..."
            className="w-full bg-transparent border border-gray-800 focus:border-military-green/50 text-xs font-mono text-gray-300 px-3 py-1.5 outline-none placeholder-gray-700 transition-colors"
          />
          {searchResultCount !== null && (
            <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono ${searchResultCount === 0 ? "text-red-400" : "text-military-green"}`}>
              {searchResultCount === 0 ? "NO MATCH" : `${searchResultCount} found`}
            </span>
          )}
        </div>
      </form>

      {/* Visual Filters */}
      <div className="hidden lg:block"><VisualFilters /></div>

      {/* Clock */}
      <div className="shrink-0 text-right">
        <div className="text-xs font-mono text-military-green">{clock}</div>
        <div className="text-[8px] font-mono text-gray-600">UTC</div>
      </div>
    </div>
  );
}
