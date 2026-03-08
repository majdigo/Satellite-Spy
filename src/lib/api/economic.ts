import type { EconomicIndicator, EconomicIndicatorType } from "@/types";

// World Bank API indicators
const WB_INDICATORS: Record<EconomicIndicatorType, string> = {
  gdp_growth: "NY.GDP.MKTP.KD.ZG",
  inflation: "FP.CPI.TOTL.ZG",
  unemployment: "SL.UEM.TOTL.ZS",
  trade_balance: "NE.RSB.GNFS.ZS",
  debt_to_gdp: "GC.DOD.TOTL.GD.ZS",
  currency_stability: "PA.NUS.FCRF",
  oil_price: "CRUDE_BRENT", // Custom, not WB
  food_price_index: "FOOD", // Custom, not WB
};

// Key countries for monitoring
export const MONITORED_COUNTRIES = [
  { code: "USA", name: "United States" },
  { code: "CHN", name: "China" },
  { code: "RUS", name: "Russia" },
  { code: "IND", name: "India" },
  { code: "GBR", name: "United Kingdom" },
  { code: "FRA", name: "France" },
  { code: "DEU", name: "Germany" },
  { code: "JPN", name: "Japan" },
  { code: "BRA", name: "Brazil" },
  { code: "IRN", name: "Iran" },
  { code: "SAU", name: "Saudi Arabia" },
  { code: "TUR", name: "Turkey" },
  { code: "UKR", name: "Ukraine" },
  { code: "ISR", name: "Israel" },
  { code: "EGY", name: "Egypt" },
  { code: "NGA", name: "Nigeria" },
  { code: "ZAF", name: "South Africa" },
  { code: "KOR", name: "South Korea" },
  { code: "TWN", name: "Taiwan" },
  { code: "PAK", name: "Pakistan" },
];

export function parseWorldBankData(
  raw: unknown,
  indicator: EconomicIndicatorType
): EconomicIndicator[] {
  const data = raw as Array<
    Array<{
      country: { id: string; value: string };
      date: string;
      value: number | null;
    }>
  >;

  if (!data || data.length < 2) return [];

  return data[1]
    .filter((entry) => entry.value !== null)
    .map((entry, idx, arr) => {
      const previousValue = idx < arr.length - 1 ? (arr[idx + 1].value ?? undefined) : undefined;
      let trend: "up" | "down" | "stable" = "stable";
      if (previousValue !== undefined && entry.value !== null) {
        if (entry.value > previousValue * 1.01) trend = "up";
        else if (entry.value < previousValue * 0.99) trend = "down";
      }

      return {
        country: entry.country.value,
        countryCode: entry.country.id,
        indicator,
        value: entry.value!,
        date: entry.date,
        previousValue,
        trend,
        source: "World Bank",
      };
    });
}

export function getWorldBankUrl(
  countryCode: string,
  indicator: EconomicIndicatorType,
  years: number = 5
): string {
  const wbIndicator = WB_INDICATORS[indicator];
  if (!wbIndicator || indicator === "oil_price" || indicator === "food_price_index") {
    return "";
  }
  return `https://api.worldbank.org/v2/country/${countryCode}/indicator/${wbIndicator}?format=json&per_page=50&mrv=${years}`;
}

export async function fetchEconomicData(): Promise<EconomicIndicator[]> {
  try {
    const resp = await fetch("/api/economic");
    if (!resp.ok) return [];
    const data = await resp.json();
    return data.indicators || [];
  } catch {
    return [];
  }
}

export function calculateEconomicRisk(indicators: EconomicIndicator[]): number {
  if (indicators.length === 0) return 0;

  let riskScore = 0;
  let count = 0;

  for (const ind of indicators) {
    switch (ind.indicator) {
      case "inflation":
        if (ind.value > 10) riskScore += 30;
        else if (ind.value > 5) riskScore += 15;
        else if (ind.value > 3) riskScore += 5;
        count++;
        break;
      case "gdp_growth":
        if (ind.value < -2) riskScore += 30;
        else if (ind.value < 0) riskScore += 20;
        else if (ind.value < 1) riskScore += 10;
        count++;
        break;
      case "unemployment":
        if (ind.value > 20) riskScore += 25;
        else if (ind.value > 10) riskScore += 15;
        else if (ind.value > 7) riskScore += 5;
        count++;
        break;
      case "debt_to_gdp":
        if (ind.value > 150) riskScore += 20;
        else if (ind.value > 100) riskScore += 10;
        count++;
        break;
    }
  }

  return count > 0 ? Math.min(100, (riskScore / count) * 10) : 0;
}
