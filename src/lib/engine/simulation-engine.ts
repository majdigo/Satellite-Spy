// ============================================================================
// Satellite Spy — Simulation Engine
// ============================================================================
// "What-if" scenario simulation. Given a hypothetical event, calculate
// cascading impacts across the world model. This is the predictive layer.
// ============================================================================

import type { WorldModel, WorldEntity, CausalStep } from "./world-model";
import type { SeverityLevel } from "@/types";

// ============================================================================
// Simulation Types
// ============================================================================

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  // The hypothetical trigger event
  trigger: SimulationTrigger;
}

export interface SimulationTrigger {
  type: "entity_disruption" | "conflict_start" | "chokepoint_closure" | "commodity_shock" | "sanctions";
  targetEntityId: string;
  severity: SeverityLevel;
  parameters: Record<string, unknown>;
}

export interface SimulationResult {
  scenario: SimulationScenario;
  timestamp: Date;
  // Timeline of cascading impacts
  timeline: SimulationEvent[];
  // Entities affected with impact summary
  affectedEntities: EntityImpact[];
  // Market impact predictions
  marketPredictions: MarketPrediction[];
  // Overall severity assessment
  overallSeverity: SeverityLevel;
  // Probability estimate
  probability: number;
  // Narrative summary
  narrative: string;
}

export interface SimulationEvent {
  timeOffset: string;  // e.g., "T+0h", "T+6h", "T+48h"
  description: string;
  entityId: string;
  entityName: string;
  impact: "disrupted" | "stressed" | "cascading" | "critical" | "recovered";
  confidence: number;
}

export interface EntityImpact {
  entityId: string;
  entityName: string;
  entityType: string;
  previousStatus: string;
  newStatus: string;
  impactDescription: string;
  recoveryTime: string;
}

export interface MarketPrediction {
  symbol: string;
  name: string;
  expectedChange: string;  // e.g., "+10-30%"
  direction: "up" | "down" | "volatile";
  confidence: number;
  timeframe: string;
  historicalPrecedent?: string;
}

// ============================================================================
// Pre-built Simulation Scenarios
// ============================================================================

export const SIMULATION_SCENARIOS: SimulationScenario[] = [
  {
    id: "sim-hormuz-closure",
    name: "Strait of Hormuz Closure",
    description: "Iran closes the Strait of Hormuz to all tanker traffic",
    trigger: {
      type: "chokepoint_closure",
      targetEntityId: "chokepoint-hormuz",
      severity: "critical",
      parameters: { durationDays: 14, blockadeType: "naval" },
    },
  },
  {
    id: "sim-taiwan-invasion",
    name: "Taiwan Strait Military Action",
    description: "China initiates military operations in the Taiwan Strait",
    trigger: {
      type: "conflict_start",
      targetEntityId: "country-TWN",
      severity: "critical",
      parameters: { aggressor: "CHN", type: "amphibious_blockade" },
    },
  },
  {
    id: "sim-suez-blockage",
    name: "Suez Canal Blockage",
    description: "Suez Canal blocked to all traffic (military action or accident)",
    trigger: {
      type: "chokepoint_closure",
      targetEntityId: "chokepoint-suez",
      severity: "high",
      parameters: { durationDays: 7, cause: "military_or_accident" },
    },
  },
  {
    id: "sim-russia-gas-cutoff",
    name: "Russia Gas Supply Cutoff",
    description: "Russia cuts all natural gas exports to Europe",
    trigger: {
      type: "commodity_shock",
      targetEntityId: "commodity-natgas",
      severity: "critical",
      parameters: { affectedRegion: "Europe", reductionPercent: 100 },
    },
  },
  {
    id: "sim-iran-sanctions",
    name: "Maximum Pressure Iran Sanctions",
    description: "Total economic sanctions imposed on Iran by US + EU",
    trigger: {
      type: "sanctions",
      targetEntityId: "country-IRN",
      severity: "high",
      parameters: { type: "comprehensive", targetSectors: ["oil", "banking", "shipping"] },
    },
  },
  {
    id: "sim-ukraine-escalation",
    name: "Ukraine Conflict Major Escalation",
    description: "Major escalation in Ukraine including tactical weapon use",
    trigger: {
      type: "conflict_start",
      targetEntityId: "country-UKR",
      severity: "critical",
      parameters: { escalationType: "strategic", natolnvolvement: "indirect" },
    },
  },
];

// ============================================================================
// Simulation Engine — runs the what-if calculations
// ============================================================================

export function runSimulation(
  scenario: SimulationScenario,
  worldModel: WorldModel
): SimulationResult {
  const timeline: SimulationEvent[] = [];
  const affectedEntities: EntityImpact[] = [];
  const marketPredictions: MarketPrediction[] = [];

  const targetEntity = worldModel.entities.get(scenario.trigger.targetEntityId);

  // Phase 1: Immediate impact (T+0)
  if (targetEntity) {
    timeline.push({
      timeOffset: "T+0h",
      description: `${scenario.name}: ${targetEntity.name} directly affected`,
      entityId: targetEntity.id,
      entityName: targetEntity.name,
      impact: "critical",
      confidence: 95,
    });

    affectedEntities.push({
      entityId: targetEntity.id,
      entityName: targetEntity.name,
      entityType: targetEntity.type,
      previousStatus: targetEntity.status,
      newStatus: "critical",
      impactDescription: scenario.description,
      recoveryTime: estimateRecoveryTime(scenario.trigger.type, "critical"),
    });
  }

  // Phase 2: First-order cascade (T+1h to T+24h)
  const firstOrderRelations = worldModel.relations.filter(
    (r) => r.sourceId === scenario.trigger.targetEntityId || r.targetId === scenario.trigger.targetEntityId
  );

  for (const rel of firstOrderRelations) {
    const otherId = rel.sourceId === scenario.trigger.targetEntityId ? rel.targetId : rel.sourceId;
    const other = worldModel.entities.get(otherId);
    if (!other) continue;

    const impact = rel.strength > 0.7 ? "cascading" : "stressed";

    timeline.push({
      timeOffset: rel.strength > 0.7 ? "T+6h" : "T+12h",
      description: `${other.name}: ${rel.type.replace(/_/g, " ")} link to ${targetEntity?.name || scenario.trigger.targetEntityId} disrupted`,
      entityId: otherId,
      entityName: other.name,
      impact,
      confidence: Math.round(rel.strength * 85),
    });

    affectedEntities.push({
      entityId: otherId,
      entityName: other.name,
      entityType: other.type,
      previousStatus: other.status,
      newStatus: impact === "cascading" ? "disrupted" : "stressed",
      impactDescription: `${rel.type.replace(/_/g, " ")} dependency on ${targetEntity?.name || "target"} (strength: ${(rel.strength * 100).toFixed(0)}%)`,
      recoveryTime: estimateRecoveryTime(scenario.trigger.type, impact),
    });

    // Phase 3: Second-order cascade (T+24h to T+7d)
    const secondOrder = worldModel.relations.filter(
      (r2) => (r2.sourceId === otherId || r2.targetId === otherId) &&
        r2.sourceId !== scenario.trigger.targetEntityId &&
        r2.targetId !== scenario.trigger.targetEntityId
    );

    for (const rel2 of secondOrder.slice(0, 3)) {
      const thirdId = rel2.sourceId === otherId ? rel2.targetId : rel2.sourceId;
      const third = worldModel.entities.get(thirdId);
      if (!third || affectedEntities.some((a) => a.entityId === thirdId)) continue;

      const combinedStrength = rel.strength * rel2.strength;
      if (combinedStrength < 0.3) continue;

      timeline.push({
        timeOffset: "T+48h",
        description: `${third.name}: second-order cascade via ${other.name}`,
        entityId: thirdId,
        entityName: third.name,
        impact: "stressed",
        confidence: Math.round(combinedStrength * 70),
      });

      affectedEntities.push({
        entityId: thirdId,
        entityName: third.name,
        entityType: third.type,
        previousStatus: third.status,
        newStatus: "stressed",
        impactDescription: `Indirect impact via ${other.name} → ${third.name} chain`,
        recoveryTime: estimateRecoveryTime(scenario.trigger.type, "stressed"),
      });
    }
  }

  // Generate market predictions based on scenario type
  marketPredictions.push(...generateMarketPredictions(scenario, worldModel));

  // Sort timeline chronologically
  timeline.sort((a, b) => {
    const aHours = parseTimeOffset(a.timeOffset);
    const bHours = parseTimeOffset(b.timeOffset);
    return aHours - bHours;
  });

  // Build narrative
  const narrative = buildNarrative(scenario, timeline, affectedEntities, marketPredictions);

  return {
    scenario,
    timestamp: new Date(),
    timeline,
    affectedEntities,
    marketPredictions,
    overallSeverity: scenario.trigger.severity,
    probability: estimateProbability(scenario, worldModel),
    narrative,
  };
}

// ============================================================================
// Market Prediction Generator
// ============================================================================

function generateMarketPredictions(
  scenario: SimulationScenario,
  _worldModel: WorldModel
): MarketPrediction[] {
  const predictions: MarketPrediction[] = [];

  switch (scenario.trigger.type) {
    case "chokepoint_closure":
      if (scenario.trigger.targetEntityId.includes("hormuz")) {
        predictions.push(
          { symbol: "CL=F", name: "Crude Oil", expectedChange: "+15-40%", direction: "up", confidence: 90, timeframe: "1-7 days", historicalPrecedent: "1990 Kuwait invasion: oil doubled in 3 months" },
          { symbol: "GC=F", name: "Gold", expectedChange: "+5-15%", direction: "up", confidence: 85, timeframe: "1-14 days", historicalPrecedent: "Traditional safe-haven surge" },
          { symbol: "^VIX", name: "VIX", expectedChange: "+50-200%", direction: "up", confidence: 88, timeframe: "1-3 days" },
          { symbol: "LMT", name: "Lockheed Martin", expectedChange: "+5-15%", direction: "up", confidence: 80, timeframe: "1-5 days" },
        );
      } else if (scenario.trigger.targetEntityId.includes("suez")) {
        predictions.push(
          { symbol: "CL=F", name: "Crude Oil", expectedChange: "+5-15%", direction: "up", confidence: 80, timeframe: "1-14 days", historicalPrecedent: "2021 Ever Given: oil +3% in days" },
          { symbol: "NG=F", name: "Natural Gas", expectedChange: "+5-10%", direction: "up", confidence: 70, timeframe: "1-7 days" },
        );
      }
      break;

    case "conflict_start":
      if (scenario.trigger.targetEntityId.includes("TWN")) {
        predictions.push(
          { symbol: "^GSPC", name: "S&P 500", expectedChange: "-10-25%", direction: "down", confidence: 85, timeframe: "1-30 days", historicalPrecedent: "Worst-case geopolitical shock" },
          { symbol: "^VIX", name: "VIX", expectedChange: "+200-400%", direction: "up", confidence: 90, timeframe: "1-5 days" },
          { symbol: "GC=F", name: "Gold", expectedChange: "+10-25%", direction: "up", confidence: 88, timeframe: "1-30 days" },
          { symbol: "USDCNY=X", name: "USD/CNY", expectedChange: "+5-15%", direction: "up", confidence: 82, timeframe: "1-14 days" },
        );
      } else if (scenario.trigger.targetEntityId.includes("UKR")) {
        predictions.push(
          { symbol: "ZW=F", name: "Wheat", expectedChange: "+20-60%", direction: "up", confidence: 85, timeframe: "1-30 days", historicalPrecedent: "2022: wheat +60% after invasion" },
          { symbol: "NG=F", name: "Natural Gas", expectedChange: "+30-100%", direction: "up", confidence: 80, timeframe: "1-30 days" },
          { symbol: "GC=F", name: "Gold", expectedChange: "+5-15%", direction: "up", confidence: 82, timeframe: "1-14 days" },
        );
      }
      break;

    case "commodity_shock":
      predictions.push(
        { symbol: "NG=F", name: "Natural Gas", expectedChange: "+50-200%", direction: "up", confidence: 88, timeframe: "1-30 days", historicalPrecedent: "2022: EU gas prices +400% YoY" },
        { symbol: "CL=F", name: "Crude Oil", expectedChange: "+10-25%", direction: "up", confidence: 75, timeframe: "1-14 days" },
      );
      break;

    case "sanctions":
      predictions.push(
        { symbol: "CL=F", name: "Crude Oil", expectedChange: "+5-20%", direction: "up", confidence: 78, timeframe: "1-30 days", historicalPrecedent: "2018 Iran sanctions: oil +30%" },
        { symbol: "GC=F", name: "Gold", expectedChange: "+3-10%", direction: "up", confidence: 72, timeframe: "1-14 days" },
      );
      break;
  }

  return predictions;
}

// ============================================================================
// Helpers
// ============================================================================

function estimateRecoveryTime(triggerType: string, impact: string): string {
  if (impact === "critical") {
    switch (triggerType) {
      case "chokepoint_closure": return "7-30 days";
      case "conflict_start": return "Months-years";
      case "sanctions": return "Months-years";
      default: return "Weeks-months";
    }
  }
  if (impact === "cascading") return "7-14 days";
  if (impact === "disrupted") return "3-7 days";
  return "1-3 days";
}

function estimateProbability(scenario: SimulationScenario, worldModel: WorldModel): number {
  const entity = worldModel.entities.get(scenario.trigger.targetEntityId);
  if (!entity) return 15;

  // Base probability from entity status
  let prob = 10;
  if (entity.status === "critical") prob = 60;
  else if (entity.status === "disrupted") prob = 40;
  else if (entity.status === "stressed") prob = 25;

  // Adjust for nearby active relations
  const activeThreats = worldModel.relations.filter(
    (r) => (r.sourceId === entity.id || r.targetId === entity.id) &&
      (r.type === "threatens" || r.type === "hostile_to") &&
      r.active
  );
  prob += activeThreats.length * 10;

  return Math.min(85, prob);
}

function parseTimeOffset(offset: string): number {
  const match = offset.match(/T\+(\d+)h/);
  return match ? parseInt(match[1]) : 0;
}

function buildNarrative(
  scenario: SimulationScenario,
  timeline: SimulationEvent[],
  entities: EntityImpact[],
  markets: MarketPrediction[]
): string {
  const lines: string[] = [];

  lines.push(`SIMULATION: ${scenario.name}`);
  lines.push(`${scenario.description}\n`);

  lines.push(`TIMELINE OF EVENTS:`);
  for (const event of timeline.slice(0, 8)) {
    lines.push(`  ${event.timeOffset} — ${event.entityName}: ${event.description} [${event.impact.toUpperCase()}]`);
  }

  lines.push(`\nIMPACTED ENTITIES: ${entities.length}`);
  const critical = entities.filter((e) => e.newStatus === "critical");
  const disrupted = entities.filter((e) => e.newStatus === "disrupted");
  if (critical.length > 0) lines.push(`  Critical: ${critical.map((e) => e.entityName).join(", ")}`);
  if (disrupted.length > 0) lines.push(`  Disrupted: ${disrupted.map((e) => e.entityName).join(", ")}`);

  if (markets.length > 0) {
    lines.push(`\nMARKET PREDICTIONS:`);
    for (const m of markets) {
      lines.push(`  ${m.name} (${m.symbol}): ${m.expectedChange} [${m.confidence}% confidence]`);
      if (m.historicalPrecedent) lines.push(`    Precedent: ${m.historicalPrecedent}`);
    }
  }

  return lines.join("\n");
}
