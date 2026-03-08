import {
  formatCoordinate,
  formatAltitude,
  formatVelocity,
  severityColor,
  severityBgClass,
  getTimeAgo,
  truncate,
  classNames,
} from "@/lib/utils/helpers";

describe("formatCoordinate", () => {
  it("formats positive latitude as N", () => {
    const result = formatCoordinate(48.8566, "lat");
    expect(result).toContain("N");
    expect(result).toContain("48");
  });

  it("formats negative latitude as S", () => {
    const result = formatCoordinate(-33.8688, "lat");
    expect(result).toContain("S");
    expect(result).toContain("33");
  });

  it("formats positive longitude as E", () => {
    const result = formatCoordinate(2.3522, "lon");
    expect(result).toContain("E");
  });

  it("formats negative longitude as W", () => {
    const result = formatCoordinate(-73.9857, "lon");
    expect(result).toContain("W");
    expect(result).toContain("73");
  });

  it("handles zero", () => {
    const result = formatCoordinate(0, "lat");
    expect(result).toContain("N");
    expect(result).toContain("0");
  });
});

describe("formatAltitude", () => {
  it("formats km values", () => {
    expect(formatAltitude(408.5)).toBe("408.5 km");
  });

  it("formats sub-km as meters", () => {
    expect(formatAltitude(0.5)).toBe("500 m");
  });

  it("formats zero", () => {
    expect(formatAltitude(0)).toBe("0 m");
  });
});

describe("formatVelocity", () => {
  it("converts km/s to km/h", () => {
    expect(formatVelocity(7.8)).toBe("28080 km/h");
  });

  it("formats zero velocity", () => {
    expect(formatVelocity(0)).toBe("0 km/h");
  });
});

describe("severityColor", () => {
  it("returns correct colors for each severity", () => {
    expect(severityColor("critical")).toBe("#ff0000");
    expect(severityColor("high")).toBe("#ff6600");
    expect(severityColor("medium")).toBe("#ffcc00");
    expect(severityColor("low")).toBe("#00cc00");
  });
});

describe("severityBgClass", () => {
  it("returns correct CSS classes", () => {
    expect(severityBgClass("critical")).toBe("bg-red-600");
    expect(severityBgClass("high")).toBe("bg-orange-500");
    expect(severityBgClass("medium")).toBe("bg-yellow-500");
    expect(severityBgClass("low")).toBe("bg-green-500");
  });
});

describe("getTimeAgo", () => {
  it("returns 'just now' for recent dates", () => {
    expect(getTimeAgo(new Date())).toBe("just now");
  });

  it("returns minutes ago", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(getTimeAgo(fiveMinAgo)).toBe("5m ago");
  });

  it("returns hours ago", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    expect(getTimeAgo(twoHoursAgo)).toBe("2h ago");
  });

  it("returns days ago", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    expect(getTimeAgo(threeDaysAgo)).toBe("3d ago");
  });

  it("handles string dates", () => {
    const result = getTimeAgo(new Date().toISOString());
    expect(result).toBe("just now");
  });
});

describe("truncate", () => {
  it("returns original string if shorter than limit", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("truncates long strings with ellipsis", () => {
    expect(truncate("this is a very long string", 15)).toBe("this is a ve...");
  });

  it("handles exact length", () => {
    expect(truncate("exact", 5)).toBe("exact");
  });
});

describe("classNames", () => {
  it("joins class names", () => {
    expect(classNames("a", "b", "c")).toBe("a b c");
  });

  it("filters falsy values", () => {
    expect(classNames("a", false, "b", undefined, null, "c")).toBe("a b c");
  });

  it("returns empty string for no classes", () => {
    expect(classNames(false, undefined)).toBe("");
  });
});
