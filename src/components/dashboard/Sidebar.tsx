"use client";

import { useState } from "react";
import { useAppStore } from "@/store";
import LayerControl from "@/components/layers/LayerControl";
import SatellitePanel from "@/components/panels/SatellitePanel";
import EventFeed from "@/components/panels/EventFeed";
import ThreatAssessmentPanel from "@/components/panels/ThreatAssessmentPanel";
import CorrelationPanel from "@/components/panels/CorrelationPanel";
import EconomicPanel from "@/components/panels/EconomicPanel";

type SidebarTab = "layers" | "satellites" | "events" | "threats" | "correlations" | "economic";

const TABS: { id: SidebarTab; label: string; icon: string }[] = [
  { id: "layers", label: "LAYERS", icon: "◫" },
  { id: "satellites", label: "SAT", icon: "◉" },
  { id: "events", label: "EVENTS", icon: "⚡" },
  { id: "threats", label: "THREATS", icon: "◆" },
  { id: "correlations", label: "INTEL", icon: "◈" },
  { id: "economic", label: "ECON", icon: "◇" },
];

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const [activeTab, setActiveTab] = useState<SidebarTab>("events");

  return (
    <>
      {/* Tab bar - always visible */}
      <div className="fixed left-0 top-14 bottom-0 w-10 bg-military-dark/95 border-r border-gray-800 z-30 flex flex-col items-center py-2 gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              if (activeTab === tab.id && sidebarOpen) {
                toggleSidebar();
              } else {
                setActiveTab(tab.id);
                if (!sidebarOpen) toggleSidebar();
              }
            }}
            className={`w-8 h-8 flex items-center justify-center text-sm border transition-all ${
              activeTab === tab.id && sidebarOpen
                ? "border-military-green/40 text-military-green bg-military-green/5"
                : "border-transparent text-gray-600 hover:text-military-green"
            }`}
            title={tab.label}
          >
            {tab.icon}
          </button>
        ))}
      </div>

      {/* Sidebar panel */}
      <div
        className={`fixed left-10 top-14 bottom-0 w-80 bg-military-dark/95 border-r border-gray-800 z-20 transition-transform duration-300 overflow-y-auto ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-3">
          {/* Tab header */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-military-green uppercase tracking-wider">
              {TABS.find((t) => t.id === activeTab)?.label}
            </span>
            <button
              onClick={toggleSidebar}
              className="text-gray-600 hover:text-military-green text-xs font-mono"
            >
              [×]
            </button>
          </div>

          {/* Tab content */}
          {activeTab === "layers" && <LayerControl />}
          {activeTab === "satellites" && <SatellitePanel />}
          {activeTab === "events" && <EventFeed />}
          {activeTab === "threats" && <ThreatAssessmentPanel />}
          {activeTab === "correlations" && <CorrelationPanel />}
          {activeTab === "economic" && <EconomicPanel />}
        </div>
      </div>
    </>
  );
}
