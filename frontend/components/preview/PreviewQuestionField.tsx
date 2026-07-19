"use client";

import { useMemo, useState } from "react";
import { RatingIcon } from "@/components/builder/ratingIcons";

type Question = {
  id: number;
  type: string;
  title: string;
  description: string | null;
  required: boolean;
  options: string[] | null;
  settings: Record<string, any> | null;
};

const NONE_VALUE = "None of the above";

// Builder's own static placeholder copy (see QuestionCanvas.tsx) - kept in
// sync so Preview reads exactly like the Builder canvas for every type that
// doesn't expose a custom-placeholder toggle.
function textPlaceholder(question: Question) {
  const settings = question.settings || {};
  if (settings.customPlaceholderEnabled && (settings.placeholder || "").trim() !== "") {
    return settings.placeholder;
  }
  switch (question.type) {
    case "phone":
      return "+1 (xxx) xxx-xxxx";
    case "number":
      return "Enter a number";
    case "long_text":
      return "Long text answer...";
    case "email":
      return "name@example.com";
    default:
      return "Type your answer here";
  }
}

// Answers live only in local component state (see the Preview page) - none
// of this ever calls the API. Validation runs in the Preview page (see
// lib/validation.ts) and is surfaced here purely as styling - this
// component never blocks input, it just reflects whether the current value
// failed validation.
export default function PreviewQuestionField({
  question,
  value,
  onChange,
  error,
}: {
  question: Question;
  value: any;
  onChange: (value: any) => void;
  error?: string | null;
}) {
  const settings = question.settings || {};
  const inputClass = `w-full border-0 border-b-2 bg-transparent px-0 py-2 text-lg text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-0 ${
    error ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-gray-900"
  }`;
  const choiceErrorRing = error ? "ring-1 ring-red-400" : "";

  switch (question.type) {
    case "long_text":
      return (
        <textarea
          rows={3}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={textPlaceholder(question)}
          className={inputClass}
        />
      );

    case "email":
      return (
        <input
          type="email"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={textPlaceholder(question)}
          className={inputClass}
        />
      );

    case "number":
      return (
        <input
          type="number"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={textPlaceholder(question)}
          className={inputClass}
        />
      );

    case "phone":
      return (
        <div className="flex items-end gap-2">
          {/* Purely decorative - the Builder has no country setting to read from */}
          <div className="flex shrink-0 items-center gap-1 border-b-2 border-gray-300 pb-2 text-gray-400">
            <span className="text-lg leading-none">🌐</span>
            <span className="text-xs">▾</span>
          </div>
          <input
            type="tel"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={textPlaceholder(question)}
            className={inputClass}
          />
        </div>
      );

    case "multiple_choice": {
      const allowMultiple = !!settings.allowMultiple;
      const includeOther = !!settings.includeOther;
      const includeNone = !!settings.includeNone;
      const layout = settings.layout || "horizontal";
      const selectionMode = settings.selectionMode ?? "unlimited";
      const exactCount = settings.exactSelectionCount ?? 1;
      const minSelection = settings.minSelection ?? 1;
      const baseOptions = question.options || [];
      const maxSelection = settings.maxSelection ?? baseOptions.length;

      const displayOptions = [
        ...baseOptions,
        ...(includeOther ? ["Other"] : []),
        ...(includeNone ? [NONE_VALUE] : []),
      ];

      const helperText =
        allowMultiple && selectionMode === "exact"
          ? `Select exactly ${exactCount}`
          : allowMultiple && selectionMode === "range"
          ? `Select between ${minSelection} and ${maxSelection}`
          : allowMultiple
          ? "Choose as many as you like"
          : null;

      // Single-select
      if (!allowMultiple) {
        const selected = typeof value === "string" ? value : "";
        return (
          <div className={choiceErrorRing ? `rounded-lg p-1 ${choiceErrorRing}` : ""}>
            <div className={layout === "vertical" ? "space-y-2" : "flex flex-wrap gap-2"}>
              {displayOptions.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onChange(opt)}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                    layout === "vertical" ? "w-full" : ""
                  } ${
                    selected === opt
                      ? "border-gray-900 bg-white ring-1 ring-gray-900"
                      : "border-transparent bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded border bg-white text-xs font-medium text-gray-600">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="text-gray-800">{opt}</span>
                </button>
              ))}
            </div>
          </div>
        );
      }

      // Multi-select
      const selectedArr: string[] = Array.isArray(value) ? value : [];
      const isNoneSelected = includeNone && selectedArr.includes(NONE_VALUE);

      function toggle(opt: string, isNone: boolean) {
        let next = [...selectedArr];
        if (isNone) {
          next = isNoneSelected ? next.filter((v) => v !== NONE_VALUE) : [NONE_VALUE];
          onChange(next);
          return;
        }
        if (next.includes(opt)) {
          next = next.filter((v) => v !== opt);
        } else {
          if (isNoneSelected) next = next.filter((v) => v !== NONE_VALUE);
          const capAt = selectionMode === "exact" ? exactCount : selectionMode === "range" ? maxSelection : undefined;
          if (capAt !== undefined && next.length >= capAt) return;
          next = [...next, opt];
        }
        onChange(next);
      }

      return (
        <div className={choiceErrorRing ? `rounded-lg p-1 ${choiceErrorRing}` : ""}>
          {helperText && <p className="mb-2 text-xs text-gray-500">{helperText}</p>}
          <div className={layout === "vertical" ? "space-y-2" : "flex flex-wrap gap-2"}>
            {displayOptions.map((opt, i) => {
              const isNone = includeNone && opt === NONE_VALUE;
              const checked = isNone ? isNoneSelected : selectedArr.includes(opt);
              const disabled = !isNone && isNoneSelected;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  onClick={() => toggle(opt, isNone)}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                    layout === "vertical" ? "w-full" : ""
                  } ${disabled ? "cursor-not-allowed opacity-40" : ""} ${
                    checked
                      ? "border-gray-900 bg-white ring-1 ring-gray-900"
                      : "border-transparent bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded border bg-white text-xs font-medium text-gray-600">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="text-gray-800">{opt}</span>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    case "dropdown": {
      const hasCustomPlaceholder =
        !!settings.customPlaceholderEnabled && (settings.placeholder || "").trim() !== "";
      const placeholderText = hasCustomPlaceholder ? settings.placeholder : "Type or select an option";
      const baseOptions = question.options || [];

      // eslint-disable-next-line react-hooks/rules-of-hooks
      const orderedOptions = useMemo(() => {
        const opts = [...baseOptions];
        if (settings.alphabeticalOrder) {
          opts.sort((a, b) => a.localeCompare(b));
        } else if (settings.randomizeChoices) {
          for (let i = opts.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [opts[i], opts[j]] = [opts[j], opts[i]];
          }
        }
        return opts;
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [question.id]);

      return (
        <select
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} cursor-pointer`}
        >
          <option value="" disabled hidden>
            {placeholderText}
          </option>
          {orderedOptions.map((opt, i) => (
            <option key={i} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }

    case "yes_no": {
      const selected = value === "Yes" || value === "No" ? value : null;
      return (
        <div className={`flex gap-3 ${choiceErrorRing ? `rounded-lg p-1 ${choiceErrorRing}` : ""}`}>
          {["Yes", "No"].map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={`flex flex-1 items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                selected === opt
                  ? "border-gray-900 bg-white ring-1 ring-gray-900"
                  : "border-transparent bg-gray-100 hover:bg-gray-200"
              }`}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded border bg-white text-xs font-medium text-gray-600">
                {opt[0]}
              </span>
              <span className="text-gray-800">{opt}</span>
            </button>
          ))}
        </div>
      );
    }

    case "rating": {
      const count = settings.rating_count ?? settings.max_rating ?? 5;
      const shape = settings.rating_shape ?? "star";
      const current = typeof value === "number" ? value : 0;
      return (
        <div className={`flex flex-wrap gap-3 ${choiceErrorRing ? `rounded-lg p-1 ${choiceErrorRing}` : ""}`}>
          {Array.from({ length: count }, (_, i) => i + 1).map((n) => {
            const active = current >= n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => onChange(n)}
                className="flex flex-col items-center gap-1.5"
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
                    active ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 text-gray-400 hover:bg-gray-100"
                  }`}
                >
                  <RatingIcon shape={shape} className="h-5 w-5" filled={active} />
                </span>
                <span className="text-xs text-gray-400">{n}</span>
              </button>
            );
          })}
        </div>
      );
    }

    case "contact_info": {
      const fields = settings.fields || {};
      const isFirstNameVisible = fields.firstName?.visible ?? true;
      const isLastNameVisible = fields.lastName?.visible ?? true;
      const isPhoneVisible = fields.phone?.visible ?? true;
      const isEmailVisible = fields.email?.visible ?? false;
      const isCompanyVisible = fields.company?.visible ?? false;

      const isFirstNameRequired = fields.firstName?.required ?? false;
      const isLastNameRequired = fields.lastName?.required ?? false;
      const isPhoneRequired = fields.phone?.required ?? false;
      const isEmailRequired = fields.email?.required ?? false;
      const isCompanyRequired = fields.company?.required ?? false;
      
      const defaultCountry = settings.defaultCountry ?? "India";
      const flagMap: Record<string, string> = {
        "India": "🇮🇳",
        "United States": "🇺🇸",
        "United Kingdom": "🇬🇧",
        "Canada": "🇨🇦",
        "Australia": "🇦🇺"
      };
      const selectedFlag = flagMap[defaultCountry] || "🌐";

      const currentVal = value && typeof value === "object" ? value : {};

      const handleFieldChange = (fieldKey: string, fieldVal: string) => {
        onChange({
          ...currentVal,
          [fieldKey]: fieldVal
        });
      };

      return (
        <div className="space-y-4 max-w-md text-left">
          {isFirstNameVisible && (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-500">
                First name
                {isFirstNameRequired && <span className="ml-1 text-red-500 font-bold">*</span>}
              </label>
              <input
                type="text"
                value={currentVal.firstName ?? ""}
                onChange={(e) => handleFieldChange("firstName", e.target.value)}
                placeholder="Jane"
                className={inputClass}
              />
            </div>
          )}

          {isLastNameVisible && (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-500">
                Last name
                {isLastNameRequired && <span className="ml-1 text-red-500 font-bold">*</span>}
              </label>
              <input
                type="text"
                value={currentVal.lastName ?? ""}
                onChange={(e) => handleFieldChange("lastName", e.target.value)}
                placeholder="Smith"
                className={inputClass}
              />
            </div>
          )}

          {isPhoneVisible && (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-500">
                Phone number
                {isPhoneRequired && <span className="ml-1 text-red-500 font-bold">*</span>}
              </label>
              <div className="flex items-end gap-2">
                <div className="flex shrink-0 items-center gap-1 border-b-2 border-gray-300 pb-2 text-gray-400">
                  <span className="text-lg leading-none">{selectedFlag}</span>
                  <span className="text-xs">▾</span>
                </div>
                <input
                  type="tel"
                  value={currentVal.phone ?? ""}
                  onChange={(e) => handleFieldChange("phone", e.target.value)}
                  placeholder="081234 56789"
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {isEmailVisible && (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-500">
                Email
                {isEmailRequired && <span className="ml-1 text-red-500 font-bold">*</span>}
              </label>
              <input
                type="email"
                value={currentVal.email ?? ""}
                onChange={(e) => handleFieldChange("email", e.target.value)}
                placeholder="jane.smith@example.com"
                className={inputClass}
              />
            </div>
          )}

          {isCompanyVisible && (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-500">
                Company
                {isCompanyRequired && <span className="ml-1 text-red-500 font-bold">*</span>}
              </label>
              <input
                type="text"
                value={currentVal.company ?? ""}
                onChange={(e) => handleFieldChange("company", e.target.value)}
                placeholder="Example Inc."
                className={inputClass}
              />
            </div>
          )}
        </div>
      );
    }

    case "short_text":
    default:
      return (
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={textPlaceholder(question)}
          className={inputClass}
        />
      );
  }
}
