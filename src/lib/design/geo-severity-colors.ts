// ============================================================================
// Satellite-Spy — GeoEvent severity → Maqam color mapping
// Bridges the Madgic design system with geopolitical event visualization.
// ============================================================================

import { MAQAM_PALETTE, TRUTH_COLORS } from "./quantum-design-system";
import type { GeoSeverity } from "@/types/geo-event-quantum";
import type { TruthLayer } from "@/types/quantum-data";

/**
 * Map event severity to Maqam color (for globe markers, alerts, etc.)
 *
 * low      → Bayati green   (serene, normal)
 * medium   → Hijaz amber    (tension, attention needed)
 * high     → Saba red       (alarm)
 * critical → Saba dark red  (critical alarm, pulsing)
 */
export const SEVERITY_COLORS: Record<GeoSeverity, { fill: string; stroke: string; pulse: boolean }> = {
  low:      { fill: MAQAM_PALETTE.bayati.primary,   stroke: MAQAM_PALETTE.bayati.dark,   pulse: false },
  medium:   { fill: MAQAM_PALETTE.hijaz.primary,    stroke: MAQAM_PALETTE.hijaz.dark,    pulse: false },
  high:     { fill: MAQAM_PALETTE.saba.primary,     stroke: MAQAM_PALETTE.saba.dark,     pulse: false },
  critical: { fill: MAQAM_PALETTE.saba.primary,     stroke: MAQAM_PALETTE.dissonance,    pulse: true },
};

/**
 * Map truth layer to color for QuantumData nodes on the globe.
 */
export function truthLayerColor(layer: TruthLayer): string {
  const colorSet = TRUTH_COLORS[layer];
  return colorSet?.text ?? "#9E9E9E";
}

/**
 * Map confidence to opacity (higher confidence = more opaque).
 */
export function confidenceToOpacity(confidence: number): number {
  return 0.4 + Math.min(1, Math.max(0, confidence)) * 0.6;
}
