export default function StatusBadge({ completed }: { completed: boolean }) {
  if (completed) {
    return (
      <span className="inline-flex items-center rounded-full border border-[#b7e4cf] bg-[#e8f8f1] px-2.5 py-0.5 text-[13px] font-medium text-[#0f7a52]">
        Completed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-gray-300 bg-gray-50 px-2.5 py-0.5 text-[13px] font-medium text-gray-500">
      Partial
    </span>
  );
}
