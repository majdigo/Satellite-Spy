# Satellite-Spy — Architecture

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 + React 19 |
| 3D Globe | CesiumJS + Resium |
| State | Zustand |
| Charts | Recharts |
| Satellite Math | satellite.js (SGP4/SDP4) |
| Styling | TailwindCSS |
| Tests | Jest + Testing Library |
| Shaders | GLSL (night vision, thermal, CRT) |

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│  CesiumJS Globe ← Zustand Store → useDataFetcher       │
│                                    ├── CelesTrak (sats) │
│  4 Engines:                        ├── OpenSky (acft)   │
│  ├── WorldModel (589 LOC)          ├── ACLED (conflicts)│
│  ├── SimulationEngine (16K bytes)  ├── GDELT (media)    │
│  ├── DecisionEngine (14K bytes)    ├── USGS/ReliefWeb   │
│  └── CrossIntelligence             ├── Yahoo Finance    │
│                                    ├── World Bank       │
│  EventBus (134 LOC)                └── OpenRouter (LLM) │
│  Platform SDK (barrel)                                  │
└─────────────────────────────────────────────────────────┘
```

## Source Organization

```
src/
├── __tests__/          8 test files (131 tests)
├── app/
│   ├── api/            11 API routes
│   ├── page.tsx        Main dashboard
│   └── layout.tsx      Root layout
├── components/
│   ├── dashboard/      4 (TopBar, Sidebar, BottomBar, CriticalAlertBanner)
│   ├── filters/        1 (VisualFilters)
│   ├── globe/          1 (GlobeViewer)
│   ├── layers/         1 (LayerControl)
│   ├── panels/         13 intelligence/data panels
│   └── ui/             1 (ErrorBoundary)
├── hooks/              2 (useDataFetcher, useEventBus)
├── lib/
│   ├── ai/             1 (plugin-system)
│   ├── api/            8 data-fetching + intelligence
│   ├── engine/         3 (WorldModel, SimulationEngine, DecisionEngine)
│   ├── event-bus/      1 (EventBus singleton)
│   ├── platform/       1 (barrel SDK export)
│   └── utils/          helpers
├── platform/           extractable SDK
├── shaders/            GLSL post-processing
├── store/              Zustand slices
└── types/              TypeScript interfaces (30+ types)
```

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/satellites` | GET | CelesTrak TLE → SGP4 positions |
| `/api/aircraft` | GET | OpenSky real-time ADS-B |
| `/api/acled` | GET | ACLED conflict events |
| `/api/gdelt` | GET | GDELT media monitoring |
| `/api/disasters` | GET | USGS + ReliefWeb |
| `/api/market` | GET | Yahoo Finance (24 symbols) |
| `/api/economic` | GET | World Bank indicators |
| `/api/llm-analysis` | POST | OpenRouter SENTINEL prompt |
| `/api/report` | POST | OSINT report generation |
| `/api/simulation/run` | POST | Simulation for Quest XR |
| `/api/simulation/stream` | GET | SSE simulation stream |
| `/api/globe-status` | GET | Globe health check |

## WorldModel Ontology

**17 Entity Types**: country, region, city, military_base, port, chokepoint, commodity, market, actor, satellite, aircraft, infrastructure, population, fleet, warehouse, shipment, route

**14 Relation Types**: depends_on, transports, threatens, monitors, trades, borders, supplies, controls, allied_with, hostile_to, impacts, stores_at, ships_via, delivers_to
