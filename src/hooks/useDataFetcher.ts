"use client";

import { useEffect, useCallback, useRef } from "react";
import { useAppStore } from "@/store";
import { propagateSatellite, categorizeSatellite } from "@/lib/api/satellites";
import type { TLEData, SatellitePosition } from "@/types";

export function useDataFetcher() {
  const {
    setSatellites,
    setAircraft,
    setGdeltEvents,
    setConflicts,
    setEconomicData,
  } = useAppStore();

  const tleCache = useRef<TLEData[]>([]);

  const fetchSatellites = useCallback(async () => {
    try {
      const categories = ["reconnaissance", "military", "stations"];
      const allTLEs: TLEData[] = [];

      await Promise.all(
        categories.map(async (cat) => {
          const resp = await fetch(`/api/satellites?category=${cat}`);
          if (!resp.ok) return;
          const data = await resp.json();
          if (data.tles) allTLEs.push(...data.tles);
        })
      );

      tleCache.current = allTLEs;

      const now = new Date();
      const positions: SatellitePosition[] = allTLEs
        .map((tle) => {
          const category = categorizeSatellite(tle.name, tle.inclination);
          return propagateSatellite(tle, now, category);
        })
        .filter((p): p is SatellitePosition => p !== null);

      setSatellites(positions);
    } catch (err) {
      console.error("Failed to fetch satellites:", err);
    }
  }, [setSatellites]);

  const updateSatellitePositions = useCallback(() => {
    if (tleCache.current.length === 0) return;
    const now = new Date();
    const positions: SatellitePosition[] = tleCache.current
      .map((tle) => {
        const category = categorizeSatellite(tle.name, tle.inclination);
        return propagateSatellite(tle, now, category);
      })
      .filter((p): p is SatellitePosition => p !== null);
    setSatellites(positions);
  }, [setSatellites]);

  const fetchAircraft = useCallback(async () => {
    try {
      const resp = await fetch("/api/aircraft");
      if (!resp.ok) return;
      const data = await resp.json();
      setAircraft(data.aircraft || []);
    } catch (err) {
      console.error("Failed to fetch aircraft:", err);
    }
  }, [setAircraft]);

  const fetchGDELT = useCallback(async () => {
    try {
      const resp = await fetch("/api/gdelt?query=conflict+OR+crisis+OR+military+OR+war&timespan=24h");
      if (!resp.ok) return;
      const data = await resp.json();
      setGdeltEvents(data.events || []);
    } catch (err) {
      console.error("Failed to fetch GDELT:", err);
    }
  }, [setGdeltEvents]);

  const fetchConflicts = useCallback(async () => {
    try {
      const resp = await fetch("/api/acled");
      if (!resp.ok) return;
      const data = await resp.json();
      setConflicts(data.conflicts || []);
    } catch (err) {
      console.error("Failed to fetch conflicts:", err);
    }
  }, [setConflicts]);

  const fetchEconomic = useCallback(async () => {
    try {
      const resp = await fetch("/api/economic");
      if (!resp.ok) return;
      const data = await resp.json();
      setEconomicData(data.indicators || []);
    } catch (err) {
      console.error("Failed to fetch economic data:", err);
    }
  }, [setEconomicData]);

  useEffect(() => {
    // Initial fetch
    fetchSatellites();
    fetchAircraft();
    fetchGDELT();
    fetchConflicts();
    fetchEconomic();

    // Satellite position updates every 5s
    const satInterval = setInterval(updateSatellitePositions, 5000);
    // Aircraft refresh every 15s
    const acInterval = setInterval(fetchAircraft, 15000);
    // GDELT refresh every 5 min
    const gdeltInterval = setInterval(fetchGDELT, 300000);
    // TLE re-fetch every hour
    const tleInterval = setInterval(fetchSatellites, 3600000);

    return () => {
      clearInterval(satInterval);
      clearInterval(acInterval);
      clearInterval(gdeltInterval);
      clearInterval(tleInterval);
    };
  }, [fetchSatellites, fetchAircraft, fetchGDELT, fetchConflicts, fetchEconomic, updateSatellitePositions]);
}
