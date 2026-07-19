"use client";

import { useEffect, useState } from "react";
import { animate } from "framer-motion";

interface BigPictureCardsProps {
  views: number;
  starts: number;
  submissions: number;
  completionRate: number;
  averageCompletionTime: number;
}

function AnimatedNumber({ value, isPercent = false }: { value: number; isPercent?: boolean }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 0.35,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [value]);

  const formatted = isPercent ? `${Math.round(display)}%` : Math.round(display).toLocaleString();
  return <>{formatted}</>;
}

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds <= 0) return "00:00";
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function BigPictureCards({
  views,
  starts,
  submissions,
  completionRate,
  averageCompletionTime,
}: BigPictureCardsProps) {
  const cards = [
    {
      label: "Views",
      value: views,
      description: "Opened the form",
      tooltip: "The number of users who landed on the form URL.",
    },
    {
      label: "Starts",
      value: starts,
      description: "Started answering",
      tooltip: "The number of users who answered at least one question.",
    },
    {
      label: "Submissions",
      value: submissions,
      description: "Completed form",
      tooltip: "The number of completed form responses received.",
    },
    {
      label: "Completion Rate",
      value: completionRate,
      isPercent: true,
      description: "Submissions / Starts",
      tooltip: "The percentage of users who started the form and submitted it.",
    },
    {
      label: "Time to Complete",
      display: formatTime(averageCompletionTime),
      description: "Average duration",
      tooltip: "The average time taken by users to complete the form.",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      {cards.map((card, idx) => (
        <div
          key={card.label}
          className="relative flex flex-col justify-between rounded-xl bg-white p-5 border border-gray-100 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
        >
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <span>{card.label}</span>
              {card.tooltip && (
                <span
                  title={card.tooltip}
                  className="cursor-help text-gray-300 hover:text-gray-400"
                >
                  ℹ️
                </span>
              )}
            </div>
            <div className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">
              {card.display !== undefined ? (
                card.display
              ) : (
                <AnimatedNumber value={card.value ?? 0} isPercent={card.isPercent} />
              )}
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">{card.description}</div>
        </div>
      ))}
    </div>
  );
}
