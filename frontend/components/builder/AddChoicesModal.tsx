"use client";

import { useEffect, useState } from "react";

interface AddChoicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: string[];
  onSave: (options: string[]) => void;
}

export default function AddChoicesModal({ isOpen, onClose, options, onSave }: AddChoicesModalProps) {
  const [text, setText] = useState("");

  // Re-seed the textarea with the current choices whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setText(options.join("\n"));
    }
  }, [isOpen, options]);

  if (!isOpen) return null;

  const parsedOptions = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  function handleSave() {
    onSave(parsedOptions);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 pb-3">
          <h2 className="text-lg font-semibold text-gray-900">Add choices</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="px-5 pb-2">
          <p className="mb-3 text-sm text-gray-600">
            Write or paste your choices below. Each choice must be on a separate line.
          </p>
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"Your choices go here\nOne per line\nLike this\n:-)"}
            className="h-40 w-full resize-none rounded-lg border border-gray-300 bg-gray-50 p-3 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
          />
        </div>

        <div className="flex items-center justify-end gap-4 px-5 py-4">
          <button
            onClick={onClose}
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Save choices
          </button>
        </div>
      </div>
    </div>
  );
}
