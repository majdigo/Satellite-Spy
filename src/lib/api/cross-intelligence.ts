import type {
  MarketData,
  MarketAnomaly,
  SatelliteSurveillancePattern,
  MilitaryAircraftPattern,
  CrossIntelligenceAlert,
  CrossIntelSignal,
  CrossIntelCategory,
  SeverityLevel,
  ConflictEvent,
  GDELTEvent,
  SatellitePosition,
  AircraftPosition,
  NaturalDisaster,
  WatchRegion,
} from "@/types";

// ============================================================================
// Cross-Intelligence Analysis Engine
// Correlates: satellite imagery × geopolitical events × market movements
//             × military aircraft patterns × conflict data
// ============================================================================

export interface CrossIntelInput {
  market: MarketData[];
  conflicts: ConflictEvent[];
  gdeltEvents: GDELTEvent[];
  satellites: SatellitePosition[];
  aircraft: AircraftPosition[];
  disasters: NaturalDisaster[];
  watchRegions: WatchRegion[];
}

// --- Region ↔ Commodity Mappings ---
// Which commodities are affected by which regions
const REGION_COMMODITY_MAP: Record<string, string[]> = {
  "IRN": ["CL=F", "BZ=F", "NG=F", "HO=F", "RB=F", "GC=F"],
  "IRQ": ["CL=F", "BZ=F", "NG=F"],
  "SAU": ["CL=F", "BZ=F", "NG=F", "HO=F"],
  "RUS": ["CL=F", "BZ=F", "NG=F", "ZW=F", "GC=F", "PL=F", "USDRUB=X"],
  "UKR": ["ZW=F", "ZC=F", "ZS=F", "NG=F"],
  "CHN": ["GC=F", "SI=F", "USDCNY=X", "^GSPC"],
  "TWN": ["^GSPC", "^VIX", "USDCNY=X"],
  "ISR": ["CL=F", "BZ=F", "GC=F", "^VIX"],
  "YEM": ["CL=F", "BZ=F"],
  "LBN": ["CL=F", "GC=F"],
  "PRK": ["^VIX", "GC=F"],
  "NGA": ["CL=F", "BZ=F"],
  "SDN": ["ZW=F", "GC=F"],
  "TUR": ["USDTRY=X", "GC=F"],
};

// Which conflict types affect which sectors
const CONFLICT_MARKET_MAP: Record<string, string[]> = {
  "battle": ["LMT", "RTX", "NOC", "GD", "BA", "LHX", "^VIX", "GC=F"],
  "explosion": ["LMT", "RTX", "NOC", "CL=F", "^VIX", "GC=F"],
  "violence_against_civilians": ["^VIX", "GC=F"],
  "strategic_development": ["LMT", "RTX", "NOC", "GD", "^VIX"],
  "protest": ["^VIX"],
  "riot": ["^VIX", "GC=F"],
};

// ============================================================================
// 1. Market Anomaly Detection
// ============================================================================

export function detectMarketAnomalies(
  market: MarketData[],
  conflicts: ConflictEvent[],
  gdeltEvents: GDELTEvent[]
): MarketAnomaly[] {
  const anomalies: MarketAnomaly[] = [];

  for (const m of market) {
    // Volume spike detection
    if (m.volumeAnomaly > 2.0) {
      const relatedRegions = findRegionsForSymbol(m.symbol);
      const relatedConflicts = conflicts.filter(
        (c) => relatedRegions.includes(c.country)
      );
      const hasActiveConflict = relatedConflicts.length > 0;

      anomalies.push({
        id: `mkt-vol-${m.symbol}-${Date.now()}`,
        symbol: m.symbol,
        name: m.name,
        category: m.category,
        anomalyType: hasActiveConflict ? "pre_event_movement" : "volume_spike",
        severity: m.volumeAnomaly > 4 ? "critical" : m.volumeAnomaly > 3 ? "high" : "medium",
        description: `Volume ${m.volumeAnomaly.toFixed(1)}x average for ${m.name}${hasActiveConflict ? ` — active conflicts in ${relatedRegions.join(", ")}` : ""}`,
        priceChange: m.changePercent,
        volumeRatio: m.volumeAnomaly,
        timestamp: m.timestamp,
        relatedRegion: relatedRegions[0],
        relatedCountries: relatedRegions,
      });
    }

    // Price surge detection (>3% in a day for commodities, >5% for stocks)
    const threshold = m.category === "energy" || m.category === "metals" ? 3 : 5;
    if (Math.abs(m.changePercent) > threshold) {
      const direction = m.changePercent > 0 ? "surge" : "crash";
      anomalies.push({
        id: `mkt-px-${m.symbol}-${Date.now()}`,
        symbol: m.symbol,
        name: m.name,
        category: m.category,
        anomalyType: direction === "surge" ? "price_surge" : "price_crash",
        severity: Math.abs(m.changePercent) > 8 ? "critical" : Math.abs(m.changePercent) > 5 ? "high" : "medium",
        description: `${m.name} ${direction}: ${m.changePercent > 0 ? "+" : ""}${m.changePercent.toFixed(2)}%`,
        priceChange: m.changePercent,
        volumeRatio: m.volumeAnomaly,
        timestamp: m.timestamp,
      });
    }

    // Defense sector surge during conflicts
    if (m.category === "defense" && m.changePercent > 2) {
      const activeConflictCountries = [...new Set(conflicts.map((c) => c.country))];
      if (activeConflictCountries.length > 0) {
        anomalies.push({
          id: `mkt-def-${m.symbol}-${Date.now()}`,
          symbol: m.symbol,
          name: m.name,
          category: m.category,
          anomalyType: "sector_rotation",
          severity: m.changePercent > 5 ? "high" : "medium",
          description: `Defense stock ${m.name} up ${m.changePercent.toFixed(2)}% amid active conflicts in ${activeConflictCountries.slice(0, 3).join(", ")}`,
          priceChange: m.changePercent,
          volumeRatio: m.volumeAnomaly,
          timestamp: m.timestamp,
          relatedCountries: activeConflictCountries,
        });
      }
    }

    // VIX spike — fear indicator
    if (m.symbol === "^VIX" && m.price > 25) {
      anomalies.push({
        id: `mkt-vix-${Date.now()}`,
        symbol: m.symbol,
        name: m.name,
        category: m.category,
        anomalyType: "volume_spike",
        severity: m.price > 35 ? "critical" : m.price > 30 ? "high" : "medium",
        description: `VIX at ${m.price.toFixed(1)} — elevated market fear. Potential geopolitical risk pricing.`,
        priceChange: m.changePercent,
        volumeRatio: m.volumeAnomaly,
        timestamp: m.timestamp,
      });
    }
  }

  return anomalies;
}

function findRegionsForSymbol(symbol: string): string[] {
  const regions: string[] = [];
  for (const [country, symbols] of Object.entries(REGION_COMMODITY_MAP)) {
    if (symbols.includes(symbol)) {
      regions.push(country);
    }
  }
  return regions;
}

// ============================================================================
// 2. Satellite Surveillance Pattern Detection
// ============================================================================

export function detectSatelliteSurveillancePatterns(
  satellites: SatellitePosition[],
  conflicts: ConflictEvent[],
  watchRegions: WatchRegion[]
): SatelliteSurveillancePattern[] {
  const patterns: SatelliteSurveillancePattern[] = [];

  // Group satellites by category
  const reconSats = satellites.filter(
    (s) => s.category === "reconnaissance" || s.category === "military" || s.category === "classified"
  );

  for (const region of watchRegions) {
    // Find recon satellites currently over this region
    const satsOverRegion = reconSats.filter(
      (s) =>
        s.latitude >= region.bounds.south &&
        s.latitude <= region.bounds.north &&
        s.longitude >= region.bounds.west &&
        s.longitude <= region.bounds.east
    );

    if (satsOverRegion.length === 0) continue;

    // Check if there are active conflicts in this region
    const regionConflicts = conflicts.filter(
      (c) => region.countries.includes(c.country)
    );

    // Group by country of origin
    const byCountry = new Map<string, SatellitePosition[]>();
    for (const sat of satsOverRegion) {
      const country = sat.country || "UNKNOWN";
      if (!byCountry.has(country)) byCountry.set(country, []);
      byCountry.get(country)!.push(sat);
    }

    for (const [country, sats] of byCountry) {
      if (sats.length < 1) continue;

      // Determine phase based on conflict activity
      let phase: SatelliteSurveillancePattern["phase"] = "ongoing";
      const recentConflicts = regionConflicts.filter(
        (c) => new Date(c.date).getTime() > Date.now() - 24 * 60 * 60 * 1000
      );
      const veryRecentConflicts = regionConflicts.filter(
        (c) => new Date(c.date).getTime() > Date.now() - 6 * 60 * 60 * 1000
      );

      if (veryRecentConflicts.length > 0) {
        phase = "during_event";
      } else if (recentConflicts.length > 0) {
        phase = "post_event";
      } else if (regionConflicts.length > 0) {
        phase = "pre_event";
      }

      // Determine pattern type
      let patternType: SatelliteSurveillancePattern["patternType"] = "persistent_surveillance";
      if (sats.length >= 3) patternType = "formation_change";
      if (phase === "post_event") patternType = "battle_damage_assessment";
      if (phase === "pre_event" && sats.length >= 2) patternType = "increased_passes";

      // Infer surveillance purpose
      const satTypes = sats.map((s) => s.category);
      const hasRecon = satTypes.includes("reconnaissance");
      const hasMilitary = satTypes.includes("military");
      const hasClassified = satTypes.includes("classified");

      let description = `${sats.length} ${country} surveillance satellite(s) over ${region.name}`;
      if (hasRecon) description += " — imagery intelligence (IMINT) collection likely";
      if (hasClassified) description += " — classified payload, possible SIGINT/ELINT";
      if (hasMilitary && phase === "pre_event") description += " — potential pre-strike reconnaissance";
      if (phase === "post_event") description += " — battle damage assessment pattern";

      const anomalyScore = Math.min(100,
        sats.length * 20 +
        (regionConflicts.length > 0 ? 30 : 0) +
        (hasClassified ? 15 : 0) +
        (phase === "pre_event" ? 20 : 0)
      );

      patterns.push({
        id: `surv-${region.id}-${country}-${Date.now()}`,
        satelliteIds: sats.map((s) => s.id),
        satelliteNames: sats.map((s) => s.name),
        patternType,
        targetRegion: region.name,
        targetCoordinates: region.center,
        frequency: sats.length,
        baselineFrequency: 1,
        anomalyScore,
        ownerCountries: [country],
        startDetected: new Date().toISOString(),
        description,
        relatedConflictIds: regionConflicts.map((c) => c.id),
        phase,
      });
    }
  }

  return patterns;
}

// ============================================================================
// 3. Military Aircraft Pattern Detection
// ============================================================================

export function detectMilitaryAircraftPatterns(
  aircraft: AircraftPosition[],
  conflicts: ConflictEvent[],
  watchRegions: WatchRegion[]
): MilitaryAircraftPattern[] {
  const patterns: MilitaryAircraftPattern[] = [];

  const militaryAC = aircraft.filter(
    (a) => a.category === "military" || a.category === "government"
  );

  for (const region of watchRegions) {
    const acInRegion = militaryAC.filter(
      (a) =>
        a.latitude >= region.bounds.south &&
        a.latitude <= region.bounds.north &&
        a.longitude >= region.bounds.west &&
        a.longitude <= region.bounds.east
    );

    if (acInRegion.length === 0) continue;

    const regionConflicts = conflicts.filter(
      (c) => region.countries.includes(c.country)
    );

    // High-altitude military aircraft (potential bombers/AWACS)
    const highAlt = acInRegion.filter((a) => a.altitude > 10000);
    const lowAlt = acInRegion.filter((a) => a.altitude <= 3000 && !a.onGround);

    if (highAlt.length >= 2) {
      patterns.push({
        id: `ac-high-${region.id}-${Date.now()}`,
        patternType: highAlt.length >= 4 ? "bomber_deployment" : "awacs_orbit",
        aircraftIds: highAlt.map((a) => a.icao24),
        region: region.name,
        coordinates: region.center,
        count: highAlt.length,
        baselineCount: 1,
        description: `${highAlt.length} high-altitude military aircraft over ${region.name} (${highAlt.map((a) => a.callsign || a.originCountry).join(", ")})`,
        relatedConflictIds: regionConflicts.map((c) => c.id),
        timestamp: new Date().toISOString(),
      });
    }

    if (lowAlt.length >= 2) {
      patterns.push({
        id: `ac-low-${region.id}-${Date.now()}`,
        patternType: "fighter_surge",
        aircraftIds: lowAlt.map((a) => a.icao24),
        region: region.name,
        coordinates: region.center,
        count: lowAlt.length,
        baselineCount: 1,
        description: `${lowAlt.length} low-altitude military aircraft over ${region.name} — possible close air support or combat patrol`,
        relatedConflictIds: regionConflicts.map((c) => c.id),
        timestamp: new Date().toISOString(),
      });
    }

    // Civilian avoidance pattern — if no civilian aircraft in a conflict zone
    const civilianInRegion = aircraft.filter(
      (a) =>
        a.category === "civilian" &&
        a.latitude >= region.bounds.south &&
        a.latitude <= region.bounds.north &&
        a.longitude >= region.bounds.west &&
        a.longitude <= region.bounds.east
    );

    if (regionConflicts.length > 0 && civilianInRegion.length === 0 && militaryAC.length > 0) {
      patterns.push({
        id: `ac-notam-${region.id}-${Date.now()}`,
        patternType: "civilian_avoidance",
        aircraftIds: [],
        region: region.name,
        coordinates: region.center,
        count: 0,
        baselineCount: 5,
        description: `No civilian air traffic over ${region.name} despite active conflict zone — possible NOTAM/airspace closure. ${acInRegion.length} military aircraft detected.`,
        relatedConflictIds: regionConflicts.map((c) => c.id),
        timestamp: new Date().toISOString(),
      });
    }

    // Transport surge (many military aircraft)
    if (acInRegion.length >= 5) {
      patterns.push({
        id: `ac-surge-${region.id}-${Date.now()}`,
        patternType: "transport_surge",
        aircraftIds: acInRegion.map((a) => a.icao24),
        region: region.name,
        coordinates: region.center,
        count: acInRegion.length,
        baselineCount: 2,
        description: `${acInRegion.length} military aircraft concentrated over ${region.name} — potential military buildup or logistics operation`,
        relatedConflictIds: regionConflicts.map((c) => c.id),
        timestamp: new Date().toISOString(),
      });
    }
  }

  return patterns;
}

// ============================================================================
// 4. Cross-Intelligence Correlation — The Main Engine
// ============================================================================

export function generateCrossIntelligenceAlerts(
  input: CrossIntelInput
): CrossIntelligenceAlert[] {
  const alerts: CrossIntelligenceAlert[] = [];

  // Detect sub-patterns
  const marketAnomalies = detectMarketAnomalies(input.market, input.conflicts, input.gdeltEvents);
  const satPatterns = detectSatelliteSurveillancePatterns(input.satellites, input.conflicts, input.watchRegions);
  const acPatterns = detectMilitaryAircraftPatterns(input.aircraft, input.conflicts, input.watchRegions);

  // --- A. Market + Conflict correlation (the Iran/oil example) ---
  alerts.push(...correlateMarketConflict(input.market, marketAnomalies, input.conflicts, input.gdeltEvents));

  // --- B. Satellite + Conflict + Market (surveillance before strikes) ---
  alerts.push(...correlateSurveillanceConflictMarket(satPatterns, input.conflicts, marketAnomalies, input.market));

  // --- C. Aircraft + Satellite + Conflict (military buildup) ---
  alerts.push(...correlateMilitaryBuildup(acPatterns, satPatterns, input.conflicts));

  // --- D. Pre-event market movement detection ---
  alerts.push(...detectPreEventMarketMovements(input.market, input.conflicts, input.gdeltEvents));

  // Sort by severity then suspicion
  const severityOrder: Record<SeverityLevel, number> = { critical: 4, high: 3, medium: 2, low: 1 };
  const suspicionOrder: Record<string, number> = { very_high: 5, high: 4, moderate: 3, low: 2, none: 1 };

  alerts.sort(
    (a, b) =>
      severityOrder[b.severity] - severityOrder[a.severity] ||
      suspicionOrder[b.suspicionLevel] - suspicionOrder[a.suspicionLevel]
  );

  return alerts.slice(0, 50);
}

// --- A. Market ↔ Conflict Correlation ---
function correlateMarketConflict(
  market: MarketData[],
  anomalies: MarketAnomaly[],
  conflicts: ConflictEvent[],
  gdeltEvents: GDELTEvent[]
): CrossIntelligenceAlert[] {
  const alerts: CrossIntelligenceAlert[] = [];

  // Group conflicts by country
  const conflictsByCountry = new Map<string, ConflictEvent[]>();
  for (const c of conflicts) {
    if (!conflictsByCountry.has(c.country)) conflictsByCountry.set(c.country, []);
    conflictsByCountry.get(c.country)!.push(c);
  }

  for (const [country, countryConflicts] of conflictsByCountry) {
    const linkedSymbols = REGION_COMMODITY_MAP[country] || [];
    if (linkedSymbols.length === 0) continue;

    const linkedMarket = market.filter((m) => linkedSymbols.includes(m.symbol));
    const linkedAnomalies = anomalies.filter(
      (a) => a.relatedCountries?.includes(country)
    );

    // Find energy commodities with unusual movement + active conflict
    const energyAnomalies = linkedMarket.filter(
      (m) => m.category === "energy" && (Math.abs(m.changePercent) > 2 || m.volumeAnomaly > 1.5)
    );

    const recentConflicts = countryConflicts.filter(
      (c) => new Date(c.date).getTime() > Date.now() - 48 * 60 * 60 * 1000
    );

    if (energyAnomalies.length > 0 && recentConflicts.length > 0) {
      const signals: CrossIntelSignal[] = [];

      for (const e of energyAnomalies) {
        signals.push({
          source: "market",
          description: `${e.name}: ${e.changePercent > 0 ? "+" : ""}${e.changePercent.toFixed(2)}% | Vol ${e.volumeAnomaly.toFixed(1)}x avg`,
          timestamp: e.timestamp,
          severity: Math.abs(e.changePercent) > 5 ? "high" : "medium",
        });
      }

      for (const c of recentConflicts.slice(0, 5)) {
        signals.push({
          source: "conflict",
          description: `${c.eventType.replace(/_/g, " ")}: ${c.location}, ${c.country} — ${c.fatalities} fatalities`,
          timestamp: c.date,
          severity: c.severity,
          dataPointId: c.id,
        });
      }

      // GDELT media signals
      const countryGdelt = gdeltEvents.filter((e) => e.country === country).slice(0, 3);
      for (const g of countryGdelt) {
        signals.push({
          source: "gdelt",
          description: `Media: "${g.title}" (tone: ${g.avgTone.toFixed(1)})`,
          timestamp: g.dateAdded,
          severity: g.avgTone < -5 ? "high" : "medium",
        });
      }

      const totalFatalities = recentConflicts.reduce((s, c) => s + c.fatalities, 0);
      const maxEnergyChange = Math.max(...energyAnomalies.map((e) => Math.abs(e.changePercent)));
      const maxVolAnomaly = Math.max(...energyAnomalies.map((e) => e.volumeAnomaly));

      // Suspicion level based on timing and magnitude
      let suspicionLevel: CrossIntelligenceAlert["suspicionLevel"] = "none";
      if (maxVolAnomaly > 3 && maxEnergyChange > 3) suspicionLevel = "high";
      else if (maxVolAnomaly > 2 || maxEnergyChange > 3) suspicionLevel = "moderate";
      else if (maxVolAnomaly > 1.5) suspicionLevel = "low";

      const energyNames = energyAnomalies.map((e) => e.name).join(", ");

      alerts.push({
        id: `cross-mkt-conf-${country}-${Date.now()}`,
        title: `Conflict-Market Nexus: ${country}`,
        summary: `Active conflict in ${country} (${recentConflicts.length} incidents, ${totalFatalities} fatalities) correlating with unusual ${energyNames} movement.`,
        category: determineCategory(suspicionLevel, maxVolAnomaly),
        severity: maxEnergyChange > 5 || totalFatalities > 20 ? "critical" : "high",
        confidence: Math.min(95, 50 + recentConflicts.length * 5 + energyAnomalies.length * 10),
        timestamp: new Date(),
        signals,
        region: country,
        countries: [country],
        marketImpact: {
          symbols: energyAnomalies.map((e) => e.symbol),
          direction: energyAnomalies[0].changePercent > 0 ? "bullish" : "bearish",
          magnitude: maxEnergyChange > 5 ? "major" : maxEnergyChange > 3 ? "moderate" : "minor",
        },
        suspicionLevel,
        narrative: buildNarrative(country, recentConflicts, energyAnomalies, suspicionLevel),
        recommendations: buildRecommendations(suspicionLevel, country, energyAnomalies),
      });
    }
  }

  return alerts;
}

// --- B. Surveillance + Conflict + Market ---
function correlateSurveillanceConflictMarket(
  satPatterns: SatelliteSurveillancePattern[],
  conflicts: ConflictEvent[],
  marketAnomalies: MarketAnomaly[],
  market: MarketData[]
): CrossIntelligenceAlert[] {
  const alerts: CrossIntelligenceAlert[] = [];

  for (const pattern of satPatterns) {
    if (pattern.anomalyScore < 40) continue;

    const signals: CrossIntelSignal[] = [];

    // Satellite signal
    signals.push({
      source: "satellite",
      description: pattern.description,
      timestamp: pattern.startDetected,
      severity: pattern.anomalyScore > 70 ? "high" : "medium",
    });

    // Related conflict signals
    const relatedConflicts = conflicts.filter(
      (c) => pattern.relatedConflictIds?.includes(c.id)
    );
    for (const c of relatedConflicts.slice(0, 3)) {
      signals.push({
        source: "conflict",
        description: `${c.eventType.replace(/_/g, " ")}: ${c.location}`,
        timestamp: c.date,
        severity: c.severity,
        dataPointId: c.id,
      });
    }

    // Related market signals
    const regionCountries = pattern.ownerCountries;
    const relatedMarketAnomalies = marketAnomalies.filter(
      (a) => a.relatedCountries?.some((c) => regionCountries.includes(c))
    );
    for (const ma of relatedMarketAnomalies.slice(0, 3)) {
      signals.push({
        source: "market",
        description: `${ma.name}: ${ma.description}`,
        timestamp: ma.timestamp,
        severity: ma.severity,
      });
    }

    const category: CrossIntelCategory = pattern.phase === "pre_event"
      ? "preemptive_positioning"
      : "surveillance_escalation";

    alerts.push({
      id: `cross-surv-${pattern.id}`,
      title: `Surveillance Pattern: ${pattern.targetRegion}`,
      summary: `${pattern.description}. Phase: ${pattern.phase.replace(/_/g, " ")}. ${relatedConflicts.length} active conflicts in region.`,
      category,
      severity: pattern.anomalyScore > 70 ? "high" : "medium",
      confidence: Math.min(90, pattern.anomalyScore + relatedConflicts.length * 5),
      timestamp: new Date(),
      signals,
      region: pattern.targetRegion,
      countries: pattern.ownerCountries,
      suspicionLevel: pattern.phase === "pre_event" ? "moderate" : "low",
      narrative: `${pattern.ownerCountries.join(", ")} intelligence assets detected in ${pattern.phase.replace(/_/g, " ")} configuration over ${pattern.targetRegion}. ${pattern.patternType.replace(/_/g, " ")} pattern suggests ${inferSurveillancePurpose(pattern)}.`,
      recommendations: [
        `Monitor ${pattern.targetRegion} for escalation indicators`,
        `Track ${pattern.ownerCountries.join(", ")} military communications`,
        `Watch for changes in commodity prices linked to this region`,
      ],
    });
  }

  return alerts;
}

// --- C. Military Buildup Correlation ---
function correlateMilitaryBuildup(
  acPatterns: MilitaryAircraftPattern[],
  satPatterns: SatelliteSurveillancePattern[],
  conflicts: ConflictEvent[]
): CrossIntelligenceAlert[] {
  const alerts: CrossIntelligenceAlert[] = [];

  for (const ac of acPatterns) {
    // Find matching satellite patterns in same region
    const matchingSat = satPatterns.find(
      (s) => s.targetRegion === ac.region
    );

    const signals: CrossIntelSignal[] = [];

    signals.push({
      source: "aircraft",
      description: ac.description,
      timestamp: ac.timestamp,
      severity: ac.count > 5 ? "high" : "medium",
    });

    if (matchingSat) {
      signals.push({
        source: "satellite",
        description: matchingSat.description,
        timestamp: matchingSat.startDetected,
        severity: matchingSat.anomalyScore > 70 ? "high" : "medium",
      });
    }

    const relatedConflicts = conflicts.filter(
      (c) => ac.relatedConflictIds?.includes(c.id)
    );
    for (const c of relatedConflicts.slice(0, 3)) {
      signals.push({
        source: "conflict",
        description: `${c.eventType.replace(/_/g, " ")}: ${c.location}`,
        timestamp: c.date,
        severity: c.severity,
      });
    }

    const hasMultiDomainSignals = matchingSat !== undefined && relatedConflicts.length > 0;

    if (hasMultiDomainSignals || ac.count >= 5 || ac.patternType === "civilian_avoidance") {
      alerts.push({
        id: `cross-mil-${ac.id}`,
        title: `Military Activity: ${ac.region}`,
        summary: ac.description + (matchingSat ? ` Concurrent satellite surveillance detected.` : ""),
        category: "military_buildup",
        severity: hasMultiDomainSignals ? "high" : "medium",
        confidence: Math.min(90, 50 + ac.count * 5 + (matchingSat ? 20 : 0)),
        timestamp: new Date(),
        signals,
        region: ac.region,
        countries: [],
        suspicionLevel: hasMultiDomainSignals ? "moderate" : "low",
        narrative: `Multi-domain military activity detected over ${ac.region}: ${ac.patternType.replace(/_/g, " ")} pattern with ${ac.count} military aircraft${matchingSat ? ` and ${matchingSat.satelliteNames.length} surveillance satellites` : ""}. ${relatedConflicts.length} ground conflicts active.`,
        recommendations: [
          `Immediate: Monitor airspace and satellite coverage changes`,
          `Watch for NOTAM changes and civilian traffic rerouting`,
          `Cross-reference with defense sector stock movements`,
        ],
      });
    }
  }

  return alerts;
}

// --- D. Pre-Event Market Movement Detection ---
function detectPreEventMarketMovements(
  market: MarketData[],
  conflicts: ConflictEvent[],
  gdeltEvents: GDELTEvent[]
): CrossIntelligenceAlert[] {
  const alerts: CrossIntelligenceAlert[] = [];

  // Look for defense stocks surging without public conflict news
  const defenseStocks = market.filter((m) => m.category === "defense");
  const avgDefenseChange = defenseStocks.reduce((s, m) => s + m.changePercent, 0) / (defenseStocks.length || 1);
  const avgDefenseVolume = defenseStocks.reduce((s, m) => s + m.volumeAnomaly, 0) / (defenseStocks.length || 1);

  // GDELT conflict count as proxy for "public awareness"
  const conflictNews = gdeltEvents.filter(
    (e) => e.quadClass === "material_conflict" || e.quadClass === "verbal_conflict"
  );

  // Defense sector moving without matching public conflict news = suspicious
  if (avgDefenseChange > 2 && avgDefenseVolume > 1.5 && conflictNews.length < 5) {
    const signals: CrossIntelSignal[] = defenseStocks
      .filter((m) => m.changePercent > 1)
      .map((m) => ({
        source: "market" as const,
        description: `${m.name}: +${m.changePercent.toFixed(2)}% | Vol ${m.volumeAnomaly.toFixed(1)}x`,
        timestamp: m.timestamp,
        severity: m.changePercent > 3 ? "high" as const : "medium" as const,
      }));

    alerts.push({
      id: `cross-preempt-defense-${Date.now()}`,
      title: "Suspicious Defense Sector Activity",
      summary: `Defense stocks averaging +${avgDefenseChange.toFixed(2)}% with ${avgDefenseVolume.toFixed(1)}x volume, but limited public conflict reporting (${conflictNews.length} events). Possible insider positioning before conflict escalation.`,
      category: "insider_trading_suspicion",
      severity: avgDefenseChange > 4 ? "critical" : "high",
      confidence: Math.min(80, 40 + avgDefenseChange * 5 + avgDefenseVolume * 10),
      timestamp: new Date(),
      signals,
      region: "Global",
      countries: [],
      marketImpact: {
        symbols: defenseStocks.filter((m) => m.changePercent > 1).map((m) => m.symbol),
        direction: "bullish",
        magnitude: avgDefenseChange > 4 ? "major" : "moderate",
      },
      suspicionLevel: avgDefenseChange > 3 && avgDefenseVolume > 2 ? "high" : "moderate",
      narrative: `The defense sector is showing coordinated upward movement (avg +${avgDefenseChange.toFixed(2)}%) with elevated volume (${avgDefenseVolume.toFixed(1)}x average) in the absence of significant public conflict reporting. This pattern historically precedes major geopolitical events or military actions. Key movers: ${defenseStocks.filter((m) => m.changePercent > 1).map((m) => `${m.name} (+${m.changePercent.toFixed(1)}%)`).join(", ")}.`,
      recommendations: [
        "IMMEDIATE: Cross-reference with classified satellite imagery requests",
        "Monitor military communication patterns for activity spikes",
        "Track unusual options activity on defense ETFs (ITA, XAR, PPA)",
        "Flag for regulatory review — possible material non-public information trading",
      ],
    });
  }

  // Oil/gas surging before conflict reports materialize
  const energyData = market.filter((m) => m.category === "energy");
  const avgEnergyChange = energyData.reduce((s, m) => s + m.changePercent, 0) / (energyData.length || 1);

  const middleEastConflicts = conflicts.filter((c) =>
    ["IRN", "IRQ", "SAU", "YEM", "ISR", "LBN", "SYR"].includes(c.country)
  );

  if (avgEnergyChange > 3 && middleEastConflicts.length === 0) {
    const signals: CrossIntelSignal[] = energyData
      .filter((m) => m.changePercent > 2)
      .map((m) => ({
        source: "market" as const,
        description: `${m.name}: +${m.changePercent.toFixed(2)}%`,
        timestamp: m.timestamp,
        severity: "high" as const,
      }));

    alerts.push({
      id: `cross-preempt-energy-${Date.now()}`,
      title: "Pre-Event Energy Market Movement",
      summary: `Energy commodities surging (avg +${avgEnergyChange.toFixed(2)}%) without corresponding Middle East conflict data. Market may be pricing in non-public intelligence.`,
      category: "preemptive_positioning",
      severity: "high",
      confidence: 60,
      timestamp: new Date(),
      signals,
      region: "Middle East",
      countries: ["IRN", "IRQ", "SAU"],
      marketImpact: {
        symbols: energyData.filter((m) => m.changePercent > 2).map((m) => m.symbol),
        direction: "bullish",
        magnitude: avgEnergyChange > 5 ? "major" : "moderate",
      },
      suspicionLevel: "moderate",
      narrative: `Energy markets are showing significant upward pressure without matching public geopolitical intelligence. Historical patterns suggest this can precede major supply disruption events (Strait of Hormuz incidents, pipeline attacks, sanctions announcements).`,
      recommendations: [
        "Monitor Strait of Hormuz satellite imagery for naval buildup",
        "Track tanker AIS data for route changes or anchorage patterns",
        "Watch for unusual options activity on USO, XLE, OIH",
        "Cross-reference with IRGC/military communication intercepts",
      ],
    });
  }

  return alerts;
}

// ============================================================================
// Helper Functions
// ============================================================================

function determineCategory(
  suspicionLevel: CrossIntelligenceAlert["suspicionLevel"],
  volumeAnomaly: number
): CrossIntelCategory {
  if (suspicionLevel === "high" || suspicionLevel === "very_high") return "insider_trading_suspicion";
  if (volumeAnomaly > 3) return "market_manipulation";
  return "conflict_profiteering";
}

function buildNarrative(
  country: string,
  conflicts: ConflictEvent[],
  energyAnomalies: MarketData[],
  suspicionLevel: CrossIntelligenceAlert["suspicionLevel"]
): string {
  const totalFatalities = conflicts.reduce((s, c) => s + c.fatalities, 0);
  const latestConflict = conflicts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )[0];

  let narrative = `Conflict activity in ${country} (${conflicts.length} incidents, ${totalFatalities} fatalities) is correlating with unusual market movements. `;
  narrative += `Energy commodities affected: ${energyAnomalies.map((e) => `${e.name} (${e.changePercent > 0 ? "+" : ""}${e.changePercent.toFixed(2)}%)`).join(", ")}. `;

  if (latestConflict) {
    narrative += `Most recent incident: ${latestConflict.subEventType} in ${latestConflict.location}. `;
  }

  if (suspicionLevel === "high" || suspicionLevel === "very_high") {
    narrative += `The volume-to-price ratio suggests potential informed trading — volume spikes preceding or coinciding with conflict escalation warrant regulatory attention.`;
  } else if (suspicionLevel === "moderate") {
    narrative += `Market movement is consistent with geopolitical risk repricing but timing warrants monitoring for anomalous trading patterns.`;
  }

  return narrative;
}

function buildRecommendations(
  suspicionLevel: CrossIntelligenceAlert["suspicionLevel"],
  country: string,
  energyAnomalies: MarketData[]
): string[] {
  const recs = [
    `Monitor ${country} conflict developments for escalation`,
    `Track ${energyAnomalies.map((e) => e.name).join(", ")} price action and volume`,
  ];

  if (suspicionLevel === "high" || suspicionLevel === "very_high") {
    recs.push(
      "FLAG: Review large block trades and options activity for suspicious timing",
      "Cross-reference with known entities connected to conflict parties",
      "Check for correlated movements in related derivatives markets"
    );
  }

  recs.push(
    `Watch for satellite imagery changes over ${country}`,
    `Monitor military aircraft movements in the region`
  );

  return recs;
}

function inferSurveillancePurpose(pattern: SatelliteSurveillancePattern): string {
  switch (pattern.patternType) {
    case "increased_passes":
      return "heightened intelligence collection, possible pre-strike planning";
    case "battle_damage_assessment":
      return "post-strike damage evaluation and targeting refinement";
    case "formation_change":
      return "coordinated multi-satellite intelligence operation";
    case "persistent_surveillance":
      return "continuous monitoring of strategic targets";
    case "orbit_adjustment":
      return "repositioning for optimized coverage of emerging threat";
    case "new_coverage":
      return "expanding surveillance footprint to new area of interest";
    default:
      return "intelligence gathering operation";
  }
}
