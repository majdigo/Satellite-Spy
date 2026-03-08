"use client";

import { useAppStore } from "@/store";
import { formatCoordinate, formatAltitude, formatVelocity } from "@/lib/utils/helpers";

const CATEGORY_COLORS: Record<string, string> = {
  reconnaissance: "text-red-400",
  military: "text-orange-400",
  communications: "text-yellow-400",
  navigation: "text-cyan-400",
  weather: "text-blue-400",
  scientific: "text-purple-400",
  classified: "text-red-600",
  unknown: "text-gray-400",
};

export default function SatellitePanel() {
  const {
    satellites,
    selectedSatellite,
    setSelectedSatellite,
    showSatelliteOrbits,
    toggleSatelliteOrbits,
    setFocusLocation,
  } = useAppStore();

  const recon = satellites.filter((s) => s.category === "reconnaissance");
  const military = satellites.filter((s) => s.category === "military");

  return (
    <div className="space-y-3">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-military-dark/50 border border-gray-800 p-2">
          <div className="text-lg font-mono text-military-green">{satellites.length}</div>
          <div className="text-[10px] text-gray-500 uppercase">Total</div>
        </div>
        <div className="bg-military-dark/50 border border-gray-800 p-2">
          <div className="text-lg font-mono text-red-400">{recon.length}</div>
          <div className="text-[10px] text-gray-500 uppercase">Recon</div>
        </div>
        <div className="bg-military-dark/50 border border-gray-800 p-2">
          <div className="text-lg font-mono text-orange-400">{military.length}</div>
          <div className="text-[10px] text-gray-500 uppercase">Military</div>
        </div>
      </div>

      {/* Orbit toggle */}
      <button
        onClick={toggleSatelliteOrbits}
        className={`w-full text-xs font-mono py-1 border transition-all ${
          showSatelliteOrbits
            ? "border-military-green/40 text-military-green"
            : "border-gray-800 text-gray-600"
        }`}
      >
        {showSatelliteOrbits ? "● ORBITS ON" : "○ ORBITS OFF"}
      </button>

      {/* Selected satellite detail */}
      {selectedSatellite && (
        <div className="border border-military-green/30 bg-military-green/5 p-3 space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <div className={`text-sm font-mono font-bold ${CATEGORY_COLORS[selectedSatellite.category]}`}>
                {selectedSatellite.name}
              </div>
              <div className="text-[10px] text-gray-500 uppercase">
                {selectedSatellite.category} • {selectedSatellite.country}
              </div>
            </div>
            <button
              onClick={() => setSelectedSatellite(null)}
              className="text-gray-600 hover:text-military-green text-xs"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-gray-400">
            <div>LAT: {formatCoordinate(selectedSatellite.latitude, "lat")}</div>
            <div>LON: {formatCoordinate(selectedSatellite.longitude, "lon")}</div>
            <div>ALT: {formatAltitude(selectedSatellite.altitude)}</div>
            <div>VEL: {formatVelocity(selectedSatellite.velocity)}</div>
            <div>CAT#: {selectedSatellite.id}</div>
            <div>INC: {selectedSatellite.tle.inclination.toFixed(1)}°</div>
          </div>
          <button
            onClick={() =>
              setFocusLocation({
                lat: selectedSatellite.latitude,
                lon: selectedSatellite.longitude,
                zoom: selectedSatellite.altitude + 500,
              })
            }
            className="w-full text-[10px] font-mono py-1 border border-military-green/30 text-military-green hover:bg-military-green/10"
          >
            TRACK TARGET
          </button>
        </div>
      )}

      {/* Satellite list - reconnaissance priority */}
      <div className="space-y-1 max-h-64 overflow-y-auto scrollbar-thin">
        {[...recon, ...military, ...satellites.filter((s) => s.category !== "reconnaissance" && s.category !== "military")]
          .slice(0, 50)
          .map((sat) => (
            <button
              key={sat.id}
              onClick={() => {
                setSelectedSatellite(sat);
                setFocusLocation({ lat: sat.latitude, lon: sat.longitude, zoom: sat.altitude + 200 });
              }}
              className={`w-full text-left px-2 py-1 text-[10px] font-mono border transition-all ${
                selectedSatellite?.id === sat.id
                  ? "border-military-green/40 bg-military-green/10 text-military-green"
                  : "border-transparent text-gray-500 hover:text-military-green hover:border-gray-800"
              }`}
            >
              <span className={`mr-1 ${CATEGORY_COLORS[sat.category]}`}>●</span>
              <span className="truncate">{sat.name}</span>
              <span className="float-right text-gray-600">
                {formatAltitude(sat.altitude)}
              </span>
            </button>
          ))}
      </div>
    </div>
  );
}
