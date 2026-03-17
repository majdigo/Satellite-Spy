"use client";

import { useAppStore } from "@/store";
import TimelinePanel from "@/components/panels/TimelinePanel";

export default function BottomBar() {
  const dataSources = useAppStore((s) => s.dataSources);
  const alerts = useAppStore((s) => s.alerts);
  const unacked = alerts.filter((a) => !a.acknowledged).length;

  const activeCount = dataSources.filter((d) => d.status === "success").length;
  const errorCount = dataSources.filter((d) => d.status === "error").length;

  return (
    <div className="fixed bottom-0 left-10 right-0 bg-military-dark/95 border-t border-gray-800 z-30">
      {/* Timeline */}
      <div className="h-20 px-4 py-1">
        <TimelinePanel />
      </div>
      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-1 text-[10px] font-mono text-gray-500 border-t border-gray-800/50">
        <div className="flex gap-4">
          <span>
            <span className="text-green-500">●</span> {activeCount} feeds
          </span>
          {errorCount > 0 && (
            <span>
              <span className="text-red-500">●</span> {errorCount} errors
            </span>
          )}
          <span>
            <span className="text-yellow-500">▲</span> {unacked} alerts
          </span>
        </div>
        <span className="text-gray-600">SATELLITE SPY — OSINT PLATFORM</span>
      </div>
    </div>
  );
}
