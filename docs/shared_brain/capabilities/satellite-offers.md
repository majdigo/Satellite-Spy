# Satellite-Spy — Capabilities Offered to Madgic Platform

**Project** : Satellite-Spy  
**Status** : Phase 1 complete, 3 feature branches ready for merge

---

## 1. WorldModel — Geopolitical + Logistics Ontology Engine

**Source** : `src/lib/engine/world-model.ts` (573 LOC)  
**Export** : `@madgic/satellite-platform/world-model`  
**Branch** : `feature/logistics-entities` extends to 17 entity types + 14 relation types

Graph-based digital twin with 17 entity types (13 geopolitical + 4 logistics), 14 relation types (11 + 3 logistics), and causal chains. Pure function `buildWorldModel()` constructs the graph from live data.

**Logistics additions** : `fleet`, `warehouse`, `shipment`, `route` entity types + `stores_at`, `ships_via`, `delivers_to` relations. Demo data: Rotterdam→Hormuz oil route with 5 waypoints, Maersk fleet, Jebel Ali port.

**Consumers** :
- **Masar AI** : Logistics entities + supply chain routes (ready to use)
- **Harissa Banking** : Geopolitical risk assessment for sovereign analysis
- **Quest XR** : 3D visualization of entity graph + relations

---

## 2. SimulationEngine — What-If Cascading + API Export

**Source** : `src/lib/engine/simulation-engine.ts` (365 LOC)  
**API** : `POST /api/simulation/run` (branch `feature/simulation-export-ws`)  
**Export** : `@madgic/satellite-platform/simulation`

Pure function `runSimulation(scenario, worldModel)` → deterministic cascade propagation. 6 pre-built scenarios. New API route returns `SimulationXREvent` format with entity positions for Quest XR.

**API format** :
```json
POST { "scenarioId": "sim-hormuz-closure" }
→ { type, scenarioId, timeline[], marketPredictions[], affectedEntities[], positions }
```

**Consumers** :
- **Quest XR** : SimulationXREvent → ReasoningVisualizer DAG with geo-positions
- **Harissa Banking** : Market impact predictions for stress testing

---

## 3. ScenarioPattern Matching

**Source** : `src/lib/api/scenario-patterns.ts` (438 LOC)  
**Export** : `@madgic/satellite-platform/correlation`

6 real-world pattern definitions with executable `evaluate()` functions. Pattern matching engine returns match percentage + matched triggers.

**Consumers** :
- **Harissa Banking** : Market pattern detection (defense insider trading, safe-haven rush)
- **Masar AI** : Supply chain disruption early warning

---

## 4. Market Anomaly Detection

**Source** : `src/lib/api/cross-intelligence.ts` (902 LOC)  
**Export** : `@madgic/satellite-platform/cross-intelligence`

4 correlation algorithms: market anomalies, temporal anomalies, satellite surveillance, military aircraft. 24 tracked symbols across 7 categories.

**Consumers** :
- **Harissa Banking** : Insider trading detection, commodity anomaly alerts
- **Quest XR** : Multi-signal correlation DAG visualization

---

## 5. SENTINEL LLM Prompt Pattern

**Source** : `src/app/api/llm-analysis/route.ts` (261 LOC)

Structured intelligence analysis prompt (BLUF format). OpenRouter + rule-based fallback.

**Consumers** :
- **All projects** : Reusable pattern for structured LLM system prompts

---

## 6. EventBus — Cross-Project Pub/Sub

**Source** : `src/lib/event-bus/index.ts` (130 LOC)  
**Branch** : `feature/eventbus-integration`

Type-safe in-process EventBus with 11 event types. Supports `publish()`, `subscribe()`, replay-1 for late subscribers, error isolation. Market data fetch already migrated to publish `market:updated` events.

**Consumers** :
- **Quest XR** : Subscribe to `market:updated`, `analysis:crossintel` events via WebSocket bridge
- **All projects** : Foundation for real-time data sharing across Madgic

---

## Summary Matrix

| Capability | LOC | Branch | Tests | Consumers |
|-----------|-----|--------|-------|-----------|
| WorldModel (17 types) | 573 | `feature/logistics-entities` | 86/86 | Masar, Harissa, Quest XR |
| SimulationEngine + API | 365+150 | `feature/simulation-export-ws` | 100/100 | Quest XR, Harissa |
| ScenarioPatterns | 438 | UAT | via cross-intel | Harissa, Masar |
| CrossIntelligence | 902 | UAT | 15 dedicated | Harissa, Quest XR |
| SENTINEL prompt | 261 | UAT | manual | All |
| EventBus | 130 | `feature/eventbus-integration` | 102/102 | Quest XR, All |

