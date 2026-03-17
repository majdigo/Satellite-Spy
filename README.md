# Satellite Spy 🛰️

**Spatial Intelligence Dashboard** — Real-time geopolitical surveillance platform combining satellite tracking, conflict monitoring, market correlation, and AI-powered intelligence analysis.

## Architecture

```
CesiumJS Globe ← Zustand Store → useDataFetcher (8 live feeds)
                                    ├── CelesTrak (satellites)
     4 Engines:                     ├── OpenSky (aircraft)
     WorldModel                     ├── ACLED (conflicts)
     SimulationEngine               ├── GDELT (media events)
     DecisionEngine                 ├── USGS/ReliefWeb (disasters)
     CrossIntelligence              ├── Yahoo Finance (24 symbols)
                                    ├── World Bank (economic)
     AI Layer:                      └── OpenRouter (LLM analysis)
     Rule-based (built-in)
     Remote LLM (optional)
```

## Quick Start

```bash
# 1. Install
npm install

# 2. Configure (copy and edit)
cp .env.example .env.local

# 3. Required: CesiumJS token (free at https://cesium.com/ion/tokens)
#    Set NEXT_PUBLIC_CESIUM_ION_TOKEN in .env.local

# 4. Launch
npm run dev
# → http://localhost:3000
```

### API Keys (optional — all have fallbacks)

| Service | Key | Fallback if absent |
|---------|-----|--------------------|
| **CesiumJS Ion** | `NEXT_PUBLIC_CESIUM_ION_TOKEN` | ⚠️ Globe won't render |
| OpenRouter LLM | `OPENROUTER_API_KEY` | Rule-based analysis |
| ACLED | `ACLED_API_KEY` + `ACLED_EMAIL` | Empty conflict data |
| OpenSky | `OPENSKY_USERNAME` + `OPENSKY_PASSWORD` | No aircraft tracking |
| Yahoo Finance | — (no key needed) | Simulated market data |
| GDELT | — (open access) | — |

## Tech Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS
- **3D Globe**: CesiumJS + Resium
- **Satellite Math**: satellite.js (SGP4/SDP4 propagation)
- **State**: Zustand
- **Charts**: Recharts
- **Tests**: Jest (86 tests, 5 suites)
- **Shaders**: GLSL (night vision, thermal/FLIR)

## Key Features

- **Real-time satellite tracking** (CelesTrak TLE → SGP4 propagation)
- **Cross-intelligence correlation** (market × conflict × satellite × aircraft)
- **6 what-if simulation scenarios** (Hormuz, Taiwan, Suez, Russia gas, Iran, Ukraine)
- **AI analysis** (OpenRouter LLM + rule-based fallback)
- **OSINT report generation** (structured intelligence brief export)
- **Visual filters** (night vision, thermal, CRT, classified)

## Tests

```bash
npm test          # 86 tests, 5 suites, ~1.2s
```

## Project Structure

```
src/
├── app/          # Next.js pages + 9 API routes
├── components/   # 18 React components (globe, panels, dashboard)
├── hooks/        # useDataFetcher (8 polling loops)
├── lib/          # Core engines + API clients
│   ├── ai/       # AI plugin system
│   ├── api/      # Data fetching + intelligence algorithms
│   ├── engine/   # WorldModel, SimulationEngine, DecisionEngine
│   └── utils/    # Helpers
├── platform/     # @madgic/satellite-platform (extractable SDK)
├── shaders/      # GLSL post-processing (NV, thermal)
├── store/        # Zustand state management
└── types/        # TypeScript interfaces (510 LOC, 30+ types)
```

## Part of Madgic

Satellite-Spy is part of the [Madgic](https://github.com/majdigo) portfolio. See `docs/shared_brain/REGISTRY.md` for cross-project contributions.
