import { ChartPlaceholderIcon, StatsPlaceholderIcon, TextPlaceholderIcon } from "../icons";

type Variant = "text" | "chart" | "stats";

const ICONS: Record<Variant, React.ComponentType<{ className?: string }>> = {
  text: TextPlaceholderIcon,
  chart: ChartPlaceholderIcon,
  stats: StatsPlaceholderIcon,
};

export default function SummaryPlaceholder({ label, variant = "text" }: { label: string; variant?: Variant }) {
  const Icon = ICONS[variant];

  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 text-gray-300">
      <Icon className="h-6 w-6" />
      <p className="text-sm font-medium text-gray-400">{label}</p>
    </div>
  );
}
