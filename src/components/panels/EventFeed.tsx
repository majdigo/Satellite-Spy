"use client";

import { useAppStore } from "@/store";
import { getTimeAgo, truncate, severityBgClass } from "@/lib/utils/helpers";
import { useState } from "react";

type FeedTab = "all" | "conflicts" | "geopolitical" | "disasters";

export default function EventFeed() {
  const { gdeltEvents, conflicts, disasters, setFocusLocation } = useAppStore();
  const [activeTab, setActiveTab] = useState<FeedTab>("all");

  const tabs: { id: FeedTab; label: string; count: number }[] = [
    {
      id: "all",
      label: "ALL",
      count: gdeltEvents.length + conflicts.length + disasters.length,
    },
    { id: "conflicts", label: "CONFLICTS", count: conflicts.length },
    { id: "geopolitical", label: "GEO", count: gdeltEvents.length },
    { id: "disasters", label: "DISASTERS", count: disasters.length },
  ];

  // Merge and sort all events by time
  const allEvents = (() => {
    const items: Array<{
      id: string;
      type: string;
      title: string;
      location: string;
      lat: number;
      lon: number;
      time: string;
      severity: string;
      detail: string;
    }> = [];

    if (activeTab === "all" || activeTab === "conflicts") {
      conflicts.forEach((c) =>
        items.push({
          id: `conf-${c.id}`,
          type: "conflict",
          title: `${c.eventType.replace(/_/g, " ").toUpperCase()}`,
          location: `${c.location}, ${c.country}`,
          lat: c.latitude,
          lon: c.longitude,
          time: c.date,
          severity: c.severity,
          detail: c.fatalities > 0 ? `${c.fatalities} fatalities` : c.subEventType,
        })
      );
    }

    if (activeTab === "all" || activeTab === "geopolitical") {
      gdeltEvents.slice(0, 100).forEach((e) =>
        items.push({
          id: `geo-${e.globalEventId}`,
          type: "geopolitical",
          title: truncate(e.title, 60),
          location: e.location || e.country,
          lat: e.latitude,
          lon: e.longitude,
          time: e.dateAdded,
          severity:
            e.quadClass === "material_conflict"
              ? "critical"
              : e.quadClass === "verbal_conflict"
              ? "high"
              : "low",
          detail: `Tone: ${e.avgTone.toFixed(1)} | ${e.numMentions} mentions`,
        })
      );
    }

    if (activeTab === "all" || activeTab === "disasters") {
      disasters.forEach((d) =>
        items.push({
          id: `dis-${d.id}`,
          type: "disaster",
          title: d.title,
          location: `${d.country}`,
          lat: d.latitude,
          lon: d.longitude,
          time: d.date,
          severity: d.severity,
          detail: d.description,
        })
      );
    }

    return items
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 100);
  })();

  const typeIcon: Record<string, string> = {
    conflict: "⚔",
    geopolitical: "🌐",
    disaster: "⚠",
  };

  return (
    <div className="space-y-2">
      {/* Tabs */}
      <div className="flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 text-[10px] font-mono py-1 border transition-all ${
              activeTab === tab.id
                ? "border-military-green/40 text-military-green bg-military-green/5"
                : "border-gray-800 text-gray-600 hover:text-gray-400"
            }`}
          >
            {tab.label}
            <span className="ml-1 text-gray-600">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Event list */}
      <div className="space-y-1 max-h-80 overflow-y-auto scrollbar-thin">
        {allEvents.map((event) => (
          <button
            key={event.id}
            onClick={() =>
              setFocusLocation({ lat: event.lat, lon: event.lon, zoom: 500 })
            }
            className="w-full text-left px-2 py-1.5 border border-transparent hover:border-gray-800 transition-all group"
          >
            <div className="flex items-start gap-2">
              <span className="text-sm mt-0.5">{typeIcon[event.type] || "●"}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span
                    className={`w-1.5 h-1.5 rounded-full inline-block ${severityBgClass(
                      event.severity as "low" | "medium" | "high" | "critical"
                    )}`}
                  />
                  <span className="text-[10px] font-mono text-gray-300 truncate">
                    {event.title}
                  </span>
                </div>
                <div className="text-[9px] font-mono text-gray-600 flex justify-between mt-0.5">
                  <span className="truncate">{event.location}</span>
                  <span className="ml-2 shrink-0">{getTimeAgo(event.time)}</span>
                </div>
                <div className="text-[9px] font-mono text-gray-700 mt-0.5 group-hover:text-gray-500 transition-colors">
                  {event.detail}
                </div>
              </div>
            </div>
          </button>
        ))}

        {allEvents.length === 0 && (
          <div className="text-center text-[10px] font-mono text-gray-700 py-8">
            AWAITING DATA FEED...
          </div>
        )}
      </div>
    </div>
  );
}
