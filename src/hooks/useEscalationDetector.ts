"use client";

/**
 * useEscalationDetector — Agentic hook that runs escalation detection
 * whenever new GDELT/ACLED data arrives.
 *
 * Subscribes to EventBus events (gdelt:updated, conflicts:updated)
 * and generates escalation alerts with reasoning. Alerts are pushed
 * to the store via addAlert().
 *
 * This is the agentic loop:
 *   Data arrives → EventBus notifies → detector runs → alerts created → UI updates
 *
 * Usage: just call useEscalationDetector() in any page component.
 * It's idempotent — multiple calls won't duplicate subscriptions.
 *
 * S-Agent — Agentic intelligence layer
 */

import { useEffect, useRef, useCallback } from "react";
import { useAppStore } from "@/store";
import { eventBus } from "@/lib/event-bus";
import { detectEscalations } from "@/lib/escalation-detector";
import type { EscalationAlert } from "@/lib/escalation-detector";
import type { GDELTEvent, ConflictEvent, Alert } from "@/types";

// Cooldown to prevent alert flooding (minimum 30s between detection runs)
const DETECTION_COOLDOWN_MS = 30_000;

export function useEscalationDetector() {
  const { gdeltEvents, conflicts, addAlert } = useAppStore();
  const lastRunRef = useRef<number>(0);
  const seenAlertIds = useRef<Set<string>>(new Set());

  const runDetection = useCallback(() => {
    const now = Date.now();

    // Cooldown check
    if (now - lastRunRef.current < DETECTION_COOLDOWN_MS) return;
    lastRunRef.current = now;

    // Don't run if no data
    if (gdeltEvents.length === 0 && conflicts.length === 0) return;

    const escalations = detectEscalations(gdeltEvents, conflicts);

    // Convert to store Alert format, deduplicating by pattern+region
    for (const esc of escalations) {
      const dedupeKey = `${esc.pattern}-${esc.region}`;
      if (seenAlertIds.current.has(dedupeKey)) continue;
      seenAlertIds.current.add(dedupeKey);

      const alert: Alert = {
        id: esc.id,
        type: mapPatternToAlertType(esc.pattern),
        severity: esc.severity,
        title: esc.title,
        message: esc.reasoning,
        timestamp: new Date(),
        acknowledged: false,
        source: "Escalation Detector",
        relatedEntityId: esc.eventIds[0] || undefined,
        location: getLocationFromEvents(esc.region, gdeltEvents, conflicts),
      };

      addAlert(alert);
    }
  }, [gdeltEvents, conflicts, addAlert]);

  // Subscribe to EventBus for real-time detection
  useEffect(() => {
    const unsub1 = eventBus.subscribe("gdelt:updated", () => {
      // Small delay to let store update
      setTimeout(runDetection, 500);
    });

    const unsub2 = eventBus.subscribe("conflicts:updated", () => {
      setTimeout(runDetection, 500);
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [runDetection]);

  // Also run on mount if data already exists
  useEffect(() => {
    if (gdeltEvents.length > 0 || conflicts.length > 0) {
      runDetection();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function mapPatternToAlertType(pattern: string): string {
  switch (pattern) {
    case "temporal_escalation": return "conflict_escalation";
    case "critical_mass": return "threshold_breach";
    case "cross_source_corroboration": return "intelligence_update";
    case "spillover_risk": return "regional_threat";
    case "anomalous_calm": return "anomaly_detected";
    default: return "intelligence_update";
  }
}

function getLocationFromEvents(
  country: string,
  gdeltEvents: GDELTEvent[],
  conflicts: ConflictEvent[],
): { lat: number; lon: number } | undefined {
  const gdelt = gdeltEvents.find((e) => e.country === country);
  if (gdelt) return { lat: gdelt.latitude, lon: gdelt.longitude };

  const conflict = conflicts.find((c) => c.country === country);
  if (conflict) return { lat: conflict.latitude, lon: conflict.longitude };

  return undefined;
}
