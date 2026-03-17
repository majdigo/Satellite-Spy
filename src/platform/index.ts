/**
 * @madgic/satellite-platform
 *
 * Spatial Intelligence SDK — extractable components from Satellite-Spy
 * for use by other Madgic projects (Quest XR, Masar AI, Harissa Banking).
 */

// World Model — graph-based digital twin of geopolitical reality
export type {
  WorldModel,
  WorldModelInput,
  WorldEntity,
  EntityType,
  EntityMetric,
  WorldRelation,
  RelationType,
  CausalChain,
  CausalStep,
} from '../lib/engine/world-model'
export { buildWorldModel } from '../lib/engine/world-model'

// Simulation Engine — what-if scenario calculations
export type {
  SimulationScenario,
  SimulationTrigger,
  SimulationResult,
  SimulationEvent,
  EntityImpact,
  MarketPrediction,
} from '../lib/engine/simulation-engine'
export { runSimulation, SIMULATION_SCENARIOS } from '../lib/engine/simulation-engine'

// Decision Engine — transforms signals into actionable decision packages
export type {
  Decision,
  DecisionUrgency,
  DecisionDomain,
  ImpactAssessment,
  RecommendedAction,
  Evidence,
  DecisionEngineInput,
} from '../lib/engine/decision-engine'
export { generateDecisions } from '../lib/engine/decision-engine'

// AI Plugin System — extensible AI capabilities
export {
  AIPlugin,
  RuleBasedAnalysisPlugin,
  RemoteAIPlugin,
  aiRegistry,
} from '../lib/ai/plugin-system'
