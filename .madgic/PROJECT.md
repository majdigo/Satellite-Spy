# Satellite-Spy — Project Card

| Field | Value |
|-------|-------|
| **Name** | Satellite-Spy (Intelligence Géopolitique) |
| **Owner** | Majdi Ghrouel — Madgic portfolio |
| **Version** | v0.3.0 |
| **Phase** | Sprint 1 complete, consolidation signed off |
| **Role** | **OSINT Intelligence Platform** — real-time geopolitical monitoring, satellite tracking, risk analysis |
| **Priority** | #5 in portfolio |

## Stack

| Layer | Tech | Port |
|-------|------|------|
| Frontend | Next.js 15 + React 19 + CesiumJS 1.124 + Resium | 3000 |
| API Routes | Next.js API (9 endpoints) | 3000 |
| Data Sources | GDELT, ACLED, CelesTrak, OpenSky, Yahoo Finance | — |
| AI | OpenRouter (LLM analysis) | — |
| State | Zustand | — |

## Key Features
- Real-time satellite tracking (SGP4 propagation)
- Live aircraft tracking (OpenSky)
- GDELT/ACLED geopolitical event monitoring
- Cross-intelligence correlation (4 algorithms)
- What-if simulation (6 scenarios)
- AI-powered OSINT report generation

## Consumers / Dependencies
- Provides: WorldModel ontology, SimulationEngine, GeoEventQuantumData to Quest XR
- Depends on: madgic_shared (QuantumData, design system)
- Future: Prime-SPA (document feeds), Masar (KSA procurement risk)

## Startup
```bash
npm run dev
# Opens on http://localhost:3000
# Requires: CESIUM_ION_TOKEN, OPENROUTER_API_KEY in .env.local
```
