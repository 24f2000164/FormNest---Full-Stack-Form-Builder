// Small inline SVG icons used only within the Results module, matching the
// style of components/share/icons.tsx rather than pulling in an icon
// package.

export function BadgeIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M10 2.5l6 2.2v4.4c0 4-2.6 6.9-6 8.4-3.4-1.5-6-4.4-6-8.4V4.7l6-2.2z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M7.5 10l1.8 1.8L12.5 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Placeholder glyph for the ComingSoon component - a simple hourglass/clock
// motif kept intentionally plain and subtle.
export function ComingSoonIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// --- Summary toolbar icons -------------------------------------------------

export function CalendarIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 8h14M6.5 2.5v3M13.5 2.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function FilterIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M3 4.5h14M5.5 10h9M8.5 15.5h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function PaletteIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M10 3a7 7 0 1 0 0 14c.9 0 1.5-.7 1.5-1.5 0-.4-.15-.75-.4-1a1.4 1.4 0 0 1-.35-.95c0-.8.65-1.4 1.4-1.4h1.4A2.5 2.5 0 0 0 16.5 9.5C16.5 5.9 13.6 3 10 3z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="6.7" cy="8.7" r="0.9" fill="currentColor" />
      <circle cx="9.3" cy="6.2" r="0.9" fill="currentColor" />
      <circle cx="12.3" cy="7.2" r="0.9" fill="currentColor" />
    </svg>
  );
}

export function ListIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M4 5.5h12M4 10h8M4 14.5h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function ArrowUpIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M10 15.5V4.5M10 4.5l-4 4M10 4.5l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ArrowDownIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M10 4.5v11M10 15.5l-4-4M10 15.5l4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HashIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M7.5 3.5l-1.8 13M14.3 3.5l-1.8 13M3.8 8h13M3 12.5h13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function PercentIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M15 5L5 15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="6" cy="6" r="1.7" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="14" cy="14" r="1.7" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export function MoreIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <circle cx="4" cy="10" r="1.4" />
      <circle cx="10" cy="10" r="1.4" />
      <circle cx="16" cy="10" r="1.4" />
    </svg>
  );
}

export function ChartPlaceholderIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 20V10M10 20V4M16 20v-7M20.5 20H3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StatsPlaceholderIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3.5" y="5" width="6" height="14" rx="1.3" stroke="currentColor" strokeWidth="1.5" />
      <rect x="14.5" y="9" width="6" height="10" rx="1.3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function TextPlaceholderIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 6.5h16M4 12h11M4 17.5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// --- Text answer list icons -------------------------------------------------

export function SearchIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="8.5" cy="8.5" r="5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M16 16l-3.5-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function QuoteIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M9.5 6.2c-3 .6-5 3-5 6.1 0 2.8 1.9 5 4.5 5.4-.3 1.6-1.3 2.8-2.8 3.5l.7 1.6c3-1.1 5.1-3.7 5.1-7.4v-2.1c0-3.4-.9-5.9-2.5-7.1zm9.4 0c-3 .6-5 3-5 6.1 0 2.8 1.9 5 4.5 5.4-.3 1.6-1.3 2.8-2.8 3.5l.7 1.6c3-1.1 5.1-3.7 5.1-7.4v-2.1c0-3.4-.9-5.9-2.5-7.1z" />
    </svg>
  );
}

// --- Choice summary chart view-toggle icons --------------------------------

export function GridTableIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="3" y="3" width="14" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 8.3h14M3 12.7h14M8.3 3v14M12.7 3v14" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function RowsListIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="3" y="4" width="14" height="3" rx="1" fill="currentColor" opacity="0.9" />
      <rect x="3" y="8.5" width="10" height="3" rx="1" fill="currentColor" opacity="0.6" />
      <rect x="3" y="13" width="7" height="3" rx="1" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

export function ColumnChartIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M3 17V13M8 17V7M13 17V10M18 17V3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function TagIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M10.5 3.5H16a.5.5 0 0 1 .5.5v5.5a1 1 0 0 1-.29.7l-6.5 6.5a1 1 0 0 1-1.42 0l-5.29-5.29a1 1 0 0 1 0-1.42l6.5-6.5a1 1 0 0 1 .5-.29z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="13" cy="7" r="1.1" fill="currentColor" />
    </svg>
  );
}

// Small "?" info glyph shown next to statistic labels (Mean, Median, ...)
// on the Number/Rating Summary cards, matching Typeform's tooltip hint.
export function HelpIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M6.1 6.1c.2-1 1-1.6 1.9-1.6.9 0 1.8.6 1.8 1.6 0 .9-.6 1.2-1.2 1.6-.5.3-.6.6-.6 1.1"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="11.2" r="0.15" fill="currentColor" stroke="currentColor" strokeWidth="0.8" />
    </svg>
  );
}

export function RetryIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M16 10a6 6 0 1 1-1.76-4.24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 3.5V7h-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// A "resize / change density" handle: up-arrow, bar, down-arrow, echoing
// the drag affordance shown next to the results count on Typeform's
// Summary page. Used here as a click toggle between stacked and
// side-by-side layouts for the response list.
export function ResizeIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M10 2.8v3.2M10 2.8L8.3 4.5M10 2.8l1.7 1.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.5 10h13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M10 17.2V14M10 17.2l-1.7-1.7M10 17.2l1.7-1.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
