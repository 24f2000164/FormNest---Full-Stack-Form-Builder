"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type ElementItem = {
  label: string;
  type?: string;
  icon: string;
  isAi?: boolean;
  comingSoon?: boolean;
};

type Category = {
  title: string;
  items: ElementItem[];
};

const CATEGORIES: Category[] = [
  {
    title: "Contact info",
    items: [
      { label: "Contact Info", type: "contact_info", icon: "👤" },
      { label: "Email", type: "email", icon: "✉" },
      { label: "Phone Number", type: "phone", icon: "📞" },
      { label: "Address", icon: "📍", comingSoon: true },
      { label: "Website", icon: "🌐", comingSoon: true },
    ],
  },
  {
    title: "Choice",
    items: [
      { label: "Multiple Choice", type: "multiple_choice", icon: "●" },
      { label: "Dropdown", type: "dropdown", icon: "▼" },
      { label: "Picture Choice", icon: "🖼️", comingSoon: true },
      { label: "Yes/No", type: "yes_no", icon: "✓" },
      { label: "Legal", icon: "⚖", comingSoon: true },
      { label: "Checkbox", icon: "☑", comingSoon: true },
    ],
  },
  {
    title: "Rating & ranking",
    items: [
      { label: "Net Promoter Score®", icon: "📈", comingSoon: true },
      { label: "Opinion Scale", type: "opinion_scale", icon: "◯" },
      { label: "Rating", type: "rating", icon: "★" },
      { label: "Ranking", icon: "📊", comingSoon: true },
      { label: "Matrix", icon: "▦", comingSoon: true },
    ],
  },
  {
    title: "Text & Video",
    items: [
      { label: "Long Text", type: "long_text", icon: "T" },
      { label: "Short Text", type: "short_text", icon: "T" },
      { label: "Video and Audio", icon: "🎥", isAi: true, comingSoon: true },
      { label: "Clarify with AI", icon: "🪄", isAi: true, comingSoon: true },
      { label: "FAQ with AI", icon: "🤖", isAi: true, comingSoon: true },
    ],
  },
  {
    title: "Other",
    items: [
      { label: "Number", type: "number", icon: "#" },
      { label: "Date", type: "date", icon: "📅" },
      { label: "Signature", icon: "✍", comingSoon: true },
      { label: "Payment", icon: "💳", isAi: true, comingSoon: true },
      { label: "File Upload", icon: "📎", isAi: true, comingSoon: true },
      { label: "Scheduler", icon: "📆", comingSoon: true },
      { label: "Welcome Screen", type: "welcome_screen", icon: "👋" },
      { label: "Partial Submit Point", icon: "💾", isAi: true, comingSoon: true },
      { label: "Statement", type: "statement", icon: "‖" },
      { label: "Question Group", icon: "🗂️", comingSoon: true },
      { label: "End Screen", type: "ending_screen", icon: "🏁" },
      { label: "Redirect to URL", icon: "🔗", isAi: true, comingSoon: true },
    ],
  },
];

const RECOMMENDED: ElementItem[] = [
  { label: "Video and Audio", icon: "🎥", isAi: true, comingSoon: true },
  { label: "Short Text", type: "short_text", icon: "T" },
  { label: "Multiple Choice", type: "multiple_choice", icon: "●" },
];

const INTEGRATIONS = [
  { label: "Hubspot", icon: "🧡", color: "text-[#ff7a59] bg-[#ff7a59]/10" },
  { label: "Salesforce", icon: "☁️", color: "text-[#00a1e0] bg-[#00a1e0]/10", isAi: true },
];

export default function QuestionTypeModal({
  onSelect,
  onClose,
}: {
  onSelect: (type: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [comingSoonItem, setComingSoonItem] = useState<string | null>(null);

  const handleItemClick = (item: ElementItem) => {
    if (item.comingSoon) {
      setComingSoonItem(item.label);
    } else if (item.type) {
      onSelect(item.type);
    }
  };

  // Filter categories by search keyword
  const filteredCategories = CATEGORIES.map((cat) => {
    const matchingItems = cat.items.filter((item) =>
      item.label.toLowerCase().includes(search.toLowerCase())
    );
    return { ...cat, items: matchingItems };
  }).filter((cat) => cat.items.length > 0);

  const totalFilteredCount = filteredCategories.reduce((acc, cat) => acc + cat.items.length, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[860px] bg-white rounded-3xl shadow-2xl p-7 text-[#26212e] relative max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* COMING SOON POPUP WINDOW */}
        <AnimatePresence>
          {comingSoonItem && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 rounded-3xl flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 10 }}
                className="bg-white rounded-2xl p-6 max-w-xs w-full text-center shadow-2xl border border-gray-100 space-y-4"
              >
                <div className="text-3xl select-none">🚀</div>
                <h4 className="text-sm font-bold text-gray-900">{comingSoonItem}</h4>
                <p className="text-xs text-gray-400 leading-relaxed font-medium">
                  This question element is coming soon! We are rolling out AI smart fields and app integrations in our next workspace update.
                </p>
                <button
                  onClick={() => setComingSoonItem(null)}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shadow-blue-500/10"
                >
                  Got it
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Tabs */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 shrink-0">
          <div className="flex gap-6 text-xs font-bold">
            <button className="pb-3 border-b-2 border-gray-900 text-gray-900">Add form elements</button>
            <button
              onClick={() => setComingSoonItem("Import Questions")}
              className="pb-3 text-gray-400 hover:text-gray-600 transition-colors"
            >
              Import questions
            </button>
            <button
              onClick={() => setComingSoonItem("Create with AI")}
              className="pb-3 text-gray-400 hover:text-gray-600 transition-colors"
            >
              Create with AI
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-base outline-none p-1 transition-colors select-none"
          >
            ✕
          </button>
        </div>

        {/* Content Body Grid */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 mt-5 gap-6">
          
          {/* Left Column: Search & Recommended (1/3 Width) */}
          <div className="w-full md:w-5/12 flex flex-col gap-6 shrink-0">
            {/* Search Input */}
            <div className="relative flex items-center">
              <span className="absolute left-3 text-gray-400 select-none">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search form elements"
                className="w-full h-10 rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-3 text-xs outline-none focus:border-gray-400 focus:bg-white transition-all placeholder-gray-400 font-semibold"
              />
            </div>

            {/* Recommended Block */}
            <div className="space-y-2 text-left">
              <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recommended</h5>
              <div className="space-y-1">
                {RECOMMENDED.filter((item) =>
                  item.label.toLowerCase().includes(search.toLowerCase())
                ).map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleItemClick(item)}
                    className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-gray-50 border border-transparent hover:border-gray-150 transition-all text-xs font-semibold text-gray-700 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="h-6 w-6 rounded-lg bg-blue-50/50 flex items-center justify-center text-xs shrink-0 select-none">
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>
                    {item.isAi && (
                      <span className="text-[8px] bg-green-50 text-green-600 px-1 py-0.5 rounded font-bold uppercase tracking-wider scale-90">
                        ⚡ AI
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Connect To Apps Block */}
            <div className="space-y-2 text-left mt-auto">
              <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Connect to apps</h5>
              <div className="space-y-1">
                {INTEGRATIONS.map((app, idx) => (
                  <button
                    key={idx}
                    onClick={() => setComingSoonItem(app.label)}
                    className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-gray-50 border border-transparent hover:border-gray-150 transition-all text-xs font-semibold text-gray-700 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`h-6 w-6 rounded-lg flex items-center justify-center text-xs shrink-0 select-none ${app.color}`}>
                        {app.icon}
                      </span>
                      <span>{app.label}</span>
                    </div>
                    {app.isAi && (
                      <span className="text-[8px] bg-green-50 text-green-600 px-1 py-0.5 rounded font-bold uppercase tracking-wider scale-90">
                        ⚡ AI
                      </span>
                    )}
                  </button>
                ))}
                <button
                  onClick={() => setComingSoonItem("Browse all apps")}
                  className="w-full py-2 border border-dashed border-gray-250 hover:border-gray-350 text-center rounded-xl text-[10px] font-bold text-gray-400 hover:text-gray-600 transition-colors mt-1"
                >
                  Browse all apps
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Categorized Elements Grid (2/3 Width, Scrollable) */}
          <div className="flex-1 overflow-y-auto pr-1">
            {totalFilteredCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-gray-450 space-y-2">
                <span className="text-2xl">🔍</span>
                <p className="text-xs font-bold">No form elements found</p>
                <p className="text-[10px] text-gray-400">Try adjusting your search criteria</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 text-left">
                {filteredCategories.map((cat, idx) => (
                  <div key={idx} className="space-y-2">
                    <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{cat.title}</h5>
                    <div className="space-y-1.5">
                      {cat.items.map((item, itemIdx) => (
                        <button
                          key={itemIdx}
                          onClick={() => handleItemClick(item)}
                          className="w-full flex items-center justify-between rounded-xl px-3 py-2 border border-transparent hover:border-gray-150 hover:bg-gray-50 transition-all text-xs font-semibold text-gray-700 text-left"
                        >
                          <div className="flex items-center gap-3">
                            <span className="h-6 w-6 rounded-lg bg-gray-50 flex items-center justify-center text-xs shrink-0 select-none">
                              {item.icon}
                            </span>
                            <span>{item.label}</span>
                          </div>
                          {item.isAi && (
                            <span className="text-[8px] bg-green-50 text-green-600 px-1 py-0.5 rounded font-bold uppercase tracking-wider scale-90">
                              ⚡ AI
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
