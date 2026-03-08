// ============================================================================
// Satellite Spy — Type Definitions
// ============================================================================

// --- Satellite Types ---
export interface TLEData {
  name: string;
  line1: string;
  line2: string;
  catalogNumber: string;
  classification: string;
  intlDesignator: string;
  epochYear: number;
  epochDay: number;
  inclination: number;
  eccentricity: number;
  period: number;
}

export interface SatellitePosition {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  altitude: number; // km
  velocity: number; // km/s
  category: SatelliteCategory;
  country: string;
  timestamp: Date;
  tle: TLEData;
}

export type SatelliteCategory =
  | "reconnaissance"
  | "communications"
  | "navigation"
  | "weather"
  | "scientific"
  | "military"
  | "classified"
  | "unknown";

export interface SatellitePass {
  satelliteId: string;
  startTime: Date;
  endTime: Date;
  maxElevation: number;
  groundTrack: Array<{ lat: number; lon: number; alt: number }>;
}

// --- Aircraft Types ---
export interface AircraftPosition {
  icao24: string;
  callsign: string;
  originCountry: string;
  latitude: number;
  longitude: number;
  altitude: number; // meters
  velocity: number; // m/s
  heading: number;
  verticalRate: number;
  onGround: boolean;
  category: AircraftCategory;
  timestamp: number;
}

export type AircraftCategory = "civilian" | "military" | "government" | "unknown";

// --- Geopolitical Event Types ---
export interface GDELTEvent {
  globalEventId: string;
  dateAdded: string;
  sourceUrl: string;
  title: string;
  tone: number; // -100 to +100
  goldsteinScale: number; // -10 to +10
  numMentions: number;
  numSources: number;
  numArticles: number;
  avgTone: number;
  actor1: GDELTActor;
  actor2: GDELTActor;
  eventCode: string;
  eventDescription: string;
  quadClass: QuadClass;
  latitude: number;
  longitude: number;
  country: string;
  location: string;
}

export interface GDELTActor {
  name: string;
  countryCode: string;
  type: string;
  religion?: string;
  ethnicity?: string;
}

export type QuadClass =
  | "verbal_cooperation"
  | "material_cooperation"
  | "verbal_conflict"
  | "material_conflict";

// --- Conflict/Crisis Types ---
export interface ConflictEvent {
  id: string;
  date: string;
  eventType: ConflictEventType;
  subEventType: string;
  actors: string[];
  location: string;
  latitude: number;
  longitude: number;
  country: string;
  region: string;
  fatalities: number;
  notes: string;
  source: string;
  severity: SeverityLevel;
}

export type ConflictEventType =
  | "battle"
  | "explosion"
  | "violence_against_civilians"
  | "protest"
  | "riot"
  | "strategic_development";

export type SeverityLevel = "low" | "medium" | "high" | "critical";

// --- Natural Disaster Types ---
export interface NaturalDisaster {
  id: string;
  type: DisasterType;
  title: string;
  description: string;
  date: string;
  latitude: number;
  longitude: number;
  country: string;
  severity: SeverityLevel;
  status: "ongoing" | "resolved" | "monitoring";
  affectedPopulation?: number;
  source: string;
}

export type DisasterType =
  | "earthquake"
  | "flood"
  | "hurricane"
  | "wildfire"
  | "tsunami"
  | "volcanic_eruption"
  | "drought"
  | "landslide";

// --- Economic Types ---
export interface EconomicIndicator {
  country: string;
  countryCode: string;
  indicator: EconomicIndicatorType;
  value: number;
  date: string;
  previousValue?: number;
  trend: "up" | "down" | "stable";
  source: string;
}

export type EconomicIndicatorType =
  | "gdp_growth"
  | "inflation"
  | "unemployment"
  | "trade_balance"
  | "debt_to_gdp"
  | "currency_stability"
  | "oil_price"
  | "food_price_index";

// --- Intelligence Analysis Types ---
export interface IntelligenceReport {
  id: string;
  title: string;
  summary: string;
  category: IntelligenceCategory;
  severity: SeverityLevel;
  confidence: number; // 0-100
  timestamp: Date;
  location: { latitude: number; longitude: number };
  country: string;
  relatedEvents: string[];
  indicators: string[];
  sources: string[];
  tags: string[];
}

export type IntelligenceCategory =
  | "military_movement"
  | "political_instability"
  | "economic_crisis"
  | "humanitarian_crisis"
  | "infrastructure"
  | "cyber_threat"
  | "environmental";

// --- Correlation & Anticipation Types ---
export interface EventCorrelation {
  id: string;
  events: string[];
  correlationType: CorrelationType;
  strength: number; // 0-1
  description: string;
  predictedOutcome?: string;
  confidence: number;
  timeframe?: string;
}

export type CorrelationType =
  | "causal"
  | "temporal"
  | "spatial"
  | "thematic"
  | "escalation";

export interface ThreatAssessment {
  region: string;
  country: string;
  overallRisk: SeverityLevel;
  militaryThreat: number; // 0-100
  politicalInstability: number;
  economicRisk: number;
  humanitarianRisk: number;
  environmentalRisk: number;
  trendDirection: "escalating" | "stable" | "de-escalating";
  keyIndicators: string[];
  lastUpdated: Date;
}

// --- Visual Filter Types ---
export type VisualFilterMode =
  | "standard"
  | "night_vision"
  | "thermal"
  | "crt_scanline"
  | "classified"
  | "satellite_view";

// --- Map/Layer Types ---
export interface MapLayer {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  opacity: number;
  data?: unknown;
}

export type LayerType =
  | "satellites"
  | "aircraft"
  | "geopolitical"
  | "conflicts"
  | "disasters"
  | "economic"
  | "intelligence"
  | "heatmap"
  | "custom";

// --- Dashboard Types ---
export interface DashboardPanel {
  id: string;
  title: string;
  type: PanelType;
  position: { x: number; y: number; w: number; h: number };
  minimized: boolean;
  data?: unknown;
}

export type PanelType =
  | "satellite_tracker"
  | "aircraft_radar"
  | "event_feed"
  | "threat_map"
  | "economic_chart"
  | "timeline"
  | "correlation"
  | "intel_report";

// --- AI Plugin Architecture Types ---
export interface AIPluginConfig {
  id: string;
  name: string;
  version: string;
  capabilities: AICapability[];
  endpoint?: string;
  enabled: boolean;
}

export type AICapability =
  | "event_classification"
  | "anomaly_detection"
  | "prediction"
  | "summarization"
  | "correlation_analysis"
  | "image_analysis"
  | "natural_language_query";

export interface AIAnalysisRequest {
  type: AICapability;
  data: unknown;
  context?: Record<string, unknown>;
  parameters?: Record<string, unknown>;
}

export interface AIAnalysisResponse {
  requestId: string;
  type: AICapability;
  result: unknown;
  confidence: number;
  processingTime: number;
  metadata?: Record<string, unknown>;
}
