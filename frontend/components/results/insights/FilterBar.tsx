"use client";

import { useState } from "react";

export type FilterState = {
  dateRange: string;
  device: string;
  startDate?: string;
  endDate?: string;
};

interface FilterBarProps {
  filters: FilterState;
  onChange: (newFilters: FilterState) => void;
}

export default function FilterBar({ filters, onChange }: FilterBarProps) {
  const [showCustomDates, setShowCustomDates] = useState(filters.dateRange === "custom");

  const handleDateChange = (val: string) => {
    if (val === "custom") {
      setShowCustomDates(true);
      onChange({ ...filters, dateRange: val });
    } else {
      setShowCustomDates(false);
      onChange({ ...filters, dateRange: val, startDate: undefined, endDate: undefined });
    }
  };

  const handleDeviceChange = (val: string) => {
    onChange({ ...filters, device: val });
  };

  const handleCustomDateChange = (type: "start" | "end", dateStr: string) => {
    if (type === "start") {
      onChange({ ...filters, startDate: dateStr });
    } else {
      onChange({ ...filters, endDate: dateStr });
    }
  };

  const isFilterActive = filters.dateRange !== "all_time" || filters.device !== "all";

  const clearAll = () => {
    setShowCustomDates(false);
    onChange({ dateRange: "all_time", device: "all" });
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <div className="flex flex-wrap items-center gap-3">
        {/* Date Filter */}
        <div className="flex flex-col gap-1">
          <label htmlFor="date-filter" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Date Range</label>
          <select
            id="date-filter"
            value={filters.dateRange}
            onChange={(e) => handleDateChange(e.target.value)}
            className="h-9 rounded-md border border-gray-200 bg-gray-50 px-3 text-sm font-medium text-gray-700 outline-none transition-colors hover:border-gray-300 focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
          >
            <option value="all_time">All Time</option>
            <option value="last_7_days">Last 7 Days</option>
            <option value="last_30_days">Last 30 Days</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {/* Device Filter */}
        <div className="flex flex-col gap-1">
          <label htmlFor="device-filter" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Device</label>
          <select
            id="device-filter"
            value={filters.device}
            onChange={(e) => handleDeviceChange(e.target.value)}
            className="h-9 rounded-md border border-gray-200 bg-gray-50 px-3 text-sm font-medium text-gray-700 outline-none transition-colors hover:border-gray-300 focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
          >
            <option value="all">All Devices</option>
            <option value="desktop">Desktop</option>
            <option value="mobile">Mobile</option>
            <option value="tablet">Tablet</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Custom Date Picker Inputs */}
        {showCustomDates && (
          <div className="flex items-center gap-2 mt-4 sm:mt-0 pt-2 sm:pt-4">
            <input
              type="date"
              aria-label="Start date"
              value={filters.startDate || ""}
              onChange={(e) => handleCustomDateChange("start", e.target.value)}
              className="h-9 rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 focus:border-gray-400 outline-none"
            />
            <span className="text-gray-400 text-sm">to</span>
            <input
              type="date"
              aria-label="End date"
              value={filters.endDate || ""}
              onChange={(e) => handleCustomDateChange("end", e.target.value)}
              className="h-9 rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 focus:border-gray-400 outline-none"
            />
          </div>
        )}
      </div>

      {isFilterActive && (
        <button
          onClick={clearAll}
          className="self-end sm:self-center text-sm font-medium text-red-600 hover:text-red-700 transition-colors focus:outline-none focus:underline"
        >
          Clear All
        </button>
      )}
    </div>
  );
}
