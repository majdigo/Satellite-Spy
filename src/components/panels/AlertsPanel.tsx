"use client";

import { useAppStore } from "@/store";
import { severityBgClass, getTimeAgo } from "@/lib/utils/helpers";

export default function AlertsPanel() {
  const { alerts, acknowledgeAlert, clearAlerts, setFocusLocation } = useAppStore();

  const unacked = alerts.filter((a) => !a.acknowledged);
  const acked = alerts.filter((a) => a.acknowledged);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-mono text-gray-600 uppercase tracking-wider">
          Alerts ({unacked.length} unread)
        </div>
        {alerts.length > 0 && (
          <button
            onClick={clearAlerts}
            className="text-[9px] font-mono text-gray-700 hover:text-red-400 transition-colors"
          >
            CLEAR ALL
          </button>
        )}
      </div>

      <div className="space-y-1 max-h-80 overflow-y-auto">
        {unacked.length === 0 && acked.length === 0 && (
          <div className="text-center text-[10px] font-mono text-gray-700 py-8">
            NO ACTIVE ALERTS
          </div>
        )}

        {unacked.map((alert) => (
          <div
            key={alert.id}
            className={`border p-2 cursor-pointer transition-all ${
              alert.severity === "critical"
                ? "border-red-600/50 bg-red-950/30 animate-pulse-glow"
                : alert.severity === "high"
                ? "border-orange-500/40 bg-orange-950/20"
                : "border-yellow-500/30 bg-yellow-950/10"
            }`}
            onClick={() => {
              acknowledgeAlert(alert.id);
              if (alert.location) {
                setFocusLocation({
                  lat: alert.location.lat,
                  lon: alert.location.lon,
                  zoom: 500,
                });
              }
            }}
          >
            <div className="flex items-start gap-2">
              <span
                className={`w-2 h-2 rounded-full mt-1 shrink-0 ${severityBgClass(alert.severity)} ${
                  alert.severity === "critical" ? "animate-pulse" : ""
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-mono text-gray-200 font-bold">
                  {alert.title}
                </div>
                <div className="text-[9px] font-mono text-gray-500 mt-0.5">
                  {alert.message}
                </div>
                <div className="text-[8px] font-mono text-gray-700 mt-1 flex justify-between">
                  <span>{alert.source}</span>
                  <span>{getTimeAgo(alert.timestamp)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {acked.length > 0 && (
          <>
            <div className="text-[9px] font-mono text-gray-700 mt-2 mb-1 uppercase">
              Acknowledged
            </div>
            {acked.slice(0, 10).map((alert) => (
              <div
                key={alert.id}
                className="border border-gray-900 p-1.5 opacity-50"
              >
                <div className="text-[9px] font-mono text-gray-600">
                  {alert.title}
                </div>
                <div className="text-[8px] font-mono text-gray-800">
                  {getTimeAgo(alert.timestamp)}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
