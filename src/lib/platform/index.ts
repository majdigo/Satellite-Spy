/**
 * Satellite-Spy Platform SDK — Barrel Export
 * 
 * This file exposes the platform capabilities for cross-project consumption.
 * Import pattern: import { eventBus, buildWorldModel, runSimulation } from "@/lib/platform";
 */

// ============================================================================
// EventBus — Real-time data distribution
// ============================================================================
export { eventBus } from "@/lib/event-bus";
export type { EventMap, EventName } from "@/lib/event-bus";

// ============================================================================
// WorldModel — Geopolitical + Logistics ontology engine
// ============================================================================
export { buildWorldModel } from "@/lib/engine/world-model";
export type {
  WorldModel,
  WorldModelInput,
  WorldEntity,
  WorldRelation,
  EntityType,
  RelationType,
  EntityMetric,
  CausalChain,
  CausalStep,
} from "@/lib/engine/world-model";

// Re-export shared types
export type { SeverityLevel } from "@/types";

// ============================================================================
// SimulationEngine — What-if cascade propagation
// ============================================================================
export { runSimulation, SIMULATION_SCENARIOS } from "@/lib/engine/simulation-engine";

// ============================================================================
// Cross-Intelligence — Anomaly detection + pattern matching
// ============================================================================
export {
  generateCrossIntelligenceAlerts,
  detectMarketAnomalies,
  detectTemporalAnomalies,
  detectSatelliteSurveillancePatterns,
  detectMilitaryAircraftPatterns,
  recordMarketSnapshot,
} from "@/lib/api/cross-intelligence";

// ============================================================================
// Scenario Patterns — Real-world pattern definitions
// ============================================================================
export { matchScenarioPatterns, SCENARIO_PATTERNS } from "@/lib/api/scenario-patterns";
