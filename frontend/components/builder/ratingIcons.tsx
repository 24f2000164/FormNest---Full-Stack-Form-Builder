"use client";

export const RATING_SHAPES: { id: string; label: string }[] = [
  { id: "star", label: "Star" },
  { id: "heart", label: "Heart" },
  { id: "smile", label: "Smile" },
  { id: "thumb", label: "Thumb" },
  { id: "crown", label: "Crown" },
  { id: "cat", label: "Cat" },
  { id: "dog", label: "Dog" },
  { id: "circle", label: "Circle" },
  { id: "flag", label: "Flag" },
  { id: "drop", label: "Drop" },
  { id: "check", label: "Check" },
  { id: "light-bulb", label: "Light bulb" },
  { id: "trophy", label: "Trophy" },
  { id: "cloud", label: "Cloud" },
  { id: "lightning", label: "Lightning" },
  { id: "pencil", label: "Pencil" },
  { id: "skull", label: "Skull" },
];

type RatingIconProps = {
  shape: string;
  className?: string;
  filled?: boolean;
};

export function RatingIcon({ shape, className = "h-5 w-5", filled = false }: RatingIconProps) {
  const common = {
    viewBox: "0 0 24 24",
    fill: filled ? "currentColor" : "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  };

  switch (shape) {
    case "star":
      return (
        <svg {...common}>
          <polygon points="12 3 14.6 9.2 21.3 9.8 16.2 14.1 17.8 20.7 12 17.1 6.2 20.7 7.8 14.1 2.7 9.8 9.4 9.2" />
        </svg>
      );
    case "heart":
      return (
        <svg {...common}>
          <path d="M12 20.3s-7.6-4.7-10-9C.5 8.2 1.7 4.6 5.2 4c2-.4 3.9.4 4.9 2 .9-1.6 2.8-2.4 4.9-2 3.4.6 4.7 4.2 3.1 7.3-2.4 4.3-6.1 9-6.1 9z" />
        </svg>
      );
    case "smile":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="9" cy="10" r="1" fill="currentColor" stroke="none" />
          <circle cx="15" cy="10" r="1" fill="currentColor" stroke="none" />
          <path d="M8 14c1 1.3 2.4 2 4 2s3-.7 4-2" />
        </svg>
      );
    case "thumb":
      return (
        <svg {...common}>
          <path d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3z" />
          <path d="M7 11l4.2-8a1 1 0 0 1 1.6-.3c1 .8 1.4 2.2 1 3.4l-.8 2.4H18a2 2 0 0 1 2 2.4l-1.2 6.6a2 2 0 0 1-2 1.5H10a3 3 0 0 1-3-3v-5z" />
        </svg>
      );
    case "crown":
      return (
        <svg {...common}>
          <path d="M3 8.5l4 3.5 5-7 5 7 4-3.5-1.6 9.5H4.6z" />
          <path d="M5 20h14" />
        </svg>
      );
    case "cat":
      return (
        <svg {...common}>
          <path d="M6 9l1.5-4L10 8" />
          <path d="M18 9l-1.5-4L14 8" />
          <circle cx="12" cy="13.5" r="6.5" />
          <circle cx="9.5" cy="12.5" r="0.6" fill="currentColor" stroke="none" />
          <circle cx="14.5" cy="12.5" r="0.6" fill="currentColor" stroke="none" />
          <path d="M12 14.5v1M9 17l2-1.2M15 17l-2-1.2" />
        </svg>
      );
    case "dog":
      return (
        <svg {...common}>
          <ellipse cx="7" cy="9" rx="2" ry="3.2" transform="rotate(-25 7 9)" />
          <ellipse cx="17" cy="9" rx="2" ry="3.2" transform="rotate(25 17 9)" />
          <circle cx="12" cy="13.5" r="6" />
          <circle cx="9.7" cy="13" r="0.6" fill="currentColor" stroke="none" />
          <circle cx="14.3" cy="13" r="0.6" fill="currentColor" stroke="none" />
          <path d="M12 14.5v1.2" />
          <path d="M12 15.7c-.8 1-2 1-2.6.3M12 15.7c.8 1 2 1 2.6.3" />
        </svg>
      );
    case "circle":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
    case "flag":
      return (
        <svg {...common}>
          <path d="M6 3v18" />
          <path d="M6 4h13l-3 4.5L19 13H6z" />
        </svg>
      );
    case "drop":
      return (
        <svg {...common}>
          <path d="M12 2.5S5.5 11 5.5 15.2a6.5 6.5 0 0 0 13 0C18.5 11 12 2.5 12 2.5z" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12.2l2.6 2.6L16.5 9" />
        </svg>
      );
    case "light-bulb":
      return (
        <svg {...common}>
          <path d="M9.5 17.5h5" />
          <path d="M10.3 20.5h3.4" />
          <path d="M12 3a6 6 0 0 0-3.3 11c.6.4 1 1.1 1 1.9v.6h4.6v-.6c0-.8.4-1.5 1-1.9A6 6 0 0 0 12 3z" />
        </svg>
      );
    case "trophy":
      return (
        <svg {...common}>
          <path d="M7 4h10v3.5a5 5 0 0 1-10 0V4z" />
          <path d="M7 5H4.5A2.5 2.5 0 0 0 7 8.5M17 5h2.5A2.5 2.5 0 0 1 17 8.5" />
          <path d="M12 12.5v3" />
          <path d="M9 20h6" />
          <path d="M9.8 15.5h4.4l.4 1.7a1.8 1.8 0 0 1-1.8 2.3h-1.6a1.8 1.8 0 0 1-1.8-2.3z" />
        </svg>
      );
    case "cloud":
      return (
        <svg {...common}>
          <path d="M7 18a4 4 0 0 1-.9-7.9 5.2 5.2 0 0 1 9.9-2A4.4 4.4 0 0 1 17.5 18H7z" />
        </svg>
      );
    case "lightning":
      return (
        <svg {...common}>
          <polygon points="13 2 4 14 11 14 10 22 20 9 13 9" />
        </svg>
      );
    case "pencil":
      return (
        <svg {...common}>
          <path d="M4 20l.7-3.6L15.4 5.7l2.9 2.9L7.6 19.3z" />
          <path d="M13.8 7.3l2.9 2.9" />
          <path d="M4.7 16.4l2.9 2.9" />
        </svg>
      );
    case "skull":
      return (
        <svg {...common}>
          <circle cx="12" cy="11" r="7" />
          <ellipse cx="9.3" cy="11" rx="1.2" ry="1.7" fill="currentColor" stroke="none" />
          <ellipse cx="14.7" cy="11" rx="1.2" ry="1.7" fill="currentColor" stroke="none" />
          <path d="M11 13.2l-.8 1.6h1.6z" />
          <path d="M9 16v2M11 16v2.6M13 16v2.6M15 16v2" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
}
