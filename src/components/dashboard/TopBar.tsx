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
    searchQuery,
    setSearchQuery,
    setFocusLocation,
  } = useAppStore();

  const [clock, setClock] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setClock(
        now.toISOString().replace("T", " ").substring(0, 19) + "Z"
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Simple geocoding - search in satellites, events
    const sat = satellites.find((s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (sat) {
      setFocusLocation({
        lat: sat.latitude,
        lon: sat.longitude,
        zoom: sat.altitude + 200,
      });
      return;
    }

    const event = gdeltEvents.find(
      (e) =>
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.location.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (event) {
      setFocusLocation({ lat: event.latitude, lon: event.longitude, zoom: 500 });
      return;
    }

    const conflict = conflicts.find(
      (c) =>
        c.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.country.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (conflict) {
      setFocusLocation({
        lat: conflict.latitude,
        lon: conflict.longitude,
        zoom: 500,
      });
    }
  };

  const conflictCount = gdeltEvents.filter(
    (e) => e.quadClass === "material_conflict"
  ).length;

  return (
    <div className="fixed top-0 left-0 right-0 h-14 bg-military-dark/95 border-b border-gray-800 z-40 flex items-center px-4 gap-4">
      {/* Logo / Title */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-8 h-8 border border-military-green/50 flex items-center justify-center">
          <span className="text-military-green text-lg">◉</span>
        </div>
        <div>
          <div className="text-sm font-mono font-bold text-military-green tracking-wider">
            SATELLITE SPY
          </div>
          <div className="text-[8px] font-mono text-gray-600 uppercase">
            Spatial Intelligence Dashboard
          </div>
        </div>
      </div>

      {/* Status indicators */}
      <div className="hidden md:flex items-center gap-4 text-[10px] font-mono">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-glow" />
          <span className="text-gray-500">SAT</span>
          <span className="text-military-green">{satellites.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse-glow" />
          <span className="text-gray-500">AIR</span>
          <span className="text-military-blue">{aircraft.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${conflictCount > 0 ? "bg-red-500 animate-pulse-glow" : "bg-gray-600"}`} />
          <span className="text-gray-500">ALERT</span>
          <span className="text-red-400">{conflictCount}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span className="text-gray-500">EVT</span>
          <span className="text-cyan-400">{gdeltEvents.length}</span>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-xs">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search satellite, location, event..."
            className="w-full bg-transparent border border-gray-800 focus:border-military-green/50 text-xs font-mono text-gray-300 px-3 py-1.5 outline-none placeholder-gray-700 transition-colors"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-700 text-xs">
            ⌕
          </span>
        </div>
      </form>

      {/* Visual Filters */}
      <div className="hidden lg:block">
        <VisualFilters />
      </div>

      {/* Clock */}
      <div className="shrink-0 text-right">
        <div className="text-xs font-mono text-military-green">{clock}</div>
        <div className="text-[8px] font-mono text-gray-600">UTC</div>
      </div>
    </div>
  );
}
