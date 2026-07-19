// Small inline SVG icons used only within the Responses table, matching
// the style of components/results/icons.tsx and components/share/icons.tsx
// rather than pulling in an icon package.

export function InboxIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M3 10.5L5 4h10l2 6.5M3 10.5V15a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-4.5M3 10.5h4.2a.5.5 0 0 1 .47.33l.4 1.1a.5.5 0 0 0 .47.33h2.92a.5.5 0 0 0 .47-.33l.4-1.1a.5.5 0 0 1 .47-.33H17"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function WarningIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M10 3.2l7.5 13a1 1 0 0 1-.87 1.5H3.37a1 1 0 0 1-.87-1.5l7.5-13a1 1 0 0 1 1.74 0z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M10 8.2v3.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="10" cy="14.2" r="0.15" fill="currentColor" stroke="currentColor" strokeWidth="0.9" />
    </svg>
  );
}

export function DownloadIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M10 3v9.5M10 12.5l3.2-3.2M10 12.5l-3.2-3.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.5 14v1.5a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ColumnsIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="3" y="3.5" width="14" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M7.7 3.5v13M12.3 3.5v13" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export function SlidersIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M4 6h7M14 6h2M4 14h2M9 14h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="10" cy="6" r="1.6" fill="white" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="6" cy="14" r="1.6" fill="white" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export function CheckIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M4 10.5l3.8 3.8L16 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function GripDotsIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <circle cx="7" cy="5" r="1.1" />
      <circle cx="7" cy="10" r="1.1" />
      <circle cx="7" cy="15" r="1.1" />
      <circle cx="13" cy="5" r="1.1" />
      <circle cx="13" cy="10" r="1.1" />
      <circle cx="13" cy="15" r="1.1" />
    </svg>
  );
}

export function PlusIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
