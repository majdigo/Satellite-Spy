"use client";

import { useAppStore } from "@/store";
import { useState, useEffect, useCallback } from "react";

export default function CriticalAlertBanner() {
  const { crossIntelAlerts, alerts } = useAppStore();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [flashState, setFlashState] = useState(false);

  // Find critical unacknowledged alerts
  const criticalCrossIntel = crossIntelAlerts.filter(
    (a) =>
      a.severity === "critical" &&
      (a.suspicionLevel === "high" || a.suspicionLevel === "very_high") &&
      !dismissed.has(a.id)
  );

  const criticalSystemAlerts = alerts.filter(
    (a) =>
      !a.acknowledged &&
      a.severity === "critical" &&
      a.source === "Cross-Intelligence Engine" &&
      !dismissed.has(a.id)
  );

  const hasCritical = criticalCrossIntel.length > 0 || criticalSystemAlerts.length > 0;
  const topAlert = criticalCrossIntel[0];

  // Flash effect for critical alerts
  useEffect(() => {
    if (!hasCritical) return;
    const interval = setInterval(() => setFlashState((p) => !p), 800);
    return () => clearInterval(interval);
  }, [hasCritical]);

  const dismissAll = useCallback(() => {
    const newDismissed = new Set(dismissed);
    for (const a of criticalCrossIntel) newDismissed.add(a.id);
    for (const a of criticalSystemAlerts) newDismissed.add(a.id);
    setDismissed(newDismissed);
  }, [dismissed, criticalCrossIntel, criticalSystemAlerts]);

  if (!hasCritical || !topAlert) return null;

  return (
    <div className="fixed top-14 left-10 right-0 z-40 pointer-events-auto">
      <div
        className={`border-b-2 transition-colors duration-300 ${
          flashState
            ? "bg-red-950/95 border-red-500"
            : "bg-red-950/80 border-red-700"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-2">
          {/* Left: Alert icon + count */}
          <div className="flex items-center gap-3">
            <div className={`text-lg ${flashState ? "text-red-400" : "text-red-600"}`}>
              {flashState ? "!" : "!"}
            </div>
            <div>
              <div className="text-[10px] font-mono text-red-400 font-bold tracking-wider">
                CRITICAL CROSS-INTELLIGENCE ALERT
                {criticalCrossIntel.length > 1 && (
                  <span className="ml-2 text-red-500">
                    (+{criticalCrossIntel.length - 1} more)
                  </span>
                )}
              </div>
              <div className="text-[11px] font-mono text-red-300 mt-0.5">
                {topAlert.title}
              </div>
            </div>
          </div>

          {/* Center: Summary */}
          <div className="flex-1 mx-6 max-w-2xl">
            <div className="text-[9px] font-mono text-red-200/80 truncate">
              {topAlert.summary}
            </div>
            <div className="flex gap-3 mt-0.5">
              {topAlert.marketImpact && (
                <span className="text-[8px] font-mono text-military-amber">
                  MARKET: {topAlert.marketImpact.direction.toUpperCase()} {topAlert.marketImpact.magnitude.toUpperCase()} — {topAlert.marketImpact.symbols.slice(0, 3).join(", ")}
                </span>
              )}
              <span className="text-[8px] font-mono text-red-400">
                SUSPICION: {topAlert.suspicionLevel.toUpperCase()}
              </span>
              <span className="text-[8px] font-mono text-gray-500">
                CONFIDENCE: {topAlert.confidence}%
              </span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={dismissAll}
              className="text-[9px] font-mono text-red-300 border border-red-700 px-2 py-1 hover:bg-red-900/50 transition-colors"
            >
              ACKNOWLEDGE
            </button>
          </div>
        </div>

        {/* Animated scan line */}
        <div className="h-0.5 bg-gradient-to-r from-transparent via-red-500/50 to-transparent animate-scan-line" />
      </div>
    </div>
  );
}
