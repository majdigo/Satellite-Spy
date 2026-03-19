# Satellite-Spy — Changelog

## [Unreleased] — Sprint Features (on dev branch)

### feature/simulation-export-ws
- `POST /api/simulation/run` endpoint for Quest XR
- `GET /api/simulation/stream` SSE endpoint
- 7 pre-built scenarios (Hormuz, Taiwan, Suez, Russia Gas, Iran Sanctions, Ukraine, Persian Gulf)
- `SimulationXREvent` format for XR-compatible timeline
- 15 new tests

### feature/logistics-entities
- 4 new entity types: `fleet`, `warehouse`, `shipment`, `route`
- 3 new relation types: `stores_at`, `ships_via`, `delivers_to`
- Demo data: Rotterdam port, Jebel Ali, Maersk fleet, Hormuz→Rotterdam route
- 14 new tests

### feature/eventbus-integration
- `EventBus` class — type-safe pub/sub with replay-1
- `EventMap` interface for 11 event types
- Market data fetch migrated to publish events
- `useEventBus` React hook
- 16 new tests

### Platform SDK
- `src/lib/platform/index.ts` barrel export
- `GET /api/globe-status` health endpoint
- Strategic critique integration

---

## [uat-v1.4] — Phase 1 Complete

### Phase 1 — Polish
- README created (95 LOC)
- BottomBar component completed
- `docs/shared_brain/` — REGISTRY, interfaces, ontologies, capabilities, insights, ADRs
- Services stabilized

### Phase 0 — Core Build
- CesiumJS globe with satellite tracking (SGP4/SDP4)
- 8 real-time data feeds (CelesTrak, OpenSky, ACLED, GDELT, USGS, ReliefWeb, Yahoo Finance, OpenRouter)
- WorldModel ontology engine (13 entity types, 11 relations)
- SimulationEngine (6 what-if scenarios)
- DecisionEngine (strategic recommendations)
- CrossIntelligence (market anomalies, satellite surveillance, military aircraft, alert generation)
- 13 intelligence/data panels
- Visual filters (night vision, thermal, CRT, classified)
- OSINT report generation
- AI plugin system (rule-based + OpenRouter LLM)
- Zustand state management
- 86 tests across 5 suites
