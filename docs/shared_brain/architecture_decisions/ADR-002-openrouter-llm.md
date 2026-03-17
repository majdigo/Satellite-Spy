# ADR-002 — OpenRouter as Shared LLM Gateway

**Projet** : Satellite-Spy  
**Date** : 2026-03-16  
**Status** : Accepted  

## Contexte

Satellite-Spy utilise un LLM pour l'analyse d'intelligence avancée
(hypothèses, détection insider trading, raisonnement cross-domaine).
Harissa Banking et Maqam Architect utilisent déjà OpenRouter.

## Décision

Utiliser OpenRouter (`https://openrouter.ai/api/v1`) comme gateway LLM partagé
avec la même clé API que les autres projets Madgic.

### Configuration

```env
OPENROUTER_API_KEY=sk-or-v1-[clé partagée]
```

### Modèle par défaut

`google/gemini-2.0-flash-001` — même que Masar AI et Harissa Banking.

## Conséquences

- **Un seul compte** pour tous les projets Madgic
- **Facturation centralisée** et monitoring via OpenRouter dashboard
- **Fallback gracieux** : si la clé est absente, `RuleBasedAnalysisPlugin` prend le relais
- **Modèle interchangeable** : OpenRouter supporte 100+ modèles, switch sans code change
