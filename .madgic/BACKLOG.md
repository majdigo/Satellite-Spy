# Satellite-Spy — Sprint Backlog

**Sprint**: Sprint 1 — Real-Time Intelligence & Data Quality
**Updated**: 2026-03-23
**Test baseline**: 152/152 pass (9 suites)

---

## Sprint 0 — DONE

| # | Feature | Branch | Tests | Date |
|---|---------|--------|-------|------|
| 1 | Core build (53 files, CesiumJS, 8 API feeds, 4 engines) | Phase 0 | +131 | 2026-03-08 |
| 2 | Shared brain + docs + governance | Phase 1 | — | 2026-03-17 |
| 3 | EventBus integration | `feature/eventbus-integration` | +16 | 2026-03-17 |
| 4 | Logistics entities (fleet, warehouse, shipment, route) | `feature/logistics-entities` | +14 | 2026-03-17 |
| 5 | Simulation export API (POST + SSE) | `feature/simulation-export-ws` | +15 | 2026-03-17 |
| 6 | Madgic Integration (QuantumData TS, GeoEvent, design system, drone types) | Phase 3 | +21 | 2026-03-22 |
| 7 | Consolidation sign-off | — | — | 2026-03-23 |

---

## Sprint 1 — Backlog (prioritized)

### P0 — CRITICAL (must do this sprint)

| # | Feature | Acceptance Criteria | Est. |
|---|---------|--------------------|------|
| S1-01 | **Real GDELT data validation** | Hit /api/gdelt with no mock, parse 50+ real events, verify lat/lon/tone/actors are correct. Add integration test with snapshot. | 2h |
| S1-02 | **Real ACLED data validation** | If API key available: hit /api/acled, parse real conflict events. If not: validate parser with ACLED sample JSON fixture. | 2h |
| S1-03 | **Auto-refresh data loop** | Dashboard fetches all 6 data sources every 5 min via EventBus. Status bar shows last refresh time per source. Stale data (>15min) shows warning. | 3h |
| S1-04 | **Error resilience** | Each API route returns graceful fallback on failure (empty array + error log). No crash if CesiumJS token missing. Globe shows "No data" overlay. | 2h |

### P1 — HIGH VALUE (should do this sprint)

| # | Feature | Acceptance Criteria | Est. |
|---|---------|--------------------|------|
| S1-05 | **QuantumData provenance panel** | Click any event on globe -> side panel shows QuantumData fields: truthLayer, confidence, source, timestamp. Uses design system colors. | 4h |
| S1-06 | **Temporal heatmap** | Toggle to show "last 24h" vs "last 7d" vs "last 30d" event density on globe. Uses Cesium heatmap or point clustering. | 3h |
| S1-07 | **Alert threshold system** | Define thresholds in config: if goldsteinScale < -5 AND numMentions > 50 -> emit CrossIntelAlert. Test with historical GDELT data. | 3h |
| S1-08 | **GDELT historical backfill** | Fetch 30 days of GDELT data on first load (not just 24h). Store in Zustand. Enable timeline scrubbing. | 3h |

### P2 — MEDIUM (nice to have)

| # | Feature | Acceptance Criteria | Est. |
|---|---------|--------------------|------|
| S1-09 | **Region watch with notifications** | User defines bounding box on globe -> all events in that region are highlighted + counted. Persists in localStorage. | 3h |
| S1-10 | **Export to GeoJSON** | Button exports current view (events + satellites + conflicts) as GeoJSON file. Importable in QGIS. | 2h |
| S1-11 | **Market correlation heatmap** | Side panel showing region->commodity impact matrix (from REGION_COMMODITY_MAP). Color = strength of correlation. | 3h |
| S1-12 | **Performance profiling** | Measure render time with 1000+ entities on globe. Target: <16ms frame time. Optimize if needed (clustering, LOD). | 2h |

### P3 — RESEARCH SPIKES (time-boxed exploration)

| # | Feature | Acceptance Criteria | Time-box |
|---|---------|--------------------|----------|
| S1-R1 | **Satellite FM models evaluation** | Evaluate Prithvi/TerraTorch, Clay, SatMAE on HuggingFace. Can they run on RTX 3070? Document findings. | 4h |
| S1-R2 | **YOLO on satellite imagery** | Download YOLOv8 pre-trained on xView/DOTA. Run inference on 1 Sentinel-2 tile. Measure accuracy + speed. | 4h |
| S1-R3 | **CesiumJS + WebXR feasibility** | Test if CesiumJS globe renders inside WebXR session on Quest 3 browser. Document blockers. | 2h |
| S1-R4 | **Real-time GDELT streaming** | Investigate GDELT GKG real-time feed. Can we get events faster than 15min polling? Document options. | 2h |

---

## Technical Debt

| # | Issue | Impact | Fix |
|---|-------|--------|-----|
| TD-01 | `helpers.ts:severityColor()` duplicates design system SEVERITY_COLORS | Inconsistent colors | Remove helpers version, use design system everywhere |
| TD-02 | Tests use hardcoded values, not fixtures | Brittle tests | Create shared test fixtures in `__tests__/fixtures/` |
| TD-03 | No TypeScript strict mode | Possible runtime errors | Enable `strict: true` in tsconfig, fix type errors |
| TD-04 | GlobeViewer.tsx is 560 lines | Hard to maintain | Extract satellite/aircraft/event layers into separate hooks |
| TD-05 | 131->152 tests but 0 integration tests | No E2E confidence | Add 1 integration test: full data fetch -> globe render |

---

## Cross-Project Dependencies

| Need | From | Status | Blocking? |
|------|------|--------|-----------|
| EventBus WebSocket bridge | Quest XR | Not started | No (SSE works) |
| LLMService structured | Masar AI | Not started | No (OpenRouter works) |
| Document extraction API | Prime-SPA | Not started | No (not needed yet) |
| Scene graph abstract | Quest XR | Not started | No |
| DJI MSDK | Majdi hardware | Waiting purchase | Blocks drone features |
| YOLO model | pip install | Ready to try | Blocks object detection |

---

## Sprint 1 Velocity Target

- **Capacity**: ~30h of dev time
- **P0 items**: 9h (must complete)
- **P1 items**: 13h (aim for 3/4)
- **P2 items**: 10h (stretch goal)
- **Research**: 12h (time-boxed, no commitment)

## Rules

- UAT environment (main, tagged) does **NOT** move
- Dev on feature branches only
- **152 tests must pass** before any merge (up from 131)
- Update `.madgic/` after each action
- No new architecture docs — execute existing specs
- Research spikes produce findings doc, not code (unless trivial)
