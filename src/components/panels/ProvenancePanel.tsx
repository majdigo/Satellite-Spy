"use client";

import { useAppStore } from "@/store";
import { TRUTH_COLORS, MAQAM_PALETTE } from "@/lib/design/quantum-design-system";
import { gdeltToQuantumData, acledToQuantumData } from "@/types/geo-event-quantum";
import type { GDELTEvent, ConflictEvent } from "@/types";
import type { GeoEventQuantumData } from "@/types/geo-event-quantum";
import type { QDTruthLayer } from "@/lib/design/quantum-design-system";

/**
 * ProvenancePanel — S1-05
 *
 * Displays QuantumData provenance fields for a selected entity.
 * Uses the Maqam design system: truth layer → color mapping.
 */
export default function ProvenancePanel() {
  const selectedSatellite = useAppStore((s) => s.selectedSatellite);
  const selectedAircraft = useAppStore((s) => s.selectedAircraft);
  const gdeltEvents = useAppStore((s) => s.gdeltEvents);
  const conflicts = useAppStore((s) => s.conflicts);
  const highlightedEntityId = useAppStore((s) => s.highlightedEntityId);

  // Try to find a matching entity to show provenance for
  const qd = resolveQuantumData(highlightedEntityId, gdeltEvents, conflicts);

  // If nothing selected, show satellite/aircraft summary
  if (!qd && !selectedSatellite && !selectedAircraft) {
    return (
      <div className="p-3 text-gray-500 text-xs font-mono text-center">
        Click an entity on the globe to view its QuantumData provenance.
      </div>
    );
  }

  // Show satellite info (not QuantumData yet — raw tracking data)
  if (!qd && selectedSatellite) {
    return (
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <TruthBadge layer="OBSERVED" />
          <span className="text-xs font-mono text-gray-300">{selectedSatellite.name}</span>
        </div>
        <InfoRow label="Source" value="CelesTrak TLE" />
        <InfoRow label="Category" value={selectedSatellite.category} />
        <InfoRow label="Country" value={selectedSatellite.country} />
        <InfoRow label="Altitude" value={`${selectedSatellite.altitude.toFixed(1)} km`} />
        <InfoRow label="Velocity" value={`${selectedSatellite.velocity.toFixed(2)} km/s`} />
        <InfoRow label="Truth Layer" value="OBSERVED (TLE propagation)" />
        <InfoRow label="Confidence" value="0.95" />
        <ConfidenceBar confidence={0.95} />
      </div>
    );
  }

  if (!qd && selectedAircraft) {
    return (
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <TruthBadge layer="OBSERVED" />
          <span className="text-xs font-mono text-gray-300">{selectedAircraft.callsign || selectedAircraft.icao24}</span>
        </div>
        <InfoRow label="Source" value="OpenSky ADS-B" />
        <InfoRow label="Category" value={selectedAircraft.category} />
        <InfoRow label="Country" value={selectedAircraft.originCountry} />
        <InfoRow label="Altitude" value={`${selectedAircraft.altitude.toFixed(0)} m`} />
        <InfoRow label="Truth Layer" value="OBSERVED (ADS-B transponder)" />
        <InfoRow label="Confidence" value="0.90" />
        <ConfidenceBar confidence={0.90} />
      </div>
    );
  }

  if (!qd) return null;

  const layer = (qd.truthLayer || "OBSERVED") as QDTruthLayer;
  const colors = TRUTH_COLORS[layer] || TRUTH_COLORS.OBSERVED;

  return (
    <div className="p-3 space-y-3">
      {/* Header with truth badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TruthBadge layer={layer} />
          <span className="text-xs font-mono text-gray-300 truncate max-w-[180px]" title={qd.label}>
            {qd.label}
          </span>
        </div>
      </div>

      {/* 6D Fields */}
      <div className="space-y-1.5">
        {/* D1 Source */}
        <DimensionHeader dim="D1" label="Source" />
        {qd.source && (
          <>
            <InfoRow label="Feed" value={qd.source.feed || "unknown"} />
            {qd.source.url && <InfoRow label="URL" value={truncate(qd.source.url, 40)} />}
            {qd.source.fetchedAt && <InfoRow label="Fetched" value={qd.source.fetchedAt} />}
          </>
        )}

        {/* D3 Temporality */}
        {qd.period && (
          <>
            <DimensionHeader dim="D3" label="Temporality" />
            <InfoRow label="Period" value={qd.period} />
          </>
        )}

        {/* D4 Context */}
        {qd.concept && (
          <>
            <DimensionHeader dim="D4" label="Context" />
            <InfoRow label="Concept" value={qd.concept} />
          </>
        )}

        {/* Geo-specific fields */}
        {"eventType" in qd && (
          <>
            <DimensionHeader dim="GEO" label="Event" />
            <InfoRow label="PLOVER Type" value={String((qd as GeoEventQuantumData).eventType)} />
            <InfoRow label="Severity" value={String((qd as GeoEventQuantumData).severity)} />
            {(qd as GeoEventQuantumData).actors?.length > 0 && (
              <InfoRow label="Actors" value={(qd as GeoEventQuantumData).actors.join(", ")} />
            )}
            <InfoRow
              label="Location"
              value={`${(qd as GeoEventQuantumData).location.lat.toFixed(3)}, ${(qd as GeoEventQuantumData).location.lon.toFixed(3)}`}
            />
            {(qd as GeoEventQuantumData).location.country && (
              <InfoRow label="Country" value={(qd as GeoEventQuantumData).location.country!} />
            )}
          </>
        )}

        {/* Confidence bar */}
        <DimensionHeader dim="QA" label="Confidence" />
        <ConfidenceBar confidence={qd.confidence} />

        {/* D6 Links */}
        {qd.links && qd.links.length > 0 && (
          <>
            <DimensionHeader dim="D6" label="Links" />
            {qd.links.map((link, i) => (
              <InfoRow key={i} label={link.relation} value={truncate(link.target, 30)} />
            ))}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="text-[9px] font-mono text-gray-600 pt-1 border-t border-gray-800">
        ID: {truncate(qd.id, 32)} | Created: {qd.createdBy}
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function TruthBadge({ layer }: { layer: QDTruthLayer | string }) {
  const key = (layer || "OBSERVED") as QDTruthLayer;
  const colors = TRUTH_COLORS[key] || TRUTH_COLORS.OBSERVED;
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold"
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        borderLeft: `3px solid ${colors.border}`,
      }}
    >
      {colors.icon} {layer}
    </span>
  );
}

function DimensionHeader({ dim, label }: { dim: string; label: string }) {
  return (
    <div className="flex items-center gap-1 pt-1">
      <span
        className="text-[8px] font-mono px-1 py-0.5 rounded"
        style={{ backgroundColor: MAQAM_PALETTE.surface.dark, color: MAQAM_PALETTE.textSecondary.dark }}
      >
        {dim}
      </span>
      <span className="text-[9px] font-mono text-gray-500 uppercase">{label}</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-[10px] font-mono">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-300 text-right max-w-[60%] truncate" title={value}>{value}</span>
    </div>
  );
}

function ConfidenceBar({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const color = confidence >= 0.8 ? MAQAM_PALETTE.bayati.medium
    : confidence >= 0.5 ? MAQAM_PALETTE.hijaz.medium
    : MAQAM_PALETTE.saba.primary;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[9px] font-mono" style={{ color }}>{pct}%</span>
    </div>
  );
}

// ── Utilities ───────────────────────────────────────────────────────────────

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + "..." : s;
}

function resolveQuantumData(
  entityId: string | null,
  gdeltEvents: GDELTEvent[],
  conflicts: ConflictEvent[],
): GeoEventQuantumData | null {
  if (!entityId) return null;

  // Try GDELT event
  if (entityId.startsWith("geo-")) {
    const gid = entityId.replace("geo-", "");
    const event = gdeltEvents.find((e) => e.globalEventId === gid);
    if (event) return gdeltToQuantumData(event);
  }

  // Try ACLED conflict
  if (entityId.startsWith("conf-")) {
    const cid = entityId.replace("conf-", "");
    const conflict = conflicts.find((c) => c.id === cid);
    if (conflict) return acledToQuantumData(conflict);
  }

  return null;
}
