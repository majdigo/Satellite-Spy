# Satellite-Spy — Coding Standards

## TypeScript / Next.js
- Next.js 15 App Router (src/app/)
- React 19 + functional components + hooks
- Zustand for state management
- Tailwind CSS for styling
- Strict TypeScript

## Naming
- Components: `PascalCase.tsx` (e.g. `GlobeViewer.tsx`)
- Hooks: `use{Name}.ts` (e.g. `useDataFetcher.ts`)
- API routes: `src/app/api/{resource}/route.ts`
- Lib modules: `camelCase.ts` or `PascalCase.ts` for classes

## API Route Pattern
```typescript
// src/app/api/{resource}/route.ts
export async function GET(request: NextRequest) { ... }
export async function POST(request: NextRequest) { ... }
```

## QuantumData Format
All API routes support `?format=quantum` to return QuantumData-formatted responses.

## Git
- Branches: `feature/*`, `fix/*`, `docs/*`, `claude/*`
- Commits: Conventional Commits (`feat:`, `fix:`, `docs:`)
- Never push directly to `main`

## Ports
- App: **3000** (Next.js dev server)

## Environment
Required in `.env.local`:
- `CESIUM_ION_TOKEN` — CesiumJS globe
- `OPENROUTER_API_KEY` — LLM analysis
