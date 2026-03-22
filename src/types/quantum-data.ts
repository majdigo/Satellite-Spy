// ============================================================================
// Satellite-Spy — QuantumData TypeScript Interface
// Port from madgic_shared/core/quantum_data.py v1.3.0
// The atomic unit of information in the Madgic platform.
// ============================================================================

/**
 * Truth layer — provenance classification for every datum.
 * Matches Python: madgic_shared/core/quantum_data.py TruthLayer enum.
 */
export type TruthLayer =
  | "OBSERVED"         // extracted from an official document
  | "COMPUTED"         // calculated from traceable inputs
  | "ESTIMATED"        // inferred, fallback, hypothesis
  | "MARKET_REF";      // market data, comparison only

/**
 * A link between two QuantumData nodes in the knowledge graph.
 */
export interface QuantumLink {
  target: string;
  relation: string; // e.g. "COMPOSES", "DERIVES", "TEMPORAL", "DEPENDS_ON"
}

/**
 * Source provenance — where the data came from.
 */
export interface QuantumSource {
  document?: string;
  page?: number;
  agent?: string;
  feed?: string;       // e.g. "GDELT", "ACLED", "CelesTrak"
  url?: string;
  fetchedAt?: string;
  [key: string]: unknown;
}

/**
 * QuantumData — the atomic unit of information in Madgic.
 *
 * A node in the knowledge graph with 6 navigable dimensions:
 *   D1 Source      — where did this come from?
 *   D2 Composition — what is it made of?
 *   D3 Temporality — when?
 *   D4 Context     — what ontological concept?
 *   D5 Model       — how was it derived?
 *   D6 Links       — what is it connected to?
 *
 * Every agent that creates a datum creates a QuantumData.
 * Not an anonymous object, not a bare number. A QuantumData with at minimum:
 * id, label, value, truthLayer, source (if OBSERVED), formula (if COMPUTED).
 */
export interface QuantumData {
  id: string;
  label: string;
  value: number | string | Record<string, unknown> | unknown[];
  unit?: string;
  truthLayer: TruthLayer;
  confidence: number;          // 0.0 to 1.0

  // D1 Source
  source?: QuantumSource;

  // D2 Composition
  children?: QuantumData[];
  aggregation?: "SUM" | "AVG" | "FORMULA" | string;
  formula?: string;
  inputs?: string[];           // IDs of input QuantumData

  // D3 Temporality
  period?: string;             // e.g. "2024-FY", "2024-Q3", "2024-03-22"

  // D4 Context
  concept?: string;            // ontological concept (e.g. "plover:PROTEST", "gdelt:MaterialConflict")

  // D5 Model
  explanation?: string;
  assumptions?: Record<string, unknown>;

  // D6 Links
  links?: QuantumLink[];

  // Metadata
  createdAt: string;           // ISO 8601
  createdBy: string;           // agent or system ID
}

/**
 * Factory function to create a QuantumData with sensible defaults.
 */
export function createQuantumData(
  params: Pick<QuantumData, "id" | "label" | "value"> &
    Partial<Omit<QuantumData, "id" | "label" | "value">>
): QuantumData {
  return {
    unit: "",
    truthLayer: "OBSERVED",
    confidence: 1.0,
    inputs: [],
    links: [],
    createdAt: new Date().toISOString(),
    createdBy: "satellite-spy",
    ...params,
  };
}
