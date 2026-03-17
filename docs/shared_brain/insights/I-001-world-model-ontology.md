# I-001 — World Model Ontology (Entity/Relation Graph)

**Projet** : Satellite-Spy  
**Date** : 2026-03-16  
**Status** : Active  
**Source** : `src/lib/engine/world-model.ts`

## Résumé

Satellite-Spy implémente un World Model sous forme de graphe d'entités-relations
avec chaînes causales. C'est la couche "digital twin" qui modélise la réalité
géopolitique et ses cascades d'impacts.

## Entity Types (13 types)

| Type | Description | Exemple |
|------|-------------|---------|
| `country` | État-nation | USA, Russia, China, Iran, Saudi Arabia |
| `region` | Région géographique | Middle East, Central Asia |
| `city` | Ville stratégique | — |
| `military_base` | Base militaire | — |
| `port` | Port maritime | — |
| `chokepoint` | Point d'étranglement maritime | Strait of Hormuz, Suez Canal, Malacca |
| `commodity` | Matière première | Crude Oil, Natural Gas, Wheat, Gold, Semiconductors |
| `market` | Marché financier | — |
| `actor` | Acteur (groupe armé, gouvernement, corporation) | — |
| `satellite` | Satellite (reconnaissance, militaire) | USA-326 |
| `aircraft` | Aéronef | — |
| `infrastructure` | Infrastructure critique | — |
| `population` | Population | — |

## Relation Types (11 types)

| Type | Sémantique | Exemple |
|------|-----------|---------|
| `depends_on` | Dépendance supply chain | USA depends_on Semiconductors |
| `transports` | Transport via chokepoint | Saudi Arabia transports oil through Hormuz |
| `threatens` | Menace militaire | China threatens Taiwan |
| `monitors` | Surveillance satellite | — (dynamique) |
| `trades` | Commerce de commodité | — |
| `borders` | Frontière géographique | — |
| `supplies` | Approvisionnement | Taiwan supplies Semiconductors (95%) |
| `controls` | Contrôle stratégique | Iran controls Hormuz |
| `allied_with` | Alliance | USA allied_with Israel |
| `hostile_to` | Hostilité | Russia hostile_to Ukraine |
| `impacts` | Impact cascade | — |

## Causal Chain Model

```
CausalChain {
  trigger → steps[] → totalTimeframe → confidence → severity
}
CausalStep {
  order → entityName → impact (disrupted|stressed|cascading|critical) → probability
}
```

Les chaînes causales sont construites automatiquement à partir des entités
`disrupted` ou `critical` et de leurs relations.

## Contribution à madgic_platform

Ce modèle d'ontologie alimenterait directement :
- `madgic_platform/ontology/L1_Core/` — types d'entités génériques
- `madgic_platform/ontology/L2_Geospatial/` — entités spatiales spécifiques
- `madgic_platform/reasoning/` — CausalChain → DefeasibleReasoner
