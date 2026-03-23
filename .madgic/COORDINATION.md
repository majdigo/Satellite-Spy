# Satellite-Spy — Cross-Project Coordination

**Last updated**: 2026-03-23

## Active Branches
| Project | Branch | Status |
|---------|--------|--------|
| Satellite-Spy | claude/satellite-simulator-project-xPivH | Active (agent) |
| Quest XR | master | Consumes WorldModel + events |
| madgic_shared | — (no git) | Provides QuantumData, design system |

## Cross-Project Tickets
| ID | Ticket | Owner | Status | Blocked by |
|----|--------|-------|--------|------------|
| S-001 | Export WorldModel ontology to Quest XR rooms | Satellite agent | DONE | — |
| S-002 | QuantumData format for GDELT events (?format=quantum) | Satellite agent | DONE | — |
| S-003 | Integrate Maqam design system (truth colors) | Satellite agent | DONE | — |
| S-004 | Feed geopolitical risk to Masar procurement | — | BACKLOG | Masar Sprint 0 |

## Shared Exports
| Module | Used by | Status |
|--------|---------|--------|
| WorldModel (21 entity types) | Quest XR | Exported |
| GeoEventQuantumData | Quest XR, madgic_shared | Exported |
| SimulationEngine (6 scenarios) | Quest XR | Available |
| Maqam design system integration | All projects | Integrated |

## Rules
- Update this file BEFORE touching cross-project code
- Check madgic_shared/DASHBOARD_MADGIC.md for portfolio state
