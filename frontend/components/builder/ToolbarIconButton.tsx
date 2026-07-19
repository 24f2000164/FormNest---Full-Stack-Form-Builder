"use client";

type ToolbarIconButtonProps = {
  icon: string; // path under /public
  label: string;
  onClick?: () => void;
  active?: boolean;
};

export default function ToolbarIconButton({ icon, label, onClick, active = false }: ToolbarIconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`group relative flex h-8 w-8 items-center justify-center rounded-lg border border-transparent transition-colors duration-150 hover:border-gray-300 hover:bg-gray-100 ${
        active ? "border-gray-300 bg-gray-100" : ""
      }`}
    >
      <img src={icon} alt="" className="h-4 w-4 opacity-70 group-hover:opacity-100" />
      <span
        className="pointer-events-none absolute top-full left-1/2 z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100"
      >
        {label}
      </span>
    </button>
  );
}
