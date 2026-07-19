"use client";

import { useState, useEffect } from "react";
import AddChoicesModal from "./AddChoicesModal";
import ToggleSwitch from "./ToggleSwitch";
import PropertyPickerModal from "./PropertyPickerModal";
import { RatingIcon } from "./ratingIcons";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function QuestionCanvas({
  question,
  index,
  onUpdate,
}: {
  question: any;
  index: number;
  onUpdate: (updated: any) => void;
}) {
  const [title, setTitle] = useState(question.title || "");
  const [description, setDescription] = useState(question.description || "");
  const [options, setOptions] = useState<string[]>(question.options || []);
  const [showChoiceEditor, setShowChoiceEditor] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Email-specific states
  const [validationEnabled, setValidationEnabled] = useState<boolean>(question.settings?.validationEnabled || false);
  const [validationRegex, setValidationRegex] = useState<string>(question.settings?.validationRegex || "");
  const [customPlaceholderEnabled, setCustomPlaceholderEnabled] = useState<boolean>(question.settings?.customPlaceholderEnabled || false);
  const [placeholder, setPlaceholder] = useState<string>(question.settings?.placeholder || "name@example.com");
  const [mapToContactsEnabled, setMapToContactsEnabled] = useState<boolean>(question.settings?.mapToContactsEnabled || false);
  const [mappedPropertyId, setMappedPropertyId] = useState<string | null>(question.settings?.mappedPropertyId || null);
  const [mappedPropertyName, setMappedPropertyName] = useState<string | null>(question.settings?.mappedPropertyName || null);
  const [regexError, setRegexError] = useState<string | null>(null);
  const [showPropertyPicker, setShowPropertyPicker] = useState(false);

  useEffect(() => {
    setTitle(question.title || "");
    setDescription(question.description || "");
    setOptions(question.options || []);
    setValidationEnabled(question.settings?.validationEnabled || false);
    setValidationRegex(question.settings?.validationRegex || "");
    setCustomPlaceholderEnabled(question.settings?.customPlaceholderEnabled || false);
    setPlaceholder(question.settings?.placeholder || "");
    setMapToContactsEnabled(question.settings?.mapToContactsEnabled || false);
    setMappedPropertyId(question.settings?.mappedPropertyId || null);
    setMappedPropertyName(question.settings?.mappedPropertyName || null);
  }, [question]);

  // Persist a partial settings update for the Email question, merged with existing settings
  function saveEmailSettings(patch: Record<string, any>) {
    saveField({ settings: { ...(question.settings || {}), ...patch } });
  }

  function handleValidationToggle(checked: boolean) {
    setValidationEnabled(checked);
    saveEmailSettings({ validationEnabled: checked });
  }

  function handleRegexChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setValidationRegex(val);
    if (val.trim() === "") {
      setRegexError(null);
      return;
    }
    try {
      new RegExp(val);
      setRegexError(null);
    } catch {
      setRegexError("Invalid regular expression");
    }
  }

  function handleRegexBlur() {
    // Don't persist an invalid regex; keep the last valid saved value on the backend
    if (regexError) return;
    saveEmailSettings({ validationRegex });
  }

  function handlePlaceholderToggle(checked: boolean) {
    setCustomPlaceholderEnabled(checked);
    saveEmailSettings({ customPlaceholderEnabled: checked });
  }

  function handlePlaceholderBlur() {
    saveEmailSettings({ placeholder });
  }

  function handleMapToggle(checked: boolean) {
    setMapToContactsEnabled(checked);
    saveEmailSettings({ mapToContactsEnabled: checked });
    if (checked && !mappedPropertyId) {
      setShowPropertyPicker(true);
    }
  }

  function handlePropertyChange(id: string | null, name: string | null) {
    setMappedPropertyId(id);
    setMappedPropertyName(name);
    saveEmailSettings({ mappedPropertyId: id, mappedPropertyName: name });
  }

  async function saveField(fields: any) {
    // Clear any existing error
    setError(null);

    // Validate dropdown options if present — validate against the options being
    // saved in *this* call (fields.options), falling back to current state only
    // when options aren't part of this particular update.
    if (question.type === "dropdown") {
      const optionsBeingSaved = fields.options ?? options;
      const validationError = validateDropdown(optionsBeingSaved);
      if (validationError) {
        setError(validationError);
        return;
      }
    }
    const res = await fetch(
      `${API_BASE}/forms/${question.form_id}/questions/${question.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      }
    );
    const updated = await res.json();
    onUpdate(updated);
  }

  function addOption() {
    const next = [...options, `Option ${options.length + 1}`];
    setOptions(next);
    saveField({ options: next });
  }

  function updateOption(i: number, value: string) {
    const next = [...options];
    next[i] = value;
    setOptions(next);
    saveField({ options: next });
  }

  function updateOptions(newOptions: string[]) {
    setOptions(newOptions);
    saveField({ options: newOptions });
  }

  function validateDropdown(candidateOptions: string[] = options): string | null {
    if (question.type !== "dropdown") return null;
    if (candidateOptions.length < 2) {
      return "Please add at least 2 choices";
    }
    return null;
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-2 flex items-start gap-2">
        <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-gray-900 text-xs text-white">
          {index + 1}
        </span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => saveField({ title })}
          placeholder="Your question here. Recall information with @"
          className="flex-1 bg-transparent text-2xl italic text-gray-700 outline-none placeholder:italic placeholder:text-gray-400"
        />
        {question.required && (
          <span className="text-red-500 font-extrabold text-xl leading-none select-none mt-1" title="Required field">
            *
          </span>
        )}
      </div>

      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={() => saveField({ description })}
        placeholder="Description (optional)"
        className="mb-6 ml-8 w-full bg-transparent italic text-gray-400 outline-none"
      />

      <div className="ml-8">
        {/* Text based inputs: short_text, long_text, number, email, phone, date */}
        {["short_text", "long_text", "number", "email", "phone", "date"].includes(
          question.type
        ) && (
          <input
            disabled
            placeholder={
              customPlaceholderEnabled && placeholder.trim() !== ""
                ? placeholder
                : question.type === "phone"
                ? "+1 (xxx) xxx-xxxx"
                : question.type === "date"
                ? "yyyy-mm-dd"
                : question.type === "number"
                ? "Enter a number"
                : question.type === "email"
                ? "name@example.com"
                : question.type === "long_text"
                ? "Long text answer..."
                : "Type your answer here"
            }
            className="w-full border-b border-gray-300 bg-transparent pb-2 text-lg text-gray-400 outline-none"
          />
        )}



        {/* Multiple choice */}
        {question.type === "multiple_choice" && (() => {
          const settings = question.settings || {};
          const includeOther = !!settings.includeOther;
          const includeNone = !!settings.includeNone;
          const layout = settings.layout || "horizontal"; // horizontal or vertical

          const displayOptions = [
            ...options,
            ...(includeOther ? ["Other"] : []),
            ...(includeNone ? ["None of the above"] : [])
          ];

          return (
            <>
              <div className={layout === "vertical" ? "space-y-2" : "flex flex-wrap gap-2"}>
                {displayOptions.map((option, optIndex) => (
                  <div
                    key={optIndex}
                    className="flex items-center gap-3 rounded-lg bg-gray-100 px-3 py-3"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded border bg-white text-xs font-medium">
                      {String.fromCharCode(65 + optIndex)}
                    </span>
                    {optIndex < options.length ? (
                      // Regular option: editable input
                      <input
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...options];
                          newOptions[optIndex] = e.target.value;
                          setOptions(newOptions);
                          saveField({ options: newOptions });
                        }}
                        className="flex-1 bg-transparent outline-none"
                      />
                    ) : (
                      // Special option: static text
                      <span className="text-sm text-gray-500">{option}</span>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={addOption}
                className="mt-2 text-sm text-gray-500 underline hover:text-gray-700"
              >
                + Add choice
              </button>
            </>
          );
        })()}

        {/* Dropdown */}
        {question.type === "dropdown" && (() => {
          const dropdownSettings = question.settings || {};
          const hasCustomPlaceholder =
            !!dropdownSettings.customPlaceholderEnabled &&
            (dropdownSettings.placeholder || "").trim() !== "";
          const placeholderText = hasCustomPlaceholder
            ? dropdownSettings.placeholder
            : "Type or select an option";

          return (
            <>
              <div
                role="button"
                tabIndex={0}
                onClick={() => setShowChoiceEditor(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setShowChoiceEditor(true);
                }}
                className="flex w-full cursor-pointer items-center justify-between border-b border-gray-300 bg-transparent pb-2 text-lg text-gray-400 outline-none hover:border-gray-400"
              >
                <span className="truncate">{placeholderText}</span>
                <span className="ml-2 shrink-0 text-gray-400">⌄</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <button
                  onClick={() => setShowChoiceEditor(true)}
                  className="text-sm text-gray-500 underline hover:text-gray-700"
                >
                  Add choices
                </button>
                <span className="text-sm text-gray-400">
                  {options.length} option{options.length === 1 ? "" : "s"} in list
                </span>
              </div>
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </>
          );
        })()}

        {/* Yes/No */}
        {question.type === "yes_no" && (
          <div className="space-y-2">
            {["Yes", "No"].map((label) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-lg bg-gray-100 px-3 py-3"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded border bg-white text-xs font-medium">
                  {label[0]}
                </span>
                {label}
              </div>
            ))}
          </div>
        )}

        {/* Rating */}
        {question.type === "rating" && (() => {
          const count = question.settings?.rating_count ?? question.settings?.max_rating ?? 5;
          const shape = question.settings?.rating_shape ?? "star";
          return (
            <div className="flex gap-4">
              {Array.from({ length: count }, (_, i) => i + 1).map((n) => (
                <div key={n} className="flex flex-col items-center gap-1.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-gray-400">
                    <RatingIcon shape={shape} className="h-5 w-5" />
                  </div>
                  <span className="text-xs text-gray-400">{n}</span>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Opinion scale (0-10) */}
        {question.type === "opinion_scale" && (
          <div className="flex items-center gap-4">
            <span className="w-20">0 (Not at all)</span>
            <input
              type="range"
              min={0}
              max={10}
              value={5}
              onChange={(e) => {
                // In a real implementation, we would store the selected value in state and save it.
                // For now, we just update the question's settings or a temporary value.
                // We'll skip saving for brevity.
              }}
              className="flex-1"
            />
            <span className="w-20">10 (Extremely)</span>
          </div>
        )}

        {/* Statement */}
        {question.type === "statement" && (
          <textarea
            value={description} // Reuse description state for simplicity
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => saveField({ description })}
            placeholder="Enter your statement here..."
            className="w-64 h-32 border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        )}

        {/* Contact Info */}
        {question.type === "contact_info" && (() => {
          const fields = question.settings?.fields || {};
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

          const defaultCountry = question.settings?.defaultCountry ?? "India";
          const flagMap: Record<string, string> = {
            "India": "🇮🇳",
            "United States": "🇺🇸",
            "United Kingdom": "🇬🇧",
            "Canada": "🇨🇦",
            "Australia": "🇦🇺"
          };
          const selectedFlag = flagMap[defaultCountry] || "🌐";

          return (
            <div className="space-y-5 max-w-md text-left mt-2">
              {isFirstNameVisible && (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500">
                    First name
                    {isFirstNameRequired && <span className="ml-1 text-red-500 font-bold">*</span>}
                  </label>
                  <input
                    disabled
                    placeholder="Jane"
                    className="w-full border-b border-gray-300 bg-transparent pb-2 text-lg text-gray-400 outline-none"
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
                    disabled
                    placeholder="Smith"
                    className="w-full border-b border-gray-300 bg-transparent pb-2 text-lg text-gray-400 outline-none"
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
                    <div className="flex shrink-0 items-center gap-1 border-b border-gray-300 pb-2 text-gray-500">
                      <span className="text-lg leading-none">{selectedFlag}</span>
                      <span className="text-xs">▾</span>
                    </div>
                    <input
                      disabled
                      placeholder="081234 56789"
                      className="w-full border-b border-gray-300 bg-transparent pb-2 text-lg text-gray-400 outline-none"
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
                    disabled
                    placeholder="jane.smith@example.com"
                    className="w-full border-b border-gray-300 bg-transparent pb-2 text-lg text-gray-400 outline-none"
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
                    disabled
                    placeholder="Example Inc."
                    className="w-full border-b border-gray-300 bg-transparent pb-2 text-lg text-gray-400 outline-none"
                  />
                </div>
              )}
            </div>
          );
        })()}

        {/* Welcome Screen */}
        {question.type === "welcome_screen" && (
          <div className="space-y-4">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => saveField({ title })}
              placeholder="Welcome message"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => saveField({ description })}
              placeholder="Description (optional)"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              value="Start" // We could have a separate state for button text, but for simplicity use title or description
              onChange={(e) => {
                // We don't have a separate state for button text in this component.
                // In a real implementation, we would store this in the question's settings.
              }}
              placeholder="Button text"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        {/* Ending Screen */}
        {question.type === "ending_screen" && (
          <div className="flex flex-col items-center justify-center text-center space-y-4 py-4 w-full">
            {/* Ending Message Title Input */}
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => saveField({ title })}
              placeholder="Say bye! Recall information with @"
              className="w-full text-center bg-transparent border-none text-2xl font-medium text-gray-800 focus:outline-none focus:ring-0 placeholder:text-gray-300 italic"
            />

            {/* Ending Description Input */}
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => saveField({ description })}
              placeholder="Description (optional)"
              className="w-full text-center bg-transparent border-none text-sm text-gray-500 focus:outline-none focus:ring-0 placeholder:text-gray-300 italic"
            />

            {/* Social Share Icons */}
            {(question.settings?.socialShare ?? true) && (
              <div className="flex items-center justify-center gap-2 mt-2 select-none">
                {/* Facebook Icon */}
                <a href="#" onClick={(e) => e.preventDefault()} className="h-6 w-6 rounded bg-[#1877f2] flex items-center justify-center text-white text-[11px] font-black shadow-xs hover:opacity-90">
                  f
                </a>
                {/* X Icon */}
                <a href="#" onClick={(e) => e.preventDefault()} className="h-6 w-6 rounded bg-black flex items-center justify-center text-white text-[10px] font-bold shadow-xs hover:opacity-90">
                  𝕏
                </a>
                {/* LinkedIn Icon */}
                <a href="#" onClick={(e) => e.preventDefault()} className="h-6 w-6 rounded bg-[#0a66c2] flex items-center justify-center text-white text-[10px] font-black shadow-xs hover:opacity-90">
                  in
                </a>
              </div>
            )}

            {/* Submit/Ending Button */}
            {(question.settings?.buttonEnabled ?? true) && (
              <button
                type="button"
                className="mt-4 px-6 py-2.5 bg-[#26212e] text-white rounded-lg text-xs font-bold shadow-md hover:bg-black/90 active:scale-95 transition-all select-none"
              >
                {question.settings?.buttonText || "Create a typeform"}
              </button>
            )}
          </div>
        )}
      </div>
      <AddChoicesModal
        isOpen={showChoiceEditor}
        onClose={() => setShowChoiceEditor(false)}
        options={options}
        onSave={updateOptions}
      />
    </div>
  );
}

