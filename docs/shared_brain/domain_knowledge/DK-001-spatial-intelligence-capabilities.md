# DK-001 — Spatial Intelligence Capabilities Inventory

**Projet** : Satellite-Spy  
**Date** : 2026-03-16  
**Status** : Validated  

## Capacités validées

### Data Sources (5 externes)

| Source | Type | API | Clé requise |
|--------|------|-----|-------------|
| CesiumJS Ion | Globe 3D, tuiles | REST | ✅ Token |
| ACLED | Conflits armés | REST | ✅ Key + Email |
| GDELT | Événements médiatiques | REST | ❌ Open |
| OpenSky Network | Trafic aérien live | REST | ✅ Credentials |
| Yahoo Finance (via proxy) | Marchés financiers | REST | ❌ |

### Engine Layer (3 moteurs)

| Moteur | Fichier | LOC | Capacité |
|--------|---------|-----|----------|
| WorldModel | `world-model.ts` | 497 | Graphe entités-relations + chaînes causales auto-construites |
| SimulationEngine | `simulation-engine.ts` | 415 | What-if scenarios (6 pré-définis : Hormuz, Taiwan, Suez, Russia Gas, Iran Sanctions, Ukraine) |
| DecisionEngine | `decision-engine.ts` | 387 | Transforme signaux → paquets décisionnels avec urgence/impact/actions |

### AI / Intelligence (2 systèmes)

| Système | Fichier | Capacité |
|---------|---------|----------|
| AI Plugin System | `plugin-system.ts` | Registry extensible : rule-based (built-in) + remote LLM |
| Cross-Intelligence | `cross-intelligence.ts` | Corrélation multi-source : marché × conflit × satellite × aéronef |

### Tests validés (5 suites)

| Suite | Tests | Status |
|-------|-------|--------|
| `cross-intelligence.test.ts` | 15 | ✅ |
| `correlation.test.ts` | — | ✅ |
| `helpers.test.ts` | — | ✅ |
| `intelligence.test.ts` | — | ✅ |
| `satellites.test.ts` | — | ✅ |

### Simulation Scenarios validés

| ID | Scénario | Cible | Sévérité |
|----|----------|-------|----------|
| sim-hormuz-closure | Strait of Hormuz closure | chokepoint-hormuz | critical |
| sim-taiwan-invasion | Taiwan Strait military action | country-TWN | critical |
| sim-suez-blockage | Suez Canal blockage | chokepoint-suez | high |
| sim-russia-gas-cutoff | Russia gas supply cutoff | commodity-natgas | critical |
| sim-iran-sanctions | Maximum pressure Iran sanctions | country-IRN | high |
| sim-ukraine-escalation | Ukraine conflict major escalation | country-UKR | critical |

## Contribution aux autres projets

### → Masar AI (Al Soudah PIF)
- Les scénarios SimulationEngine couvrent la région KSA (chokepoint-hormuz, country-SAU)
- WorldModel fournit le contexte géospatial pour les chantiers construction PIF
- Pattern `buildWorldModel()` isomorphe au pattern S1/S2

### → Harissa Banking
- `detectMarketAnomalies()` : volume spikes, price surges/crashes, sector rotation, VIX alerts
- Market predictions des simulations → alimentation DefeasibleReasoner
- 6 commodités/indices trackés : CL=F, BZ=F, NG=F, ZW=F, GC=F, ^VIX

### → Quest XR
- WorldModel entities avec coordonnées GPS → overlay XR spatial
- SimulationEngine → visualisation cascade impacts en 3D
- Zones dangereuses/restreintes (chokepoints, conflits) → POI XR
