/**
 * GET /api/simulation/stream
 * 
 * Server-Sent Events (SSE) endpoint for streaming simulation results.
 * Streams each cascade step as it's computed, enabling real-time 
 * visualization in Quest XR's ReasoningVisualizer.
 * 
 * Query: ?scenarioId=sim-hormuz-closure
 * Response: text/event-stream with SimulationXREvent steps
 */

import { NextRequest } from "next/server";
import { runSimulation, SIMULATION_SCENARIOS } from "@/lib/engine/simulation-engine";
import { buildWorldModel } from "@/lib/engine/world-model";
import type { WorldModelInput } from "@/lib/engine/world-model";

export async function GET(request: NextRequest) {
  const scenarioId = request.nextUrl.searchParams.get("scenarioId");

  if (!scenarioId) {
    return new Response(
      JSON.stringify({ error: "scenarioId query parameter is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const scenario = SIMULATION_SCENARIOS.find((s) => s.id === scenarioId);
  if (!scenario) {
    return new Response(
      JSON.stringify({ error: `Scenario "${scenarioId}" not found` }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  // Build world model
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

  // Run simulation to get full result
  const result = runSimulation(scenario, worldModel);

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Helper to send SSE event
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      // 1. Send scenario metadata
      send("scenario", {
        id: scenario.id,
        name: scenario.name,
        description: scenario.description,
        overallSeverity: result.overallSeverity,
        probability: result.probability,
      });

      // 2. Stream timeline events with delays to simulate cascade propagation
      for (let i = 0; i < result.timeline.length; i++) {
        const event = result.timeline[i];
        const entity = worldModel.entities.get(event.entityId);

        send("cascade_step", {
          step: i + 1,
          total: result.timeline.length,
          timeOffset: event.timeOffset,
          entityId: event.entityId,
          entityName: event.entityName,
          entityType: entity?.type || "unknown",
          impact: event.impact,
          confidence: event.confidence,
          position: entity?.location || null,
        });

        // Small delay between steps for real-time feel
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      // 3. Send market predictions
      send("market_predictions", {
        predictions: result.marketPredictions.map((mp) => ({
          symbol: mp.symbol,
          name: mp.name,
          expectedChange: mp.expectedChange,
          direction: mp.direction,
          confidence: mp.confidence,
          timeframe: mp.timeframe,
        })),
      });

      // 4. Send affected entities summary
      send("affected_entities", {
        entities: result.affectedEntities.map((ae) => ({
          entityId: ae.entityId,
          entityName: ae.entityName,
          entityType: ae.entityType,
          previousStatus: ae.previousStatus,
          newStatus: ae.newStatus,
          impactDescription: ae.impactDescription,
          recoveryTime: ae.recoveryTime,
        })),
      });

      // 5. Send narrative
      send("narrative", {
        text: result.narrative,
      });

      // 6. Signal completion
      send("complete", {
        scenarioId: scenario.id,
        totalSteps: result.timeline.length,
        totalEntities: result.affectedEntities.length,
        timestamp: new Date().toISOString(),
      });

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
