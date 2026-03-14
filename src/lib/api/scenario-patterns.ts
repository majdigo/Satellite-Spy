import type {
  MarketData,
  ConflictEvent,
  GDELTEvent,
  SatellitePosition,
  AircraftPosition,
  SeverityLevel,
  CrossIntelSignal,
} from "@/types";

// ============================================================================
// Scenario Pattern Library
// Known historical patterns of geopolitical-market correlations
// The engine matches live data against these patterns to generate early warnings
// ============================================================================

export interface ScenarioPattern {
  id: string;
  name: string;
  description: string;
  category: "energy_conflict" | "food_crisis" | "defense_surge" | "currency_crisis" | "safe_haven" | "supply_chain" | "sanctions";
  severity: SeverityLevel;
  // Match criteria
  triggers: ScenarioTrigger[];
  // Minimum triggers that must match
  minTriggersToActivate: number;
  // Historical precedents
  historicalExamples: string[];
  // What to expect if pattern activates
  expectedOutcome: string;
  // Commodities/symbols affected
  affectedSymbols: string[];
  // Regions involved
  involvedRegions: string[];
}

export interface ScenarioTrigger {
  type: "conflict" | "market" | "satellite" | "aircraft" | "gdelt" | "combined";
  condition: string; // human-readable
  evaluate: (ctx: ScenarioContext) => boolean;
}

export interface ScenarioContext {
  market: MarketData[];
  conflicts: ConflictEvent[];
  gdeltEvents: GDELTEvent[];
  satellites: SatellitePosition[];
  aircraft: AircraftPosition[];
}

export interface ScenarioMatch {
  pattern: ScenarioPattern;
  matchedTriggers: number;
  totalTriggers: number;
  matchPercentage: number;
  signals: CrossIntelSignal[];
  activatedAt: Date;
}

// ============================================================================
// Pattern Definitions — based on real historical precedents
// ============================================================================

export const SCENARIO_PATTERNS: ScenarioPattern[] = [
  // --- 1. Strait of Hormuz Crisis ---
  {
    id: "hormuz-crisis",
    name: "Strait of Hormuz Disruption",
    description: "Iran-related military escalation threatening oil transit through Strait of Hormuz. ~20% of global oil transits this chokepoint.",
    category: "energy_conflict",
    severity: "critical",
    triggers: [
      {
        type: "conflict",
        condition: "Active conflicts in Iran, Iraq, or Yemen",
        evaluate: (ctx) => ctx.conflicts.some((c) =>
          ["IRN", "IRQ", "YEM"].includes(c.country) &&
          new Date(c.date).getTime() > Date.now() - 48 * 3600000
        ),
      },
      {
        type: "market",
        condition: "Brent crude up >3% or volume >2x average",
        evaluate: (ctx) => ctx.market.some((m) =>
          (m.symbol === "BZ=F" || m.symbol === "CL=F") &&
          (m.changePercent > 3 || m.volumeAnomaly > 2)
        ),
      },
      {
        type: "market",
        condition: "Natural gas also rising (>2%)",
        evaluate: (ctx) => ctx.market.some((m) =>
          m.symbol === "NG=F" && m.changePercent > 2
        ),
      },
      {
        type: "gdelt",
        condition: "Negative media tone about Iran (avg < -5)",
        evaluate: (ctx) => {
          const iranEvents = ctx.gdeltEvents.filter((e) => e.country === "IRN" || e.country === "Iran");
          if (iranEvents.length === 0) return false;
          const avgTone = iranEvents.reduce((s, e) => s + e.avgTone, 0) / iranEvents.length;
          return avgTone < -5;
        },
      },
      {
        type: "satellite",
        condition: "Reconnaissance satellites over Persian Gulf",
        evaluate: (ctx) => ctx.satellites.some((s) =>
          (s.category === "reconnaissance" || s.category === "military") &&
          s.latitude >= 20 && s.latitude <= 35 &&
          s.longitude >= 45 && s.longitude <= 60
        ),
      },
      {
        type: "market",
        condition: "Gold rising (safe-haven demand)",
        evaluate: (ctx) => ctx.market.some((m) => m.symbol === "GC=F" && m.changePercent > 1),
      },
    ],
    minTriggersToActivate: 3,
    historicalExamples: [
      "2019: US-Iran tensions after drone shootdown — oil spiked 15% in days",
      "2024: Houthi Red Sea attacks — shipping costs +300%, Brent +8%",
      "1990: Iraqi invasion of Kuwait — oil doubled in 3 months",
    ],
    expectedOutcome: "Oil prices surge 10-30%. Defense stocks rise. Gold rises as safe haven. Airlines and shipping stocks decline.",
    affectedSymbols: ["CL=F", "BZ=F", "NG=F", "GC=F", "LMT", "RTX", "NOC"],
    involvedRegions: ["IRN", "IRQ", "YEM", "SAU"],
  },

  // --- 2. Ukraine-Russia Grain Crisis ---
  {
    id: "ukraine-grain-crisis",
    name: "Black Sea Grain Corridor Disruption",
    description: "Escalation in Ukraine-Russia conflict threatening grain exports. Ukraine & Russia supply ~30% of global wheat.",
    category: "food_crisis",
    severity: "high",
    triggers: [
      {
        type: "conflict",
        condition: "Active conflicts in Ukraine or Russia",
        evaluate: (ctx) => ctx.conflicts.some((c) =>
          ["UKR", "RUS"].includes(c.country) &&
          new Date(c.date).getTime() > Date.now() - 48 * 3600000
        ),
      },
      {
        type: "market",
        condition: "Wheat futures up >2%",
        evaluate: (ctx) => ctx.market.some((m) => m.symbol === "ZW=F" && m.changePercent > 2),
      },
      {
        type: "market",
        condition: "Corn or soybeans also rising",
        evaluate: (ctx) => ctx.market.some((m) =>
          (m.symbol === "ZC=F" || m.symbol === "ZS=F") && m.changePercent > 1.5
        ),
      },
      {
        type: "gdelt",
        condition: "Material conflict GDELT events about Ukraine/Russia",
        evaluate: (ctx) => ctx.gdeltEvents.some((e) =>
          (e.country === "UKR" || e.country === "Ukraine" || e.country === "RUS" || e.country === "Russia") &&
          e.quadClass === "material_conflict"
        ),
      },
      {
        type: "market",
        condition: "Russian ruble weakening (USDRUB up >1%)",
        evaluate: (ctx) => ctx.market.some((m) => m.symbol === "USDRUB=X" && m.changePercent > 1),
      },
    ],
    minTriggersToActivate: 3,
    historicalExamples: [
      "2022: Russia invasion — wheat +60% in weeks, global food crisis",
      "2023: Black Sea grain deal collapse — wheat spiked 8% in one day",
    ],
    expectedOutcome: "Wheat/corn/soy spike. Food importing nations face inflation. Ruble depreciates. Energy prices rise due to sanctions.",
    affectedSymbols: ["ZW=F", "ZC=F", "ZS=F", "USDRUB=X", "NG=F"],
    involvedRegions: ["UKR", "RUS"],
  },

  // --- 3. Taiwan Strait Crisis ---
  {
    id: "taiwan-strait-crisis",
    name: "Taiwan Strait Military Escalation",
    description: "China-Taiwan military tensions threatening global semiconductor supply chain and trade routes.",
    category: "supply_chain",
    severity: "critical",
    triggers: [
      {
        type: "conflict",
        condition: "Military activity near Taiwan or South China Sea",
        evaluate: (ctx) => ctx.conflicts.some((c) =>
          ["TWN", "CHN"].includes(c.country) &&
          (c.eventType === "battle" || c.eventType === "strategic_development")
        ),
      },
      {
        type: "market",
        condition: "VIX spiking above 25",
        evaluate: (ctx) => ctx.market.some((m) => m.symbol === "^VIX" && m.price > 25),
      },
      {
        type: "market",
        condition: "Yuan weakening (USDCNY up >0.5%)",
        evaluate: (ctx) => ctx.market.some((m) => m.symbol === "USDCNY=X" && m.changePercent > 0.5),
      },
      {
        type: "satellite",
        condition: "Military satellites over Taiwan Strait",
        evaluate: (ctx) => ctx.satellites.some((s) =>
          (s.category === "reconnaissance" || s.category === "military") &&
          s.latitude >= 20 && s.latitude <= 30 &&
          s.longitude >= 115 && s.longitude <= 125
        ),
      },
      {
        type: "aircraft",
        condition: "Military aircraft in Taiwan Strait area",
        evaluate: (ctx) => ctx.aircraft.some((a) =>
          a.category === "military" &&
          a.latitude >= 20 && a.latitude <= 30 &&
          a.longitude >= 115 && a.longitude <= 125
        ),
      },
      {
        type: "market",
        condition: "Gold and defense stocks rising",
        evaluate: (ctx) => ctx.market.some((m) => m.symbol === "GC=F" && m.changePercent > 1) &&
          ctx.market.some((m) => m.category === "defense" && m.changePercent > 2),
      },
    ],
    minTriggersToActivate: 3,
    historicalExamples: [
      "2022: Pelosi Taiwan visit — PLA military drills, semiconductor stocks dropped 5%",
      "1996: Taiwan Strait crisis — US carriers deployed, regional markets crashed",
    ],
    expectedOutcome: "Global markets crash 5-15%. Semiconductor stocks devastated. Gold and defense surge. CNY depreciates sharply.",
    affectedSymbols: ["^GSPC", "^VIX", "USDCNY=X", "GC=F", "LMT", "RTX"],
    involvedRegions: ["TWN", "CHN"],
  },

  // --- 4. Defense Industry Insider Pattern ---
  {
    id: "defense-insider-pattern",
    name: "Defense Sector Pre-Conflict Positioning",
    description: "Defense stocks rising with high volume before public conflict news — classic informed trading pattern.",
    category: "defense_surge",
    severity: "high",
    triggers: [
      {
        type: "market",
        condition: "Multiple defense stocks up >2% simultaneously",
        evaluate: (ctx) => {
          const defenseUp = ctx.market.filter((m) => m.category === "defense" && m.changePercent > 2);
          return defenseUp.length >= 3;
        },
      },
      {
        type: "market",
        condition: "Defense sector volume >1.5x average",
        evaluate: (ctx) => {
          const defense = ctx.market.filter((m) => m.category === "defense");
          if (defense.length === 0) return false;
          const avgVol = defense.reduce((s, m) => s + m.volumeAnomaly, 0) / defense.length;
          return avgVol > 1.5;
        },
      },
      {
        type: "combined",
        condition: "Limited public conflict reporting (GDELT conflict events < 5)",
        evaluate: (ctx) => {
          const conflictEvents = ctx.gdeltEvents.filter(
            (e) => e.quadClass === "material_conflict"
          );
          return conflictEvents.length < 5;
        },
      },
      {
        type: "market",
        condition: "VIX stable or declining (market not broadly fearful)",
        evaluate: (ctx) => ctx.market.some((m) => m.symbol === "^VIX" && m.price < 20),
      },
    ],
    minTriggersToActivate: 3,
    historicalExamples: [
      "Multiple documented cases of defense contractor stock movement before military action announcements",
      "Congressional trading disclosures showing defense purchases before classified briefings",
    ],
    expectedOutcome: "Major military action or defense contract announcement likely within 1-5 days. Post-announcement defense stocks typically surge further 5-15%.",
    affectedSymbols: ["LMT", "RTX", "NOC", "GD", "BA", "LHX"],
    involvedRegions: [],
  },

  // --- 5. Sanctions Escalation Pattern ---
  {
    id: "sanctions-escalation",
    name: "Sanctions-Related Currency/Commodity Crisis",
    description: "New sanctions or sanctions escalation driving currency collapse and commodity disruption.",
    category: "sanctions",
    severity: "high",
    triggers: [
      {
        type: "market",
        condition: "Target country currency depreciating >2%",
        evaluate: (ctx) => ctx.market.some((m) =>
          m.category === "currency" && m.changePercent > 2 &&
          ["USDRUB=X", "USDIRR=X", "USDTRY=X"].includes(m.symbol)
        ),
      },
      {
        type: "gdelt",
        condition: "GDELT events with sanctions/embargo keywords",
        evaluate: (ctx) => ctx.gdeltEvents.some((e) =>
          e.title && (e.title.toLowerCase().includes("sanction") || e.title.toLowerCase().includes("embargo"))
        ),
      },
      {
        type: "market",
        condition: "Commodities from target region spiking",
        evaluate: (ctx) => ctx.market.some((m) =>
          m.category === "energy" && m.changePercent > 2 && m.volumeAnomaly > 1.5
        ),
      },
      {
        type: "combined",
        condition: "Gold rising as safe-haven",
        evaluate: (ctx) => ctx.market.some((m) => m.symbol === "GC=F" && m.changePercent > 0.5),
      },
    ],
    minTriggersToActivate: 2,
    historicalExamples: [
      "2022: Russian sanctions — ruble crashed 50%, energy prices +40%",
      "2018: Iran sanctions reimposed — oil spiked, rial collapsed",
      "2014: Russia/Crimea sanctions — ruble -50% over months",
    ],
    expectedOutcome: "Target currency depreciates 10-50%. Commodities from region spike. Global trade disruption in affected sectors.",
    affectedSymbols: ["USDRUB=X", "USDIRR=X", "USDTRY=X", "CL=F", "GC=F", "ZW=F"],
    involvedRegions: ["RUS", "IRN", "TUR"],
  },

  // --- 6. Safe Haven Rush ---
  {
    id: "safe-haven-rush",
    name: "Global Safe-Haven Rush",
    description: "Coordinated flight to safety across gold, USD, and treasuries indicating major geopolitical fear event.",
    category: "safe_haven",
    severity: "high",
    triggers: [
      {
        type: "market",
        condition: "Gold up >2%",
        evaluate: (ctx) => ctx.market.some((m) => m.symbol === "GC=F" && m.changePercent > 2),
      },
      {
        type: "market",
        condition: "VIX above 25",
        evaluate: (ctx) => ctx.market.some((m) => m.symbol === "^VIX" && m.price > 25),
      },
      {
        type: "market",
        condition: "US Dollar Index rising (>0.5%)",
        evaluate: (ctx) => ctx.market.some((m) => m.symbol === "DX-Y.NYB" && m.changePercent > 0.5),
      },
      {
        type: "market",
        condition: "S&P 500 declining (< -1%)",
        evaluate: (ctx) => ctx.market.some((m) => m.symbol === "^GSPC" && m.changePercent < -1),
      },
      {
        type: "conflict",
        condition: "Multiple active high-severity conflicts",
        evaluate: (ctx) => {
          const recent = ctx.conflicts.filter(
            (c) => (c.severity === "high" || c.severity === "critical") &&
            new Date(c.date).getTime() > Date.now() - 24 * 3600000
          );
          return recent.length >= 3;
        },
      },
    ],
    minTriggersToActivate: 3,
    historicalExamples: [
      "2020: COVID panic — gold +30% over months, VIX hit 82",
      "2022: Ukraine invasion — gold +8%, VIX doubled, equities crashed",
      "2001: 9/11 — markets closed, gold spiked on reopening",
    ],
    expectedOutcome: "Sustained flight to quality. Equities decline 5-20%. Gold and USD rally. Credit spreads widen. Risk assets sell off globally.",
    affectedSymbols: ["GC=F", "^VIX", "^GSPC", "DX-Y.NYB", "SI=F"],
    involvedRegions: [],
  },
];

// ============================================================================
// Pattern Matching Engine
// ============================================================================

export function matchScenarioPatterns(ctx: ScenarioContext): ScenarioMatch[] {
  const matches: ScenarioMatch[] = [];

  for (const pattern of SCENARIO_PATTERNS) {
    let matchedCount = 0;
    const signals: CrossIntelSignal[] = [];

    for (const trigger of pattern.triggers) {
      try {
        if (trigger.evaluate(ctx)) {
          matchedCount++;
          signals.push({
            source: trigger.type === "combined" ? "market" : trigger.type,
            description: `[${pattern.name}] ${trigger.condition}`,
            timestamp: new Date().toISOString(),
            severity: matchedCount >= pattern.minTriggersToActivate ? "high" : "medium",
          });
        }
      } catch {
        // Skip triggers that fail evaluation
      }
    }

    if (matchedCount >= pattern.minTriggersToActivate) {
      matches.push({
        pattern,
        matchedTriggers: matchedCount,
        totalTriggers: pattern.triggers.length,
        matchPercentage: Math.round((matchedCount / pattern.triggers.length) * 100),
        signals,
        activatedAt: new Date(),
      });
    }
  }

  // Sort by match percentage descending
  return matches.sort((a, b) => b.matchPercentage - a.matchPercentage);
}
