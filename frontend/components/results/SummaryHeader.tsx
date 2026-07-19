"use client";

import DesignButton from "./DesignButton";

export default function SummaryHeader() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-[28px] font-semibold leading-tight text-gray-900">Summary</h1>
        <DesignButton />
      </div>
      <div className="mt-6 border-b border-gray-200" />
    </div>
  );
}
