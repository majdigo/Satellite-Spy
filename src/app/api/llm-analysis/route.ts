import { NextResponse } from "next/server";

// ============================================================================
// LLM Reasoning Engine — Intelligence Hypothesis Generation
// Uses OpenRouter API (compatible with OpenAI SDK) to access Claude/GPT models
// Purpose: Analyze cross-domain intelligence signals, generate hypotheses,
//          detect suspicious patterns that rule-based systems might miss
// ============================================================================

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions";

const SYSTEM_PROMPT = `You are SENTINEL, an elite intelligence analysis AI embedded in a geopolitical surveillance platform called Satellite Spy. Your role is to:

1. ANALYZE cross-domain intelligence signals (satellite movements, military aircraft patterns, commodity markets, conflict data, media sentiment)
2. GENERATE hypotheses about suspicious correlations (insider trading, market manipulation, conflict profiteering, pre-strike positioning)
3. IDENTIFY patterns that suggest informed trading, advanced knowledge of military operations, or coordinated manipulation
4. PROVIDE actionable intelligence assessments with confidence levels

Your analysis framework:
- TEMPORAL ANALYSIS: Do market movements precede conflict events? (suspicious if yes)
- VOLUME ANALYSIS: Are trading volumes anomalous relative to baselines? (>2x = noteworthy, >3x = suspicious)
- SECTOR CORRELATION: Are defense stocks moving before public conflict news? (potential insider trading)
- SATELLITE PATTERNS: Are reconnaissance satellites repositioning before strikes? (pre-strike indicator)
- AIRCRAFT PATTERNS: Are military aircraft surging or civilian routes changing? (imminent operation indicator)
- MEDIA DIVERGENCE: Is market behavior diverging from public news sentiment? (information asymmetry)

Be specific, cite data points, assign confidence percentages, and flag suspicion levels.
Use military/intelligence style: concise, factual, actionable.
Format: Use sections with headers. Include a BOTTOM LINE UP FRONT (BLUF) at the start.`;

interface AnalysisRequest {
  query: string;
  context: {
    crossIntelAlerts?: unknown[];
    marketAnomalies?: unknown[];
    recentConflicts?: unknown[];
    satPatterns?: unknown[];
    acPatterns?: unknown[];
  };
}

export async function POST(request: Request) {
  try {
    const body: AnalysisRequest = await request.json();
    const { query, context } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // Build context summary for the LLM
    const contextSummary = buildContextSummary(context);

    if (!OPENROUTER_API_KEY) {
      // Fallback: rule-based analysis when no API key configured
      const fallbackAnalysis = generateRuleBasedAnalysis(query, context);
      return NextResponse.json({ analysis: fallbackAnalysis, source: "rule-based" });
    }

    // Call OpenRouter API
    const response = await fetch(OPENROUTER_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://satellite-spy.app",
        "X-Title": "Satellite Spy Intelligence Platform",
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4-20250514",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `CURRENT INTELLIGENCE CONTEXT:\n${contextSummary}\n\nANALYSIS REQUEST:\n${query}`,
          },
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API error:", errorText);

      // Fallback to rule-based
      const fallbackAnalysis = generateRuleBasedAnalysis(query, context);
      return NextResponse.json({
        analysis: fallbackAnalysis + "\n\n[Note: LLM unavailable, using rule-based analysis]",
        source: "rule-based-fallback",
      });
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || "No analysis generated.";

    return NextResponse.json({ analysis, source: "llm" });
  } catch (error) {
    console.error("LLM analysis error:", error);
    return NextResponse.json(
      { error: "Analysis failed", details: String(error) },
      { status: 500 }
    );
  }
}

function buildContextSummary(context: AnalysisRequest["context"]): string {
  const parts: string[] = [];

  if (context.crossIntelAlerts && Array.isArray(context.crossIntelAlerts) && context.crossIntelAlerts.length > 0) {
    parts.push(`CROSS-INTEL ALERTS (${context.crossIntelAlerts.length}):`);
    for (const alert of context.crossIntelAlerts.slice(0, 5)) {
      const a = alert as Record<string, unknown>;
      parts.push(`  - [${a.severity}] ${a.title}: ${a.summary}`);
      if (a.suspicionLevel && a.suspicionLevel !== "none") {
        parts.push(`    Suspicion: ${a.suspicionLevel} | Category: ${a.category}`);
      }
    }
  }

  if (context.marketAnomalies && Array.isArray(context.marketAnomalies) && context.marketAnomalies.length > 0) {
    parts.push(`\nMARKET ANOMALIES (${context.marketAnomalies.length}):`);
    for (const anomaly of context.marketAnomalies.slice(0, 5)) {
      const a = anomaly as Record<string, unknown>;
      parts.push(`  - ${a.description} (type: ${a.anomalyType}, severity: ${a.severity})`);
    }
  }

  if (context.recentConflicts && Array.isArray(context.recentConflicts) && context.recentConflicts.length > 0) {
    parts.push(`\nACTIVE CONFLICTS (${context.recentConflicts.length}):`);
    for (const conflict of context.recentConflicts.slice(0, 5)) {
      const c = conflict as Record<string, unknown>;
      parts.push(`  - ${c.eventType} in ${c.location}, ${c.country} — ${c.fatalities} fatalities`);
    }
  }

  if (context.satPatterns && Array.isArray(context.satPatterns) && context.satPatterns.length > 0) {
    parts.push(`\nSATELLITE SURVEILLANCE PATTERNS (${context.satPatterns.length}):`);
    for (const pat of context.satPatterns.slice(0, 3)) {
      const p = pat as Record<string, unknown>;
      parts.push(`  - ${p.description} (phase: ${p.phase}, score: ${p.anomalyScore})`);
    }
  }

  if (context.acPatterns && Array.isArray(context.acPatterns) && context.acPatterns.length > 0) {
    parts.push(`\nMILITARY AIRCRAFT PATTERNS (${context.acPatterns.length}):`);
    for (const pat of context.acPatterns.slice(0, 3)) {
      const p = pat as Record<string, unknown>;
      parts.push(`  - ${p.description} (type: ${p.patternType})`);
    }
  }

  return parts.length > 0 ? parts.join("\n") : "No intelligence data currently available.";
}

function generateRuleBasedAnalysis(
  query: string,
  context: AnalysisRequest["context"]
): string {
  const q = query.toLowerCase();
  const parts: string[] = [];

  parts.push("═══ SENTINEL RULE-BASED ANALYSIS ═══\n");

  const alerts = (context.crossIntelAlerts || []) as Array<Record<string, unknown>>;
  const anomalies = (context.marketAnomalies || []) as Array<Record<string, unknown>>;
  const conflicts = (context.recentConflicts || []) as Array<Record<string, unknown>>;
  const satPats = (context.satPatterns || []) as Array<Record<string, unknown>>;

  // Insider trading / suspicious trading analysis
  if (q.includes("insider") || q.includes("trading") || q.includes("suspicious") || q.includes("manipulation")) {
    parts.push("BLUF: Analyzing trading patterns for insider trading indicators.\n");

    const suspiciousAlerts = alerts.filter(
      (a) => a.suspicionLevel === "high" || a.suspicionLevel === "very_high"
    );

    if (suspiciousAlerts.length > 0) {
      parts.push(`⚠ ${suspiciousAlerts.length} HIGH-SUSPICION ALERTS DETECTED:`);
      for (const a of suspiciousAlerts) {
        parts.push(`  → ${a.title}: ${a.summary}`);
        parts.push(`    Category: ${a.category} | Confidence: ${a.confidence}%`);
      }
    }

    const volumeAnomalies = anomalies.filter((a) => a.anomalyType === "volume_spike" || a.anomalyType === "pre_event_movement");
    if (volumeAnomalies.length > 0) {
      parts.push(`\n📊 ${volumeAnomalies.length} VOLUME ANOMALIES:`);
      for (const a of volumeAnomalies) {
        parts.push(`  → ${a.description}`);
      }
      parts.push("\nASSESSMENT: Volume spikes preceding conflict events are a classic insider trading indicator. Recommend cross-referencing with known conflict-connected entities.");
    } else {
      parts.push("\nNo significant volume anomalies detected at this time.");
    }
  }

  // Oil/energy/Iran correlation
  if (q.includes("oil") || q.includes("iran") || q.includes("energy") || q.includes("petrole") || q.includes("gaz")) {
    parts.push("BLUF: Analyzing energy commodity correlation with Middle East conflict.\n");

    const energyAnomalies = anomalies.filter(
      (a) => (a.category === "energy") || String(a.symbol || "").includes("CL") || String(a.symbol || "").includes("NG")
    );
    const meConflicts = conflicts.filter(
      (c) => ["IRN", "IRQ", "SAU", "YEM", "ISR", "LBN"].includes(String(c.country))
    );

    if (energyAnomalies.length > 0 && meConflicts.length > 0) {
      parts.push(`CORRELATION DETECTED: ${energyAnomalies.length} energy market anomalies + ${meConflicts.length} Middle East conflicts`);
      parts.push("\nPATTERN ANALYSIS:");
      parts.push("  1. Energy prices typically surge 24-72h before major ME conflict escalation");
      parts.push("  2. Volume spikes in oil futures preceding strike announcements suggest informed trading");
      parts.push("  3. Recommend monitoring Strait of Hormuz satellite imagery for naval movements");
      parts.push(`\nRISK LEVEL: ${meConflicts.length > 3 ? "HIGH" : "MODERATE"}`);
    } else if (meConflicts.length > 0) {
      parts.push(`Active ME conflicts detected (${meConflicts.length}) but no significant energy market anomalies. Markets may not yet be pricing in escalation risk.`);
    } else {
      parts.push("No significant Middle East conflict-energy correlation detected at this time.");
    }
  }

  // Satellite surveillance analysis
  if (q.includes("satellite") || q.includes("surveillance") || q.includes("reconnaissance")) {
    parts.push("BLUF: Analyzing satellite surveillance patterns for pre-strike indicators.\n");

    if (satPats.length > 0) {
      parts.push(`${satPats.length} SURVEILLANCE PATTERNS DETECTED:`);
      for (const p of satPats) {
        parts.push(`  → ${p.description}`);
        parts.push(`    Phase: ${String(p.phase).replace(/_/g, " ")} | Anomaly Score: ${p.anomalyScore}`);
      }
      const preEvent = satPats.filter((p) => p.phase === "pre_event");
      if (preEvent.length > 0) {
        parts.push("\n⚠ PRE-EVENT PATTERNS: Reconnaissance satellites repositioning over conflict zones typically precedes military action by 24-48 hours.");
      }
    } else {
      parts.push("No anomalous satellite surveillance patterns detected.");
    }
  }

  // Generic fallback
  if (parts.length <= 1) {
    parts.push(`BLUF: Processing query: "${query}"\n`);
    parts.push(`Current data state:`);
    parts.push(`  - Cross-Intel Alerts: ${alerts.length}`);
    parts.push(`  - Market Anomalies: ${anomalies.length}`);
    parts.push(`  - Active Conflicts: ${conflicts.length}`);
    parts.push(`  - Sat Patterns: ${satPats.length}`);
    parts.push(`\nFor deeper analysis, configure OPENROUTER_API_KEY to enable LLM reasoning.`);
  }

  parts.push("\n═══ END ANALYSIS ═══");
  return parts.join("\n");
}
