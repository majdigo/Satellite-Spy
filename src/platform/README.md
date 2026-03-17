# @madgic/satellite-platform

**Madgic Satellite Platform** — Spatial Intelligence SDK extracted from Satellite-Spy.

## Components

### WorldModel (`./world-model`)

Graph-based digital twin of geopolitical reality. Assembles live data from 5 sources
into entities, relationships, and causal chains.

**Key exports:**
- `buildWorldModel(input)` — assembles the graph from live data
- `WorldEntity` — nodes: countries, chokepoints, commodities, satellites, etc.
- `WorldRelation` — edges: depends_on, threatens, supplies, controls, etc.
- `CausalChain` — auto-built cascade chains from disrupted entities

**Usage in Quest XR:**
```typescript
import { buildWorldModel } from '@madgic/satellite-platform/world-model'

const worldModel = buildWorldModel({
  conflicts, gdeltEvents, satellites, aircraft,
  disasters, marketData, marketAnomalies, economicIndicators,
  crossIntelAlerts,
})
// Overlay entities on XR environment
for (const [id, entity] of worldModel.entities) {
  if (entity.location) {
    xrScene.addPOI(entity.location, entity.name, entity.status)
  }
}
```

### SimulationEngine (`./simulation`)

What-if scenario calculator. Runs cascade impact simulations across the world model.

**6 pre-built scenarios:** Hormuz closure, Taiwan invasion, Suez blockage,
Russia gas cutoff, Iran sanctions, Ukraine escalation.

**Key exports:**
- `runSimulation(scenario, worldModel)` → `SimulationResult`
- `SIMULATION_SCENARIOS` — pre-built scenario list

**Usage in Masar AI:**
```typescript
import { runSimulation, SIMULATION_SCENARIOS } from '@madgic/satellite-platform/simulation'
import { buildWorldModel } from '@madgic/satellite-platform/world-model'

// Simulate impact of Hormuz closure on KSA supply chain
const hormuz = SIMULATION_SCENARIOS.find(s => s.id === 'sim-hormuz-closure')!
const result = runSimulation(hormuz, worldModel)
// result.marketPredictions → oil +15-40%, gold +5-15%
// result.affectedEntities → Saudi Arabia, Iran, ...
```

### DecisionEngine (`./decision`)

Transforms intelligence signals into actionable decision packages with
urgency levels, impact assessments, and recommended actions.

**Key exports:**
- `generateDecisions(input)` → `Decision[]`
- `Decision` — urgency, domain, situation, actions, evidence, confidence

### AI Plugin System (`./ai-plugins`)

Extensible plugin registry for AI capabilities. Ships with a built-in
rule-based engine; remote LLM plugins can be added at runtime.

**Key exports:**
- `aiRegistry` — singleton plugin registry
- `AIPlugin` — abstract base class
- `RuleBasedAnalysisPlugin` — built-in, no dependencies
- `RemoteAIPlugin` — template for LLM endpoints

**Relationship to madgic_platform:**

| Satellite Platform | madgic_platform Equivalent |
|-------------------|---------------------------|
| `AIPlugin` | `BaseAgent` (agentic/) |
| `RuleBasedAnalysisPlugin` | Local rule-based agent |
| `RemoteAIPlugin` | `LLMService` (ai_sdk/) |
| `WorldEntity` types | Ontology L1 Core + L2 Geospatial |
| `CausalChain` | `DefeasibleReasoner` reasoning chain |

## Cross-Project Consumers

| Project | Components Used | Purpose |
|---------|----------------|---------|
| **Quest XR** | WorldModel, SimulationEngine | XR spatial overlay, 3D cascade visualization |
| **Masar AI** | SimulationEngine, WorldModel | Geospatial context for Al Soudah PIF contracts |
| **Harissa Banking** | DecisionEngine, market predictions | Financial risk from geopolitical scenarios |
| **Maqam Architect** | AI Plugin pattern | Inspiration for vibe-engine plugin architecture |
