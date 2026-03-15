// ============================================================================
// Satellite Spy — Ontology / World Model
// ============================================================================
// A graph-based representation of the real world that connects all data sources
// into entities, relationships, and causal chains. This is the "digital twin"
// layer that Palantir-class products use to reason about reality.
// ============================================================================

import type {
  ConflictEvent,
  GDELTEvent,
  SatellitePosition,
  AircraftPosition,
  NaturalDisaster,
  MarketData,
  MarketAnomaly,
  EconomicIndicator,
  SeverityLevel,
  CrossIntelligenceAlert,
} from "@/types";

// ============================================================================
// Entity Types — objects in the world
// ============================================================================

export type EntityType =
  | "country"
  | "region"
  | "city"
  | "military_base"
  | "port"
  | "chokepoint"
  | "commodity"
  | "market"
  | "actor"        // armed group, government, corporation
  | "satellite"
  | "aircraft"
  | "infrastructure"
  | "population";

export interface WorldEntity {
  id: string;
  type: EntityType;
  name: string;
  location?: { lat: number; lon: number };
  country?: string;
  properties: Record<string, unknown>;
  // Current state
  status: "normal" | "stressed" | "disrupted" | "critical";
  statusReason?: string;
  // Live metrics
  metrics: EntityMetric[];
  // When last updated
  lastUpdated: Date;
}

export interface EntityMetric {
  name: string;
  value: number;
  unit: string;
  trend: "rising" | "falling" | "stable";
  anomaly: boolean;
}

// ============================================================================
// Relationship Types — how entities connect
// ============================================================================

export type RelationType =
  | "depends_on"       // A depends on B (supply chain)
  | "transports"       // A transports goods through B (chokepoint)
  | "threatens"        // A threatens B (conflict)
  | "monitors"         // A monitors B (surveillance)
  | "trades"           // A trades commodity B
  | "borders"          // A borders B (geography)
  | "supplies"         // A supplies B
  | "controls"         // A controls B
  | "allied_with"      // A is allied with B
  | "hostile_to"       // A is hostile to B
  | "impacts";         // A impacts B (cascade)

export interface WorldRelation {
  id: string;
  type: RelationType;
  sourceId: string;
  targetId: string;
  strength: number;    // 0-1
  properties: Record<string, unknown>;
  active: boolean;
}

// ============================================================================
// Causal Chain — how events propagate
// ============================================================================

export interface CausalChain {
  id: string;
  trigger: string;           // What starts it
  steps: CausalStep[];
  totalTimeframe: string;    // e.g., "48h-7d"
  confidence: number;
  severity: SeverityLevel;
}

export interface CausalStep {
  order: number;
  description: string;
  entityId: string;
  entityName: string;
  impact: "disrupted" | "stressed" | "cascading" | "critical";
  timeframe: string;
  probability: number;
}

// ============================================================================
// World Model — the assembled graph
// ============================================================================

export interface WorldModel {
  entities: Map<string, WorldEntity>;
  relations: WorldRelation[];
  causalChains: CausalChain[];
  lastUpdated: Date;
}

// ============================================================================
// Pre-defined strategic entities
// ============================================================================

const STRATEGIC_CHOKEPOINTS: Omit<WorldEntity, "metrics" | "status" | "lastUpdated">[] = [
  {
    id: "chokepoint-hormuz",
    type: "chokepoint",
    name: "Strait of Hormuz",
    location: { lat: 26.5, lon: 56.3 },
    properties: { oilFlowMbpd: 21, globalOilShare: 0.21, width_km: 39 },
  },
  {
    id: "chokepoint-malacca",
    type: "chokepoint",
    name: "Strait of Malacca",
    location: { lat: 2.5, lon: 101.5 },
    properties: { tradeValueTrillion: 5.3, globalTradeShare: 0.25, width_km: 65 },
  },
  {
    id: "chokepoint-suez",
    type: "chokepoint",
    name: "Suez Canal",
    location: { lat: 30.5, lon: 32.3 },
    properties: { globalTradeShare: 0.12, dailyTransits: 50 },
  },
  {
    id: "chokepoint-bab-el-mandeb",
    type: "chokepoint",
    name: "Bab el-Mandeb Strait",
    location: { lat: 12.5, lon: 43.3 },
    properties: { oilFlowMbpd: 6.2, connectsTo: "Red Sea" },
  },
  {
    id: "chokepoint-taiwan-strait",
    type: "chokepoint",
    name: "Taiwan Strait",
    location: { lat: 24.5, lon: 119.5 },
    properties: { chipSupplyShare: 0.65, globalTradeShare: 0.08 },
  },
  {
    id: "chokepoint-bosphorus",
    type: "chokepoint",
    name: "Turkish Straits (Bosphorus)",
    location: { lat: 41.1, lon: 29.0 },
    properties: { grainExportShare: 0.25, oilFlowMbpd: 3.0 },
  },
];

const STRATEGIC_COMMODITIES: Omit<WorldEntity, "metrics" | "status" | "lastUpdated">[] = [
  {
    id: "commodity-oil",
    type: "commodity",
    name: "Crude Oil",
    properties: { symbols: ["CL=F", "BZ=F"], unit: "barrel", topProducers: ["USA", "SAU", "RUS"] },
  },
  {
    id: "commodity-natgas",
    type: "commodity",
    name: "Natural Gas",
    properties: { symbols: ["NG=F"], unit: "MMBtu", topProducers: ["USA", "RUS", "IRN"] },
  },
  {
    id: "commodity-wheat",
    type: "commodity",
    name: "Wheat",
    properties: { symbols: ["ZW=F"], unit: "bushel", topExporters: ["RUS", "UKR", "CAN", "USA"] },
  },
  {
    id: "commodity-gold",
    type: "commodity",
    name: "Gold",
    properties: { symbols: ["GC=F"], unit: "oz", role: "safe_haven" },
  },
  {
    id: "commodity-semiconductors",
    type: "commodity",
    name: "Semiconductors",
    properties: { topProducers: ["TWN", "KOR", "USA"], criticalFor: ["defense", "auto", "tech"] },
  },
];

const KEY_COUNTRIES: Omit<WorldEntity, "metrics" | "status" | "lastUpdated">[] = [
  { id: "country-USA", type: "country", name: "United States", location: { lat: 39.8, lon: -98.6 }, country: "USA", properties: { gdpTrillion: 25.5, military: "superpower", nuclearArsenal: true } },
  { id: "country-RUS", type: "country", name: "Russia", location: { lat: 61.5, lon: 105.3 }, country: "RUS", properties: { gdpTrillion: 1.8, military: "superpower", nuclearArsenal: true, keyExports: ["oil", "gas", "wheat"] } },
  { id: "country-CHN", type: "country", name: "China", location: { lat: 35.9, lon: 104.2 }, country: "CHN", properties: { gdpTrillion: 17.9, military: "superpower", nuclearArsenal: true, keyImports: ["oil", "semiconductors"] } },
  { id: "country-IRN", type: "country", name: "Iran", location: { lat: 32.4, lon: 53.7 }, country: "IRN", properties: { gdpTrillion: 0.4, keyExports: ["oil"], sanctions: true, controlsHormuz: true } },
  { id: "country-UKR", type: "country", name: "Ukraine", location: { lat: 48.4, lon: 31.2 }, country: "UKR", properties: { gdpTrillion: 0.16, keyExports: ["wheat", "corn", "sunflower"], activeConflict: true } },
  { id: "country-TWN", type: "country", name: "Taiwan", location: { lat: 23.7, lon: 121.0 }, country: "TWN", properties: { gdpTrillion: 0.79, keyExports: ["semiconductors"], chipShare: 0.65 } },
  { id: "country-SAU", type: "country", name: "Saudi Arabia", location: { lat: 23.9, lon: 45.1 }, country: "SAU", properties: { gdpTrillion: 1.1, keyExports: ["oil"], oilReserves: "largest" } },
  { id: "country-ISR", type: "country", name: "Israel", location: { lat: 31.0, lon: 34.9 }, country: "ISR", properties: { gdpTrillion: 0.52, military: "regional_power", nuclearArsenal: true } },
];

const STRATEGIC_RELATIONS: Omit<WorldRelation, "id">[] = [
  // Oil flows through Hormuz
  { type: "transports", sourceId: "country-SAU", targetId: "chokepoint-hormuz", strength: 0.9, properties: { commodity: "oil" }, active: true },
  { type: "transports", sourceId: "country-IRN", targetId: "chokepoint-hormuz", strength: 0.8, properties: { commodity: "oil" }, active: true },
  { type: "controls", sourceId: "country-IRN", targetId: "chokepoint-hormuz", strength: 0.7, properties: { canBlockade: true }, active: true },
  // Taiwan semiconductor dependency
  { type: "supplies", sourceId: "country-TWN", targetId: "commodity-semiconductors", strength: 0.95, properties: { globalShare: 0.65 }, active: true },
  { type: "depends_on", sourceId: "country-USA", targetId: "commodity-semiconductors", strength: 0.8, properties: { sector: "defense, tech" }, active: true },
  { type: "threatens", sourceId: "country-CHN", targetId: "country-TWN", strength: 0.6, properties: { type: "military_pressure" }, active: true },
  // Ukraine grain
  { type: "supplies", sourceId: "country-UKR", targetId: "commodity-wheat", strength: 0.7, properties: { globalExportShare: 0.10 }, active: true },
  { type: "transports", sourceId: "country-UKR", targetId: "chokepoint-bosphorus", strength: 0.8, properties: { commodity: "grain" }, active: true },
  { type: "hostile_to", sourceId: "country-RUS", targetId: "country-UKR", strength: 0.95, properties: { type: "active_conflict" }, active: true },
  // Energy dependencies
  { type: "depends_on", sourceId: "country-CHN", targetId: "commodity-oil", strength: 0.85, properties: { importPercent: 72 }, active: true },
  { type: "supplies", sourceId: "country-SAU", targetId: "commodity-oil", strength: 0.9, properties: { globalShare: 0.12 }, active: true },
  { type: "supplies", sourceId: "country-RUS", targetId: "commodity-natgas", strength: 0.7, properties: { europeShare: 0.15 }, active: true },
  // Middle East dynamics
  { type: "hostile_to", sourceId: "country-IRN", targetId: "country-ISR", strength: 0.9, properties: { type: "proxy_conflict" }, active: true },
  { type: "allied_with", sourceId: "country-USA", targetId: "country-ISR", strength: 0.9, properties: { type: "strategic_alliance" }, active: true },
];

// ============================================================================
// World Model Builder — assembles the graph from live data
// ============================================================================

export interface WorldModelInput {
  conflicts: ConflictEvent[];
  gdeltEvents: GDELTEvent[];
  satellites: SatellitePosition[];
  aircraft: AircraftPosition[];
  disasters: NaturalDisaster[];
  marketData: MarketData[];
  marketAnomalies: MarketAnomaly[];
  economicIndicators: EconomicIndicator[];
  crossIntelAlerts: CrossIntelligenceAlert[];
}

export function buildWorldModel(input: WorldModelInput): WorldModel {
  const entities = new Map<string, WorldEntity>();
  const now = new Date();

  // --- 1. Load static strategic entities ---
  for (const choke of STRATEGIC_CHOKEPOINTS) {
    entities.set(choke.id, {
      ...choke,
      status: "normal",
      metrics: [],
      lastUpdated: now,
    });
  }

  for (const commodity of STRATEGIC_COMMODITIES) {
    const symbols = commodity.properties.symbols as string[] | undefined;
    const marketItems = symbols
      ? input.marketData.filter((m) => symbols.includes(m.symbol))
      : [];
    const metrics: EntityMetric[] = marketItems.map((m) => ({
      name: `${m.symbol} price`,
      value: m.changePercent,
      unit: "%",
      trend: m.changePercent > 1 ? "rising" : m.changePercent < -1 ? "falling" : "stable",
      anomaly: m.volumeAnomaly > 2 || Math.abs(m.changePercent) > 5,
    }));

    let status: WorldEntity["status"] = "normal";
    if (marketItems.some((m) => Math.abs(m.changePercent) > 5)) status = "critical";
    else if (marketItems.some((m) => Math.abs(m.changePercent) > 3)) status = "disrupted";
    else if (marketItems.some((m) => m.volumeAnomaly > 2)) status = "stressed";

    entities.set(commodity.id, {
      ...commodity,
      status,
      statusReason: status !== "normal" ? `Price ${metrics[0]?.trend || "volatile"}: ${metrics[0]?.value.toFixed(1)}%` : undefined,
      metrics,
      lastUpdated: now,
    });
  }

  for (const country of KEY_COUNTRIES) {
    const countryCode = country.country!;
    const countryConflicts = input.conflicts.filter((c) => c.country === countryCode);
    const countryDisasters = input.disasters.filter((d) => d.country === countryCode);
    const countryAlerts = input.crossIntelAlerts.filter((a) => a.countries.includes(countryCode));

    let status: WorldEntity["status"] = "normal";
    let statusReason: string | undefined;

    if (countryConflicts.some((c) => c.severity === "critical") || countryAlerts.some((a) => a.severity === "critical")) {
      status = "critical";
      statusReason = "Critical conflict or intelligence alert active";
    } else if (countryConflicts.some((c) => c.severity === "high") || countryDisasters.some((d) => d.severity === "high")) {
      status = "disrupted";
      statusReason = `${countryConflicts.length} conflicts, ${countryDisasters.length} disasters`;
    } else if (countryConflicts.length > 0 || countryDisasters.length > 0) {
      status = "stressed";
      statusReason = `${countryConflicts.length} conflicts, ${countryDisasters.length} disasters`;
    }

    const metrics: EntityMetric[] = [
      { name: "Active conflicts", value: countryConflicts.length, unit: "events", trend: "stable", anomaly: countryConflicts.length > 3 },
      { name: "Cross-intel alerts", value: countryAlerts.length, unit: "alerts", trend: "stable", anomaly: countryAlerts.length > 0 },
    ];

    // Economic metrics
    const econ = input.economicIndicators.filter((e) => e.countryCode === countryCode);
    for (const e of econ.slice(0, 3)) {
      metrics.push({
        name: e.indicator.replace(/_/g, " "),
        value: e.value,
        unit: "%",
        trend: e.trend === "up" ? "rising" : e.trend === "down" ? "falling" : "stable",
        anomaly: e.trend !== "stable",
      });
    }

    entities.set(country.id, {
      ...country,
      status,
      statusReason,
      metrics,
      lastUpdated: now,
    });
  }

  // --- 2. Update chokepoint status based on nearby conflicts/events ---
  for (const [id, entity] of entities) {
    if (entity.type !== "chokepoint" || !entity.location) continue;

    const nearbyConflicts = input.conflicts.filter((c) => {
      const dist = haversineDistance(entity.location!.lat, entity.location!.lon, c.latitude, c.longitude);
      return dist < 500; // 500km radius
    });

    const nearbySats = input.satellites.filter((s) => {
      const dist = haversineDistance(entity.location!.lat, entity.location!.lon, s.latitude, s.longitude);
      return dist < 300 && (s.category === "reconnaissance" || s.category === "military");
    });

    if (nearbyConflicts.some((c) => c.severity === "critical")) {
      entity.status = "critical";
      entity.statusReason = `Critical conflict within 500km: ${nearbyConflicts[0]?.location}`;
    } else if (nearbyConflicts.length > 0) {
      entity.status = "stressed";
      entity.statusReason = `${nearbyConflicts.length} conflicts within 500km`;
    }

    entity.metrics = [
      { name: "Nearby conflicts", value: nearbyConflicts.length, unit: "events", trend: "stable", anomaly: nearbyConflicts.length > 0 },
      { name: "Recon satellites", value: nearbySats.length, unit: "sats", trend: "stable", anomaly: nearbySats.length > 2 },
    ];

    entities.set(id, entity);
  }

  // --- 3. Build relations from static + dynamic data ---
  const relations: WorldRelation[] = STRATEGIC_RELATIONS.map((r, i) => ({
    ...r,
    id: `rel-static-${i}`,
  }));

  // Dynamic: satellites monitoring regions
  for (const sat of input.satellites.filter((s) => s.category === "reconnaissance" || s.category === "military")) {
    for (const [entityId, entity] of entities) {
      if (!entity.location) continue;
      const dist = haversineDistance(entity.location.lat, entity.location.lon, sat.latitude, sat.longitude);
      if (dist < 300) {
        relations.push({
          id: `rel-sat-${sat.id}-${entityId}`,
          type: "monitors",
          sourceId: `sat-${sat.id}`,
          targetId: entityId,
          strength: Math.max(0.3, 1 - dist / 300),
          properties: { satellite: sat.name, country: sat.country, altitude: sat.altitude },
          active: true,
        });
      }
    }
  }

  // --- 4. Build causal chains from current state ---
  const causalChains = buildCausalChains(entities, relations, input);

  return {
    entities,
    relations,
    causalChains,
    lastUpdated: now,
  };
}

// ============================================================================
// Causal Chain Builder
// ============================================================================

function buildCausalChains(
  entities: Map<string, WorldEntity>,
  relations: WorldRelation[],
  input: WorldModelInput
): CausalChain[] {
  const chains: CausalChain[] = [];

  // Check each disrupted/critical entity for cascade effects
  for (const [entityId, entity] of entities) {
    if (entity.status !== "disrupted" && entity.status !== "critical") continue;

    // Find all entities that depend on or are supplied by this entity
    const impactedRelations = relations.filter(
      (r) =>
        (r.sourceId === entityId && (r.type === "supplies" || r.type === "transports")) ||
        (r.targetId === entityId && r.type === "depends_on")
    );

    if (impactedRelations.length === 0) continue;

    const steps: CausalStep[] = [];
    let order = 1;

    // Step 1: The disrupted entity itself
    steps.push({
      order: order++,
      description: `${entity.name} status: ${entity.status.toUpperCase()} — ${entity.statusReason || "disruption detected"}`,
      entityId,
      entityName: entity.name,
      impact: entity.status === "critical" ? "critical" : "disrupted",
      timeframe: "Now",
      probability: 1.0,
    });

    // Step 2+: Cascade to dependent entities
    for (const rel of impactedRelations) {
      const dependentId = rel.sourceId === entityId ? rel.targetId : rel.sourceId;
      const dependent = entities.get(dependentId);
      if (!dependent) continue;

      steps.push({
        order: order++,
        description: `${dependent.name}: ${rel.type.replace(/_/g, " ")} link to ${entity.name} at risk (strength: ${(rel.strength * 100).toFixed(0)}%)`,
        entityId: dependentId,
        entityName: dependent.name,
        impact: rel.strength > 0.7 ? "cascading" : "stressed",
        timeframe: "24-72h",
        probability: rel.strength * 0.8,
      });
    }

    if (steps.length >= 2) {
      chains.push({
        id: `chain-${entityId}-${Date.now()}`,
        trigger: `${entity.name} ${entity.status}`,
        steps,
        totalTimeframe: "24h-7d",
        confidence: Math.round(60 + (entity.status === "critical" ? 20 : 0)),
        severity: entity.status === "critical" ? "critical" : "high",
      });
    }
  }

  return chains.sort((a, b) => {
    const sevOrder: Record<SeverityLevel, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    return sevOrder[b.severity] - sevOrder[a.severity];
  });
}

// ============================================================================
// Utility
// ============================================================================

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
