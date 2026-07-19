"use client";

import { RATING_SHAPES, RatingIcon } from "./ratingIcons";

type ShapePickerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  currentShape: string;
  onShapeChange: (shape: string) => void;
};

export default function ShapePickerModal({
  isOpen,
  onClose,
  currentShape,
  onShapeChange,
}: ShapePickerModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Click-away layer (invisible, closes the popover) */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Popover anchored under the trigger via the relative wrapper */}
      <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-gray-200 bg-white p-3 shadow-xl">
        <div className="grid grid-cols-5 gap-2">
          {RATING_SHAPES.map((shape) => (
            <button
              key={shape.id}
              type="button"
              onClick={() => {
                onShapeChange(shape.id);
                onClose();
              }}
              title={shape.label}
              className={`flex h-12 w-12 items-center justify-center rounded-lg border transition-colors ${
                currentShape === shape.id
                  ? "border-gray-900"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <RatingIcon shape={shape.id} className="h-5 w-5 text-gray-700" />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
