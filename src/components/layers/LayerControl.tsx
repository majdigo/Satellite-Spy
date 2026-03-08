"use client";

import { useAppStore } from "@/store";

const LAYER_ICONS: Record<string, string> = {
  satellites: "🛰",
  aircraft: "✈",
  geopolitical: "🌐",
  conflicts: "⚔",
  disasters: "🌊",
  economic: "📊",
  intelligence: "🔍",
  heatmap: "🔥",
};

export default function LayerControl() {
  const { layers, toggleLayer, setLayerOpacity } = useAppStore();

  return (
    <div className="space-y-1">
      <div className="text-xs font-mono text-military-green/70 uppercase tracking-wider mb-2">
        Data Layers
      </div>
      {layers.map((layer) => (
        <div key={layer.id} className="flex items-center gap-2 group">
          <button
            onClick={() => toggleLayer(layer.id)}
            className={`flex-1 flex items-center gap-2 px-2 py-1.5 text-xs font-mono border transition-all ${
              layer.visible
                ? "border-military-green/40 text-military-green bg-military-green/5"
                : "border-gray-800 text-gray-600 bg-transparent"
            }`}
          >
            <span className="text-sm">{LAYER_ICONS[layer.type] || "●"}</span>
            <span className="flex-1 text-left">{layer.name}</span>
            <span
              className={`w-2 h-2 rounded-full ${
                layer.visible ? "bg-military-green animate-pulse-glow" : "bg-gray-700"
              }`}
            />
          </button>
          {layer.visible && (
            <input
              type="range"
              min="0"
              max="100"
              value={layer.opacity * 100}
              onChange={(e) =>
                setLayerOpacity(layer.id, parseInt(e.target.value) / 100)
              }
              className="w-16 h-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer accent-military-green"
            />
          )}
        </div>
      ))}
    </div>
  );
}
