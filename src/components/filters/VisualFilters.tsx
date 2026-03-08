"use client";

import { useAppStore } from "@/store";
import type { VisualFilterMode } from "@/types";

const FILTERS: { mode: VisualFilterMode; label: string; icon: string }[] = [
  { mode: "standard", label: "STD", icon: "◉" },
  { mode: "night_vision", label: "NVG", icon: "◎" },
  { mode: "thermal", label: "FLIR", icon: "◈" },
  { mode: "crt_scanline", label: "CRT", icon: "▦" },
  { mode: "classified", label: "CLASS", icon: "◆" },
  { mode: "satellite_view", label: "SAT", icon: "◇" },
];

export default function VisualFilters() {
  const { visualFilter, setVisualFilter } = useAppStore();

  return (
    <div className="flex gap-1">
      {FILTERS.map(({ mode, label, icon }) => (
        <button
          key={mode}
          onClick={() => setVisualFilter(mode)}
          className={`px-2 py-1 text-xs font-mono border transition-all duration-200 ${
            visualFilter === mode
              ? "bg-military-green/20 text-military-green border-military-green shadow-[0_0_8px_rgba(0,255,65,0.3)]"
              : "bg-transparent text-gray-500 border-gray-700 hover:text-military-green hover:border-military-green/50"
          }`}
          title={label}
        >
          <span className="mr-1">{icon}</span>
          {label}
        </button>
      ))}
    </div>
  );
}
