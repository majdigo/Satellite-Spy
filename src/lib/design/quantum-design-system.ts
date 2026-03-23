/**
 * MADGIC DESIGN SYSTEM — Harissa × Maqam
 *
 * Sensory mapping of financial data through musical-emotional encoding.
 * Each truth layer maps to a maqam with a distinct emotional character:
 *
 *   OBSERVED       → Bayati    (serenity, trust, earth)
 *   COMPUTED       → Rast      (nobility, structure, logic)
 *   ESTIMATED      → Hijaz     (tension, mystery, attention)
 *   USER_INPUT     → Sikah     (nostalgia, reflection)
 *   MARKET_REFERENCE → Nahawand  (melancholy, introspection, external)
 *
 * Visual channels:
 *   COLOR     → Truth Layer (provenance via maqam)
 *   OPACITY   → Confidence (certainty)
 *   BORDER    → Anomaly severity (dissonance)
 *   ANIMATION → Recency (pulse = recent change)
 *   SIZE      → Materiality (relative importance)
 *
 * @see DESIGN.md for the full Harissa × Maqam specification
 */

// ── 1. MAQAM COLOR PALETTE ──────────────────────────────────────────────────

/** Core maqam colors — emotional truth encoding */
export const MAQAM_PALETTE = {
  // Truth layer primaries
  bayati:    { primary: '#2D6A4F', light: '#E8F5E9', medium: '#66BB6A', dark: '#1B4332' },
  rast:      { primary: '#1B4965', light: '#E3F2FD', medium: '#42A5F5', dark: '#0B2545' },
  hijaz:     { primary: '#E76F51', light: '#FFF3E0', medium: '#FF9800', dark: '#BC4B30' },
  nahawand:  { primary: '#6C567B', light: '#F3E5F5', medium: '#AB47BC', dark: '#4A3558' },
  sikah:     { primary: '#9B8816', light: '#FFFDE7', medium: '#FDD835', dark: '#6B5E0E' },

  // System state (consonance → dissonance)
  harmony:    '#A7C957',   // consonance — all clear
  tension:    '#F2CC8F',   // second interval — something to watch
  dissonance: '#E63946',   // tritone — critical anomaly (Saba)

  // Extended maqamat
  jiharkah:  { primary: '#457B9D', light: '#89B0C8', dark: '#2C5F7C' },  // peer comparison
  saba:      { primary: '#E63946', light: '#F08080', dark: '#B71C1C' },   // critical alarm

  // Surfaces
  surface:      { light: '#FAFAFA', dark: '#1A1A2E' },
  surfaceUp:    { light: '#FFFFFF', dark: '#16213E' },
  surfaceDown:  { light: '#F0F0F0', dark: '#0F3460' },

  // Text
  textPrimary:   { light: '#1A1A2E', dark: '#E8E8E8' },
  textSecondary: { light: '#6B7280', dark: '#9CA3AF' },
} as const;

// ── 2. TRUTH LAYER SYSTEM ───────────────────────────────────────────────────

export type QDTruthLayer =
  | 'OBSERVED'
  | 'COMPUTED'
  | 'ESTIMATED'
  | 'USER_INPUT'
  | 'MARKET_REFERENCE';

export interface TruthColorSet {
  bg: string;
  text: string;
  border: string;
  label: string;
  icon: string;
  maqam: string;
  ethos: string;
}

export const TRUTH_COLORS: Record<QDTruthLayer, TruthColorSet> = {
  OBSERVED: {
    bg: MAQAM_PALETTE.bayati.light,
    text: MAQAM_PALETTE.bayati.primary,
    border: MAQAM_PALETTE.bayati.medium,
    label: 'From Filing',
    icon: '📄',
    maqam: 'Bayati',
    ethos: 'serene, grounded',
  },
  COMPUTED: {
    bg: MAQAM_PALETTE.rast.light,
    text: MAQAM_PALETTE.rast.primary,
    border: MAQAM_PALETTE.rast.medium,
    label: 'Calculated',
    icon: '🔧',
    maqam: 'Rast',
    ethos: 'noble, structured',
  },
  ESTIMATED: {
    bg: MAQAM_PALETTE.hijaz.light,
    text: MAQAM_PALETTE.hijaz.primary,
    border: MAQAM_PALETTE.hijaz.medium,
    label: 'Estimated',
    icon: '📊',
    maqam: 'Hijaz',
    ethos: 'tense, uncertain',
  },
  USER_INPUT: {
    bg: MAQAM_PALETTE.sikah.light,
    text: MAQAM_PALETTE.sikah.primary,
    border: MAQAM_PALETTE.sikah.medium,
    label: 'User Input',
    icon: '✏️',
    maqam: 'Sikah',
    ethos: 'reflective, intentional',
  },
  MARKET_REFERENCE: {
    bg: MAQAM_PALETTE.nahawand.light,
    text: MAQAM_PALETTE.nahawand.primary,
    border: MAQAM_PALETTE.nahawand.medium,
    label: 'Market Data',
    icon: '🌐',
    maqam: 'Nahawand',
    ethos: 'external, introspective',
  },
} as const;

// ── 3. MAQAM MODE (for sonification + graph) ───────────────────────────────

export type MaqamMode =
  | 'bayati'    // Serenity — OBSERVED
  | 'rast'      // Noble — COMPUTED
  | 'hijaz'     // Tension — ESTIMATED
  | 'nahawand'  // Melancholy — historical
  | 'saba'      // Pain — critical anomaly
  | 'jiharkah'  // Expansive — peer comparison
  | 'sikah';    // Nostalgic — temporal

export interface MaqamPalette {
  primary: string;
  light: string;
  dark: string;
  emotion: string;
}

export const MAQAM_COLORS: Record<MaqamMode, MaqamPalette> = {
  bayati:   { primary: '#2D6A4F', light: '#74C69D', dark: '#1B4332', emotion: 'serenity' },
  rast:     { primary: '#1B4965', light: '#5FA8D3', dark: '#0B2545', emotion: 'nobility' },
  hijaz:    { primary: '#E76F51', light: '#F4A261', dark: '#BC4B30', emotion: 'tension' },
  nahawand: { primary: '#6C567B', light: '#A08BBB', dark: '#4A3558', emotion: 'introspection' },
  saba:     { primary: '#E63946', light: '#F08080', dark: '#B71C1C', emotion: 'alarm' },
  jiharkah: { primary: '#457B9D', light: '#89B0C8', dark: '#2C5F7C', emotion: 'expansion' },
  sikah:    { primary: '#9B8816', light: '#C4B14A', dark: '#6B5E0E', emotion: 'nostalgia' },
};

/** Map truth layer to maqam for sonification */
export const TRUTH_TO_MAQAM: Record<QDTruthLayer, MaqamMode> = {
  OBSERVED: 'bayati',
  COMPUTED: 'rast',
  ESTIMATED: 'hijaz',
  USER_INPUT: 'sikah',
  MARKET_REFERENCE: 'nahawand',
};

// ── 4. TYPOGRAPHY — Musical Rhythm ──────────────────────────────────────────
// Titles = chords (bold, imposing), Body = melody (fluid),
// Numbers = percussion (fixed, aligned, tabular-nums)

export const TYPOGRAPHY = {
  fontFamily: {
    /** Running text, titles — the melody */
    prose: "'Inter', 'system-ui', sans-serif",
    /** Financial figures, code — the percussion */
    mono: "'SF Mono', 'JetBrains Mono', 'Consolas', monospace",
  },
  scale: {
    h1:      { size: 28, weight: 700, family: 'prose' as const },    // movement title
    h2:      { size: 20, weight: 600, family: 'prose' as const },    // main theme
    h3:      { size: 16, weight: 600, family: 'prose' as const },    // variation
    body:    { size: 14, weight: 400, family: 'prose' as const },    // melody
    caption: { size: 12, weight: 400, family: 'prose' as const },    // ornaments
    mono:    { size: 13, weight: 400, family: 'mono' as const },     // percussion
    monoSm:  { size: 11, weight: 400, family: 'mono' as const },    // XBRL concepts
  },
  spacing: {
    gridUnit: 4,   // 4px grid — musical 4/4 time signature
    halfBar:  8,   // 8px — half measure
    fullBar: 16,   // 16px — full measure
    section: 32,   // 32px — section break (between groups)
  },
} as const;

// ── 5. EASING — Musical Articulation ────────────────────────────────────────

export const EASING = {
  /** Standard — smooth, natural movement */
  standard:  'cubic-bezier(0.22, 1, 0.36, 1)',
  /** Portamento — Arabic vocal slide with slight overshoot */
  portamento: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  /** Staccato — sharp, immediate, detached */
  staccato:  'cubic-bezier(0.4, 0, 1, 1)',
  /** Legato — connected, flowing, smooth */
  legato:    'cubic-bezier(0.16, 1, 0.3, 1)',
} as const;

/** Timing constants inspired by musical feel */
export const TIMING = {
  tooltipDelay:    300,   // hover → appear (breath before note)
  tooltipFadeIn:   200,   // fade-in duration
  tooltipExit:       0,   // staccato — immediate exit
  drillDownExpand: 200,   // expand-in-place (grace note)
  viewTransition:  300,   // zoom between views (modulation)
  morphTransition: 500,   // table → graph morph (mode change)
  arpeggio:        100,   // delay between items in progressive reveal
  pulseRecent:    1000,   // pulse period for recently changed data
} as const;

// ── 6. CONFIDENCE ───────────────────────────────────────────────────────────

export function confidenceOpacity(confidence: number): number {
  return 0.4 + Math.min(1, Math.max(0, confidence)) * 0.6;
}

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unknown';

export function confidenceLevel(c: number | undefined): ConfidenceLevel {
  if (c === undefined || c === null) return 'unknown';
  if (c >= 0.9) return 'high';
  if (c >= 0.6) return 'medium';
  return 'low';
}

export function confidenceColor(c: number | undefined): string {
  const level = confidenceLevel(c);
  switch (level) {
    case 'high':    return MAQAM_PALETTE.bayati.primary;    // Bayati green
    case 'medium':  return MAQAM_PALETTE.hijaz.primary;     // Hijaz amber
    case 'low':     return MAQAM_PALETTE.dissonance;        // Saba red
    default:        return '#9E9E9E';
  }
}

// ── 7. MATERIALITY ──────────────────────────────────────────────────────────

export function materialitySize(value: number, maxValue: number): number {
  if (!value || !maxValue) return 1;
  return 0.5 + (Math.abs(value) / maxValue) * 1.5;
}

// ── 8. ANOMALY (Dissonance) ─────────────────────────────────────────────────

export interface AnomalyInfo {
  type: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  message: string;
}

export function anomalyBorder(anomalies: AnomalyInfo[]): string {
  if (!anomalies || anomalies.length === 0) return 'none';
  const worst = anomalies[0].severity;
  if (worst === 'CRITICAL') return `2px solid ${MAQAM_PALETTE.dissonance}`;
  if (worst === 'WARNING') return `2px solid ${MAQAM_PALETTE.tension}`;
  return '1px dashed #9E9E9E';
}

export function anomalyGlow(anomalies: AnomalyInfo[]): string {
  if (!anomalies || anomalies.length === 0) return 'none';
  if (anomalies[0].severity === 'CRITICAL')
    return `0 0 8px ${MAQAM_PALETTE.dissonance}40`;
  return 'none';
}

// ── 9. RECENCY → ANIMATION ─────────────────────────────────────────────────

export function recentChangeAnimation(lastModified: Date): string {
  const ageMs = Date.now() - lastModified.getTime();
  if (ageMs < 60_000)  return 'qd-pulse-fast 1s infinite';
  if (ageMs < 300_000) return 'qd-pulse-slow 3s infinite';
  return 'none';
}

// ── 10. GOLDMAN SACHS FORMATTING ────────────────────────────────────────────

/**
 * GS-standard financial number formatting:
 * - Negatives in (parentheses)
 * - Tabular numerals, right-aligned
 * - Dash for zero
 * - NM for invalid multiples
 */
export function gsFormat(
  value: number,
  format: 'currency_m' | 'currency_b' | 'percentage' | 'multiple' | 'number' | 'number_1dp' | 'per_share',
  _currency = 'USD',
): string {
  if (value === 0 || (Math.abs(value) < 0.005 && format !== 'percentage')) return '\u2014';

  const neg = value < 0;
  const abs = Math.abs(value);
  let str: string;

  switch (format) {
    case 'currency_m':
      str = abs.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
      break;
    case 'currency_b':
      str = (abs / 1000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      break;
    case 'percentage':
      str = `${(abs * 100).toFixed(1)}%`;
      break;
    case 'multiple':
      if (abs > 100 || abs < 0.1) return 'NM';
      str = `${abs.toFixed(1)}x`;
      break;
    case 'per_share':
      str = `$${abs.toFixed(2)}`;
      break;
    case 'number_1dp':
      str = abs.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
      break;
    default:
      str = abs.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  return neg ? `(${str})` : str;
}

// ── 11. SENSITIVITY MATRIX ──────────────────────────────────────────────────

export function sensitivityColor(impliedPrice: number, currentPrice: number): string {
  const delta = (impliedPrice - currentPrice) / currentPrice;
  if (delta > 0.3)  return MAQAM_PALETTE.bayati.primary;
  if (delta > 0.1)  return `${MAQAM_PALETTE.bayati.primary}99`;
  if (delta > -0.1) return '#9CA3AF';
  if (delta > -0.3) return `${MAQAM_PALETTE.hijaz.primary}99`;
  return MAQAM_PALETTE.hijaz.primary;
}

// ── 12. GRAPH NODE SHAPES ───────────────────────────────────────────────────

export type GraphNodeShape = 'circle' | 'diamond' | 'square' | 'hexagon';

export const graphNodeShapes: Record<string, GraphNodeShape> = {
  financial: 'circle',
  ratio:     'diamond',
  source:    'square',
  composite: 'hexagon',
};

export const graphEdgeStyles = {
  COMPOSES:    { width: 2, dash: 'none',  color: MAQAM_PALETTE.bayati.primary },
  DERIVES:     { width: 1.5, dash: '5,3', color: MAQAM_PALETTE.rast.primary },
  COMPARED_TO: { width: 1, dash: '2,4',   color: MAQAM_PALETTE.jiharkah.primary },
  TEMPORAL:    { width: 1, dash: '4,2',   color: MAQAM_PALETTE.sikah.primary },
} as const;

// ── 13. CSS KEYFRAMES INJECTION ─────────────────────────────────────────────

/** Call once at app startup to inject quantum CSS animations */
export function injectQuantumKeyframes(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById('qd-maqam-keyframes')) return;

  const style = document.createElement('style');
  style.id = 'qd-maqam-keyframes';
  style.textContent = `
    @keyframes qd-pulse-fast {
      0%, 100% { box-shadow: 0 0 0 0 ${MAQAM_PALETTE.hijaz.primary}40; }
      50% { box-shadow: 0 0 8px 2px ${MAQAM_PALETTE.hijaz.primary}60; }
    }
    @keyframes qd-pulse-slow {
      0%, 100% { box-shadow: 0 0 0 0 ${MAQAM_PALETTE.rast.primary}20; }
      50% { box-shadow: 0 0 6px 1px ${MAQAM_PALETTE.rast.primary}40; }
    }
    @keyframes qd-dissonance {
      0%, 100% { box-shadow: 0 0 0 0 ${MAQAM_PALETTE.dissonance}00; }
      50% { box-shadow: 0 0 12px 4px ${MAQAM_PALETTE.dissonance}40; }
    }
    @keyframes qd-fade-in {
      from { opacity: 0; transform: translateY(4px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes qd-expand {
      from { max-height: 0; opacity: 0; }
      to   { max-height: 500px; opacity: 1; }
    }
    @keyframes qd-arpeggio-item {
      from { opacity: 0; transform: translateX(-8px); }
      to   { opacity: 1; transform: translateX(0); }
    }
  `;
  document.head.appendChild(style);
}

// ── CONVENIENCE EXPORT ──────────────────────────────────────────────────────

export const quantumTokens = {
  palette: MAQAM_PALETTE,
  truthColors: TRUTH_COLORS,
  maqamColors: MAQAM_COLORS,
  truthToMaqam: TRUTH_TO_MAQAM,
  typography: TYPOGRAPHY,
  easing: EASING,
  timing: TIMING,
  gsFormat,
  sensitivityColor,
  graphNodeShapes,
  graphEdgeStyles,
  injectQuantumKeyframes,
} as const;
