/**
 * Tests for quantum component utility functions.
 * S-Agent Phase 2 — Agentic Cognitive UI
 */

import { getConfidenceLevel as getLevel, CONFIDENCE_COLORS as LEVEL_COLORS, TRUTH_TAG } from "@/lib/quantum-utils";

describe("ConfidenceBadge", () => {
  describe("getLevel", () => {
    test("high for >= 0.9", () => {
      expect(getLevel(0.9)).toBe("high");
      expect(getLevel(1.0)).toBe("high");
    });

    test("medium for 0.6-0.89", () => {
      expect(getLevel(0.6)).toBe("medium");
      expect(getLevel(0.89)).toBe("medium");
    });

    test("low for < 0.6", () => {
      expect(getLevel(0.5)).toBe("low");
      expect(getLevel(0)).toBe("low");
    });

    test("unknown for undefined/null", () => {
      expect(getLevel(undefined)).toBe("unknown");
    });
  });

  describe("LEVEL_COLORS", () => {
    test("all levels have ring and text colors", () => {
      for (const level of ["high", "medium", "low", "unknown"] as const) {
        expect(LEVEL_COLORS[level].ring).toBeTruthy();
        expect(LEVEL_COLORS[level].text).toBeTruthy();
        expect(LEVEL_COLORS[level].label).toBeTruthy();
      }
    });

    test("high is green, low is red", () => {
      expect(LEVEL_COLORS.high.ring).toBe("#2D6A4F");
      expect(LEVEL_COLORS.low.ring).toBe("#E63946");
    });
  });
});

describe("TruthLayerTag", () => {
  describe("TRUTH_TAG", () => {
    test("all 4 truth layers defined", () => {
      expect(TRUTH_TAG.OBSERVED).toBeDefined();
      expect(TRUTH_TAG.COMPUTED).toBeDefined();
      expect(TRUTH_TAG.ESTIMATED).toBeDefined();
      expect(TRUTH_TAG.MARKET_REFERENCE).toBeDefined();
    });

    test("each has bg, text, label, maqam", () => {
      for (const key of ["OBSERVED", "COMPUTED", "ESTIMATED", "MARKET_REFERENCE"]) {
        const tag = TRUTH_TAG[key];
        expect(tag.bg).toBeTruthy();
        expect(tag.text).toBeTruthy();
        expect(tag.label).toBeTruthy();
        expect(tag.maqam).toBeTruthy();
      }
    });

    test("OBSERVED maps to Bayati", () => {
      expect(TRUTH_TAG.OBSERVED.maqam).toBe("Bayati");
      expect(TRUTH_TAG.OBSERVED.bg).toBe("#2D6A4F");
    });

    test("ESTIMATED maps to Hijaz", () => {
      expect(TRUTH_TAG.ESTIMATED.maqam).toBe("Hijaz");
      expect(TRUTH_TAG.ESTIMATED.bg).toBe("#E76F51");
    });
  });
});
