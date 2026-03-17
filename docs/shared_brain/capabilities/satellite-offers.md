# Satellite-Spy — Capabilities Offered to Madgic Platform

**Project** : Satellite-Spy  
**Status** : Phase 1 complete, 86/86 tests, all services operational

---

## 1. WorldModel — Geopolitical Ontology Engine

**Source** : `src/lib/engine/world-model.ts` (442 LOC)  
**Export** : `@madgic/satellite-platform/world-model`

Graph-based digital twin with 13 entity types, 11 relation types, and causal chains. Pure function `buildWorldModel()` constructs the graph from live data (conflicts, markets, satellites, aircraft).

**Consumers** :
- **Masar AI** : Add logistics entities (warehouse, fleet, shipment) + supply chain routes
- **Harissa Banking** : Geopolitical risk assessment for sovereign analysis
- **Quest XR** : 3D visualization of entity graph + relations

---

## 2. SimulationEngine — What-If Cascading

**Source** : `src/lib/engine/simulation-engine.ts` (365 LOC)  
**Export** : `@madgic/satellite-platform/simulation`

Pure function `runSimulation(scenario, worldModel)` → deterministic cascade propagation through the entity graph. 6 pre-built scenarios (Hormuz, Taiwan, Suez, Russia gas, Iran sanctions, Ukraine).

**Output format** : `SimulationResult { timeline, affectedEntities, marketPredictions, narrative }`

**Consumers** :
- **Quest XR** : ReasoningVisualizer DAG of cascade timeline
- **Harissa Banking** : Market impact predictions for stress testing

---

## 3. ScenarioPattern Matching

**Source** : `src/lib/api/scenario-patterns.ts` (438 LOC)  
**Export** : `@madgic/satellite-platform/correlation`

6 real-world pattern definitions (Hormuz crisis, Ukraine grain, Taiwan, defense insider, sanctions, safe-haven) with executable `evaluate()` functions. Pattern matching engine returns match percentage + matched triggers.

**Consumers** :
- **Harissa Banking** : Market pattern detection (defense insider trading, safe-haven rush)
- **Masar AI** : Supply chain disruption early warning

---

## 4. Market Anomaly Detection

**Source** : `src/lib/api/cross-intelligence.ts` (902 LOC)  
**Export** : `@madgic/satellite-platform/cross-intelligence`

4 correlation algorithms:
- `detectMarketAnomalies()` — volume spikes, price crashes, sector rotation, VIX
- `detectTemporalAnomalies()` — pre-event market movements (insider trading indicator)
- `detectSatelliteSurveillancePatterns()` — recon satellites over watch regions
- `detectMilitaryAircraftPatterns()` — AWACS orbits, bomber deployment

24 tracked symbols across 7 categories (energy, metals, agriculture, defense, indices, currency).

**Consumers** :
- **Harissa Banking** : Insider trading detection, commodity anomaly alerts
- **Quest XR** : Multi-signal correlation DAG visualization

---

## 5. SENTINEL LLM Prompt Pattern

**Source** : `src/app/api/llm-analysis/route.ts` (261 LOC)

Structured intelligence analysis prompt (BLUF format, confidence %, suspicion levels). Works with OpenRouter (Claude) or falls back to rule-based analysis.

Analysis domains: temporal analysis, volume analysis, sector correlation, satellite patterns, aircraft patterns, media divergence.

**Consumers** :
- **All projects** : Reusable pattern for structured LLM system prompts with fallback

---

## Summary Matrix

| Capability | LOC | Pure function? | Test coverage | Consumers |
|-----------|-----|----------------|--------------|-----------|
| WorldModel | 442 | ✅ `buildWorldModel()` | via engine tests | Masar, Harissa, Quest XR |
| SimulationEngine | 365 | ✅ `runSimulation()` | via engine tests | Quest XR, Harissa |
| ScenarioPatterns | 438 | ✅ `matchScenarioPatterns()` | via cross-intel tests | Harissa, Masar |
| CrossIntelligence | 902 | ✅ all detection functions | 15 dedicated tests | Harissa, Quest XR |
| SENTINEL prompt | 261 | ⚠️ route handler | manual verified | All |
