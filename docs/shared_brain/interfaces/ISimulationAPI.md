# ISimulationAPI — Simulation Export Interface

**Source** : `src/app/api/simulation/run/route.ts` + `src/lib/engine/simulation-engine.ts`  
**Consumers** : Quest XR (ReasoningVisualizer), Harissa Banking (stress testing)

---

## API Endpoints

### POST `/api/simulation/run`

Run a simulation scenario and get full results.

**Request**:
```json
{ "scenarioId": "sim-hormuz-closure" }
```

**Response** (`SimulationXREvent`):
```json
{
  "type": "simulation:result",
  "scenarioId": "sim-hormuz-closure",
  "scenarioName": "Strait of Hormuz Closure",
  "timeline": [
    {
      "timeOffset": "T+0h",
      "description": "...",
      "entityId": "chokepoint-hormuz",
      "entityName": "Strait of Hormuz",
      "entityType": "chokepoint",
      "impact": "critical",
      "confidence": 95,
      "position": { "lat": 26.5, "lon": 56.3 }
    }
  ],
  "marketPredictions": [
    {
      "symbol": "CL=F",
      "name": "Crude Oil",
      "expectedChange": "+15-40%",
      "direction": "up",
      "confidence": 90,
      "timeframe": "1-7 days"
    }
  ],
  "affectedEntities": [...],
  "overallSeverity": "critical",
  "probability": 25,
  "narrative": "SIMULATION: Strait of Hormuz Closure\n..."
}
```

### GET `/api/simulation/stream`

SSE stream for real-time simulation delivery.

---

## 7 Pre-built Scenarios

| ID | Name | Trigger | Target |
|----|------|---------|--------|
| `sim-hormuz-closure` | Strait of Hormuz Closure | chokepoint_closure | chokepoint-hormuz |
| `sim-taiwan-invasion` | Taiwan Strait Military Action | conflict_start | country-TWN |
| `sim-suez-blockage` | Suez Canal Blockage | chokepoint_closure | chokepoint-suez |
| `sim-russia-gas-cutoff` | Russia Gas Supply Cutoff | commodity_shock | commodity-natgas |
| `sim-iran-sanctions` | Maximum Pressure Iran Sanctions | sanctions | country-IRN |
| `sim-ukraine-escalation` | Ukraine Conflict Major Escalation | conflict_start | country-UKR |
| `sim-logistics-disruption` | Persian Gulf Supply Chain Disruption | chokepoint_closure | route-hormuz-rotterdam |

## SimulationResult Structure

```typescript
interface SimulationResult {
  scenario: SimulationScenario;
  timestamp: Date;
  timeline: SimulationEvent[];         // Chronological cascade
  affectedEntities: EntityImpact[];    // Entity status changes
  marketPredictions: MarketPrediction[];// Symbol-level forecasts
  overallSeverity: SeverityLevel;
  probability: number;                 // 0-85%
  narrative: string;                   // Human-readable summary
}
```

## Cascade Mechanics

1. **T+0h** — Direct target impact (critical, 95% confidence)
2. **T+6-12h** — First-order cascade via relations (strength > 0.7 → T+6h)
3. **T+48h** — Second-order cascade (combined strength > 0.3, max 3 per entity)
4. Market predictions generated from trigger type + target entity
5. Probability estimated from entity status + active threat relations
