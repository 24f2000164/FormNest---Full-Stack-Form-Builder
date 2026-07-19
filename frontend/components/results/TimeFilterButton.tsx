"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { CalendarIcon } from "./icons";

type DateRangeType = "All time" | "Today" | "Last week" | "Last month" | "Last year" | "custom";

export type DateFilterValue = {
  type: DateRangeType;
  start?: Date;
  end?: Date;
};

interface TimeFilterButtonProps {
  onChange?: (val: DateFilterValue) => void;
}

export default function TimeFilterButton({ onChange }: TimeFilterButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Applied selection
  const [appliedFilter, setAppliedFilter] = useState<DateFilterValue>({ type: "All time" });

  // Temporary selection inside the dropdown
  const [tempType, setTempType] = useState<DateRangeType>("All time");
  const [tempStart, setTempStart] = useState<Date | undefined>(undefined);
  const [tempEnd, setTempEnd] = useState<Date | undefined>(undefined);

  // Month navigation in calendar panel
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date());

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync temp state with applied filter when opening
  const handleToggle = () => {
    if (!isOpen) {
      setTempType(appliedFilter.type);
      setTempStart(appliedFilter.start);
      setTempEnd(appliedFilter.end);
      if (appliedFilter.start) {
        setCurrentMonth(new Date(appliedFilter.start));
      } else {
        setCurrentMonth(new Date());
      }
    }
    setIsOpen(!isOpen);
  };

  const handlePresetSelect = (type: DateRangeType) => {
    setTempType(type);
    if (type === "All time") {
      setTempStart(undefined);
      setTempEnd(undefined);
    } else {
      const now = new Date();
      let start = new Date();
      if (type === "Today") {
        start.setHours(0, 0, 0, 0);
      } else if (type === "Last week") {
        start.setDate(now.getDate() - 7);
      } else if (type === "Last month") {
        start.setDate(now.getDate() - 30);
      } else if (type === "Last year") {
        start.setDate(now.getDate() - 365);
      }
      setTempStart(start);
      setTempEnd(now);
      setCurrentMonth(start);
    }
  };

  const handleDateClick = (date: Date) => {
    setTempType("custom");
    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(date);
      setTempEnd(undefined);
    } else if (tempStart && !tempEnd) {
      if (date < tempStart) {
        setTempStart(date);
      } else {
        setTempEnd(date);
      }
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  const handleApply = () => {
    const finalFilter: DateFilterValue = {
      type: tempType,
      start: tempStart,
      end: tempEnd,
    };
    setAppliedFilter(finalFilter);
    setIsOpen(false);
    if (onChange) {
      onChange(finalFilter);
    }
  };

  // Calendar cells generation
  const calendarCells = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevTotalDays = new Date(year, month, 0).getDate();

    const cells = [];
    
    // Prev month overflow
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevTotalDays - i;
      cells.push({
        day: d,
        isCurrentMonth: false,
        date: new Date(year, month - 1, d),
      });
    }

    // Current month
    for (let i = 1; i <= totalDays; i++) {
      cells.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(year, month, i),
      });
    }

    // Next month overflow
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      cells.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(year, month + 1, i),
      });
    }

    return cells;
  }, [currentMonth]);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const buttonLabel = useMemo(() => {
    if (appliedFilter.type !== "custom") {
      return appliedFilter.type;
    }
    if (appliedFilter.start) {
      const startStr = appliedFilter.start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      if (appliedFilter.end) {
        const endStr = appliedFilter.end.toLocaleDateString(undefined, { month: "short", day: "numeric" });
        return `${startStr} - ${endStr}`;
      }
      return startStr;
    }
    return "Custom range";
  }, [appliedFilter]);

  // Helper to check if a day is today
  const isTodayDate = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Helper to check if a date is selected or in range
  const getDateState = (date: Date) => {
    if (!tempStart) return "none";
    
    const dTime = new Date(date).setHours(0,0,0,0);
    const startTime = new Date(tempStart).setHours(0,0,0,0);
    
    if (tempEnd) {
      const endTime = new Date(tempEnd).setHours(0,0,0,0);
      if (dTime === startTime) return "start";
      if (dTime === endTime) return "end";
      if (dTime > startTime && dTime < endTime) return "in-range";
    } else {
      if (dTime === startTime) return "selected";
    }
    return "none";
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleToggle}
        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-gray-50 focus:outline-none"
      >
        <CalendarIcon className="h-4 w-4 text-gray-500" />
        <span>{buttonLabel}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-2 w-[520px] rounded-xl border border-gray-200 bg-white p-4 shadow-xl flex flex-col gap-4">
          <div className="flex gap-4 min-h-[290px]">
            {/* Presets Sidebar */}
            <div className="w-[140px] flex flex-col gap-1 pr-3 border-r border-gray-100 shrink-0">
              {(["All time", "Today", "Last week", "Last month", "Last year"] as DateRangeType[]).map((type) => {
                const isSelected = tempType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handlePresetSelect(type)}
                    className={`w-full px-3 py-2 text-left rounded-lg text-sm font-medium transition-colors ${
                      isSelected
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 flex flex-col select-none">
              {/* Header */}
              <div className="flex items-center justify-between mb-4 px-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-gray-100 text-gray-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-sm font-bold text-gray-700">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-gray-100 text-gray-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Weekday labels */}
              <div className="grid grid-cols-7 gap-y-1 text-center text-[11px] font-bold text-gray-400 mb-2">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
                {calendarCells.map((cell, idx) => {
                  const state = getDateState(cell.date);
                  const isToday = isTodayDate(cell.date);

                  let btnStyle = "text-gray-800 hover:bg-gray-100 rounded-md";
                  if (!cell.isCurrentMonth) {
                    btnStyle = "text-gray-300 hover:bg-gray-50 rounded-md";
                  }

                  if (state === "selected" || state === "start" || state === "end") {
                    btnStyle = "bg-[#222222] text-white font-bold rounded-md";
                  } else if (state === "in-range") {
                    btnStyle = "bg-gray-100 text-gray-900 rounded-none";
                  }

                  const todayStyle = isToday && state === "none" ? "font-bold text-[#222222] ring-1 ring-gray-900 rounded-md" : "";

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleDateClick(cell.date)}
                      className={`h-8 w-full flex items-center justify-center transition-all ${btnStyle} ${todayStyle}`}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-4 py-2 text-sm font-bold text-white bg-[#222222] hover:bg-zinc-800 rounded-lg transition-colors shadow-sm"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
