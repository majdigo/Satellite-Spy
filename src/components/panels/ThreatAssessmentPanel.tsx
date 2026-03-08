"use client";

import { useAppStore } from "@/store";
import { generateThreatAssessment } from "@/lib/api/correlation";
import { MONITORED_COUNTRIES } from "@/lib/api/economic";
import { severityBgClass, severityColor } from "@/lib/utils/helpers";
import { useMemo } from "react";

export default function ThreatAssessmentPanel() {
  const { gdeltEvents, conflicts, disasters, economicData, setFocusLocation } = useAppStore();

  const assessments = useMemo(() => {
    if (gdeltEvents.length === 0 && conflicts.length === 0) return [];

    return MONITORED_COUNTRIES.slice(0, 10).map((country) =>
      generateThreatAssessment(country.name, country.code, {
        gdeltEvents,
        conflicts,
        disasters,
        economicData,
      })
    ).sort((a, b) => {
      const order = { critical: 4, high: 3, medium: 2, low: 1 };
      return order[b.overallRisk] - order[a.overallRisk];
    });
  }, [gdeltEvents, conflicts, disasters, economicData]);

  const trendIcon = {
    escalating: "▲",
    stable: "━",
    "de-escalating": "▼",
  };

  const trendColor = {
    escalating: "text-red-400",
    stable: "text-yellow-400",
    "de-escalating": "text-green-400",
  };

  return (
    <div className="space-y-2">
      <div className="text-[10px] font-mono text-gray-600 uppercase tracking-wider">
        Regional Threat Assessment
      </div>

      <div className="space-y-1 max-h-72 overflow-y-auto scrollbar-thin">
        {assessments.map((assessment) => (
          <div
            key={assessment.country}
            className="border border-gray-800 hover:border-gray-700 transition-all p-2 cursor-pointer"
            onClick={() => {
              // Focus on country (approximate centers)
              const countryConflict = conflicts.find(
                (c) => c.country === assessment.country
              );
              if (countryConflict) {
                setFocusLocation({
                  lat: countryConflict.latitude,
                  lon: countryConflict.longitude,
                  zoom: 2000,
                });
              }
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${severityBgClass(assessment.overallRisk)}`}
                />
                <span className="text-xs font-mono text-gray-300">
                  {assessment.region}
                </span>
              </div>
              <span
                className={`text-[10px] font-mono ${trendColor[assessment.trendDirection]}`}
              >
                {trendIcon[assessment.trendDirection]} {assessment.trendDirection.toUpperCase()}
              </span>
            </div>

            {/* Risk bars */}
            <div className="grid grid-cols-5 gap-0.5 mt-1">
              {[
                { label: "MIL", value: assessment.militaryThreat },
                { label: "POL", value: assessment.politicalInstability },
                { label: "ECO", value: assessment.economicRisk },
                { label: "HUM", value: assessment.humanitarianRisk },
                { label: "ENV", value: assessment.environmentalRisk },
              ].map((metric) => (
                <div key={metric.label} className="text-center">
                  <div className="w-full bg-gray-900 h-1 mb-0.5">
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${metric.value}%`,
                        backgroundColor: severityColor(
                          metric.value > 70
                            ? "critical"
                            : metric.value > 50
                            ? "high"
                            : metric.value > 25
                            ? "medium"
                            : "low"
                        ),
                      }}
                    />
                  </div>
                  <div className="text-[8px] font-mono text-gray-700">
                    {metric.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Key indicators */}
            <div className="mt-1 flex flex-wrap gap-1">
              {assessment.keyIndicators.slice(0, 2).map((ind, i) => (
                <span
                  key={i}
                  className="text-[8px] font-mono text-gray-600 bg-gray-900 px-1 py-0.5"
                >
                  {ind}
                </span>
              ))}
            </div>
          </div>
        ))}

        {assessments.length === 0 && (
          <div className="text-center text-[10px] font-mono text-gray-700 py-8">
            COMPUTING THREAT MATRIX...
          </div>
        )}
      </div>
    </div>
  );
}
