import { useState } from "react";

interface ChoiceEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: string[];
  onUpdate: (options: string[]) => void;
  questionType: string;
}

export default function ChoiceEditorModal({ isOpen, onClose, options, onUpdate, questionType }: ChoiceEditorModalProps) {
  const [localOptions, setLocalOptions] = useState<string[]>(options);
  const [error, setError] = useState<string | null>(null);

  const validateOptions = (opts: string[]): string | null => {
    if (questionType === "dropdown" && opts.length < 2) {
      return "Please add at least 2 options";
    }
    return null;
  };

  const handleAddOption = () => {
    setLocalOptions([...localOptions, `Option ${localOptions.length + 1}`]);
  };

  const handleUpdateOption = (index: number, value: string) => {
    const newOptions = [...localOptions];
    newOptions[index] = value;
    setLocalOptions(newOptions);
  };

  const handleRemoveOption = (index: number) => {
    if (localOptions.length <= 2 && questionType === "dropdown") {
      setError("Must have at least 2 options");
      return;
    }
    const newOptions = [...localOptions];
    newOptions.splice(index, 1);
    setLocalOptions(newOptions);
  };

  const handleSave = () => {
    const validationError = validateOptions(localOptions);
    if (validationError) {
      setError(validationError);
      return;
    }
    onUpdate(localOptions);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 pt-24">
      <div className="w-96 rounded-xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="border-b p-3">
          <h2 className="text-lg font-semibold">Edit options</h2>
        </div>

        <div className="max-h-96 overflow-y-auto p-4">
          {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
          <div className="space-y-3">
            {localOptions.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  value={option}
                  onChange={(e) => handleUpdateOption(index, e.target.value)}
                  className="flex-1 border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={() => handleRemoveOption(index)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
            <div className="pt-2 border-t">
              <button
                onClick={handleAddOption}
                className="w-full text-sm text-blue-500 underline hover:text-blue-700"
              >
                + Add option
              </button>
            </div>
          </div>
        </div>

        <div className="border-t pt-3 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
            disabled={!!error}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}