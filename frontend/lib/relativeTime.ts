// Formats an ISO timestamp as a short relative string ("2 minutes ago",
// "16 seconds ago"), matching the style Typeform uses on response cards.
//
// The backend stores timestamps with datetime.utcnow() and Pydantic
// serializes naive datetimes without a timezone suffix (no trailing "Z").
// JS's Date parser treats a timezone-less ISO string as *local* time, which
// would silently skew every relative time by the viewer's UTC offset. We
// append "Z" when it's missing so the string is always parsed as UTC.
export function formatRelativeTime(isoString: string): string {
  const hasTimezone = /[zZ]|[+-]\d\d:?\d\d$/.test(isoString);
  const date = new Date(hasTimezone ? isoString : `${isoString}Z`);
  if (Number.isNaN(date.getTime())) return "";

  const diffSeconds = Math.round((Date.now() - date.getTime()) / 1000);

  if (diffSeconds < 5) return "just now";
  if (diffSeconds < 60) return `${diffSeconds} second${diffSeconds === 1 ? "" : "s"} ago`;

  const diffMinutes = Math.round(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

  const diffMonths = Math.round(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} month${diffMonths === 1 ? "" : "s"} ago`;

  const diffYears = Math.round(diffMonths / 12);
  return `${diffYears} year${diffYears === 1 ? "" : "s"} ago`;
}
