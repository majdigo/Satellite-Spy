"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAppStore } from "@/store";
import { computeOrbitPath } from "@/lib/api/satellites";
import { SEVERITY_COLORS } from "@/lib/design/geo-severity-colors";
import { MAQAM_PALETTE } from "@/lib/design/quantum-design-system";
import type { SatellitePosition, AircraftPosition, GDELTEvent, ConflictEvent, NaturalDisaster } from "@/types";
import type { GeoSeverity } from "@/types/geo-event-quantum";
import type { Cartesian2 as CesiumCartesian2 } from "cesium";

let Cesium: typeof import("cesium") | null = null;

interface GlobeViewerProps {
  className?: string;
}

export default function GlobeViewer({ className }: GlobeViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<InstanceType<typeof import("cesium").Viewer> | null>(null);
  const entitiesRef = useRef<Map<string, unknown>>(new Map());

  const {
    satellites,
    aircraft,
    gdeltEvents,
    conflicts,
    disasters,
    visualFilter,
    showSatelliteOrbits,
    setSelectedSatellite,
    setSelectedAircraft,
    setHighlightedEntityId,
    focusLocation,
  } = useAppStore();

  // Initialize Cesium
  useEffect(() => {
    let mounted = true;

    async function init() {
      if (!containerRef.current || viewerRef.current) return;

      Cesium = await import("cesium");

      (window as unknown as Record<string, string>).CESIUM_BASE_URL = "/cesium";

      const ionToken = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN;
      if (ionToken) {
        Cesium.Ion.defaultAccessToken = ionToken;
      }

      if (!mounted) return;

      const viewer = new Cesium.Viewer(containerRef.current!, {
        animation: false,
        baseLayerPicker: false,
        fullscreenButton: false,
        vrButton: false,
        geocoder: false,
        homeButton: false,
        infoBox: false,
        sceneModePicker: false,
        selectionIndicator: false,
        timeline: false,
        navigationHelpButton: false,
        scene3DOnly: true,
        shadows: false,
        shouldAnimate: true,
        msaaSamples: 4,
      });

      // Styling
      viewer.scene.backgroundColor = Cesium.Color.BLACK;
      viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString("#0a1a0a");
      viewer.scene.globe.enableLighting = true;
      viewer.scene.globe.showGroundAtmosphere = true;
      if (viewer.scene.skyAtmosphere) viewer.scene.skyAtmosphere.show = true;
      viewer.scene.fog.enabled = true;
      viewer.scene.fog.density = 0.0001;

      // Remove Cesium credits
      (viewer as unknown as { _cesiumWidget: { creditContainer: HTMLElement } })
        ._cesiumWidget.creditContainer.style.display = "none";

      // Click handler
      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      handler.setInputAction((movement: { position: CesiumCartesian2 }) => {
        const picked = viewer.scene.pick(movement.position);
        if (Cesium!.defined(picked) && picked.id) {
          const entity = picked.id;
          const now = Cesium!.JulianDate.now();
          try {
            const entityType = entity.properties?.type?.getValue(now);
            const rawData = entity.properties?.data?.getValue(now);
            if (!rawData) return;
            const parsed = JSON.parse(rawData);
            if (entityType === "satellite") {
              setSelectedSatellite(parsed);
            } else if (entityType === "aircraft") {
              setSelectedAircraft(parsed);
            }
            // Set highlightedEntityId for provenance panel (works for all entity types)
            const entityId = typeof entity.id === "string" ? entity.id : "";
            if (entityId) {
              setHighlightedEntityId(entityId);
            }
          } catch {
            // Ignore malformed entity data
          }
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      // Google 3D Tiles
      const googleKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (googleKey) {
        try {
          const tileset = await Cesium.Cesium3DTileset.fromUrl(
            `https://tile.googleapis.com/v1/3dtiles/root.json?key=${googleKey}`
          );
          viewer.scene.primitives.add(tileset);
        } catch {
          console.warn("Google 3D Tiles not available");
        }
      }

      viewerRef.current = viewer;
    }

    init();

    return () => {
      mounted = false;
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [setSelectedSatellite, setSelectedAircraft]);

  // Satellite layer
  const updateSatellites = useCallback(
    (sats: SatellitePosition[]) => {
      if (!viewerRef.current || !Cesium) return;
      const viewer = viewerRef.current;
      const currentLayers = useAppStore.getState().layers;
      const satLayer = currentLayers.find((l) => l.id === "satellites");
      if (!satLayer?.visible) {
        // Remove existing satellite entities
        for (const [key, entity] of entitiesRef.current) {
          if (key.startsWith("sat-")) {
            viewer.entities.remove(entity as InstanceType<typeof Cesium.Entity>);
            entitiesRef.current.delete(key);
          }
        }
        return;
      }

      const existingKeys = new Set<string>();

      for (const sat of sats) {
        const key = `sat-${sat.id}`;
        existingKeys.add(key);

        const color =
          sat.category === "reconnaissance"
            ? Cesium.Color.RED
            : sat.category === "military"
            ? Cesium.Color.ORANGE
            : sat.category === "navigation"
            ? Cesium.Color.CYAN
            : sat.category === "communications"
            ? Cesium.Color.YELLOW
            : Cesium.Color.LIME;

        const position = Cesium.Cartesian3.fromDegrees(
          sat.longitude,
          sat.latitude,
          sat.altitude * 1000
        );

        if (entitiesRef.current.has(key)) {
          const entity = entitiesRef.current.get(key) as InstanceType<typeof Cesium.Entity>;
          entity.position = new Cesium.ConstantPositionProperty(position);
        } else {
          const entity = viewer.entities.add({
            id: key,
            name: sat.name,
            position,
            point: {
              pixelSize: sat.category === "reconnaissance" ? 8 : 5,
              color,
              outlineColor: Cesium.Color.WHITE.withAlpha(0.5),
              outlineWidth: 1,
              scaleByDistance: new Cesium.NearFarScalar(1e6, 1.5, 1e8, 0.5),
            },
            label: {
              text: sat.name,
              font: "11px JetBrains Mono, monospace",
              fillColor: color,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 2,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              pixelOffset: new Cesium.Cartesian2(10, -10),
              scaleByDistance: new Cesium.NearFarScalar(1e6, 1, 5e7, 0),
              distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 2e7),
            },
            properties: {
              type: "satellite",
              data: JSON.stringify(sat),
            },
          });
          entitiesRef.current.set(key, entity);
        }

        // Orbit path
        if (showSatelliteOrbits && sat.tle) {
          const orbitKey = `orbit-${sat.id}`;
          if (!entitiesRef.current.has(orbitKey)) {
            const path = computeOrbitPath(sat.tle, new Date(), 90, 2);
            if (path.length > 2) {
              const positions = Cesium.Cartesian3.fromDegreesArrayHeights(
                path.flatMap((p) => [p.lon, p.lat, p.alt * 1000])
              );
              const orbitEntity = viewer.entities.add({
                id: orbitKey,
                polyline: {
                  positions,
                  width: 1,
                  material: color.withAlpha(0.3),
                },
              });
              entitiesRef.current.set(orbitKey, orbitEntity);
            }
          }
        }
      }

      // Clean up removed satellites
      for (const [key, entity] of entitiesRef.current) {
        if (key.startsWith("sat-") && !existingKeys.has(key)) {
          viewer.entities.remove(entity as InstanceType<typeof Cesium.Entity>);
          entitiesRef.current.delete(key);
          const orbitKey = key.replace("sat-", "orbit-");
          if (entitiesRef.current.has(orbitKey)) {
            viewer.entities.remove(entitiesRef.current.get(orbitKey) as InstanceType<typeof Cesium.Entity>);
            entitiesRef.current.delete(orbitKey);
          }
        }
      }
    },
    [showSatelliteOrbits]
  );

  // Aircraft layer
  const updateAircraft = useCallback(
    (acs: AircraftPosition[]) => {
      if (!viewerRef.current || !Cesium) return;
      const viewer = viewerRef.current;
      const currentLayers = useAppStore.getState().layers;
      const acLayer = currentLayers.find((l) => l.id === "aircraft");
      if (!acLayer?.visible) return;

      const existingKeys = new Set<string>();
      // Only show military/government or limit civilian
      const filtered = acs.filter(
        (a) => a.category === "military" || a.category === "government" || !a.onGround
      ).slice(0, 2000);

      for (const ac of filtered) {
        const key = `ac-${ac.icao24}`;
        existingKeys.add(key);

        const color =
          ac.category === "military"
            ? Cesium.Color.RED
            : ac.category === "government"
            ? Cesium.Color.GOLD
            : Cesium.Color.fromCssColorString("#00b4d8").withAlpha(0.6);

        const position = Cesium.Cartesian3.fromDegrees(
          ac.longitude,
          ac.latitude,
          ac.altitude
        );

        if (entitiesRef.current.has(key)) {
          const entity = entitiesRef.current.get(key) as InstanceType<typeof Cesium.Entity>;
          entity.position = new Cesium.ConstantPositionProperty(position);
        } else {
          const size = ac.category === "military" ? 6 : ac.category === "government" ? 7 : 3;
          const entity = viewer.entities.add({
            id: key,
            name: ac.callsign || ac.icao24,
            position,
            point: {
              pixelSize: size,
              color,
              outlineColor: Cesium.Color.WHITE.withAlpha(0.3),
              outlineWidth: 1,
            },
            label:
              ac.category !== "civilian"
                ? {
                    text: ac.callsign || ac.icao24,
                    font: "10px JetBrains Mono, monospace",
                    fillColor: color,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    pixelOffset: new Cesium.Cartesian2(10, -5),
                    scaleByDistance: new Cesium.NearFarScalar(5e4, 1, 5e6, 0),
                  }
                : undefined,
            properties: {
              type: "aircraft",
              data: JSON.stringify(ac),
            },
          });
          entitiesRef.current.set(key, entity);
        }
      }

      // Clean up removed aircraft
      for (const [key, entity] of entitiesRef.current) {
        if (key.startsWith("ac-") && !existingKeys.has(key)) {
          viewer.entities.remove(entity as InstanceType<typeof Cesium.Entity>);
          entitiesRef.current.delete(key);
        }
      }
    },
    []
  );

  // Disaster layer
  const updateDisasters = useCallback(
    (disasterData: NaturalDisaster[]) => {
      if (!viewerRef.current || !Cesium) return;
      const viewer = viewerRef.current;
      const currentLayers = useAppStore.getState().layers;
      const disLayer = currentLayers.find((l) => l.id === "disasters");
      if (!disLayer?.visible) return;

      for (const disaster of disasterData.slice(0, 200)) {
        const key = `dis-${disaster.id}`;
        if (entitiesRef.current.has(key)) continue;

        // Maqam design system: disaster severity colors
        const disSeverity = (disaster.severity || "low") as GeoSeverity;
        const disColor = SEVERITY_COLORS[disSeverity] || SEVERITY_COLORS.medium;
        const color = Cesium.Color.fromCssColorString(disColor.fill);

        const size = disaster.severity === "critical" ? 10 : disaster.severity === "high" ? 7 : 5;

        const entity = viewer.entities.add({
          id: key,
          position: Cesium.Cartesian3.fromDegrees(disaster.longitude, disaster.latitude),
          point: {
            pixelSize: size,
            color: color.withAlpha(0.9),
            outlineColor: color.withAlpha(0.4),
            outlineWidth: 6,
          },
          label: (disaster.severity === "critical" || disaster.severity === "high") ? {
            text: disaster.title.substring(0, 30),
            font: "10px monospace",
            fillColor: color,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cesium.Cartesian2(12, 0),
            scaleByDistance: new Cesium.NearFarScalar(1e5, 1, 5e6, 0),
          } : undefined,
          properties: {
            type: "disaster",
            data: JSON.stringify(disaster),
          },
        });
        entitiesRef.current.set(key, entity);
      }
    },
    []
  );

  // Geopolitical events layer
  const updateEvents = useCallback(
    (events: GDELTEvent[]) => {
      if (!viewerRef.current || !Cesium) return;
      const viewer = viewerRef.current;
      const currentLayers = useAppStore.getState().layers;
      const geoLayer = currentLayers.find((l) => l.id === "geopolitical");
      if (!geoLayer?.visible) return;

      for (const event of events.slice(0, 500)) {
        const key = `geo-${event.globalEventId}`;
        if (entitiesRef.current.has(key)) continue;

        // Maqam design system: conflict events → Saba red, cooperation → Bayati green
        const isConflict =
          event.quadClass === "material_conflict" || event.quadClass === "verbal_conflict";
        const color = isConflict
          ? Cesium.Color.fromCssColorString(MAQAM_PALETTE.saba.primary).withAlpha(0.7)
          : Cesium.Color.fromCssColorString(MAQAM_PALETTE.bayati.primary).withAlpha(0.5);

        const entity = viewer.entities.add({
          id: key,
          position: Cesium.Cartesian3.fromDegrees(event.longitude, event.latitude),
          point: {
            pixelSize: Math.min(12, 4 + event.numMentions * 0.5),
            color,
            outlineColor: color.withAlpha(0.3),
            outlineWidth: 3,
          },
          properties: {
            type: "event",
            data: JSON.stringify(event),
          },
        });
        entitiesRef.current.set(key, entity);
      }
    },
    []
  );

  // Conflict layer
  const updateConflicts = useCallback(
    (conflictsData: ConflictEvent[]) => {
      if (!viewerRef.current || !Cesium) return;
      const viewer = viewerRef.current;
      const currentLayers = useAppStore.getState().layers;
      const confLayer = currentLayers.find((l) => l.id === "conflicts");
      if (!confLayer?.visible) return;

      for (const conflict of conflictsData.slice(0, 500)) {
        const key = `conf-${conflict.id}`;
        if (entitiesRef.current.has(key)) continue;

        // Maqam design system: severity → color (Bayati green → Saba red)
        const severityKey = (conflict.severity || "low") as GeoSeverity;
        const maqamColor = SEVERITY_COLORS[severityKey] || SEVERITY_COLORS.low;
        const color = Cesium.Color.fromCssColorString(maqamColor.fill);

        const size =
          conflict.severity === "critical"
            ? 12
            : conflict.severity === "high"
            ? 9
            : conflict.severity === "medium"
            ? 6
            : 4;

        const entity = viewer.entities.add({
          id: key,
          position: Cesium.Cartesian3.fromDegrees(conflict.longitude, conflict.latitude),
          point: {
            pixelSize: size,
            color: color.withAlpha(0.8),
            outlineColor: color.withAlpha(0.3),
            outlineWidth: 4,
          },
          label: conflict.severity === "critical" ? {
            text: `!! ${conflict.location}`,
            font: "11px JetBrains Mono, monospace",
            fillColor: Cesium.Color.RED,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cesium.Cartesian2(15, 0),
            scaleByDistance: new Cesium.NearFarScalar(1e5, 1, 5e6, 0),
          } : undefined,
          properties: {
            type: "conflict",
            data: JSON.stringify(conflict),
          },
        });
        entitiesRef.current.set(key, entity);
      }
    },
    []
  );

  // Subscribe to layer visibility changes to trigger re-renders
  const layerVisibility = useAppStore((s) =>
    s.layers.map((l) => `${l.id}:${l.visible}`).join(",")
  );

  // Update layers when data or visibility changes
  useEffect(() => { updateSatellites(satellites); }, [satellites, updateSatellites, layerVisibility]);
  useEffect(() => { updateAircraft(aircraft); }, [aircraft, updateAircraft, layerVisibility]);
  useEffect(() => { updateEvents(gdeltEvents); }, [gdeltEvents, updateEvents, layerVisibility]);
  useEffect(() => { updateConflicts(conflicts); }, [conflicts, updateConflicts, layerVisibility]);
  useEffect(() => { updateDisasters(disasters); }, [disasters, updateDisasters, layerVisibility]);

  // Focus location
  useEffect(() => {
    if (!viewerRef.current || !Cesium || !focusLocation) return;
    viewerRef.current.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        focusLocation.lon,
        focusLocation.lat,
        focusLocation.zoom * 1000
      ),
      duration: 2,
    });
  }, [focusLocation]);

  // Visual filter CSS
  const filterStyles: React.CSSProperties = (() => {
    switch (visualFilter) {
      case "night_vision":
        return { filter: "brightness(1.2) contrast(1.3) saturate(0) sepia(1) hue-rotate(70deg)" };
      case "thermal":
        return { filter: "contrast(1.5) saturate(2) hue-rotate(180deg) brightness(0.8)" };
      case "crt_scanline":
        return { filter: "contrast(1.1) brightness(1.1) saturate(0.8)" };
      case "classified":
        return { filter: "contrast(1.2) brightness(0.9) saturate(0.5) sepia(0.3)" };
      default:
        return {};
    }
  })();

  return (
    <div className={`relative ${className || ""}`} style={filterStyles}>
      <div ref={containerRef} className="w-full h-full" />

      {/* CRT scanline overlay */}
      {visualFilter === "crt_scanline" && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <div
            className="w-full h-full opacity-10"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)",
            }}
          />
          <div className="absolute inset-0 animate-scan-line opacity-5 bg-gradient-to-b from-transparent via-green-500 to-transparent h-32" />
        </div>
      )}

      {/* Night vision vignette */}
      {visualFilter === "night_vision" && (
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.7) 100%)",
          }}
        />
      )}

      {/* Classification watermark */}
      {visualFilter === "classified" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="border-2 border-red-600 px-6 py-1">
            <span className="text-red-600 font-mono font-bold text-sm tracking-widest">
              TOP SECRET // SI // NOFORN
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
