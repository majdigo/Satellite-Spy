/**
 * Tests for Unified Confidence Framework.
 * S-Agent — Product quality refactoring
 */

import {
  calculateConfidence,
  propagateConfidence,
  crossValidateConfidence,
  confidenceToOpacity,
  classifyConfidence,
  SOURCE_PROFILES,
} from "../confidence";

describe("Confidence Framework", () => {
  describe("calculateConfidence", () => {
    describe("GDELT source", () => {
      test("1 source gives low confidence", () => {
        const conf = calculateConfidence("GDELT", { numSources: 1 });
        expect(conf).toBeLessThan(0.25);
        expect(conf).toBeGreaterThan(0);
      });

      test("5 sources gives medium confidence", () => {
        const conf = calculateConfidence("GDELT", { numSources: 5 });
        expect(conf).toBeGreaterThanOrEqual(0.3);
        expect(conf).toBeLessThan(0.6);
      });

      test("12 sources gives good confidence", () => {
        const conf = calculateConfidence("GDELT", { numSources: 12, hasCoordinates: true });
        expect(conf).toBeGreaterThanOrEqual(0.6);
      });

      test("20+ sources gives high confidence", () => {
        const conf = calculateConfidence("GDELT", { numSources: 20, hasCoordinates: true });
        expect(conf).toBeGreaterThanOrEqual(0.8);
      });

      test("no coordinates penalty", () => {
        const withCoords = calculateConfidence("GDELT", { numSources: 10, hasCoordinates: true });
        const noCoords = calculateConfidence("GDELT", { numSources: 10, hasCoordinates: false });
        expect(withCoords).toBeGreaterThan(noCoords);
      });

      test("old events lose confidence", () => {
        const recent = calculateConfidence("GDELT", { numSources: 10, recencyHours: 2 });
        const old = calculateConfidence("GDELT", { numSources: 10, recencyHours: 200 });
        expect(recent).toBeGreaterThan(old);
      });
    });

    describe("ACLED source", () => {
      test("verified ACLED = 0.85", () => {
        expect(calculateConfidence("ACLED", { isVerified: true })).toBe(0.85);
      });

      test("unverified ACLED = 0.65", () => {
        expect(calculateConfidence("ACLED", { isVerified: false })).toBe(0.65);
      });

      test("default ACLED = 0.85 (assumed verified)", () => {
        expect(calculateConfidence("ACLED")).toBe(0.85);
      });
    });

    describe("other sources", () => {
      test("USGS = 0.95", () => {
        expect(calculateConfidence("USGS")).toBe(0.95);
      });

      test("SATELLITE = 0.90", () => {
        expect(calculateConfidence("SATELLITE")).toBe(0.90);
      });

      test("unknown source = 0.50", () => {
        expect(calculateConfidence("UNKNOWN_SOURCE")).toBe(0.50);
      });
    });
  });

  describe("propagateConfidence", () => {
    test("single input degrades by 2%", () => {
      expect(propagateConfidence([0.8])).toBeCloseTo(0.784, 2);
    });

    test("multiple inputs use minimum", () => {
      expect(propagateConfidence([0.9, 0.7, 0.8])).toBeCloseTo(0.686, 2);
    });

    test("empty inputs return 0.5", () => {
      expect(propagateConfidence([])).toBe(0.5);
    });

    test("custom degradation factor", () => {
      expect(propagateConfidence([0.8], 0.95)).toBeCloseTo(0.76, 2);
    });
  });

  describe("crossValidateConfidence", () => {
    test("two medium sources boost to high", () => {
      const result = crossValidateConfidence(0.7, 0.7);
      expect(result).toBeGreaterThan(0.85);
    });

    test("high + low still better than low alone", () => {
      const result = crossValidateConfidence(0.9, 0.3);
      expect(result).toBeGreaterThan(0.9);
    });

    test("two high sources approach certainty", () => {
      const result = crossValidateConfidence(0.9, 0.85);
      expect(result).toBeGreaterThan(0.98);
    });

    test("caps at 0.99", () => {
      expect(crossValidateConfidence(0.99, 0.99)).toBeLessThanOrEqual(0.99);
    });
  });

  describe("confidenceToOpacity", () => {
    test("0 confidence → 0.4 opacity (minimum visible)", () => {
      expect(confidenceToOpacity(0)).toBe(0.4);
    });

    test("1.0 confidence → 1.0 opacity", () => {
      expect(confidenceToOpacity(1)).toBe(1.0);
    });

    test("0.5 confidence → 0.7 opacity", () => {
      expect(confidenceToOpacity(0.5)).toBeCloseTo(0.7);
    });
  });

  describe("classifyConfidence", () => {
    test("high for >= 0.85", () => {
      expect(classifyConfidence(0.90)).toBe("high");
      expect(classifyConfidence(0.85)).toBe("high");
    });

    test("medium for 0.60-0.84", () => {
      expect(classifyConfidence(0.60)).toBe("medium");
      expect(classifyConfidence(0.84)).toBe("medium");
    });

    test("low for < 0.60", () => {
      expect(classifyConfidence(0.30)).toBe("low");
    });

    test("unknown for undefined", () => {
      expect(classifyConfidence(undefined)).toBe("unknown");
    });
  });

  describe("SOURCE_PROFILES registry", () => {
    test("all 6 sources registered", () => {
      expect(Object.keys(SOURCE_PROFILES)).toHaveLength(6);
      expect(SOURCE_PROFILES.GDELT).toBeDefined();
      expect(SOURCE_PROFILES.ACLED).toBeDefined();
      expect(SOURCE_PROFILES.USGS).toBeDefined();
      expect(SOURCE_PROFILES.SATELLITE).toBeDefined();
      expect(SOURCE_PROFILES.AIRCRAFT).toBeDefined();
      expect(SOURCE_PROFILES.COMPUTED).toBeDefined();
    });

    test("all profiles have required fields", () => {
      for (const [key, profile] of Object.entries(SOURCE_PROFILES)) {
        expect(profile.name).toBeTruthy();
        expect(profile.baseConfidence).toBeGreaterThan(0);
        expect(profile.maxConfidence).toBeGreaterThan(profile.baseConfidence);
        expect(typeof profile.confidenceFn).toBe("function");
      }
    });
  });
});
