# I-004 — Competitive Landscape & State of the Art (March 2026)

## Summary

Research conducted 2026-03-23. Satellite-Spy has 5 unique differentiators vs ALL competitors.

## Competitors

| Platform | Revenue/Price | Globe? | Markets? | Causal Chains? | Decision Engine? |
|----------|--------------|--------|----------|---------------|-----------------|
| Palantir Gotham | $4.5B rev, $1M+/yr | No | No | Analyst-configured | No |
| Recorded Future | $2.65B acquisition | No | No | No | No |
| Dataminr | $150K+/yr | No | No | No | Alert-only |
| Janes | $50K+/yr | No | No | No | No |
| ShadowBroker (OSS) | Free | 2D MapLibre | No | No | No |
| **Satellite-Spy** | Open | **3D CesiumJS** | **Yes** | **Yes** | **Yes** |

## Closest Competitor: ShadowBroker

Open-source, Next.js + MapLibre + FastAPI. Hit Hacker News March 8, 2026.
15+ live feeds (ADS-B, AIS maritime, GDELT, earthquakes, GPS interference).
Limitations: 2D only, no market/economic data, no causal chain, no decision engine.

## Critical Findings

1. **GDELT data quality**: ~55% accuracy per MDPI 2025 study. Need validation layer.
2. **OpenSky deprecated basic auth** on March 18, 2026. Now OAuth2 only.
3. **ACLED** merged all tools into unified Early Warning Dashboard (2025).
4. **GPR Index** (Federal Reserve) and **BlackRock BGRI** are established risk scores we should consume.

## Key Technologies to Watch

- **TerraTorch 1.0** (IBM): Framework for fine-tuning geospatial FMs
- **Prithvi-EO-2.0** (IBM/NASA): Best-in-class Earth observation FM
- **deck.gl v9.0**: GPU-accelerated overlays, integrates with CesiumJS
- **Overture Maps**: Open building/infrastructure data (Amazon, Meta, Microsoft)

## Sources

- [Palantir FY2025](https://finance.yahoo.com/news/palantir-gotham)
- [Recorded Future + Mastercard](https://www.recordedfuture.com/blog/mastercard)
- [ShadowBroker HN](https://news.ycombinator.com/item?id=47300102)
- [GDELT Quality Study](https://www.mdpi.com/2306-5729/10/10/158)
- [GPR Index](https://www.matteoiacoviello.com/gpr.htm)
- [TerraTorch 1.0](https://research.ibm.com/blog/simplifying-geospatial-ai-with-terra-torch-1-0)
- [Prithvi-EO-2.0](https://github.com/NASA-IMPACT/Prithvi-EO-2.0)
- [OpenSky API](https://openskynetwork.github.io/opensky-api/)
