"use client";

// Slim progress indicator across the very top of the viewport, matching
// Typeform: hidden/full on welcome & ending screens, and filling
// proportionally to how many questions have been completed while answering.
export default function PreviewProgressBar({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="h-1 w-full bg-gray-200">
      <div
        className="h-full bg-gray-900 transition-all duration-500 ease-out"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
