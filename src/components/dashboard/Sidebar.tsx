"use client";

import { useState } from "react";
import { useAppStore } from "@/store";
import LayerControl from "@/components/layers/LayerControl";
import SatellitePanel from "@/components/panels/SatellitePanel";
import EventFeed from "@/components/panels/EventFeed";
import ThreatAssessmentPanel from "@/components/panels/ThreatAssessmentPanel";
import CorrelationPanel from "@/components/panels/CorrelationPanel";
import EconomicPanel from "@/components/panels/EconomicPanel";
import AlertsPanel from "@/components/panels/AlertsPanel";
import WatchRegionsPanel from "@/components/panels/WatchRegionsPanel";
import IntelligencePanel from "@/components/panels/IntelligencePanel";
import CrossIntelligencePanel from "@/components/panels/CrossIntelligencePanel";
import DataStatusPanel from "@/components/panels/DataStatusPanel";
import ScenarioPanel from "@/components/panels/ScenarioPanel";
import ActionCenterPanel from "@/components/panels/ActionCenterPanel";

type SidebarTab =
  | "actions"
  | "alerts"
  | "regions"
  | "layers"
  | "satellites"
  | "events"
  | "threats"
  | "intel"
  | "crossintel"
  | "scenarios"
  | "correlations"
  | "economic"
  | "status";

const TABS: { id: SidebarTab; label: string; icon: string }[] = [
  { id: "actions", label: "ACTION", icon: "▶" },
  { id: "alerts", label: "ALERTS", icon: "!" },
  { id: "regions", label: "REGIONS", icon: "O" },
  { id: "layers", label: "LAYERS", icon: "#" },
  { id: "satellites", label: "SAT", icon: "*" },
  { id: "events", label: "EVENTS", icon: ">" },
  { id: "threats", label: "THREATS", icon: "X" },
  { id: "intel", label: "INTEL", icon: "i" },
  { id: "crossintel", label: "X-INT", icon: "⊕" },
  { id: "scenarios", label: "SCEN", icon: "S" },
  { id: "correlations", label: "CORR", icon: "~" },
  { id: "economic", label: "ECON", icon: "$" },
  { id: "status", label: "SYS", icon: "=" },
];

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar, alerts } = useAppStore();
  const [activeTab, setActiveTab] = useState<SidebarTab>("actions");

  const unackedAlerts = alerts.filter((a) => !a.acknowledged).length;

  return (
    <>
      {/* Tab bar */}
      <div className="fixed left-0 top-14 bottom-0 w-10 bg-military-dark/95 border-r border-gray-800 z-30 flex flex-col items-center py-2 gap-0.5">
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
            className={`w-8 h-7 flex items-center justify-center text-[10px] font-mono font-bold border transition-all relative ${
              activeTab === tab.id && sidebarOpen
                ? "border-military-green/40 text-military-green bg-military-green/5"
                : "border-transparent text-gray-600 hover:text-military-green"
            }`}
            title={tab.label}
          >
            {tab.icon}
            {/* Alert badge */}
            {tab.id === "alerts" && unackedAlerts > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-600 text-white text-[7px] font-mono flex items-center justify-center rounded-full animate-pulse">
                {unackedAlerts > 9 ? "9+" : unackedAlerts}
              </span>
            )}
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
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-military-green uppercase tracking-wider">
              {TABS.find((t) => t.id === activeTab)?.label}
            </span>
            <button
              onClick={toggleSidebar}
              className="text-gray-600 hover:text-military-green text-xs font-mono"
            >
              [x]
            </button>
          </div>

          {activeTab === "actions" && <ActionCenterPanel />}
          {activeTab === "alerts" && <AlertsPanel />}
          {activeTab === "regions" && <WatchRegionsPanel />}
          {activeTab === "layers" && <LayerControl />}
          {activeTab === "satellites" && <SatellitePanel />}
          {activeTab === "events" && <EventFeed />}
          {activeTab === "threats" && <ThreatAssessmentPanel />}
          {activeTab === "intel" && <IntelligencePanel />}
          {activeTab === "crossintel" && <CrossIntelligencePanel />}
          {activeTab === "scenarios" && <ScenarioPanel />}
          {activeTab === "correlations" && <CorrelationPanel />}
          {activeTab === "economic" && <EconomicPanel />}
          {activeTab === "status" && <DataStatusPanel />}
        </div>
      </div>
    </>
  );
}
