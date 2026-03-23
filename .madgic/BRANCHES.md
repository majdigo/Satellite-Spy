# Satellite-Spy — Branch Strategy

## Convention
- `main` — production-ready, protected
- `feature/{topic}` — new features
- `fix/{bug}` — bug fixes
- `docs/{topic}` — documentation
- `claude/{session}` — agent work branches

## Active Branches
| Branch | Purpose | Owner | Status |
|--------|---------|-------|--------|
| claude/satellite-simulator-project-xPivH | Agent dev | Claude | Active |
| feature/sprint1-gdelt-resilience | Sprint 1 work | Claude | Merged |
| feature/cross-intelligence | Correlation engine | Claude | Merged |

## Merge Rules
- Never push directly to `main`
- All features via PR
- Agent branches (claude/*) require review before merge to main
