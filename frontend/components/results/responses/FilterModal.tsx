"use client";

import { CloseIcon, ChevronDownIcon } from "@/components/share/icons";
import { GripDotsIcon, PlusIcon } from "./icons";

export default function FilterModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 pt-24" onClick={onClose}>
      <div
        className="w-[560px] max-w-[92vw] rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2 text-gray-800">
            <GripDotsIcon className="h-4 w-4 text-gray-300" />
            <h2 className="text-base font-semibold">Filter responses</h2>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600" aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div className="p-5">
          <div className="rounded-xl bg-gray-50 p-5">
            <button className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-left text-sm text-gray-500 hover:border-gray-300">
              Filter by question or data
              <ChevronDownIcon className="h-4 w-4 text-gray-400" />
            </button>

            <button className="mt-4 flex items-center gap-1.5 text-sm font-medium text-gray-400 cursor-not-allowed" disabled>
              <PlusIcon className="h-4 w-4" />
              Add filter
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-5 py-4">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={onClose} className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
