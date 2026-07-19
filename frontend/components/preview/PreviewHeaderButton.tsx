"use client";

type PreviewHeaderButtonProps = {
  icon: string; // path under /public
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
};

// Visually mirrors ToolbarIconButton (same hover + tooltip treatment) so the
// Preview window's header feels consistent with the Builder's toolbar, but
// lives on its own so Builder components stay untouched.
export default function PreviewHeaderButton({
  icon,
  label,
  onClick,
  disabled = false,
  active = false,
}: PreviewHeaderButtonProps) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-pressed={active}
      aria-label={label}
      className={`group relative flex h-9 w-9 items-center justify-center rounded-lg border border-transparent transition-colors duration-150 ${
        disabled
          ? "cursor-not-allowed opacity-40"
          : active
          ? "border-gray-300 bg-gray-100"
          : "hover:border-gray-300 hover:bg-gray-100"
      }`}
    >
      <img src={icon} alt="" className="h-4 w-4 opacity-70 group-hover:opacity-100" />
      <span className="pointer-events-none absolute top-full left-1/2 z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
        {label}
      </span>
    </button>
  );
}
