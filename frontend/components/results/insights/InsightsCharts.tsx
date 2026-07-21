"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface ChartDataPoint {
  date: string;
  count: number;
}

interface TrendPoint {
  label: string;
  count: number;
}

interface InsightsChartsProps {
  responsesOverTime: ChartDataPoint[];
  deviceDistribution: { device: string; count: number; percentage: number }[];
  completionFunnel: { stage: string; count: number; percentage: number }[];
  responseTrend: {
    daily: TrendPoint[];
    weekly: TrendPoint[];
    monthly: TrendPoint[];
  };
}

export default function InsightsCharts({
  responsesOverTime,
  deviceDistribution,
  completionFunnel,
  responseTrend,
}: InsightsChartsProps) {
  const [trendTab, setTrendTab] = useState<"daily" | "weekly" | "monthly">("daily");
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // Line Chart Calculations (Responses Over Time)
  const lineChartWidth = 600;
  const lineChartHeight = 220;
  const maxResponseCount = Math.max(...responsesOverTime.map((d) => d.count), 5);

  const getPointsPath = () => {
    if (responsesOverTime.length < 2) return "";
    return responsesOverTime
      .map((d, i) => {
        const x = (i / (responsesOverTime.length - 1)) * (lineChartWidth - 40) + 20;
        const y = lineChartHeight - (d.count / maxResponseCount) * (lineChartHeight - 40) - 20;
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  };

  const getAreaPath = () => {
    if (responsesOverTime.length < 2) return "";
    const linePath = getPointsPath();
    const firstX = 20;
    const lastX = lineChartWidth - 20;
    const bottomY = lineChartHeight - 20;
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  // Donut Chart Calculations (Device Distribution)
  const donutRadius = 50;
  const donutCircumference = 2 * Math.PI * donutRadius;
  let accumulatedPercentage = 0;
  const deviceColors: Record<string, string> = {
    Desktop: "stroke-[#0f6b52]",
    Mobile: "stroke-blue-500",
    Tablet: "stroke-amber-500",
    Other: "stroke-gray-400",
  };
  const deviceBgColors: Record<string, string> = {
    Desktop: "bg-[#0f6b52]",
    Mobile: "bg-blue-500",
    Tablet: "bg-amber-500",
    Other: "bg-gray-400",
  };

  // Response Trend (Bar Chart) Calculations
  const activeTrend = responseTrend[trendTab];
  const maxTrendVal = Math.max(...activeTrend.map((d) => d.count), 5);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* 1. Responses Over Time */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Responses Over Time</h3>
        {responsesOverTime.length === 0 ? (
          <div className="flex h-[220px] items-center justify-center text-sm text-gray-400">No data available</div>
        ) : (
          <div className="relative">
            <svg viewBox={`0 0 ${lineChartWidth} ${lineChartHeight}`} className="w-full h-auto overflow-visible">
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0f6b52" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#0f6b52" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Horizontal Gridlines */}
              {[0, 0.5, 1].map((ratio) => {
                const y = lineChartHeight - ratio * (lineChartHeight - 40) - 20;
                const value = Math.round(ratio * maxResponseCount);
                return (
                  <g key={ratio} className="opacity-40">
                    <line x1="20" y1={y} x2={lineChartWidth - 20} y2={y} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4 4" />
                    <text x="2" y={y + 4} fontSize="10" className="fill-gray-400 font-medium">{value}</text>
                  </g>
                );
              })}

              {/* Area path */}
              <motion.path
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                d={getAreaPath()}
                fill="url(#areaGrad)"
              />

              {/* Line path */}
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                d={getPointsPath()}
                fill="none"
                stroke="#0f6b52"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Hover circles */}
              {responsesOverTime.map((d, i) => {
                const x = (i / (responsesOverTime.length - 1)) * (lineChartWidth - 40) + 20;
                const y = lineChartHeight - (d.count / maxResponseCount) * (lineChartHeight - 40) - 20;
                return (
                  <g key={i}>
                    <circle
                      cx={x}
                      cy={y}
                      r={hoveredPoint === i ? 6 : 4}
                      className={`${hoveredPoint === i ? "fill-white stroke-[#0f6b52] stroke-2" : "fill-[#0f6b52]"} transition-all cursor-pointer`}
                      onMouseEnter={() => setHoveredPoint(i)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Tooltip Overlay */}
            {hoveredPoint !== null && (
              <div className="absolute top-2 right-2 rounded bg-gray-900 px-2 py-1 text-xs text-white">
                <span className="font-semibold">{responsesOverTime[hoveredPoint].date}: </span>
                <span>{responsesOverTime[hoveredPoint].count} response(s)</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Device Distribution Donut */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Device Distribution</h3>
          {deviceDistribution.every((d) => d.count === 0) ? (
            <div className="flex h-[180px] items-center justify-center text-sm text-gray-400">No data available</div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
              {/* Donut SVG */}
              <div className="relative h-32 w-32 shrink-0">
                <svg viewBox="0 0 120 120" className="h-full w-full">
                  <circle cx="60" cy="60" r={donutRadius} fill="transparent" stroke="#F3F4F6" strokeWidth="12" />
                  {deviceDistribution.map((item) => {
                    const strokeDashoffset = donutCircumference - (accumulatedPercentage * donutCircumference) / 100;
                    const strokeDasharray = `${(item.percentage * donutCircumference) / 100} ${donutCircumference}`;
                    accumulatedPercentage += item.percentage;

                    if (item.count === 0) return null;

                    return (
                      <circle
                        key={item.device}
                        cx="60"
                        cy="60"
                        r={donutRadius}
                        fill="transparent"
                        className={`${deviceColors[item.device] || "stroke-gray-400"} transition-all duration-300`}
                        strokeWidth="12"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        transform="rotate(-90 60 60)"
                      />
                    );
                  })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs font-semibold text-gray-400">Total Views</span>
                  <span className="text-lg font-bold text-gray-800">
                    {deviceDistribution.reduce((acc, curr) => acc + curr.count, 0)}
                  </span>
                </div>
              </div>

              {/* Legends */}
              <div className="flex-1 space-y-2">
                {deviceDistribution.map((item) => (
                  <div key={item.device} className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${deviceBgColors[item.device]}`} />
                      <span>{item.device}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{item.count} ({item.percentage}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Completion Funnel */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">Completion Funnel</h3>
        <div className="flex flex-col gap-4">
          {completionFunnel.map((stage, idx) => {
            const widthPercent = idx === 0 ? 100 : idx === 1 ? 80 : 60;
            return (
              <div key={stage.stage} className="flex flex-col items-center">
                <div
                  className="flex items-center justify-between px-5 py-3.5 text-white font-medium rounded-xl shadow-sm transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    width: `${widthPercent}%`,
                    backgroundColor: idx === 0 ? "#0f6b52" : idx === 1 ? "#0c5943" : "#084131",
                  }}
                >
                  <span>{stage.stage}</span>
                  <span className="font-bold">{stage.count}</span>
                </div>

                {/* Conversion arrows */}
                {idx < completionFunnel.length - 1 && (
                  <div className="flex flex-col items-center my-1 text-xs text-gray-400 font-semibold uppercase tracking-wider">
                    <span>⬇️ {completionFunnel[idx + 1].percentage}% Conversion</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Response Trend (Bar Chart) */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Response Trend</h3>
          <div className="flex rounded-md bg-gray-100 p-0.5">
            {(["daily", "weekly", "monthly"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setTrendTab(tab)}
                className={`rounded px-2.5 py-1 text-xs font-semibold uppercase tracking-wide transition-colors ${
                  trendTab === tab ? "bg-white text-gray-800 shadow-sm" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="relative h-[200px] pt-4">
          {/* Gridlines */}
          <div className="pointer-events-none absolute inset-y-0 left-6 right-2 flex flex-col-reverse justify-between pb-6">
            {[0, 0.5, 1].map((ratio) => {
              const val = Math.round(ratio * maxTrendVal);
              return (
                <div key={ratio} className="flex items-center gap-2">
                  <span className="w-5 -translate-x-6 text-right text-[10px] text-gray-400 font-medium">{val}</span>
                  <div className="h-px flex-1 bg-gray-100" />
                </div>
              );
            })}
          </div>

          {/* Bars */}
          <div className="relative flex h-full items-end gap-2 pb-6 pl-6 pr-2">
            {activeTrend.map((pt, i) => {
              const heightPct = (pt.count / maxTrendVal) * 100;
              return (
                <div key={pt.label + i} className="flex h-full flex-1 flex-col items-center justify-end gap-1 group">
                  <span className="text-[10px] font-bold text-[#0f6b52] opacity-0 group-hover:opacity-100 transition-opacity">
                    {pt.count}
                  </span>
                  <div className="relative w-full max-w-[40px] flex-1 flex items-end">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPct}%` }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="w-full rounded-t bg-[#0f6b52] opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                    />
                  </div>
                  <span className="text-[10px] text-gray-500 font-semibold truncate max-w-full mt-1.5" title={pt.label}>
                    {(activeTrend.length <= 6 || i % Math.ceil(activeTrend.length / 5) === 0 || i === activeTrend.length - 1) ? pt.label : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
