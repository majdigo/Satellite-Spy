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
  Alert,
  WatchRegion,
  DataSourceStatus,
} from "@/types";

interface AppState {
  visualFilter: VisualFilterMode;
  setVisualFilter: (filter: VisualFilterMode) => void;
  layers: MapLayer[];
  toggleLayer: (layerId: string) => void;
  setLayerOpacity: (layerId: string, opacity: number) => void;
  satellites: SatellitePosition[];
  setSatellites: (sats: SatellitePosition[]) => void;
  selectedSatellite: SatellitePosition | null;
  setSelectedSatellite: (sat: SatellitePosition | null) => void;
  showSatelliteOrbits: boolean;
  toggleSatelliteOrbits: () => void;
  aircraft: AircraftPosition[];
  setAircraft: (ac: AircraftPosition[]) => void;
  selectedAircraft: AircraftPosition | null;
  setSelectedAircraft: (ac: AircraftPosition | null) => void;
  gdeltEvents: GDELTEvent[];
  setGdeltEvents: (events: GDELTEvent[]) => void;
  conflicts: ConflictEvent[];
  setConflicts: (conflicts: ConflictEvent[]) => void;
  disasters: NaturalDisaster[];
  setDisasters: (disasters: NaturalDisaster[]) => void;
  economicData: EconomicIndicator[];
  setEconomicData: (data: EconomicIndicator[]) => void;
  intelReports: IntelligenceReport[];
  setIntelReports: (reports: IntelligenceReport[]) => void;
  addIntelReport: (report: IntelligenceReport) => void;
  threats: ThreatAssessment[];
  setThreats: (threats: ThreatAssessment[]) => void;
  correlations: EventCorrelation[];
  setCorrelations: (correlations: EventCorrelation[]) => void;
  alerts: Alert[];
  addAlert: (alert: Alert) => void;
  acknowledgeAlert: (id: string) => void;
  clearAlerts: () => void;
  watchRegions: WatchRegion[];
  activeRegion: WatchRegion | null;
  setActiveRegion: (region: WatchRegion | null) => void;
  dataSources: DataSourceStatus[];
  updateDataSource: (source: string, update: Partial<DataSourceStatus>) => void;
  panels: DashboardPanel[];
  togglePanel: (panelId: string) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  currentTime: Date;
  setCurrentTime: (time: Date) => void;
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
  isPlaying: boolean;
  togglePlayback: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResultCount: number | null;
  setSearchResultCount: (count: number | null) => void;
  focusLocation: { lat: number; lon: number; zoom: number } | null;
  setFocusLocation: (loc: { lat: number; lon: number; zoom: number } | null) => void;
  highlightedEntityId: string | null;
  setHighlightedEntityId: (id: string | null) => void;
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

const WATCH_REGIONS: WatchRegion[] = [
  {
    id: "middle-east",
    name: "Middle East & Persian Gulf",
    description: "Iran, Iraq, Syria, Israel, Yemen — active conflict monitoring",
    bounds: { north: 42, south: 12, east: 63, west: 25 },
    center: { lat: 32, lon: 44 },
    zoom: 3000,
    countries: ["IRN", "IRQ", "SYR", "ISR", "YEM", "SAU", "LBN", "JOR", "PSE", "ARE"],
    watchKeywords: ["iran", "israel", "hezbollah", "houthi", "irgc", "nuclear", "strait of hormuz", "gaza", "west bank", "syria", "iraq", "yemen"],
    active: false,
  },
  {
    id: "ukraine-russia",
    name: "Ukraine-Russia Front",
    description: "Eastern European conflict zone — military operations tracking",
    bounds: { north: 56, south: 44, east: 42, west: 22 },
    center: { lat: 49, lon: 33 },
    zoom: 2500,
    countries: ["UKR", "RUS", "BLR", "POL", "ROU", "MDA"],
    watchKeywords: ["ukraine", "russia", "donbas", "crimea", "kherson", "zaporizhzhia", "nato", "black sea"],
    active: false,
  },
  {
    id: "taiwan-strait",
    name: "Taiwan Strait & South China Sea",
    description: "Indo-Pacific military posture monitoring",
    bounds: { north: 35, south: 5, east: 135, west: 100 },
    center: { lat: 23, lon: 118 },
    zoom: 3500,
    countries: ["TWN", "CHN", "JPN", "PHL", "VNM", "KOR"],
    watchKeywords: ["taiwan", "china", "south china sea", "pla", "strait", "okinawa", "philippines"],
    active: false,
  },
  {
    id: "sahel",
    name: "Sahel & Horn of Africa",
    description: "Insurgency, famine, and governance crisis monitoring",
    bounds: { north: 25, south: 0, east: 55, west: -18 },
    center: { lat: 14, lon: 15 },
    zoom: 4000,
    countries: ["MLI", "NER", "BFA", "NGA", "TCD", "SDN", "SSD", "ETH", "SOM"],
    watchKeywords: ["sahel", "boko haram", "al-shabaab", "sudan", "ethiopia", "somalia", "famine", "coup"],
    active: false,
  },
  {
    id: "korean-peninsula",
    name: "Korean Peninsula",
    description: "DPRK missile and nuclear program monitoring",
    bounds: { north: 43, south: 33, east: 132, west: 124 },
    center: { lat: 38, lon: 127 },
    zoom: 2000,
    countries: ["PRK", "KOR", "JPN"],
    watchKeywords: ["north korea", "dprk", "pyongyang", "missile", "nuclear test", "icbm", "kim jong"],
    active: false,
  },
];

const defaultDataSources: DataSourceStatus[] = [
  { source: "CelesTrak", status: "idle", lastUpdated: null, count: 0 },
  { source: "OpenSky", status: "idle", lastUpdated: null, count: 0 },
  { source: "GDELT", status: "idle", lastUpdated: null, count: 0 },
  { source: "ACLED", status: "idle", lastUpdated: null, count: 0 },
  { source: "USGS", status: "idle", lastUpdated: null, count: 0 },
  { source: "ReliefWeb", status: "idle", lastUpdated: null, count: 0 },
  { source: "WorldBank", status: "idle", lastUpdated: null, count: 0 },
];

export const useAppStore = create<AppState>((set) => ({
  visualFilter: "standard",
  setVisualFilter: (filter) => set({ visualFilter: filter }),
  layers: defaultLayers,
  toggleLayer: (layerId) =>
    set((s) => ({ layers: s.layers.map((l) => l.id === layerId ? { ...l, visible: !l.visible } : l) })),
  setLayerOpacity: (layerId, opacity) =>
    set((s) => ({ layers: s.layers.map((l) => l.id === layerId ? { ...l, opacity } : l) })),
  satellites: [],
  setSatellites: (sats) => set({ satellites: sats }),
  selectedSatellite: null,
  setSelectedSatellite: (sat) => set({ selectedSatellite: sat }),
  showSatelliteOrbits: true,
  toggleSatelliteOrbits: () => set((s) => ({ showSatelliteOrbits: !s.showSatelliteOrbits })),
  aircraft: [],
  setAircraft: (ac) => set({ aircraft: ac }),
  selectedAircraft: null,
  setSelectedAircraft: (ac) => set({ selectedAircraft: ac }),
  gdeltEvents: [],
  setGdeltEvents: (events) => set({ gdeltEvents: events }),
  conflicts: [],
  setConflicts: (conflicts) => set({ conflicts }),
  disasters: [],
  setDisasters: (disasters) => set({ disasters }),
  economicData: [],
  setEconomicData: (data) => set({ economicData: data }),
  intelReports: [],
  setIntelReports: (reports) => set({ intelReports: reports }),
  addIntelReport: (report) =>
    set((s) => ({ intelReports: [report, ...s.intelReports].slice(0, 100) })),
  threats: [],
  setThreats: (threats) => set({ threats }),
  correlations: [],
  setCorrelations: (correlations) => set({ correlations }),
  alerts: [],
  addAlert: (alert) =>
    set((s) => ({ alerts: [alert, ...s.alerts].slice(0, 200) })),
  acknowledgeAlert: (id) =>
    set((s) => ({ alerts: s.alerts.map((a) => a.id === id ? { ...a, acknowledged: true } : a) })),
  clearAlerts: () => set({ alerts: [] }),
  watchRegions: WATCH_REGIONS,
  activeRegion: null,
  setActiveRegion: (region) => set({ activeRegion: region }),
  dataSources: defaultDataSources,
  updateDataSource: (source, update) =>
    set((s) => ({ dataSources: s.dataSources.map((ds) => ds.source === source ? { ...ds, ...update } : ds) })),
  panels: defaultPanels,
  togglePanel: (panelId) =>
    set((s) => ({ panels: s.panels.map((p) => p.id === panelId ? { ...p, minimized: !p.minimized } : p) })),
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  currentTime: new Date(),
  setCurrentTime: (time) => set({ currentTime: time }),
  playbackSpeed: 1,
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  isPlaying: false,
  togglePlayback: () => set((s) => ({ isPlaying: !s.isPlaying })),
  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),
  searchResultCount: null,
  setSearchResultCount: (count) => set({ searchResultCount: count }),
  focusLocation: null,
  setFocusLocation: (loc) => set({ focusLocation: loc }),
  highlightedEntityId: null,
  setHighlightedEntityId: (id) => set({ highlightedEntityId: id }),
  minSeverity: "low",
  setMinSeverity: (severity) => set({ minSeverity: severity }),
}));
