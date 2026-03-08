import { create } from "zustand";
import type {
  SatellitePosition,
  AircraftPosition,
  GDELTEvent,
  ConflictEvent,
  NaturalDisaster,
  EconomicIndicator,
  IntelligenceReport,
  ThreatAssessment,
  EventCorrelation,
  VisualFilterMode,
  MapLayer,
  DashboardPanel,
  SeverityLevel,
} from "@/types";

// ============================================================================
// Application Store
// ============================================================================

interface AppState {
  // --- Visual ---
  visualFilter: VisualFilterMode;
  setVisualFilter: (filter: VisualFilterMode) => void;

  // --- Layers ---
  layers: MapLayer[];
  toggleLayer: (layerId: string) => void;
  setLayerOpacity: (layerId: string, opacity: number) => void;

  // --- Satellites ---
  satellites: SatellitePosition[];
  setSatellites: (sats: SatellitePosition[]) => void;
  selectedSatellite: SatellitePosition | null;
  setSelectedSatellite: (sat: SatellitePosition | null) => void;
  showSatelliteOrbits: boolean;
  toggleSatelliteOrbits: () => void;

  // --- Aircraft ---
  aircraft: AircraftPosition[];
  setAircraft: (ac: AircraftPosition[]) => void;
  selectedAircraft: AircraftPosition | null;
  setSelectedAircraft: (ac: AircraftPosition | null) => void;

  // --- Events ---
  gdeltEvents: GDELTEvent[];
  setGdeltEvents: (events: GDELTEvent[]) => void;
  conflicts: ConflictEvent[];
  setConflicts: (conflicts: ConflictEvent[]) => void;
  disasters: NaturalDisaster[];
  setDisasters: (disasters: NaturalDisaster[]) => void;

  // --- Economic ---
  economicData: EconomicIndicator[];
  setEconomicData: (data: EconomicIndicator[]) => void;

  // --- Intelligence ---
  intelReports: IntelligenceReport[];
  setIntelReports: (reports: IntelligenceReport[]) => void;
  threats: ThreatAssessment[];
  setThreats: (threats: ThreatAssessment[]) => void;
  correlations: EventCorrelation[];
  setCorrelations: (correlations: EventCorrelation[]) => void;

  // --- Dashboard ---
  panels: DashboardPanel[];
  togglePanel: (panelId: string) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;

  // --- Timeline ---
  currentTime: Date;
  setCurrentTime: (time: Date) => void;
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
  isPlaying: boolean;
  togglePlayback: () => void;

  // --- Search / Focus ---
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  focusLocation: { lat: number; lon: number; zoom: number } | null;
  setFocusLocation: (loc: { lat: number; lon: number; zoom: number } | null) => void;

  // --- Severity Filter ---
  minSeverity: SeverityLevel;
  setMinSeverity: (severity: SeverityLevel) => void;
}

const defaultLayers: MapLayer[] = [
  { id: "satellites", name: "Satellites", type: "satellites", visible: true, opacity: 1 },
  { id: "aircraft", name: "Aircraft", type: "aircraft", visible: true, opacity: 1 },
  { id: "geopolitical", name: "Geopolitical Events", type: "geopolitical", visible: true, opacity: 0.8 },
  { id: "conflicts", name: "Conflicts & Crises", type: "conflicts", visible: true, opacity: 0.8 },
  { id: "disasters", name: "Natural Disasters", type: "disasters", visible: true, opacity: 0.8 },
  { id: "economic", name: "Economic Indicators", type: "economic", visible: false, opacity: 0.7 },
  { id: "intelligence", name: "Intelligence Reports", type: "intelligence", visible: false, opacity: 0.9 },
  { id: "heatmap", name: "Threat Heatmap", type: "heatmap", visible: false, opacity: 0.5 },
];

const defaultPanels: DashboardPanel[] = [
  { id: "sat-tracker", title: "Satellite Tracker", type: "satellite_tracker", position: { x: 0, y: 0, w: 4, h: 3 }, minimized: false },
  { id: "event-feed", title: "Live Event Feed", type: "event_feed", position: { x: 0, y: 3, w: 4, h: 4 }, minimized: false },
  { id: "threat-map", title: "Threat Assessment", type: "threat_map", position: { x: 4, y: 0, w: 4, h: 3 }, minimized: true },
  { id: "econ-chart", title: "Economic Indicators", type: "economic_chart", position: { x: 4, y: 3, w: 4, h: 4 }, minimized: true },
  { id: "timeline", title: "Event Timeline", type: "timeline", position: { x: 0, y: 7, w: 8, h: 2 }, minimized: false },
  { id: "correlation", title: "Event Correlations", type: "correlation", position: { x: 8, y: 0, w: 4, h: 4 }, minimized: true },
];

export const useAppStore = create<AppState>((set) => ({
  // Visual
  visualFilter: "standard",
  setVisualFilter: (filter) => set({ visualFilter: filter }),

  // Layers
  layers: defaultLayers,
  toggleLayer: (layerId) =>
    set((s) => ({
      layers: s.layers.map((l) =>
        l.id === layerId ? { ...l, visible: !l.visible } : l
      ),
    })),
  setLayerOpacity: (layerId, opacity) =>
    set((s) => ({
      layers: s.layers.map((l) =>
        l.id === layerId ? { ...l, opacity } : l
      ),
    })),

  // Satellites
  satellites: [],
  setSatellites: (sats) => set({ satellites: sats }),
  selectedSatellite: null,
  setSelectedSatellite: (sat) => set({ selectedSatellite: sat }),
  showSatelliteOrbits: true,
  toggleSatelliteOrbits: () => set((s) => ({ showSatelliteOrbits: !s.showSatelliteOrbits })),

  // Aircraft
  aircraft: [],
  setAircraft: (ac) => set({ aircraft: ac }),
  selectedAircraft: null,
  setSelectedAircraft: (ac) => set({ selectedAircraft: ac }),

  // Events
  gdeltEvents: [],
  setGdeltEvents: (events) => set({ gdeltEvents: events }),
  conflicts: [],
  setConflicts: (conflicts) => set({ conflicts }),
  disasters: [],
  setDisasters: (disasters) => set({ disasters }),

  // Economic
  economicData: [],
  setEconomicData: (data) => set({ economicData: data }),

  // Intelligence
  intelReports: [],
  setIntelReports: (reports) => set({ intelReports: reports }),
  threats: [],
  setThreats: (threats) => set({ threats }),
  correlations: [],
  setCorrelations: (correlations) => set({ correlations }),

  // Dashboard
  panels: defaultPanels,
  togglePanel: (panelId) =>
    set((s) => ({
      panels: s.panels.map((p) =>
        p.id === panelId ? { ...p, minimized: !p.minimized } : p
      ),
    })),
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  // Timeline
  currentTime: new Date(),
  setCurrentTime: (time) => set({ currentTime: time }),
  playbackSpeed: 1,
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  isPlaying: false,
  togglePlayback: () => set((s) => ({ isPlaying: !s.isPlaying })),

  // Search
  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),
  focusLocation: null,
  setFocusLocation: (loc) => set({ focusLocation: loc }),

  // Severity
  minSeverity: "low",
  setMinSeverity: (severity) => set({ minSeverity: severity }),
}));
