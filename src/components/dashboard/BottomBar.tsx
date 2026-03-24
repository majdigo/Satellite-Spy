"use client";

import { useAppStore } from "@/store";
import TimelinePanel from "@/components/panels/TimelinePanel";

const STALE_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes

function timeAgo(date: Date | null): string {
  if (!date) return "never";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h${minutes % 60}m`;
}

export default function BottomBar() {
  const dataSources = useAppStore((s) => s.dataSources);
  const alerts = useAppStore((s) => s.alerts);
  const unacked = alerts.filter((a) => !a.acknowledged).length;

  const activeCount = dataSources.filter((d) => d.status === "success").length;
  const errorCount = dataSources.filter((d) => d.status === "error").length;
  const loadingCount = dataSources.filter((d) => d.status === "loading").length;
  const staleCount = dataSources.filter(
    (d) => d.lastUpdated && Date.now() - d.lastUpdated.getTime() > STALE_THRESHOLD_MS
  ).length;

  return (
    <div className="fixed bottom-0 left-10 right-0 bg-military-dark/95 border-t border-gray-800 z-30">
      {/* Timeline */}
      <div className="h-20 px-4 py-1">
        <TimelinePanel />
      </div>
      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-1 text-[10px] font-mono text-gray-500 border-t border-gray-800/50">
        <div className="flex gap-3">
          <span>
            <span className="text-green-500">●</span> {activeCount} feeds
          </span>
          {loadingCount > 0 && (
            <span>
              <span className="text-blue-400 animate-pulse">●</span> {loadingCount} loading
            </span>
          )}
          {errorCount > 0 && (
            <span>
              <span className="text-red-500">●</span> {errorCount} errors
            </span>
          )}
          {staleCount > 0 && (
            <span className="text-amber-500">
              ⚠ {staleCount} stale (&gt;15m)
            </span>
          )}
          <span>
            <span className="text-yellow-500">▲</span> {unacked} alerts
          </span>
          <span className="text-gray-600">|</span>
          {/* Per-source mini status */}
          {dataSources.map((ds) => {
            const isStale = ds.lastUpdated && Date.now() - ds.lastUpdated.getTime() > STALE_THRESHOLD_MS;
            const color = ds.status === "error" ? "text-red-500"
              : ds.status === "loading" ? "text-blue-400"
              : isStale ? "text-amber-500"
              : ds.status === "success" ? "text-green-600"
              : "text-gray-600";
            return (
              <span key={ds.source} className={color} title={`${ds.source}: ${ds.count} items, updated ${timeAgo(ds.lastUpdated)} ago`}>
                {ds.source.slice(0, 4)}:{ds.count > 0 ? ds.count : "—"}
              </span>
            );
          })}
        </div>
        <span className="text-gray-600">SATELLITE SPY — LIVE OSINT</span>
      </div>
    </div>
  );
}
