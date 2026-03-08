"use client";

import { useEffect, useRef, useState } from "react";

let cesiumModule: typeof import("cesium") | null = null;

export function useCesium() {
  const viewerRef = useRef<InstanceType<typeof import("cesium").Viewer> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function initCesium() {
      if (!containerRef.current) return;

      // Dynamic import to avoid SSR issues
      if (!cesiumModule) {
        cesiumModule = await import("cesium");
      }
      const Cesium = cesiumModule;

      // Set Cesium base URL
      (window as unknown as Record<string, string>).CESIUM_BASE_URL = "/cesium";

      // Set Ion token if available
      const ionToken = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN;
      if (ionToken) {
        Cesium.Ion.defaultAccessToken = ionToken;
      }

      if (viewerRef.current || !mounted) return;

      const viewer = new Cesium.Viewer(containerRef.current, {
        animation: false,
        baseLayerPicker: false,
        fullscreenButton: false,
        vrButton: false,
        geocoder: false,
        homeButton: false,
        infoBox: true,
        sceneModePicker: false,
        selectionIndicator: true,
        timeline: false,
        navigationHelpButton: false,
        scene3DOnly: true,
        shadows: false,
        shouldAnimate: true,
        requestRenderMode: false,
        maximumRenderTimeChange: Infinity,
      });

      // Dark theme for the globe
      viewer.scene.backgroundColor = Cesium.Color.fromCssColorString("#0a0f0a");
      viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString("#0a1a0a");
      viewer.scene.globe.enableLighting = true;
      viewer.scene.globe.showGroundAtmosphere = true;

      // Try to add Google 3D Tiles if API key available
      const googleKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (googleKey) {
        try {
          const tileset = await Cesium.Cesium3DTileset.fromUrl(
            `https://tile.googleapis.com/v1/3dtiles/root.json?key=${googleKey}`
          );
          viewer.scene.primitives.add(tileset);
        } catch (err) {
          console.warn("Could not load Google 3D Tiles:", err);
        }
      }

      // Performance settings
      viewer.scene.fog.enabled = true;
      viewer.scene.fog.density = 0.0002;
      if (viewer.scene.skyBox) viewer.scene.skyBox.show = true;

      viewerRef.current = viewer;
      if (mounted) setIsReady(true);
    }

    initCesium();

    return () => {
      mounted = false;
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  return { viewer: viewerRef.current, containerRef, isReady };
}
