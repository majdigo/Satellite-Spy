"use client";

import dynamic from "next/dynamic";
import { useDataFetcher } from "@/hooks/useDataFetcher";
import TopBar from "@/components/dashboard/TopBar";
import Sidebar from "@/components/dashboard/Sidebar";
import BottomBar from "@/components/dashboard/BottomBar";
import { useAppStore } from "@/store";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

const GlobeViewer = dynamic(
  () => import("@/components/globe/GlobeViewer"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-military-dark flex items-center justify-center">
        <div className="text-center">
          <div className="text-military-green font-mono text-2xl mb-4 animate-pulse-glow">*</div>
          <div className="text-xs font-mono text-military-green/70 tracking-widest">INITIALIZING SATELLITE SPY</div>
          <div className="text-[10px] font-mono text-gray-700 mt-2">Loading CesiumJS Globe Engine...</div>
          <div className="mt-4 w-48 h-0.5 bg-gray-900 mx-auto overflow-hidden">
            <div className="h-full bg-military-green/50 animate-pulse w-1/2" />
          </div>
        </div>
      </div>
    ),
  }
);

export default function HomePage() {
  useDataFetcher();

  const { visualFilter, activeRegion, dataSources } = useAppStore();

  const loadingCount = dataSources.filter((d) => d.status === "loading").length;
  const errorCount = dataSources.filter((d) => d.status === "error").length;

  return (
    <main className="w-screen h-screen overflow-hidden bg-military-dark relative">
      <TopBar />
      <Sidebar />

      {/* Main 3D Globe */}
      <div className="absolute inset-0 pt-14 pl-10 pb-24">
        <ErrorBoundary>
          <GlobeViewer className="w-full h-full" />
        </ErrorBoundary>
      </div>

      <BottomBar />

      {/* Active region banner */}
      {activeRegion && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <div className="border border-military-green/30 bg-military-dark/90 px-4 py-1.5">
            <div className="text-[10px] font-mono text-military-green tracking-widest text-center">
              MONITORING: {activeRegion.name.toUpperCase()}
            </div>
            <div className="text-[8px] font-mono text-gray-600 text-center mt-0.5">
              {activeRegion.countries.length} countries | {activeRegion.watchKeywords.length} keywords tracked
            </div>
          </div>
        </div>
      )}

      {/* Classified overlay */}
      {visualFilter === "classified" && (
        <div className="absolute inset-0 pointer-events-none z-50 grid-overlay" />
      )}

      {/* Status bar */}
      <div className="fixed bottom-28 right-4 z-40 flex items-center gap-3">
        {loadingCount > 0 && (
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-[9px] font-mono text-yellow-400/60">FETCHING ({loadingCount})</span>
          </div>
        )}
        {errorCount > 0 && (
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-[9px] font-mono text-red-400/60">{errorCount} SOURCE ERROR</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse-glow" />
          <span className="text-[9px] font-mono text-gray-600">SYSTEM ACTIVE</span>
        </div>
      </div>
    </main>
  );
}
