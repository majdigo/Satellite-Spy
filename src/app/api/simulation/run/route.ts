/**
 * POST /api/simulation/run
 * 
 * Runs a what-if simulation scenario and returns the result in a format
 * compatible with Quest XR (SimulationXREvent).
 * 
 * Body: { scenarioId: string }
 * Response: SimulationXREvent
 */

import { NextResponse } from "next/server";
import { runSimulation, SIMULATION_SCENARIOS } from "@/lib/engine/simulation-engine";
import { buildWorldModel } from "@/lib/engine/world-model";
import type { WorldModelInput } from "@/lib/engine/world-model";

// SimulationXREvent — the format Quest XR consumes
interface SimulationXREvent {
  type: "simulation_result";
  scenarioId: string;
  scenarioName: string;
  overallSeverity: string;
  probability: number;
  narrative: string;
  timeline: Array<{
    timeOffset: string;
    entityName: string;
    entityType: string;
    impact: string;
    confidence: number;
    position?: { lat: number; lon: number };
  }>;
  marketPredictions: Array<{
    symbol: string;
    name: string;
    expectedChange: string;
    direction: string;
    confidence: number;
    timeframe: string;
  }>;
  affectedEntities: Array<{
    entityId: string;
    entityName: string;
    entityType: string;
    previousStatus: string;
    newStatus: string;
    impactDescription: string;
    recoveryTime: string;
  }>;
  timestamp: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { scenarioId } = body;

    if (!scenarioId) {
      return NextResponse.json(
        { error: "scenarioId is required" },
        { status: 400 }
      );
    }

    // Find the scenario
    const scenario = SIMULATION_SCENARIOS.find((s) => s.id === scenarioId);
    if (!scenario) {
      return NextResponse.json(
        {
          error: `Scenario "${scenarioId}" not found`,
          availableScenarios: SIMULATION_SCENARIOS.map((s) => ({
            id: s.id,
            name: s.name,
            description: s.description,
          })),
        },
        { status: 404 }
      );
    }

    // Build a minimal world model for the simulation
    const emptyInput: WorldModelInput = {
      conflicts: [],
      gdeltEvents: [],
      satellites: [],
      aircraft: [],
      disasters: [],
      marketData: [],
      marketAnomalies: [],
      economicIndicators: [],
      crossIntelAlerts: [],
    };

    const worldModel = buildWorldModel(emptyInput);

    // Run the simulation
    const result = runSimulation(scenario, worldModel);

    // Map entities to include positions
    const entityPositions = new Map<string, { lat: number; lon: number }>();
    for (const [, entity] of worldModel.entities) {
      if (entity.location) {
        entityPositions.set(entity.id, entity.location);
      }
    }

    // Transform to XR-compatible format
    const xrEvent: SimulationXREvent = {
      type: "simulation_result",
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      overallSeverity: result.overallSeverity,
      probability: result.probability,
      narrative: result.narrative,
      timeline: result.timeline.map((event) => {
        const entity = worldModel.entities.get(event.entityId);
        return {
          timeOffset: event.timeOffset,
          entityName: event.entityName,
          entityType: entity?.type || "unknown",
          impact: event.impact,
          confidence: event.confidence,
          position: entity?.location || undefined,
        };
      }),
      marketPredictions: result.marketPredictions.map((mp) => ({
        symbol: mp.symbol,
        name: mp.name,
        expectedChange: mp.expectedChange,
        direction: mp.direction,
        confidence: mp.confidence,
        timeframe: mp.timeframe,
      })),
      affectedEntities: result.affectedEntities,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(xrEvent);
  } catch (error) {
    console.error("Simulation error:", error);
    return NextResponse.json(
      { error: "Failed to run simulation", details: String(error) },
      { status: 500 }
    );
  }
}

// GET — list available scenarios
export async function GET() {
  return NextResponse.json({
    scenarios: SIMULATION_SCENARIOS.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      severity: s.trigger.severity,
      triggerType: s.trigger.type,
    })),
    count: SIMULATION_SCENARIOS.length,
  });
}
