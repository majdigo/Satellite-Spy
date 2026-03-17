"use client";

/**
 * useEventBus — React hook for consuming EventBus events
 * 
 * Usage:
 *   const { market } = useEventBus("market:updated");
 *   // market = latest market data, auto-updates on each publish
 * 
 *   useEventBus("system:error", (data) => {
 *     toast.error(`${data.source}: ${data.error}`);
 *   });
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { eventBus } from "@/lib/event-bus";
import type { EventMap } from "@/lib/event-bus";

/**
 * Subscribe to an EventBus event and get the latest data as React state.
 * Optionally provide a callback for side effects.
 * 
 * @param eventName - The event to subscribe to
 * @param onEvent - Optional callback invoked on each event
 * @returns The latest event data (or null if no event received yet)
 */
export function useEventBus<E extends keyof EventMap>(
  eventName: E,
  onEvent?: (data: EventMap[E]) => void
): EventMap[E] | null {
  const [data, setData] = useState<EventMap[E] | null>(() => {
    // Initialize with replay value if available
    return eventBus.getLastEvent(eventName) || null;
  });

  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    const unsubscribe = eventBus.subscribe(eventName, (eventData) => {
      setData(eventData);
      onEventRef.current?.(eventData);
    });

    return unsubscribe;
  }, [eventName]);

  return data;
}

/**
 * Subscribe to multiple EventBus events at once.
 * Returns a record of latest data per event name.
 * 
 * Usage:
 *   const data = useEventBusMulti(["market:updated", "conflicts:updated"]);
 *   // data["market:updated"] = latest market data
 *   // data["conflicts:updated"] = latest conflict data
 */
export function useEventBusMulti<E extends keyof EventMap>(
  eventNames: E[]
): Partial<Record<E, EventMap[E]>> {
  const [data, setData] = useState<Partial<Record<E, EventMap[E]>>>(() => {
    const initial: Partial<Record<E, EventMap[E]>> = {};
    for (const name of eventNames) {
      const last = eventBus.getLastEvent(name);
      if (last) initial[name] = last;
    }
    return initial;
  });

  // Use ref for stable eventNames reference
  const eventNamesRef = useRef(eventNames);
  eventNamesRef.current = eventNames;

  useEffect(() => {
    const unsubscribes = eventNames.map((name) =>
      eventBus.subscribe(name, (eventData) => {
        setData((prev) => ({ ...prev, [name]: eventData }));
      })
    );

    return () => {
      for (const unsub of unsubscribes) unsub();
    };
  }, [eventNames.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  return data;
}

/**
 * Publish an event from a React component.
 * Returns a stable publish function.
 */
export function useEventBusPublish() {
  return useCallback(
    <E extends keyof EventMap>(eventName: E, data: EventMap[E]) => {
      eventBus.publish(eventName, data);
    },
    []
  );
}
