# DK-002 — Market Intelligence Correlation Patterns

**Projet** : Satellite-Spy  
**Date** : 2026-03-16  
**Status** : Validated (15 tests passing)  
**Source** : `src/lib/api/cross-intelligence.ts`

## Patterns de corrélation marché × géopolitique validés

### 1. Pre-Event Movement Detection

Détection de mouvements de marché **avant** des événements géopolitiques publics.

| Signal | Seuil | Sévérité |
|--------|-------|----------|
| Volume spike + conflit actif | `volumeAnomaly > 2.0` + conflits dans même pays | high |
| Price surge sans événement | `changePercent > 5%` | medium → high |
| Price crash | `changePercent < -5%` | high |

### 2. Defense Sector Rotation

Détection de rotation sectorielle vers les valeurs défense pendant les conflits.

| Signal | Condition | Implication |
|--------|-----------|-------------|
| LMT, RTX, NOC, GD, BA up | `changePercent > 3%` + conflits actifs | Insider trading suspicion |
| Defense up sans conflict news | Multiple defense stocks up, zero GDELT conflict | `suspicionLevel: high` |

### 3. VIX Fear Gauge

| Seuil | Interprétation |
|-------|----------------|
| VIX > 25 | Market stress élevé |
| VIX > 35 | Panique marché |
| VIX spike > 15% en 1 jour | Événement géopolitique majeur probable |

### 4. Cross-Intelligence Correlation

Fusion multi-source pour détecter les patterns que chaque source seule ne voit pas :

```
Market anomaly + Conflict in country    → "market_manipulation" alert
Recon satellites + Conflict zone        → "surveillance_escalation" alert
Defense stocks up + No public conflict  → "insider_trading_suspicion" alert
Military aircraft + Civilian avoidance  → "military_buildup" alert
```

### Seuils Market Predictions (par scénario)

| Scénario | CL=F (Oil) | GC=F (Gold) | ^VIX | Confiance |
|----------|-----------|------------|------|-----------|
| Hormuz closure | +15-40% | +5-15% | +50-200% | 90% |
| Taiwan invasion | — | +10-25% | +200-400% | 85-90% |
| Suez blockage | +5-15% | — | — | 80% |
| Russia gas cutoff | +10-25% | — | — | 75-88% |

## Pertinence pour Harissa Banking

Ces patterns de détection de marché sont directement exploitables par
le DefeasibleReasoner de Harissa Banking pour :
1. Alertes sur les positions clients exposées aux commodités
2. Détection de transactions suspectes corrélées à des événements
3. Évaluation de risque de crédit en contexte géopolitique
