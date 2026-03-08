"use client";

import { useAppStore } from "@/store";
import { getTimeAgo } from "@/lib/utils/helpers";

export default function DataStatusPanel() {
  const { dataSources } = useAppStore();

  const statusIcon = {
    idle: "○",
    loading: "◌",
    success: "●",
    error: "✕",
  };

  const statusColor = {
    idle: "text-gray-600",
    loading: "text-yellow-400 animate-pulse",
    success: "text-green-400",
    error: "text-red-400",
  };

  return (
    <div className="space-y-2">
      <div className="text-[10px] font-mono text-gray-600 uppercase tracking-wider">
        Data Source Status
      </div>

      <div className="space-y-1">
        {dataSources.map((ds) => (
          <div
            key={ds.source}
            className="flex items-center gap-2 px-2 py-1.5 border border-gray-900"
          >
            <span className={`text-xs ${statusColor[ds.status]}`}>
              {statusIcon[ds.status]}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-gray-400">
                  {ds.source}
                </span>
                <span className="text-[9px] font-mono text-gray-600">
                  {ds.count > 0 ? `${ds.count} items` : "—"}
                </span>
              </div>
              {ds.lastUpdated && (
                <div className="text-[8px] font-mono text-gray-700">
                  Updated {getTimeAgo(ds.lastUpdated)}
                </div>
              )}
              {ds.error && (
                <div className="text-[8px] font-mono text-red-400/60 truncate">
                  {ds.error}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
