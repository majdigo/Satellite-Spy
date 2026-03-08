"use client";

import { useAppStore } from "@/store";
import { useMemo } from "react";
import { severityColor } from "@/lib/utils/helpers";

export default function TimelinePanel() {
  const { gdeltEvents, conflicts, disasters } = useAppStore();

  // Build timeline data bucketed by hour over the last 24h
  const timelineData = useMemo(() => {
    const now = Date.now();
    const buckets: Array<{
      hour: string;
      conflicts: number;
      events: number;
      disasters: number;
      maxSeverity: string;
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

      let maxSeverity = "low";
      if (hourConflicts.some((c) => c.severity === "critical")) maxSeverity = "critical";
      else if (hourConflicts.some((c) => c.severity === "high")) maxSeverity = "high";
      else if (hourConflicts.some((c) => c.severity === "medium")) maxSeverity = "medium";

      buckets.push({
        hour: hourLabel,
        conflicts: hourConflicts.length,
        events: hourEvents.length,
        disasters: hourDisasters.length,
        maxSeverity,
      });
    }

    return buckets;
  }, [gdeltEvents, conflicts, disasters]);

  const maxTotal = Math.max(
    1,
    ...timelineData.map((d) => d.conflicts + d.events + d.disasters)
  );

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-mono text-gray-600 uppercase tracking-wider">
          24H Event Timeline
        </span>
        <div className="flex gap-3 text-[8px] font-mono text-gray-700">
          <span>
            <span className="inline-block w-2 h-2 bg-red-500 mr-1" />
            Conflicts
          </span>
          <span>
            <span className="inline-block w-2 h-2 bg-cyan-500 mr-1" />
            Events
          </span>
          <span>
            <span className="inline-block w-2 h-2 bg-yellow-500 mr-1" />
            Disasters
          </span>
        </div>
      </div>

      <div className="flex items-end gap-px h-16">
        {timelineData.map((bucket, i) => {
          const total = bucket.conflicts + bucket.events + bucket.disasters;
          const height = (total / maxTotal) * 100;

          return (
            <div
              key={i}
              className="flex-1 flex flex-col justify-end group relative"
            >
              <div
                className="w-full transition-all duration-300 hover:opacity-80"
                style={{
                  height: `${Math.max(2, height)}%`,
                  background: `linear-gradient(to top, ${severityColor(
                    bucket.maxSeverity as "low" | "medium" | "high" | "critical"
                  )}88, ${severityColor(
                    bucket.maxSeverity as "low" | "medium" | "high" | "critical"
                  )}22)`,
                }}
              />
              {/* Tooltip */}
              {total > 0 && (
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block z-50">
                  <div className="bg-gray-900 border border-gray-700 px-2 py-1 text-[8px] font-mono text-gray-300 whitespace-nowrap">
                    {bucket.hour}:00 — {total} events
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
