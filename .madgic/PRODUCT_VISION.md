# PRODUCT VISION — Satellite-Spy
# OSINT Intelligence & Geopolitical Monitoring Platform
# S-Agent | Date: 2026-03-26

---

## The Product in One Sentence

Satellite-Spy is a **real-time OSINT intelligence platform** that ingests
geopolitical events (GDELT, ACLED), satellite passes, aircraft tracks,
and market data into a **knowledge graph**, reasons about threats
autonomously, and projects insights through an **agentic UI** (globe,
tables, force graphs, heatmaps) — with full provenance and confidence
tracking on every data point.

---

## What Makes It Different

1. **Every data point is a DataBucket** — not just data, but data with
   provenance, confidence, truth layer, and interaction journal.

2. **Cross-domain intelligence** — geopolitical events feed into financial
   models (WACC adjustment), supply chain risk (M-Agent), and immersive
   exploration (Q-Agent). The graph connects domains that Excel keeps separate.

3. **Agentic reasoning** — the system detects escalation patterns, anomalies,
   and cross-correlations autonomously. It doesn't wait for the analyst to
   ask — it alerts proactively.

4. **The UI IS the graph** — every pixel on the globe, every row in the table,
   every node in the force graph is a projection of a knowledge graph node.
   Same data, different modality. Click-to-trace from any visualization
   back to the source.

---

## End-to-End Architecture

```
DATA SOURCES                KNOWLEDGE GRAPH              INTELLIGENCE               UI PROJECTIONS
─────────────              ───────────────              ────────────              ──────────────
GDELT GEO API    ──┐                                                             ┌── Globe (CesiumJS)
GDELT DOC API    ──┤       ┌──────────────┐       ┌──────────────┐              ├── IntelligenceGrid
ACLED REST       ──┤──────▶│ GeoEventBucket│──────▶│ Cross-Intel  │─────────────▶├── ForceGraph
Satellite TLE    ──┤       │ + Relations   │       │ Correlation  │              ├── AnomalyHeatmap
OpenSky ADS-B    ──┤       │ + Provenance  │       │ Anomaly Det  │              ├── EntityCard
USGS Disasters   ──┤       │ + Confidence  │       │ Escalation   │              ├── Timeline
Market Data      ──┘       └──────┬───────┘       │ Risk Score   │              └── Alerts
                                  │               └──────┬───────┘
                                  │                      │
                                  ▼                      ▼
                          ┌──────────────┐       ┌──────────────┐
                          │ Shared KG    │       │ Financial    │
                          │ (madgic_     │◀─────▶│ Models       │
                          │  shared)     │       │ (Harissa)    │
                          └──────────────┘       └──────────────┘
```

---

## Quality Standards

### Code
- TypeScript strict mode, no `any` except explicit boundaries
- Zod validation on all API responses
- Consistent error handling (structured errors, not silent failures)
- No duplication — extract to lib/ when used 2+ times
- Every function < 50 lines, every file < 300 lines

### Architecture
- Store slices (not monolithic) — satellites, events, intelligence, market
- Data flows one way: API → adapter → KG node → store → component
- Components are pure functions of props (no side effects in render)
- Hooks encapsulate all async logic

### Testing
- Unit tests for all lib/ functions (current: good)
- Component tests for all interactive components (current: missing)
- Integration tests for data pipeline (current: missing)
- E2E tests for critical user flows (current: missing)

### Agentic
- Every data point carries truth_layer + confidence
- Cross-source validation (GDELT × ACLED → boosted confidence)
- Autonomous alert generation (threshold-based + pattern-based)
- Provenance trace from any UI element back to source

---

## Priority Refactorings

### P0: Unified Confidence Framework
Currently 3 different confidence calculations scattered across files.
Create `lib/confidence.ts` with one source of truth.

### P1: Zod API Validation
All API responses are trust-on-faith. Add Zod schemas for GDELT, ACLED,
satellite, market responses. Catch format changes before they crash the UI.

### P2: Deduplicate Utilities
- Distance calculation (haversine) in 2 files → 1
- Event type mapping in 3 files → 1
- Search logic in TopBar → extract to lib/search.ts

### P3: Store Slices
Split 274-line monolithic store into domain slices.
Each slice has its own selectors, preventing unnecessary rerenders.

---

## Cross-Project Integration Points

| Partner | Integration | Status | Direction |
|---------|------------|--------|-----------|
| **Harissa** (H-Agent) | Geo risk → WACC adjustment | ✅ Done | S→H via madgic_shared |
| **Masar** (M-Agent) | Supply chain risk correlation | Planned | S↔M bidirectional |
| **Quest** (Q-Agent) | 3D immersive event exploration | Partial | S→Q via WorldModel |
| **Maq-Agent** | Sonification of threat levels | Planned | S→Maq via EventBus |
| **Prime-SPA** (P-Agent) | Document-sourced events | Planned | P→S via XBRL bridge |

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Tests passing | 319 | 450+ (add component + integration) |
| Code coverage | ~60% (est) | 80%+ |
| API response validation | 0% | 100% (Zod) |
| MAPE vs ground truth (geo risk benchmark) | N/A | <5% (calibrated CRP) |
| Alert precision (true positive rate) | Unknown | >80% |
| UI responsiveness (store update → render) | ~50ms (est) | <16ms (60fps) |
| Data freshness (GDELT ingestion delay) | 15min | 15min (API limit) |
