# CLAUDE.md — Satellite-Spy
# OSINT Intelligence & Geopolitical Monitoring Platform
# Madgic · by Majdi Ghrouel

## Project Overview
Satellite-Spy is a full-stack intelligence platform providing real-time
satellite tracking, geopolitical event monitoring (GDELT/ACLED), aircraft
tracking, market correlation, and AI-powered OSINT analysis.

## Architecture
- Next.js 15 + React 19 + CesiumJS 1.124 + Resium
- 9 API routes (satellites, aircraft, GDELT, ACLED, disasters, economic, market, LLM, simulation)
- 4 engines: WorldModel (21 entities), SimulationEngine (6 scenarios), DecisionEngine, CrossIntelligence
- Zustand store with 8 data sources
- 152 tests across 9 suites

## Key Commands
```bash
npm install
npm run dev        # Next.js on http://localhost:3000
npm run test       # Run 152 tests
npm run build      # Production build
```

## Environment (.env.local)
- CESIUM_ION_TOKEN — CesiumJS globe rendering
- OPENROUTER_API_KEY — LLM analysis

## Coding Standards
- Next.js App Router (src/app/)
- React 19 + TypeScript strict
- Zustand for state, Tailwind for styles
- API routes: src/app/api/{resource}/route.ts
- All routes support ?format=quantum for QuantumData output

## Git
- Branches: feature/*, fix/*, docs/*, claude/*
- Commits: Conventional Commits
- NEVER push directly to main

## Session Output
Each session MUST produce `.madgic/SESSION_RESULT.md`:
- DELIVERED, TESTED, BLOCKS, next-action

## Cross-Project Coordination
- Shared: `C:\Users\majdi\Dropbox (Personal)\madgic_shared\`
- Exports to Quest XR: WorldModel ontology, SimulationEngine, GeoEventQuantumData
- Exports to Masar: geopolitical risk feed (planned)
- Design system: Maqam colors integrated (truth_layer + severity)

## ADR-013 — Living System Protocol
After each task, write AGENT_SIGNAL in `.madgic/REFLEXIONS.md`:
```
## AGENT_SIGNAL — [AGENT] — [DATE]
### SANTE : Confiance [1-5] — [why]
### LIMITES OBSERVEES : [what was missing]
### PATTERNS OBSERVES : [recurring issues]
### SUGGESTIONS : [improvements with effort/impact]
### BESOIN DE FEEDBACK : [questions to humans/agents]
```

## DO NOT
- Create new architecture documents
- Modify other projects without COORDINATION.md update
- Skip tests (152 must pass)
- Push directly to main
