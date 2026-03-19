# Satellite-Spy — Sprint Backlog

**Sprint**: Post Phase 1  
**Updated**: 2026-03-19

## ✅ Completed

| # | Feature | Branch | Tests |
|---|---------|--------|-------|
| 3 | EventBus integration | `feature/eventbus-integration` | +16 |
| 4 | Logistics entities (fleet, warehouse, shipment, route) | `feature/logistics-entities` | +14 |
| 5 | Simulation export API (POST + SSE) | `feature/simulation-export-ws` | +15 |

## 🔄 In Progress

| # | Feature | Branch | Priority |
|---|---------|--------|----------|
| 6 | Shared brain updates | `feature/shared-brain-update` | Continuous |

## 📋 Next Up

| # | Feature | Priority | Notes |
|---|---------|----------|-------|
| — | QA UAT testing | 🔴 HIGH | QA free after Quest; deploy on port 3000 |
| — | EventBus → WebSocket bridge | MEDIUM | For Quest XR cross-project events |
| — | LLMService structured integration | MEDIUM | From Masar AI |
| — | Scene graph abstract layer | LOW | From Quest XR |
| — | Document extraction integration | LOW | From Prime-SPA |

## Git Workflow

```
main (uat-v1.4)
├── claude/satellite-simulator-project-xPivH  ← active dev
│   ├── feature/eventbus-integration     ✅ merged
│   ├── feature/logistics-entities       ✅ merged
│   ├── feature/simulation-export-ws     ✅ merged
│   └── feature/shared-brain-update      🔄 continuous
```

## Rules
- UAT environment (main, tagged) does **NOT** move
- Dev on feature branches only
- 131 tests must pass before any merge
- Update `.madgic/` after each action
