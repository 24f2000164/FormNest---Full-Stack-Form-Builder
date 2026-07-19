import { ChoiceOptionStat } from "./choiceAggregation";

// "Grid" view: a plain table of Option / Count / Percentage.
export default function ChoiceTable({ options }: { options: ChoiceOptionStat[] }) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
          <th className="py-2 font-medium">Option</th>
          <th className="py-2 pl-4 text-right font-medium">Count</th>
          <th className="py-2 pl-4 text-right font-medium">Percentage</th>
        </tr>
      </thead>
      <tbody>
        {options.map((opt, i) => (
          <tr key={opt.label + i} className="border-b border-gray-50 last:border-0">
            <td className="py-2.5 pr-4 text-gray-800">{opt.label}</td>
            <td className="py-2.5 pl-4 text-right text-gray-600">{opt.count}</td>
            <td className="py-2.5 pl-4 text-right text-gray-600">{opt.percentage}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
