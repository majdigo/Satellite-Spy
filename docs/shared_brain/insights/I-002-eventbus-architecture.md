# I-002 — EventBus Architecture Decision

**Date** : 2026-03-17  
**Project** : Satellite-Spy  
**Impact** : All Madgic projects (cross-project data sharing foundation)

---

## Decision

Implemented an in-process, type-safe EventBus (`src/lib/event-bus/index.ts`, 130 LOC) as the foundation for cross-project real-time data sharing.

## Why Not Replace Zustand?

Zustand remains the **UI state manager**. The EventBus sits alongside it as a **data distribution layer**:

```
API fetch → Zustand set() (UI rendering)
         → EventBus publish() (cross-project distribution)
```

Both are called from `useDataFetcher.ts`. This dual-write pattern avoids breaking the 18 React components that read from Zustand, while enabling external consumers to subscribe.

## 11 Event Types

| Event | Trigger | Interval |
|-------|---------|----------|
| `satellites:updated` | CelesTrak fetch | 1h (TLE) / 5s (propagation) |
| `aircraft:updated` | OpenSky fetch | 15s |
| `gdelt:updated` | GDELT fetch | 5min |
| `conflicts:updated` | ACLED fetch | 10min |
| `disasters:updated` | USGS fetch | 15min |
| `economic:updated` | WorldBank fetch | 15min |
| `market:updated` | Market fetch | 1min |
| `analysis:crossintel` | Analysis cycle | 2min |
| `analysis:anomalies` | Analysis cycle | 2min |
| `system:error` | Any fetch failure | On error |
| `system:datasource` | DataSource change | On change |

## Features

- **Type-safe** : `EventMap` interface enforces data shapes per event
- **Replay-1** : Late subscribers get the last emitted value
- **Error isolation** : One handler crash doesn't break others
- **Unsubscribe** : Returns cleanup function (React-compatible)

## Future: WebSocket Bridge

Next step: a WebSocket bridge that forwards EventBus events to external consumers:

```
EventBus (in-process) → WebSocket server → Quest XR (remote)
```

This keeps the core EventBus simple while enabling cross-device distribution.
