# IWorldModel — Interface du World Model Satellite-Spy

**Source** : `src/lib/engine/world-model.ts` (442 LOC)  
**Pattern** : Graphe dirigé pondéré (entités + relations + chaînes causales)

---

## EntityType (13 types)

```typescript
// world-model.ts L26-39
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
```

## RelationType (11 types)

```typescript
// world-model.ts L69-80
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
```

## WorldEntity

```typescript
// world-model.ts L41-55
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
// world-model.ts L82-90
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
// world-model.ts L96-113
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

## Correspondance ontologie L2

| WorldModel | Ontologie L2 (Masar pattern) |
|-----------|------------------------------|
| `EntityType` | `ConceptType` domaine |
| `WorldEntity` | Instance de concept + property bag |
| `RelationType` | `RelationType` |
| `WorldRelation.strength` | Poids de confiance |
| `CausalChain` | Rule chain (→ DefeasibleReasoner) |
| `status` (4 états) | `NormDomain` implicite |
