"use client";

import dynamic from "next/dynamic";
import { useDataFetcher } from "@/hooks/useDataFetcher";
import TopBar from "@/components/dashboard/TopBar";
import Sidebar from "@/components/dashboard/Sidebar";
import BottomBar from "@/components/dashboard/BottomBar";
import { useAppStore } from "@/store";

// Dynamic import for CesiumJS (no SSR)
const GlobeViewer = dynamic(
  () => import("@/components/globe/GlobeViewer"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-military-dark flex items-center justify-center">
        <div className="text-center">
          <div className="text-military-green font-mono text-2xl mb-4 animate-pulse-glow">
            ◉
          </div>
          <div className="text-xs font-mono text-military-green/70 tracking-widest">
            INITIALIZING SATELLITE SPY
          </div>
          <div className="text-[10px] font-mono text-gray-700 mt-2">
            Loading CesiumJS Globe Engine...
          </div>
          <div className="mt-4 w-48 h-0.5 bg-gray-900 mx-auto overflow-hidden">
            <div className="h-full bg-military-green/50 animate-pulse w-1/2" />
          </div>
        </div>
      </div>
    ),
  }
);

export default function HomePage() {
  // Start data fetching
  useDataFetcher();

  const { visualFilter } = useAppStore();

  return (
    <main className="w-screen h-screen overflow-hidden bg-military-dark relative">
      {/* Top navigation bar */}
      <TopBar />

      {/* Sidebar */}
      <Sidebar />

      {/* Main 3D Globe */}
      <div className="absolute inset-0 pt-14 pl-10 pb-24">
        <GlobeViewer className="w-full h-full" />
      </div>

      {/* Bottom timeline bar */}
      <BottomBar />

      {/* Global overlays based on visual filter */}
      {visualFilter === "classified" && (
        <div className="absolute inset-0 pointer-events-none z-50 grid-overlay" />
      )}

      {/* Status indicator */}
      <div className="fixed bottom-28 right-4 z-40 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse-glow" />
        <span className="text-[9px] font-mono text-gray-600">SYSTEM ACTIVE</span>
      </div>
    </main>
  );
}
