# ADR-001 — AI Plugin Architecture

**Projet** : Satellite-Spy  
**Date** : 2026-03-16  
**Status** : Accepted  
**Source** : `src/lib/ai/plugin-system.ts`

## Contexte

Satellite-Spy doit intégrer des capacités AI (classification d'événements,
détection d'anomalies, analyse corrélationnelle) tout en restant fonctionnel
sans clé API ou connexion réseau.

## Décision

Architecture plugin extensible avec deux niveaux :

### 1. RuleBasedAnalysisPlugin (built-in, toujours actif)
- Classification d'événements par regex (military, political, economic, etc.)
- Détection d'anomalies par z-score
- Analyse de corrélation (délègue à `correlation.ts`)
- **Aucune dépendance externe**

### 2. RemoteAIPlugin (optionnel, nécessite endpoint)
- Connecte à un LLM distant via HTTP
- Health check au démarrage → auto-disable si indisponible
- Supporte toute capacité : `event_classification`, `anomaly_detection`,
  `predictive_analysis`, `natural_language_query`, `report_summarization`,
  `imagery_analysis`

## Pattern

```typescript
AIPluginRegistry (singleton)
  ├── register(plugin)
  ├── getPluginsForCapability(capability)
  └── analyze(request) → first available plugin

AIPlugin (abstract)
  ├── RuleBasedAnalysisPlugin (built-in)
  └── RemoteAIPlugin (API-based, template)
```

## Conséquences

- L'app fonctionne toujours, même offline
- LLM = enrichissement, pas dépendance
- Pattern réutilisable par Maqam Architect (vibe analysis) et Quest XR (environment reasoning)

## Lien avec madgic_platform

Ce pattern pourrait alimenter `madgic_platform/agentic/BaseAgent` :
- `BaseAgent` = `AIPlugin` abstrait
- `RuleBasedAgent` = agent local, pas de LLM
- `LLMAgent` = agent distant via OpenRouter
