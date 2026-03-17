# IWorldModel — Interface du World Model Satellite-Spy

**Source** : `src/lib/engine/world-model.ts` (573 LOC)  
**Pattern** : Graphe dirigé pondéré (entités + relations + chaînes causales)

---

## EntityType (17 = 13 geopolitical + 4 logistics)

```typescript
// world-model.ts L26-43
type EntityType =
  | "country"          // État souverain
  | "region"           // Zone géographique
  | "city"             // Ville
  | "military_base"    // Base militaire
  | "port"             // Port maritime
  | "chokepoint"       // Goulot maritime/terrestre (Hormuz, Suez)
  | "commodity"        // Matière première (oil, wheat, gold)
  | "market"           // Marché financier
  | "actor"            // Groupe armé, gouvernement, corporation
  | "satellite"        // Satellite orbital
  | "aircraft"         // Aéronef
  | "infrastructure"   // Pipeline, câble, route
  | "population"       // Population civile
  // Logistics (Masar AI / supply chain)
  | "fleet"            // Flotte maritime ou aérienne
  | "warehouse"        // Entrepôt ou centre de distribution
  | "shipment"         // Marchandises en transit
  | "route"            // Route commerciale définie
```

## RelationType (14 = 11 geopolitical + 3 logistics)

```typescript
// world-model.ts L69-86
type RelationType =
  | "depends_on"       // A dépend de B (supply chain)
  | "transports"       // A transporte via B (chokepoint)
  | "threatens"        // A menace B (conflit)
  | "monitors"         // A surveille B (renseignement)
  | "trades"           // A échange B (commodity)
  | "borders"          // A borde B (géographie)
  | "supplies"         // A approvisionne B
  | "controls"         // A contrôle B
  | "allied_with"      // A est allié de B
  | "hostile_to"       // A est hostile à B
  | "impacts"          // A impacte B (cascade)
  // Logistics relations
  | "stores_at"        // A stocke des biens chez B (warehouse)
  | "ships_via"        // A expédie via B (route/chokepoint)
  | "delivers_to"      // A livre à B (destination)
```

## WorldEntity

```typescript
// world-model.ts L45-59
interface WorldEntity {
  id: string;
  type: EntityType;
  name: string;
  location?: { lat: number; lon: number };
  country?: string;
  properties: Record<string, unknown>;
  status: "normal" | "stressed" | "disrupted" | "critical";
  statusReason?: string;
  metrics: EntityMetric[];
  lastUpdated: Date;
}
```

## WorldRelation

```typescript
// world-model.ts L88-96
interface WorldRelation {
  id: string;
  type: RelationType;
  sourceId: string;
  targetId: string;
  strength: number;    // 0-1
  properties: Record<string, unknown>;
  active: boolean;
}
```

## CausalChain

```typescript
// world-model.ts L102-119
interface CausalChain {
  id: string;
  trigger: string;
  steps: CausalStep[];
  totalTimeframe: string;    // "48h-7d"
  confidence: number;
  severity: SeverityLevel;
}

interface CausalStep {
  order: number;
  description: string;
  entityId: string;
  entityName: string;
  impact: "disrupted" | "stressed" | "cascading" | "critical";
  timeframe: string;
  probability: number;
}
```

## Demo Logistics Entities (5)

| ID | Type | Name | Location |
|----|------|------|----------|
| `port-rotterdam` | port | Port of Rotterdam | 51.95°N 4.13°E |
| `port-jebel-ali` | port | Jebel Ali Port (Dubai) | 25.0°N 55.06°E |
| `warehouse-rotterdam-tank` | warehouse | Rotterdam Oil Tank Farm | 51.89°N 4.29°E |
| `fleet-maersk-gulf` | fleet | Maersk Gulf Fleet | 25.3°N 55.5°E |
| `route-hormuz-rotterdam` | route | Hormuz→Suez→Rotterdam Oil Route | 5 waypoints, 6500nm |

## Correspondance ontologie L2

| WorldModel | Ontologie L2 (Masar pattern) |
|-----------|------------------------------|
| `EntityType` | `ConceptType` domaine |
| `WorldEntity` | Instance de concept + property bag |
| `RelationType` | `RelationType` |
| `WorldRelation.strength` | Poids de confiance |
| `CausalChain` | Rule chain (→ DefeasibleReasoner) |
| `status` (4 états) | `NormDomain` implicite |
| `fleet/warehouse/route` | Logistics extension (Masar AI) |
