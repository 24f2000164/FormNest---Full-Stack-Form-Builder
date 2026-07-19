"use client";

import PreviewQuestionField from "./PreviewQuestionField";

type Question = {
  id: number;
  type: string;
  title: string;
  description: string | null;
  required: boolean;
  options: string[] | null;
  settings: Record<string, any> | null;
};

export default function PreviewQuestionScreen({
  question,
  badgeNumber,
  value,
  onChange,
  onSubmit,
  error,
  isLastQuestion = false,
  hideActionButtons = false,
}: {
  question: Question;
  badgeNumber: number | null;
  value: any;
  onChange: (value: any) => void;
  onSubmit: () => void;
  error?: string | null;
  isLastQuestion?: boolean;
  hideActionButtons?: boolean;
}) {
  const imageUrl = question.settings?.imageUrl as string | undefined;

  return (
    <div>
      {badgeNumber !== null && (
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-400">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-gray-900 text-xs font-medium text-white">
            {badgeNumber}
          </span>
          <span>...</span>
        </div>
      )}

      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          className="mb-4 max-h-56 w-full rounded-lg border object-cover"
        />
      )}

      <h2 className="text-xl font-medium text-gray-900 sm:text-2xl">
        {question.title || "Untitled question"}
        {question.required && <span className="ml-1 text-red-500">*</span>}
      </h2>
      {question.description && <p className="mt-2 text-gray-500">{question.description}</p>}

      <div className="mt-6">
        <PreviewQuestionField question={question} value={value} onChange={onChange} error={error} />
      </div>

      {/* Inline, Typeform-style error - never a browser alert() */}
      {error && (
        <div className="mt-3 flex items-center gap-1.5 text-sm font-medium text-red-600" role="alert">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.63-1.516 2.63H3.72c-1.347 0-2.189-1.463-1.515-2.63L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 8a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {!hideActionButtons && (
        <div className="mt-6 flex items-center gap-3">
          {isLastQuestion ? (
            // Last answerable question in the form - swap OK for a Submit
            // pill, matching Typeform's fully-rounded, bold, uppercase style.
            <button
              onClick={onSubmit}
              className="transform-gpu rounded-lg bg-[#222222] px-6 py-2.5 font-bold text-white transition-transform duration-150 ease-out hover:scale-105 hover:bg-gray-800 active:scale-95"
            >
              Submit
            </button>
          ) : (
            <button
              onClick={onSubmit}
              className="transform-gpu rounded-lg bg-gray-900 px-6 py-2.5 font-medium text-white transition-transform duration-150 ease-out hover:scale-110 hover:bg-gray-800 active:scale-95"
            >
              OK
            </button>
          )}
          <span className="text-xs text-gray-400">press Enter ↵</span>
        </div>
      )}
    </div>
  );
}
