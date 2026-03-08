"use client";

import { useEffect, useCallback, useRef } from "react";
import { useAppStore } from "@/store";
import { propagateSatellite, categorizeSatellite } from "@/lib/api/satellites";
import { generateCorrelations } from "@/lib/api/correlation";
import { generateIntelReports } from "@/lib/api/intelligence";
import type { TLEData, SatellitePosition, Alert, ConflictEvent } from "@/types";

export function useDataFetcher() {
  const {
    setSatellites,
    setAircraft,
    setGdeltEvents,
    setConflicts,
    setDisasters,
    setEconomicData,
    setCorrelations,
    setIntelReports,
    addAlert,
    updateDataSource,
    activeRegion,
  } = useAppStore();

  const tleCache = useRef<TLEData[]>([]);
  const prevConflictCount = useRef<number>(0);

  // Check for alert-worthy changes
  const checkAlerts = useCallback(
    (newConflicts: ConflictEvent[]) => {
      const criticalNew = newConflicts.filter(
        (c) =>
          c.severity === "critical" &&
          new Date(c.date).getTime() > Date.now() - 3600000
      );

      if (criticalNew.length > 0 && newConflicts.length > prevConflictCount.current) {
        for (const c of criticalNew.slice(0, 3)) {
          const alert: Alert = {
            id: `alert-${Date.now()}-${c.id}`,
            type: "conflict_escalation",
            severity: "critical",
            title: `CRITICAL: ${c.eventType.replace(/_/g, " ").toUpperCase()}`,
            message: `${c.location}, ${c.country} — ${c.fatalities > 0 ? `${c.fatalities} fatalities` : c.subEventType}`,
            timestamp: new Date(),
            location: { lat: c.latitude, lon: c.longitude },
            acknowledged: false,
            source: "ACLED",
            relatedEntityId: c.id,
          };
          addAlert(alert);
        }
      }

      // Check for surge in conflict events (>50% increase)
      if (
        prevConflictCount.current > 10 &&
        newConflicts.length > prevConflictCount.current * 1.5
      ) {
        addAlert({
          id: `alert-surge-${Date.now()}`,
          type: "threshold_breach",
          severity: "high",
          title: "CONFLICT SURGE DETECTED",
          message: `Conflict events increased from ${prevConflictCount.current} to ${newConflicts.length} (+${((newConflicts.length / prevConflictCount.current - 1) * 100).toFixed(0)}%)`,
          timestamp: new Date(),
          acknowledged: false,
          source: "System",
        });
      }

      prevConflictCount.current = newConflicts.length;
    },
    [addAlert]
  );

  const fetchSatellites = useCallback(async () => {
    updateDataSource("CelesTrak", { status: "loading" });
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
      updateDataSource("CelesTrak", {
        status: "success",
        lastUpdated: new Date(),
        count: positions.length,
      });
    } catch (err) {
      console.error("Failed to fetch satellites:", err);
      updateDataSource("CelesTrak", {
        status: "error",
        error: String(err),
      });
    }
  }, [setSatellites, updateDataSource]);

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
    updateDataSource("OpenSky", { status: "loading" });
    try {
      // If watching a region, constrain bounds
      let url = "/api/aircraft";
      if (activeRegion) {
        const b = activeRegion.bounds;
        url += `?lamin=${b.south}&lomin=${b.west}&lamax=${b.north}&lomax=${b.east}`;
      }
      const resp = await fetch(url);
      if (!resp.ok) return;
      const data = await resp.json();
      setAircraft(data.aircraft || []);
      updateDataSource("OpenSky", {
        status: "success",
        lastUpdated: new Date(),
        count: data.aircraft?.length || 0,
      });
    } catch (err) {
      console.error("Failed to fetch aircraft:", err);
      updateDataSource("OpenSky", { status: "error", error: String(err) });
    }
  }, [setAircraft, updateDataSource, activeRegion]);

  const fetchGDELT = useCallback(async () => {
    updateDataSource("GDELT", { status: "loading" });
    try {
      // Build query based on active region keywords
      let query = "conflict+OR+crisis+OR+military+OR+war";
      if (activeRegion) {
        query = activeRegion.watchKeywords.join("+OR+");
      }
      const resp = await fetch(
        `/api/gdelt?query=${encodeURIComponent(query)}&timespan=24h`
      );
      if (!resp.ok) return;
      const data = await resp.json();
      setGdeltEvents(data.events || []);
      updateDataSource("GDELT", {
        status: "success",
        lastUpdated: new Date(),
        count: data.events?.length || 0,
      });
    } catch (err) {
      console.error("Failed to fetch GDELT:", err);
      updateDataSource("GDELT", { status: "error", error: String(err) });
    }
  }, [setGdeltEvents, updateDataSource, activeRegion]);

  const fetchConflicts = useCallback(async () => {
    updateDataSource("ACLED", { status: "loading" });
    try {
      let url = "/api/acled";
      if (activeRegion) {
        url += `?countries=${activeRegion.countries.join(",")}`;
      }
      const resp = await fetch(url);
      if (!resp.ok) return;
      const data = await resp.json();
      const newConflicts = data.conflicts || [];
      setConflicts(newConflicts);
      checkAlerts(newConflicts);
      updateDataSource("ACLED", {
        status: "success",
        lastUpdated: new Date(),
        count: newConflicts.length,
      });
    } catch (err) {
      console.error("Failed to fetch conflicts:", err);
      updateDataSource("ACLED", { status: "error", error: String(err) });
    }
  }, [setConflicts, updateDataSource, activeRegion, checkAlerts]);

  const fetchDisasters = useCallback(async () => {
    updateDataSource("USGS", { status: "loading" });
    try {
      const resp = await fetch("/api/disasters");
      if (!resp.ok) return;
      const data = await resp.json();
      setDisasters(data.disasters || []);
      updateDataSource("USGS", {
        status: "success",
        lastUpdated: new Date(),
        count: data.disasters?.length || 0,
      });
    } catch (err) {
      console.error("Failed to fetch disasters:", err);
      updateDataSource("USGS", { status: "error", error: String(err) });
    }
  }, [setDisasters, updateDataSource]);

  const fetchEconomic = useCallback(async () => {
    updateDataSource("WorldBank", { status: "loading" });
    try {
      const resp = await fetch("/api/economic");
      if (!resp.ok) return;
      const data = await resp.json();
      setEconomicData(data.indicators || []);
      updateDataSource("WorldBank", {
        status: "success",
        lastUpdated: new Date(),
        count: data.indicators?.length || 0,
      });
    } catch (err) {
      console.error("Failed to fetch economic data:", err);
      updateDataSource("WorldBank", { status: "error", error: String(err) });
    }
  }, [setEconomicData, updateDataSource]);

  // Run correlation & intelligence analysis after data loads
  const runAnalysis = useCallback(() => {
    const state = useAppStore.getState();
    if (state.gdeltEvents.length === 0 && state.conflicts.length === 0) return;

    const correlations = generateCorrelations({
      gdeltEvents: state.gdeltEvents,
      conflicts: state.conflicts,
      disasters: state.disasters,
      economicData: state.economicData,
    });
    setCorrelations(correlations);

    const reports = generateIntelReports({
      gdeltEvents: state.gdeltEvents,
      conflicts: state.conflicts,
      disasters: state.disasters,
      economicData: state.economicData,
      correlations,
    });
    setIntelReports(reports);
  }, [setCorrelations, setIntelReports]);

  useEffect(() => {
    // Initial fetch
    fetchSatellites();
    fetchAircraft();
    fetchGDELT();
    fetchConflicts();
    fetchDisasters();
    fetchEconomic();

    // Satellite position updates every 5s
    const satInterval = setInterval(updateSatellitePositions, 5000);
    // Aircraft refresh every 15s
    const acInterval = setInterval(fetchAircraft, 15000);
    // GDELT refresh every 5 min
    const gdeltInterval = setInterval(fetchGDELT, 300000);
    // Conflicts refresh every 10 min
    const conflictInterval = setInterval(fetchConflicts, 600000);
    // Disasters refresh every 15 min
    const disasterInterval = setInterval(fetchDisasters, 900000);
    // TLE re-fetch every hour
    const tleInterval = setInterval(fetchSatellites, 3600000);
    // Run analysis every 2 min
    const analysisInterval = setInterval(runAnalysis, 120000);
    // Initial analysis after 10s (give data time to load)
    const analysisTimeout = setTimeout(runAnalysis, 10000);

    return () => {
      clearInterval(satInterval);
      clearInterval(acInterval);
      clearInterval(gdeltInterval);
      clearInterval(conflictInterval);
      clearInterval(disasterInterval);
      clearInterval(tleInterval);
      clearInterval(analysisInterval);
      clearTimeout(analysisTimeout);
    };
  }, [
    fetchSatellites, fetchAircraft, fetchGDELT, fetchConflicts,
    fetchDisasters, fetchEconomic, updateSatellitePositions, runAnalysis,
  ]);
}
