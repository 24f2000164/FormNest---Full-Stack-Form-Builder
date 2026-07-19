"use client";

export default function EmbedSection({ onComingSoon }: { onComingSoon: () => void }) {
  return (
    <div className="mx-auto mt-8 w-full max-w-2xl">
      <h2 className="mb-3 text-sm font-semibold text-gray-900">Embed form</h2>
      <div className="grid grid-cols-2 gap-4">
        <EmbedCard
          label="On your website"
          gradientClass="from-fuchsia-300 to-purple-400"
          onClick={onComingSoon}
        />
        <EmbedCard
          label="In your email"
          gradientClass="from-sky-300 to-blue-400"
          onClick={onComingSoon}
        />
      </div>
    </div>
  );
}

function EmbedCard({
  label,
  gradientClass,
  onClick,
}: {
  label: string;
  gradientClass: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 overflow-hidden rounded-lg border bg-white text-left hover:border-gray-400"
    >
      <div className={`h-16 w-24 shrink-0 bg-gradient-to-br ${gradientClass}`} />
      <span className="text-sm font-medium text-gray-900">{label}</span>
    </button>
  );
}
