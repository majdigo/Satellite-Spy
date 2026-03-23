# Satellite-Spy — Team Operating Model

## Branch strategy
- `feature/<topic>`
- `fix/<bug>`
- `docs/<topic>`
- `release/vX.Y.Z`

## Review gates
- update `.madgic/STATUS.md` or session result for meaningful changes
- no merge of UI changes without at least one review
- keep geospatial and intelligence assumptions explicit in docs

## Validation baseline
- run Jest tests when present
- run Next.js lint/build checks before merge when feasible
- document manual validation when tests are missing

## Cross-project discipline
- coordinate with Quest for 3D/spatial handoff
- coordinate with Robotics for drone/twin/terrain overlaps
