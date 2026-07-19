"use client";

import { useState, useEffect } from "react";

type CustomVar = {
  name: string;
  type: "Number" | "Text";
  value: string;
};

export default function VariablesModal({
  isOpen,
  onClose,
  formSettings,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  formSettings: any;
  onSave: (variables: any) => void;
}) {
  const [activeTab, setActiveTab] = useState<"default" | "quiz" | "enrichment">("default");
  
  // States for default variables
  const [score, setScore] = useState("0");
  const [price, setPrice] = useState("0");
  const [segment, setSegment] = useState("");

  // State for custom variables
  const [customVars, setCustomVars] = useState<CustomVar[]>([]);

  // Load from existing settings on mount
  useEffect(() => {
    if (formSettings?.variables) {
      const vars = formSettings.variables;
      setScore(vars.score ?? "0");
      setPrice(vars.price ?? "0");
      setSegment(vars.segment ?? "");
      setCustomVars(vars.custom_variables ?? []);
    }
  }, [formSettings, isOpen]);

  const handleAddCustomVar = () => {
    setCustomVars((prev) => [
      ...prev,
      { name: `variable_${prev.length + 1}`, type: "Number", value: "0" },
    ]);
  };

  const handleUpdateCustomVar = (idx: number, patch: Partial<CustomVar>) => {
    setCustomVars((prev) =>
      prev.map((v, i) => (i === idx ? { ...v, ...patch } : v))
    );
  };

  const handleRemoveCustomVar = (idx: number) => {
    setCustomVars((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    onSave({
      score,
      price,
      segment,
      custom_variables: customVars,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-55 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[850px] bg-[#fafafb] rounded-3xl shadow-2xl text-[#26212e] relative max-h-[85vh] overflow-hidden flex flex-col border border-gray-250"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 bg-white border-b border-gray-150 shrink-0">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-gray-900">Variables</h2>
              <p className="text-xs text-gray-450 leading-relaxed font-semibold max-w-2xl">
                Variables let you track, calculate, and update information like scores, prices, or other data. Use them to customize forms by showing updated information as people respond.
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-lg transition-colors p-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex min-h-0 bg-[#fafafb]">
          {/* Left Navigation Sidebar */}
          <div className="w-64 border-r border-gray-205 bg-white p-4 shrink-0 space-y-1 flex flex-col">
            <button
              onClick={() => setActiveTab("default")}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "default"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
            >
              Default & custom variables
            </button>

            <button
              onClick={() => setActiveTab("quiz")}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                activeTab === "quiz"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
            >
              <span>Quiz variables</span>
              <span className="text-[10px] text-teal-650 font-bold" title="Premium Feature">💎</span>
            </button>

            <button
              onClick={() => setActiveTab("enrichment")}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                activeTab === "enrichment"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
            >
              <span className="truncate">Data enrichment variabl...</span>
              <span className="text-[10px] text-teal-650 font-bold" title="Premium Feature">💎</span>
            </button>
          </div>

          {/* Right Panel Content */}
          <div className="flex-1 overflow-y-auto p-6 text-left">
            {activeTab === "default" && (
              <div className="space-y-6">
                
                {/* Custom Variables Section */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-900">Custom variables</h3>
                  
                  {customVars.length === 0 ? (
                    <div className="py-2">
                      <p className="text-xs text-gray-400 font-semibold italic">No custom variables created yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {customVars.map((v, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-150 shadow-xs">
                          {/* Var Name Input */}
                          <input
                            type="text"
                            value={v.name}
                            onChange={(e) => handleUpdateCustomVar(idx, { name: e.target.value })}
                            placeholder="var_name"
                            className="flex-1 min-w-0 border border-gray-200 rounded-lg px-2 py-1 text-xs outline-none focus:border-gray-400 font-semibold"
                          />
                          
                          {/* Var Type Select */}
                          <select
                            value={v.type}
                            onChange={(e) => handleUpdateCustomVar(idx, { type: e.target.value as any })}
                            className="border border-gray-200 rounded-lg px-2 py-1 text-xs outline-none focus:border-gray-400 font-semibold bg-white"
                          >
                            <option value="Number">Number</option>
                            <option value="Text">Text</option>
                          </select>

                          {/* Var Starting Value Input */}
                          <input
                            type="text"
                            value={v.value}
                            onChange={(e) => handleUpdateCustomVar(idx, { value: e.target.value })}
                            placeholder="Starting value"
                            className="w-24 border border-gray-200 rounded-lg px-2 py-1 text-xs outline-none focus:border-gray-400 font-semibold"
                          />

                          {/* Remove Var Button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomVar(idx)}
                            className="text-gray-400 hover:text-red-500 p-1 text-xs font-bold transition-colors"
                          >
                            🗑
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleAddCustomVar}
                    className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 mt-1 outline-none select-none"
                  >
                    <span>+</span> Add custom variable
                  </button>
                </div>

                {/* Default Variables Section */}
                <div className="space-y-4 border-t border-gray-200 pt-5">
                  <h3 className="text-sm font-bold text-gray-900">Default variables</h3>
                  
                  {/* Score variable row */}
                  <div className="bg-white p-3 rounded-xl border border-gray-150 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 bg-gray-100 rounded flex items-center justify-center text-[10px] select-none">🧮</span>
                        <span className="text-xs font-bold text-gray-800">score</span>
                        <span className="text-[10px] text-gray-450 font-semibold">=</span>
                        <span className="text-[10px] bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded text-gray-500 font-bold">Number</span>
                      </div>
                      <input
                        type="number"
                        value={score}
                        onChange={(e) => setScore(e.target.value)}
                        placeholder="Enter the starting value"
                        className="w-48 border border-gray-250 rounded-lg px-2.5 py-1 text-xs outline-none focus:border-gray-400 font-semibold text-right"
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">
                      For lead scores, quiz results, or anything else you want to score
                    </p>
                  </div>

                  {/* Price variable row */}
                  <div className="bg-white p-3 rounded-xl border border-gray-150 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 bg-gray-100 rounded flex items-center justify-center text-[10px] select-none">💵</span>
                        <span className="text-xs font-bold text-gray-800">price</span>
                        <span className="text-[10px] text-gray-450 font-semibold">=</span>
                        <span className="text-[10px] bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded text-gray-500 font-bold">Number</span>
                      </div>
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="Enter the starting value"
                        className="w-48 border border-gray-250 rounded-lg px-2.5 py-1 text-xs outline-none focus:border-gray-400 font-semibold text-right"
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">
                      Requires a Payment question
                    </p>
                  </div>

                  {/* Segment variable row */}
                  <div className="bg-white p-3 rounded-xl border border-gray-150 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 bg-gray-100 rounded flex items-center justify-center text-[10px] select-none">🏷</span>
                        <span className="text-xs font-bold text-gray-800">segment</span>
                        <span className="text-[10px] text-gray-455 font-semibold">=</span>
                        <span className="text-[10px] bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded text-gray-500 font-bold">Text</span>
                      </div>
                      <input
                        type="text"
                        value={segment}
                        onChange={(e) => setSegment(e.target.value)}
                        placeholder="Enter the starting value"
                        className="w-48 border border-gray-250 rounded-lg px-2.5 py-1 text-xs outline-none focus:border-gray-400 font-semibold text-right"
                      />
                    </div>
                  </div>
                </div>

              </div>
            )}

            {activeTab === "quiz" && (
              <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 max-w-sm mx-auto h-full min-h-[300px]">
                <div className="text-5xl select-none">🚪🔑</div>
                <h4 className="text-sm font-bold text-gray-900">Knowledge quiz variables 💎</h4>
                <p className="text-xs text-gray-400 leading-relaxed font-semibold">
                  Easily create quizzes with correct and incorrect answers. Engage customers and leads with real-time feedback.
                </p>
                <button
                  type="button"
                  onClick={() => alert("Quiz features are part of the Enterprise subscription plans.")}
                  className="px-5 py-2.5 bg-teal-700 hover:bg-[#00524d] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  Upgrade plan
                </button>
                <span className="text-[10px] text-teal-600 font-bold">This feature is available on paid plans.</span>
              </div>
            )}

            {activeTab === "enrichment" && (
              <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 max-w-sm mx-auto h-full min-h-[300px]">
                <div className="text-5xl select-none">📊✨</div>
                <h4 className="text-sm font-bold text-[#26212e]">Enrich your form responses and contacts</h4>
                <p className="text-xs text-gray-450 leading-relaxed font-semibold">
                  Ask for less contact information and collect deeper insights with automated B2B and B2C data enrichment.
                </p>
                <button
                  type="button"
                  onClick={() => alert("Enrichment features are part of the Enterprise subscription plans.")}
                  className="px-5 py-2.5 bg-teal-700 hover:bg-[#00524d] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  Upgrade plan
                </button>
                <span className="text-[9px] text-gray-400 font-semibold leading-relaxed">
                  Available on these plans: Plus, Business, Growth Flow, Growth Custom
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-white border-t border-gray-150 shrink-0 flex items-center justify-end gap-3.5">
          <button
            onClick={onClose}
            className="px-4 py-2 hover:bg-gray-100 text-gray-500 rounded-xl text-xs font-bold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2.5 bg-[#26212e] hover:bg-black text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
