/**
 * Satellite-Spy EventBus — Lightweight in-process publish/subscribe
 * 
 * Compatible with @platform/event-bus pattern (Quest XR).
 * Currently in-process only. Future: WebSocket bridge for cross-project events.
 * 
 * Usage:
 *   eventBus.publish("market:updated", marketData);
 *   const unsub = eventBus.subscribe("market:updated", (data) => { ... });
 *   unsub(); // cleanup
 */

// Event type definitions for type-safe publish/subscribe
export interface EventMap {
  // Data feed events
  "market:updated": { market: import("@/types").MarketData[]; count: number; timestamp: string };
  "satellites:updated": { positions: import("@/types").SatellitePosition[]; count: number };
  "aircraft:updated": { aircraft: import("@/types").AircraftPosition[]; count: number };
  "conflicts:updated": { conflicts: import("@/types").ConflictEvent[]; count: number };
  "gdelt:updated": { events: import("@/types").GDELTEvent[]; count: number };
  "disasters:updated": { disasters: import("@/types").NaturalDisaster[]; count: number };
  "economic:updated": { indicators: import("@/types").EconomicIndicator[]; count: number };
  // Analysis events
  "analysis:crossintel": { alerts: import("@/types").CrossIntelligenceAlert[] };
  "analysis:anomalies": { anomalies: import("@/types").MarketAnomaly[] };
  // System events
  "system:error": { source: string; error: string };
  "system:datasource": { name: string; status: string; count?: number };
}

export type EventName = keyof EventMap;
type EventHandler<T> = (data: T) => void;

interface Subscription {
  event: EventName;
  handler: EventHandler<unknown>;
  id: number;
}

class EventBus {
  private subscriptions: Map<EventName, Subscription[]> = new Map();
  private nextId = 0;
  private history: Map<EventName, { data: unknown; timestamp: number }> = new Map();

  /**
   * Publish an event to all subscribers
   */
  publish<E extends EventName>(event: E, data: EventMap[E]): void {
    // Store last event for late subscribers (replay-1)
    this.history.set(event, { data, timestamp: Date.now() });

    const subs = this.subscriptions.get(event);
    if (!subs || subs.length === 0) return;

    for (const sub of subs) {
      try {
        sub.handler(data);
      } catch (err) {
        console.error(`[EventBus] Error in handler for "${event}":`, err);
      }
    }
  }

  /**
   * Subscribe to an event. Returns an unsubscribe function.
   */
  subscribe<E extends EventName>(
    event: E,
    handler: EventHandler<EventMap[E]>,
    options?: { replay?: boolean }
  ): () => void {
    const id = this.nextId++;
    const sub: Subscription = {
      event,
      handler: handler as EventHandler<unknown>,
      id,
    };

    if (!this.subscriptions.has(event)) {
      this.subscriptions.set(event, []);
    }
    this.subscriptions.get(event)!.push(sub);

    // Replay last event if requested (useful for late-mounting components)
    if (options?.replay) {
      const last = this.history.get(event);
      if (last) {
        try {
          handler(last.data as EventMap[E]);
        } catch (err) {
          console.error(`[EventBus] Error in replay handler for "${event}":`, err);
        }
      }
    }

    // Return unsubscribe function
    return () => {
      const subs = this.subscriptions.get(event);
      if (subs) {
        const idx = subs.findIndex((s) => s.id === id);
        if (idx !== -1) subs.splice(idx, 1);
      }
    };
  }

  /**
   * Get the last published data for an event (if any)
   */
  getLastEvent<E extends EventName>(event: E): EventMap[E] | undefined {
    const entry = this.history.get(event);
    return entry ? (entry.data as EventMap[E]) : undefined;
  }

  /**
   * Get count of subscribers for an event
   */
  subscriberCount(event: EventName): number {
    return this.subscriptions.get(event)?.length ?? 0;
  }

  /**
   * Clear all subscriptions (for testing/cleanup)
   */
  clear(): void {
    this.subscriptions.clear();
    this.history.clear();
    this.nextId = 0;
  }
}

// Singleton instance
export const eventBus = new EventBus();
export default eventBus;
