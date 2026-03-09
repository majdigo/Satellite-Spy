import { NextResponse } from "next/server";
import type { MarketData } from "@/types";

// ============================================================================
// Market / Commodity Data API
// Uses Yahoo Finance v8 API (public, no key required) for real-time data
// Covers: Oil, Gas, Gold, Defense stocks, major indices, currencies
// ============================================================================

const TRACKED_SYMBOLS: Array<{
  symbol: string;
  name: string;
  category: MarketData["category"];
}> = [
  // Energy commodities — key conflict indicators
  { symbol: "CL=F", name: "Crude Oil (WTI)", category: "energy" },
  { symbol: "BZ=F", name: "Brent Crude Oil", category: "energy" },
  { symbol: "NG=F", name: "Natural Gas", category: "energy" },
  { symbol: "HO=F", name: "Heating Oil", category: "energy" },
  { symbol: "RB=F", name: "Gasoline RBOB", category: "energy" },
  // Precious metals — safe haven indicators
  { symbol: "GC=F", name: "Gold", category: "metals" },
  { symbol: "SI=F", name: "Silver", category: "metals" },
  { symbol: "PL=F", name: "Platinum", category: "metals" },
  // Agriculture — food security indicators
  { symbol: "ZW=F", name: "Wheat", category: "agriculture" },
  { symbol: "ZC=F", name: "Corn", category: "agriculture" },
  { symbol: "ZS=F", name: "Soybeans", category: "agriculture" },
  // Defense sector — military-industrial complex
  { symbol: "LMT", name: "Lockheed Martin", category: "defense" },
  { symbol: "RTX", name: "RTX Corp (Raytheon)", category: "defense" },
  { symbol: "NOC", name: "Northrop Grumman", category: "defense" },
  { symbol: "GD", name: "General Dynamics", category: "defense" },
  { symbol: "BA", name: "Boeing", category: "defense" },
  { symbol: "LHX", name: "L3Harris Technologies", category: "defense" },
  // Key indices
  { symbol: "^VIX", name: "VIX (Fear Index)", category: "index" },
  { symbol: "^GSPC", name: "S&P 500", category: "index" },
  // Currencies of conflict zones
  { symbol: "USDRUB=X", name: "USD/RUB", category: "currency" },
  { symbol: "USDIRR=X", name: "USD/IRR", category: "currency" },
  { symbol: "USDTRY=X", name: "USD/TRY", category: "currency" },
  { symbol: "USDCNY=X", name: "USD/CNY", category: "currency" },
  { symbol: "DX-Y.NYB", name: "US Dollar Index", category: "currency" },
];

interface YahooQuoteResult {
  symbol: string;
  regularMarketPrice: number;
  regularMarketPreviousClose: number;
  regularMarketChangePercent: number;
  regularMarketVolume: number;
  averageDailyVolume3Month: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  regularMarketTime: number;
}

async function fetchYahooFinance(symbols: string[]): Promise<YahooQuoteResult[]> {
  const symbolStr = symbols.join(",");
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbolStr)}&fields=regularMarketPrice,regularMarketPreviousClose,regularMarketChangePercent,regularMarketVolume,averageDailyVolume3Month,fiftyTwoWeekHigh,fiftyTwoWeekLow,regularMarketTime`;

  const resp = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
    next: { revalidate: 60 }, // Cache for 1 minute
  });

  if (!resp.ok) {
    throw new Error(`Yahoo Finance API error: ${resp.status}`);
  }

  const data = await resp.json();
  return data?.quoteResponse?.result || [];
}

function mapToMarketData(
  quote: YahooQuoteResult,
  meta: (typeof TRACKED_SYMBOLS)[number]
): MarketData {
  const avgVol = quote.averageDailyVolume3Month || 1;
  const vol = quote.regularMarketVolume || 0;

  return {
    symbol: meta.symbol,
    name: meta.name,
    category: meta.category,
    price: quote.regularMarketPrice || 0,
    previousClose: quote.regularMarketPreviousClose || 0,
    changePercent: quote.regularMarketChangePercent || 0,
    volume: vol,
    avgVolume: avgVol,
    volumeAnomaly: avgVol > 0 ? vol / avgVol : 0,
    high52w: quote.fiftyTwoWeekHigh || 0,
    low52w: quote.fiftyTwoWeekLow || 0,
    timestamp: new Date(
      (quote.regularMarketTime || Date.now() / 1000) * 1000
    ).toISOString(),
    source: "Yahoo Finance",
  };
}

// Fallback with simulated data when Yahoo API is unavailable
function generateFallbackData(): MarketData[] {
  return TRACKED_SYMBOLS.map((meta) => {
    const basePrice = getBasePrice(meta.symbol);
    const change = (Math.random() - 0.45) * 5; // slight bias toward positive
    const volumeAnomaly = 0.5 + Math.random() * 2.5;

    return {
      symbol: meta.symbol,
      name: meta.name,
      category: meta.category,
      price: basePrice * (1 + change / 100),
      previousClose: basePrice,
      changePercent: change,
      volume: Math.floor(1000000 * volumeAnomaly),
      avgVolume: 1000000,
      volumeAnomaly,
      high52w: basePrice * 1.3,
      low52w: basePrice * 0.7,
      timestamp: new Date().toISOString(),
      source: "Simulated",
    };
  });
}

function getBasePrice(symbol: string): number {
  const prices: Record<string, number> = {
    "CL=F": 78, "BZ=F": 82, "NG=F": 2.8, "HO=F": 2.6, "RB=F": 2.3,
    "GC=F": 2650, "SI=F": 31, "PL=F": 920,
    "ZW=F": 580, "ZC=F": 450, "ZS=F": 1200,
    "LMT": 450, "RTX": 95, "NOC": 480, "GD": 270, "BA": 210, "LHX": 210,
    "^VIX": 18, "^GSPC": 5100,
    "USDRUB=X": 92, "USDIRR=X": 42000, "USDTRY=X": 32, "USDCNY=X": 7.2, "DX-Y.NYB": 104,
  };
  return prices[symbol] || 100;
}

export async function GET() {
  try {
    const symbols = TRACKED_SYMBOLS.map((s) => s.symbol);

    let marketData: MarketData[];

    try {
      const quotes = await fetchYahooFinance(symbols);
      if (quotes.length === 0) {
        throw new Error("No quotes returned");
      }

      marketData = quotes
        .map((quote) => {
          const meta = TRACKED_SYMBOLS.find((s) => s.symbol === quote.symbol);
          if (!meta) return null;
          return mapToMarketData(quote, meta);
        })
        .filter((d): d is MarketData => d !== null);

      // If we got partial data, fill in the missing symbols with fallback
      if (marketData.length < TRACKED_SYMBOLS.length * 0.5) {
        marketData = generateFallbackData();
      }
    } catch {
      // Yahoo Finance unavailable — use fallback data
      marketData = generateFallbackData();
    }

    return NextResponse.json({
      market: marketData,
      count: marketData.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch market data", details: String(error) },
      { status: 500 }
    );
  }
}
