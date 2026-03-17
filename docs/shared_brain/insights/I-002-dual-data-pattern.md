# I-002 — Dual Data Fusion Pattern (Static Strategic + Live)

**Projet** : Satellite-Spy  
**Date** : 2026-03-16  
**Status** : Active  
**Source** : `src/lib/engine/world-model.ts` (buildWorldModel)

## Résumé

Satellite-Spy utilise un pattern de fusion de données en deux couches qui peut
s'appliquer à tous les projets Madgic.

## Le Pattern

### Couche 1 — Connaissances stratégiques statiques

Données pré-codées qui modélisent les relations structurelles du monde:
- **6 chokepoints** maritimes (Hormuz, Malacca, Suez, Bab el-Mandeb, Taiwan Strait, Bosphorus)
- **5 commodités** (Oil, Gas, Wheat, Gold, Semiconductors)
- **8 pays clés** avec propriétés stratégiques (GDP, nucléaire, exports)
- **14 relations** stratégiques (alliances, hostilités, dépendances)

### Couche 2 — Données temps réel

Flux live qui mettent à jour les statuts des entités:
- ACLED (conflits armés)
- GDELT (événements médiatiques)
- OpenSky (aéronefs)
- TLE/satellite.js (satellites)
- Yahoo Finance (marchés)

### Fusion

`buildWorldModel(input)` fusionne les deux couches :
1. Charge les entités statiques avec `status: "normal"`
2. Met à jour les statuts avec les données live (conflicts, markets, disasters)
3. Enrichit les relations (satellites → entités en zone de surveillance)
4. Construit les chaînes causales à partir des entités perturbées

## Applicabilité cross-projets

| Projet | Couche 1 (statique) | Couche 2 (live) |
|--------|-------------------|-----------------|
| **Masar AI** | Seuils NMPG, règles procurement | Appels d'offres temps réel |
| **Harissa Banking** | NormDomain, DefeasibleNorms | Transactions, KYC checks |
| **Maqam Architect** | ScaleIntelligence, gammes | Audio stream MIDI live |
| **Quest XR** | EnvironmentModel, POI | Capteurs XR, position user |

Ce pattern est isomorphe au pattern **S1/S2** de Masar AI :
- **S1 = Couche 1** : réponse immédiate basée sur les règles statiques
- **S2 = Couche 2** : enrichissement par les données live + LLM
