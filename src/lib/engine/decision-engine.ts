// ============================================================================
// Satellite Spy — Decision Engine
// ============================================================================
// Transforms raw intelligence signals into actionable decision packages.
// This is the "action layer" — not just what's happening, but what to DO.
// ============================================================================

import type { WorldModel, CausalChain, CausalStep, WorldEntity } from "./world-model";
import type { CrossIntelligenceAlert, SeverityLevel } from "@/types";
import type { ScenarioMatch } from "@/lib/api/scenario-patterns";

// ============================================================================
// Decision Types
// ============================================================================

export type DecisionUrgency = "immediate" | "urgent" | "monitor" | "routine";
export type DecisionDomain = "military" | "economic" | "humanitarian" | "diplomatic" | "logistics" | "intelligence";

export interface Decision {
  id: string;
  title: string;
  urgency: DecisionUrgency;
  domain: DecisionDomain;
  severity: SeverityLevel;
  // The situation
  situation: string;
  // Impact assessment
  impact: ImpactAssessment;
  // Recommended actions
  actions: RecommendedAction[];
  // What happens if we do nothing
  inactionRisk: string;
  // Supporting evidence
  evidence: Evidence[];
  // Causal chain if applicable
  causalChain?: CausalChain;
  // Time window for action
  decisionWindow: string;
  // Confidence in assessment
  confidence: number;
  timestamp: Date;
}

export interface ImpactAssessment {
  scope: "local" | "regional" | "global";
  affectedEntities: string[];
  estimatedCost?: string;
  populationAffected?: string;
  supplyChainImpact?: string;
  marketImpact?: string;
}

export interface RecommendedAction {
  priority: number;
  action: string;
  rationale: string;
  domain: DecisionDomain;
  resources?: string;
  timeframe: string;
  risk: "low" | "medium" | "high";
}

export interface Evidence {
  source: string;
  description: string;
  confidence: number;
  timestamp: string;
}

// ============================================================================
// Decision Engine
// ============================================================================

export interface DecisionEngineInput {
  worldModel: WorldModel;
  crossIntelAlerts: CrossIntelligenceAlert[];
  scenarioMatches: ScenarioMatch[];
}

export function generateDecisions(input: DecisionEngineInput): Decision[] {
  const decisions: Decision[] = [];
  const { worldModel, crossIntelAlerts, scenarioMatches } = input;

  // --- 1. Decisions from causal chains (cascade risks) ---
  for (const chain of worldModel.causalChains) {
    const decision = buildCascadeDecision(chain, worldModel);
    if (decision) decisions.push(decision);
  }

  // --- 2. Decisions from scenario pattern matches ---
  for (const match of scenarioMatches) {
    decisions.push(buildScenarioDecision(match));
  }

  // --- 3. Decisions from critical cross-intel alerts ---
  const criticalAlerts = crossIntelAlerts.filter(
    (a) => a.severity === "critical" || (a.severity === "high" && a.suspicionLevel === "high")
  );
  for (const alert of criticalAlerts.slice(0, 5)) {
    decisions.push(buildAlertDecision(alert));
  }

  // --- 4. Decisions from entity status (disrupted infrastructure, etc.) ---
  for (const [, entity] of worldModel.entities) {
    if (entity.status === "critical" && entity.type === "chokepoint") {
      decisions.push(buildChokepointDecision(entity, worldModel));
    }
  }

  // Deduplicate by similar titles
  const seen = new Set<string>();
  const unique = decisions.filter((d) => {
    const key = d.title.substring(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by urgency then severity
  const urgencyOrder: Record<DecisionUrgency, number> = { immediate: 4, urgent: 3, monitor: 2, routine: 1 };
  const sevOrder: Record<SeverityLevel, number> = { critical: 4, high: 3, medium: 2, low: 1 };

  return unique.sort(
    (a, b) => urgencyOrder[b.urgency] - urgencyOrder[a.urgency] || sevOrder[b.severity] - sevOrder[a.severity]
  ).slice(0, 20);
}

// ============================================================================
// Decision Builders
// ============================================================================

function buildCascadeDecision(chain: CausalChain, worldModel: WorldModel): Decision | null {
  if (chain.steps.length < 2) return null;

  const trigger = chain.steps[0];
  const cascades = chain.steps.slice(1);
  const affectedNames = cascades.map((s) => s.entityName);

  return {
    id: `dec-cascade-${chain.id}`,
    title: `CASCADE RISK: ${trigger.entityName} disruption`,
    urgency: chain.severity === "critical" ? "immediate" : "urgent",
    domain: determineDomain(trigger.entityName),
    severity: chain.severity,
    situation: `${trigger.entityName} is ${trigger.impact}. This creates cascade risk to ${affectedNames.length} dependent entities: ${affectedNames.join(", ")}.`,
    impact: {
      scope: cascades.length > 3 ? "global" : cascades.length > 1 ? "regional" : "local",
      affectedEntities: affectedNames,
      supplyChainImpact: cascades.some((s) => s.impact === "cascading")
        ? "Major supply chain disruption expected"
        : "Moderate supply chain stress",
    },
    actions: cascades.map((step, i) => ({
      priority: i + 1,
      action: generateAction(step),
      rationale: `${step.entityName} at risk — ${step.description}`,
      domain: determineDomain(step.entityName),
      timeframe: step.timeframe,
      risk: step.probability > 0.7 ? "high" : step.probability > 0.4 ? "medium" : "low",
    })),
    inactionRisk: `If no action taken within ${chain.totalTimeframe}, cascade could affect ${affectedNames.join(", ")} with ${Math.round(chain.confidence)}% probability.`,
    evidence: chain.steps.map((s) => ({
      source: "World Model",
      description: s.description,
      confidence: Math.round(s.probability * 100),
      timestamp: new Date().toISOString(),
    })),
    causalChain: chain,
    decisionWindow: chain.totalTimeframe,
    confidence: chain.confidence,
    timestamp: new Date(),
  };
}

function buildScenarioDecision(match: ScenarioMatch): Decision {
  const { pattern, matchPercentage, matchedTriggers, totalTriggers } = match;

  return {
    id: `dec-scenario-${pattern.id}-${Date.now()}`,
    title: `SCENARIO ACTIVE: ${pattern.name}`,
    urgency: matchPercentage > 80 ? "immediate" : matchPercentage > 60 ? "urgent" : "monitor",
    domain: scenarioDomain(pattern.category),
    severity: pattern.severity,
    situation: `${pattern.description}\n\n${matchedTriggers}/${totalTriggers} triggers active (${matchPercentage}% match). Historical precedents suggest this pattern leads to: ${pattern.expectedOutcome}`,
    impact: {
      scope: pattern.involvedRegions.length > 2 ? "global" : "regional",
      affectedEntities: pattern.involvedRegions.map((r) => `Region: ${r}`),
      marketImpact: `Symbols at risk: ${pattern.affectedSymbols.join(", ")}`,
    },
    actions: [
      {
        priority: 1,
        action: `Increase monitoring of ${pattern.involvedRegions.join(", ")} regions`,
        rationale: `Scenario at ${matchPercentage}% — historical precedents show significant impact`,
        domain: "intelligence",
        timeframe: "Immediate",
        risk: "low",
      },
      {
        priority: 2,
        action: `Assess exposure to ${pattern.affectedSymbols.slice(0, 3).join(", ")}`,
        rationale: pattern.expectedOutcome,
        domain: "economic",
        timeframe: "24h",
        risk: "medium",
      },
      {
        priority: 3,
        action: `Prepare contingency for ${pattern.name} full activation`,
        rationale: `${totalTriggers - matchedTriggers} remaining triggers could activate`,
        domain: scenarioDomain(pattern.category),
        timeframe: "48h",
        risk: "medium",
      },
    ],
    inactionRisk: `If pattern reaches 100% match, historical precedents indicate: ${pattern.historicalExamples[0] || pattern.expectedOutcome}`,
    evidence: match.signals.map((s) => ({
      source: s.source,
      description: s.description,
      confidence: s.severity === "high" ? 85 : s.severity === "critical" ? 95 : 65,
      timestamp: s.timestamp,
    })),
    decisionWindow: matchPercentage > 80 ? "6-24h" : "24-72h",
    confidence: Math.min(95, matchPercentage + 10),
    timestamp: new Date(),
  };
}

function buildAlertDecision(alert: CrossIntelligenceAlert): Decision {
  return {
    id: `dec-alert-${alert.id}`,
    title: `ALERT: ${alert.title}`,
    urgency: alert.severity === "critical" ? "immediate" : "urgent",
    domain: alertDomain(alert.category),
    severity: alert.severity,
    situation: alert.summary,
    impact: {
      scope: alert.countries.length > 2 ? "global" : "regional",
      affectedEntities: alert.countries,
      marketImpact: alert.marketImpact
        ? `${alert.marketImpact.symbols.join(", ")} — ${alert.marketImpact.direction} ${alert.marketImpact.magnitude}`
        : undefined,
    },
    actions: alert.recommendations.map((rec, i) => ({
      priority: i + 1,
      action: rec,
      rationale: `Based on cross-intelligence analysis (confidence: ${alert.confidence}%)`,
      domain: alertDomain(alert.category),
      timeframe: i === 0 ? "Immediate" : "24-48h",
      risk: alert.suspicionLevel === "very_high" ? "high" : "medium",
    })),
    inactionRisk: `Suspicion level: ${alert.suspicionLevel.toUpperCase()}. ${alert.narrative.substring(0, 200)}`,
    evidence: alert.signals.map((s) => ({
      source: s.source,
      description: s.description,
      confidence: s.severity === "critical" ? 90 : s.severity === "high" ? 75 : 60,
      timestamp: s.timestamp,
    })),
    decisionWindow: alert.severity === "critical" ? "1-6h" : "24h",
    confidence: alert.confidence,
    timestamp: new Date(),
  };
}

function buildChokepointDecision(entity: WorldEntity, worldModel: WorldModel): Decision {
  const dependents = worldModel.relations
    .filter((r) => r.targetId === entity.id || r.sourceId === entity.id)
    .map((r) => {
      const otherId = r.sourceId === entity.id ? r.targetId : r.sourceId;
      return worldModel.entities.get(otherId);
    })
    .filter(Boolean) as WorldEntity[];

  return {
    id: `dec-chokepoint-${entity.id}-${Date.now()}`,
    title: `CHOKEPOINT CRITICAL: ${entity.name}`,
    urgency: "immediate",
    domain: "logistics",
    severity: "critical",
    situation: `${entity.name} status is CRITICAL. ${entity.statusReason || "Major disruption detected."}. This chokepoint affects ${dependents.length} connected entities.`,
    impact: {
      scope: "global",
      affectedEntities: dependents.map((d) => d.name),
      supplyChainImpact: `Global trade through ${entity.name} at risk. Properties: ${JSON.stringify(entity.properties)}`,
    },
    actions: [
      {
        priority: 1,
        action: `Activate alternate routing plans bypassing ${entity.name}`,
        rationale: "Immediate chokepoint disruption requires rerouting",
        domain: "logistics",
        timeframe: "Immediate",
        risk: "high",
      },
      {
        priority: 2,
        action: "Assess inventory levels of affected commodities",
        rationale: "Determine how long reserves last without this supply route",
        domain: "economic",
        timeframe: "6h",
        risk: "medium",
      },
      {
        priority: 3,
        action: "Engage diplomatic channels for de-escalation",
        rationale: "Chokepoint disruptions often have geopolitical root causes",
        domain: "diplomatic",
        timeframe: "24h",
        risk: "medium",
      },
    ],
    inactionRisk: `${entity.name} disruption could cascade to ${dependents.map((d) => d.name).join(", ")}. Historical chokepoint closures have caused 10-40% commodity price spikes.`,
    evidence: entity.metrics.map((m) => ({
      source: "World Model",
      description: `${m.name}: ${m.value} ${m.unit} (${m.trend})`,
      confidence: 80,
      timestamp: new Date().toISOString(),
    })),
    decisionWindow: "1-12h",
    confidence: 85,
    timestamp: new Date(),
  };
}

// ============================================================================
// Helpers
// ============================================================================

function generateAction(step: CausalStep): string {
  switch (step.impact) {
    case "critical":
      return `CRITICAL: Activate emergency protocols for ${step.entityName}`;
    case "cascading":
      return `Prepare contingency: ${step.entityName} cascade risk — secure alternate supply`;
    case "disrupted":
      return `Monitor ${step.entityName} disruption — assess secondary impacts`;
    case "stressed":
      return `Increase monitoring of ${step.entityName} — early warning indicators active`;
    default:
      return `Monitor ${step.entityName}`;
  }
}

function determineDomain(entityName: string): DecisionDomain {
  const lower = entityName.toLowerCase();
  if (lower.includes("oil") || lower.includes("gas") || lower.includes("wheat") || lower.includes("gold") || lower.includes("semiconductor")) return "economic";
  if (lower.includes("strait") || lower.includes("canal") || lower.includes("port")) return "logistics";
  return "intelligence";
}

function scenarioDomain(category: string): DecisionDomain {
  switch (category) {
    case "energy_conflict":
    case "food_crisis":
      return "economic";
    case "defense_surge":
      return "military";
    case "sanctions":
      return "diplomatic";
    case "supply_chain":
      return "logistics";
    case "safe_haven":
    case "currency_crisis":
      return "economic";
    default:
      return "intelligence";
  }
}

function alertDomain(category: string): DecisionDomain {
  switch (category) {
    case "market_manipulation":
    case "insider_trading_suspicion":
    case "conflict_profiteering":
      return "economic";
    case "military_buildup":
    case "surveillance_escalation":
      return "military";
    case "sanctions_evasion":
      return "diplomatic";
    case "resource_warfare":
      return "economic";
    default:
      return "intelligence";
  }
}
