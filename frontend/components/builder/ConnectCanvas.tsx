"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

type GoogleAccount = {
  name: string;
  email: string;
  avatarColor: string;
};

const GOOGLE_ACCOUNTS: GoogleAccount[] = [
  { name: "24F2000164 SAHIL KUMAR", email: "24f2000164@ds.study.iitm.ac.in", avatarColor: "bg-indigo-600 text-white" },
  { name: "Bhaskar", email: "24f2000@gmail.com", avatarColor: "bg-amber-600 text-white" },
  { name: "Andrew pupil", email: "andrewpupilcreator@gmail.com", avatarColor: "bg-purple-600 text-white" },
  { name: "Shuti", email: "bt23ece015@gmail.com", avatarColor: "bg-teal-600 text-white" },
  { name: "BT23ECE015 Sahil Kumar", email: "bt23ece015@nituk.ac.in", avatarColor: "bg-blue-600 text-white" },
  { name: "Dhruv", email: "dhruvshivan123@gmail.com", avatarColor: "bg-gray-600 text-white" },
];

export default function ConnectCanvas({
  form,
  onSaveSettings,
}: {
  form: any;
  onSaveSettings: (nextSettings: any) => Promise<void>;
}) {
  const [subTab, setSubTab] = useState<"integrations" | "webhooks">("integrations");
  const [search, setSearch] = useState("");
  const [comingSoonApp, setComingSoonApp] = useState<string | null>(null);

  // Sheets modal state
  const [showSheetsModal, setShowSheetsModal] = useState(false);
  const [sheetsStep, setSheetsStep] = useState<1 | 2>(1);
  const [showAccountSelector, setShowAccountSelector] = useState(false);
  
  // Selected integration states
  const [connectedAccount, setConnectedAccount] = useState<GoogleAccount | null>(null);
  const [selectedSpreadsheet, setSelectedSpreadsheet] = useState("Sahil's Feedback Tracker");

  // Load existing Google Sheets configuration from database on mount
  useEffect(() => {
    if (form?.settings?.integrations?.google_sheets) {
      const gs = form.settings.integrations.google_sheets;
      if (gs.connected) {
        setConnectedAccount({
          name: gs.name || "Sahil Kumar",
          email: gs.email || "24f2000164@ds.study.iitm.ac.in",
          avatarColor: "bg-indigo-600 text-white"
        });
        setSelectedSpreadsheet(gs.spreadsheet || "Sahil's Feedback Tracker");
      }
    }
  }, [form]);

  const handleSelectAccount = (acc: GoogleAccount) => {
    setConnectedAccount(acc);
    setShowAccountSelector(false);
  };

  const handleSaveSheetsIntegration = async () => {
    if (!connectedAccount) return;
    const nextSettings = {
      ...(form?.settings || {}),
      integrations: {
        ...(form?.settings?.integrations || {}),
        google_sheets: {
          connected: true,
          name: connectedAccount.name,
          email: connectedAccount.email,
          spreadsheet: selectedSpreadsheet,
        },
      },
    };
    await onSaveSettings(nextSettings);
    setShowSheetsModal(false);
  };

  const handleDisconnectSheets = async () => {
    if (!confirm("Are you sure you want to disconnect Google Sheets?")) return;
    const nextSettings = {
      ...(form?.settings || {}),
      integrations: {
        ...(form?.settings?.integrations || {}),
        google_sheets: null,
      },
    };
    await onSaveSettings(nextSettings);
    setConnectedAccount(null);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#fafafb] h-full overflow-hidden text-[#26212e]">
      
      {/* COMING SOON MODAL POPUP */}
      <AnimatePresence>
        {comingSoonApp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-55 flex items-center justify-center p-4"
            onClick={() => setComingSoonApp(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 10 }}
              className="bg-white rounded-2xl p-6 max-w-xs w-full text-center shadow-2xl border border-gray-100 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-3xl select-none">🔌</div>
              <h4 className="text-sm font-bold text-gray-900">{comingSoonApp}</h4>
              <p className="text-xs text-gray-400 leading-relaxed font-semibold">
                This integration is coming soon! We are actively building secure OAuth connectors for HubSpot, Notion, Webhooks, and Salesforce.
              </p>
              <button
                onClick={() => setComingSoonApp(null)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GOOGLE SHEETS CONNECT DIALOG */}
      <AnimatePresence>
        {showSheetsModal && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            onClick={() => setShowSheetsModal(false)}
          >
            <div
              className="w-full max-w-[820px] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden relative max-h-[85vh] border border-gray-250 text-left"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-150 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded bg-green-50 text-green-600 flex items-center justify-center font-bold text-xs select-none">📊</span>
                  <h3 className="text-base font-bold text-gray-800">Google Sheets</h3>
                </div>
                <button onClick={() => setShowSheetsModal(false)} className="text-gray-400 hover:text-gray-600 text-lg p-1">✕</button>
              </div>

              {/* Modal Body Columns */}
              <div className="flex-1 flex min-h-0 bg-[#fafafb] relative">
                
                {/* Left Sidebar Steps */}
                <div className="w-56 border-r border-gray-200 bg-white p-4 shrink-0 space-y-1">
                  <div className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${sheetsStep === 1 ? 'bg-gray-100 text-gray-900' : 'text-gray-400'}`}>
                    <span className="h-4 w-4 rounded-full bg-gray-200 text-[10px] flex items-center justify-center font-black">1</span>
                    Authorization
                  </div>
                  <div className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${sheetsStep === 2 ? 'bg-gray-100 text-gray-900' : 'text-gray-300'}`}>
                    <span className="h-4 w-4 rounded-full bg-gray-150 text-[10px] flex items-center justify-center font-black">2</span>
                    Select sheet
                  </div>
                </div>

                {/* Right Content Panel */}
                <div className="flex-1 p-6 overflow-y-auto">
                  {sheetsStep === 1 ? (
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-gray-900">Authorize a new Google Sheets account</h4>
                      <p className="text-xs text-gray-450 font-semibold leading-relaxed">
                        Give Google Sheets permission to connect to your Typeform account.
                      </p>

                      {/* Authorize Account Box */}
                      <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-xs flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="h-7 w-7 rounded bg-green-50 text-green-600 flex items-center justify-center text-xs">📊</span>
                          <div>
                            <p className="text-xs font-bold text-gray-800">
                              {connectedAccount ? "Google Sheets account connected" : "Authorize a new account"}
                            </p>
                            <p className="text-[10px] text-gray-400 font-semibold">
                              {connectedAccount ? connectedAccount.email : "Not connected"}
                            </p>
                          </div>
                        </div>
                        
                        {connectedAccount ? (
                          <span className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full select-none">
                            Connected
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowAccountSelector(true)}
                            className="px-3.5 py-1.5 bg-[#26212e] hover:bg-black text-white rounded-lg text-[10px] font-bold transition-all shadow-xs"
                          >
                            Add account
                          </button>
                        )}
                      </div>

                      {/* Info Box */}
                      <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex gap-2">
                        <span className="text-blue-500 text-xs">ℹ</span>
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-bold text-blue-800">Workspace access to your Google Sheets account</p>
                          <p className="text-[9px] text-blue-650 leading-relaxed font-semibold">
                            By authorizing this account, you're giving everyone in this workspace access to connect this Google Sheets account to their forms.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-gray-900">Select a spreadsheet</h4>
                      <p className="text-xs text-gray-455 font-semibold leading-relaxed">
                        Choose the spreadsheet where you want to send your form responses.
                      </p>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide">Spreadsheet</label>
                        <select
                          value={selectedSpreadsheet}
                          onChange={(e) => setSelectedSpreadsheet(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-2.5 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white font-bold text-gray-700"
                        >
                          <option value="Sahil's Feedback Tracker">Sahil's Feedback Tracker</option>
                          <option value="Form Submissions v1">Form Submissions v1</option>
                          <option value="B2B Lead List 2026">B2B Lead List 2026</option>
                        </select>
                      </div>

                      <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex gap-2">
                        <span className="text-blue-500 text-xs">ℹ</span>
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-bold text-blue-850">Data Appending Rules</p>
                          <p className="text-[9px] text-blue-650 leading-relaxed font-semibold">
                            New responses will be appended as new rows at the bottom of the active sheet. Modifying columns in Google Sheets directly might break submission synchronizations.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* MOCK GOOGLE SIGN-IN POPUP OVERLAY */}
                {showAccountSelector && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="w-[360px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90%]">
                      {/* Google Sign-in Header */}
                      <div className="p-5 border-b border-gray-100 flex items-center gap-2 select-none">
                        <span className="text-base">👤</span>
                        <div className="text-left">
                          <h4 className="text-xs font-bold text-gray-800">Sign in with Google</h4>
                          <p className="text-[10px] text-gray-450 font-semibold">Choose an account to continue to Typeform</p>
                        </div>
                      </div>

                      {/* Google Accounts List */}
                      <div className="flex-1 overflow-y-auto p-2">
                        {GOOGLE_ACCOUNTS.map((acc, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSelectAccount(acc)}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-xl transition-all text-left group"
                          >
                            <span className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold select-none shrink-0 ${acc.avatarColor}`}>
                              {acc.name[0]}
                            </span>
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                                {acc.name}
                              </p>
                              <p className="text-[9px] text-gray-400 font-semibold truncate">
                                {acc.email}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Google Sign-in Footer */}
                      <div className="p-3 border-t border-gray-100 text-center shrink-0">
                        <button
                          onClick={() => setShowAccountSelector(false)}
                          className="px-4 py-1.5 hover:bg-gray-100 text-gray-500 rounded-lg text-[10px] font-bold transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Footer Actions */}
              <div className="px-6 py-3 border-t border-gray-150 flex items-center justify-end gap-3.5 bg-white shrink-0">
                <button
                  onClick={() => setShowSheetsModal(false)}
                  className="px-4 py-2 hover:bg-gray-100 text-gray-500 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>

                {sheetsStep === 1 ? (
                  <button
                    disabled={!connectedAccount}
                    onClick={() => setSheetsStep(2)}
                    className="px-4 py-2 bg-[#26212e] hover:bg-black disabled:opacity-45 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    Next
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setSheetsStep(1)}
                      className="px-4 py-2 border border-gray-250 hover:bg-gray-50 text-gray-600 rounded-xl text-xs font-bold transition-all"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSaveSheetsIntegration}
                      className="px-4 py-2.5 bg-[#26212e] hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                      Save
                    </button>
                  </>
                )}
              </div>

            </div>
          </div>
        )}
      </AnimatePresence>

      {/* TOP NAVIGATION SUB-TABS */}
      <div className="border-b bg-white px-6 py-2 flex items-center gap-6 shrink-0 z-10 select-none">
        <button
          onClick={() => setSubTab("integrations")}
          className={`pb-1 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
            subTab === "integrations" ? "border-gray-900 text-gray-900" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          Integrations
        </button>
        <button
          onClick={() => setSubTab("webhooks")}
          className={`pb-1 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
            subTab === "webhooks" ? "border-gray-900 text-gray-900" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          Webhooks
        </button>
      </div>

      {/* MAIN VIEW CONTROLLER */}
      {subTab === "integrations" ? (
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Panel: Search & Categories */}
          <div className="w-64 border-r border-gray-200 bg-white p-5 shrink-0 flex flex-col gap-6 text-left select-none">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-gray-800">Connect Typeform to your favorite apps</h3>
              <p className="text-[10px] text-gray-400 leading-relaxed font-semibold">
                Create automated, efficient workflows that work for you.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative flex items-center">
              <span className="absolute left-3 text-gray-400 select-none">
                <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search integrations"
                className="w-full h-8.5 rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-[11px] outline-none focus:border-gray-400 focus:bg-white transition-all placeholder-gray-400 font-semibold"
              />
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Categories</h4>
              <div className="space-y-0.5 max-h-[220px] overflow-y-auto pr-1">
                {[
                  { name: "All", count: 83 },
                  { name: "Analytics & reporting", count: 21 },
                  { name: "Automation", count: 1 },
                  { name: "CMS", count: 2 },
                  { name: "Collaboration", count: 17 },
                  { name: "Customer support", count: 8 },
                  { name: "Developer tools", count: 6 },
                  { name: "Lead generation", count: 19 },
                  { name: "Marketing automation", count: 34 },
                  { name: "Productivity", count: 15 },
                ].map((cat, idx) => (
                  <button
                    key={idx}
                    onClick={() => setComingSoonApp(cat.name)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 hover:bg-gray-50 rounded-lg text-[10px] font-semibold text-gray-500 hover:text-gray-800 transition-colors text-left"
                  >
                    <span>{cat.name}</span>
                    <span className="text-[9px] text-gray-400 font-bold bg-gray-100 px-1 py-0.5 rounded">{cat.count}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: Cards Grid */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
            
            {/* Zapier AI Banner */}
            <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-3 max-w-3xl">
              <div className="flex items-center gap-2">
                <span className="text-orange-500 font-bold">✨</span>
                <span className="text-xs font-bold text-gray-800">Generate a custom flow with Zapier AI</span>
              </div>
              <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">
                Describe what you want to do with your data:
              </p>
              <textarea
                disabled
                placeholder="E.g. When the typeform is submitted, check if leads exist in Salesforce and send details to Slack"
                className="w-full h-16 rounded-xl border border-gray-200 bg-gray-50 p-3 text-[11px] outline-none placeholder-gray-400 resize-none font-semibold"
              />
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-gray-400 font-semibold">
                  Powered by <span className="font-bold text-orange-500">Zapier</span>
                </span>
                <button
                  type="button"
                  disabled
                  className="px-4 py-1.5 bg-gray-100 text-gray-400 rounded-lg text-[10px] font-bold select-none"
                >
                  Generate flow
                </button>
              </div>
            </div>

            {/* Integrations Grid */}
            <div className="space-y-4 max-w-3xl">
              
              {/* 1. Google Sheets Integration Card */}
              {("google sheets").includes(search.toLowerCase()) && (
                <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <span className="h-10 w-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center text-lg shadow-xs select-none">
                      📊
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                        Google Sheets
                        {connectedAccount && (
                          <span className="text-[9px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full select-none">
                            Connected
                          </span>
                        )}
                      </h4>
                      <p className="text-[10px] text-gray-400 leading-relaxed font-semibold max-w-md mt-0.5">
                        {connectedAccount
                          ? `Automatically appending responses to spreadsheet: ${selectedSpreadsheet} (${connectedAccount.email})`
                          : "Send form submissions straight to Google Sheets. Update spreadsheets in real time."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {connectedAccount ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setSheetsStep(1);
                            setShowSheetsModal(true);
                          }}
                          className="px-4 py-1.5 border border-gray-250 hover:bg-gray-50 text-gray-650 rounded-lg text-[10px] font-bold transition-all"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={handleDisconnectSheets}
                          className="px-4 py-1.5 bg-red-50 hover:bg-red-100 text-red-650 rounded-lg text-[10px] font-bold transition-all"
                        >
                          Disconnect
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setSheetsStep(1);
                          setShowSheetsModal(true);
                        }}
                        className="px-4 py-1.5 bg-[#26212e] hover:bg-black text-white rounded-lg text-[10px] font-bold transition-all shadow-xs"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* 2. Typeform Contacts Card */}
              {("typeform contacts").includes(search.toLowerCase()) && (
                <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <span className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg shadow-xs select-none">
                      👤
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-gray-800">Typeform contacts</h4>
                      <p className="text-[10px] text-gray-400 leading-relaxed font-semibold max-w-md mt-0.5">
                        Map form responses to create or update your contacts and trigger automations.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setComingSoonApp("Typeform contacts")}
                    className="px-4 py-1.5 bg-[#26212e] hover:bg-black text-white rounded-lg text-[10px] font-bold transition-all shadow-xs shrink-0"
                  >
                    Manage form mapping
                  </button>
                </div>
              )}

              {/* 3. Facebook Pixel Card */}
              {("facebook pixel").includes(search.toLowerCase()) && (
                <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <span className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg shadow-xs select-none">
                      🌐
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                        Facebook Pixel
                        <span className="text-[8px] bg-green-50 text-green-600 px-1 py-0.5 rounded font-bold uppercase tracking-wider scale-90">
                          💎 Paid
                        </span>
                      </h4>
                      <p className="text-[10px] text-gray-400 leading-relaxed font-semibold max-w-md mt-0.5">
                        Add your Facebook pixel ID and get all the data you need to measure and optimize your marketing campaigns.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setComingSoonApp("Facebook Pixel")}
                    className="px-4 py-1.5 bg-[#26212e] hover:bg-black text-white rounded-lg text-[10px] font-bold transition-all shadow-xs shrink-0"
                  >
                    Connect
                  </button>
                </div>
              )}

              {/* 4. Google Analytics Card */}
              {("google analytics").includes(search.toLowerCase()) && (
                <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <span className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg shadow-xs select-none">
                      📊
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                        Google Analytics
                        <span className="text-[8px] bg-green-50 text-green-600 px-1 py-0.5 rounded font-bold uppercase tracking-wider scale-90">
                          💎 Paid
                        </span>
                      </h4>
                      <p className="text-[10px] text-gray-400 leading-relaxed font-semibold max-w-md mt-0.5">
                        Discover how people find and interact with your typeform. Get the data you need to measure campaigns, improve conversions, and more.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setComingSoonApp("Google Analytics")}
                    className="px-4 py-1.5 bg-[#26212e] hover:bg-black text-white rounded-lg text-[10px] font-bold transition-all shadow-xs shrink-0"
                  >
                    Connect
                  </button>
                </div>
              )}

              {/* 5. HubSpot Card */}
              {("hubspot").includes(search.toLowerCase()) && (
                <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <span className="h-10 w-10 rounded-xl bg-orange-50 text-orange-650 flex items-center justify-center text-lg shadow-xs select-none">
                      🧡
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-gray-800">HubSpot</h4>
                      <p className="text-[10px] text-gray-400 leading-relaxed font-semibold max-w-md mt-0.5">
                        Send contact, company, or deal info to HubSpot to quickly follow up on new leads or update existing details to your free HubSpot account.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setComingSoonApp("HubSpot")}
                    className="px-4 py-1.5 bg-[#26212e] hover:bg-black text-white rounded-lg text-[10px] font-bold transition-all shadow-xs shrink-0"
                  >
                    Connect
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      ) : (
        /* Webhooks View */
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#fafafb] select-none h-full min-h-[400px] space-y-4">
          <div className="text-5xl select-none">🔌🔗</div>
          <h3 className="text-sm font-bold text-gray-800">Trigger webhooks</h3>
          <p className="text-xs text-gray-400 font-semibold leading-relaxed max-w-xs">
            Not familiar with webhooks? Just ask your tech team for a hand.
          </p>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setComingSoonApp("Webhook Documentation");
            }}
            className="text-xs text-teal-650 hover:underline font-bold"
          >
            Learn about webhooks
          </a>
          <button
            type="button"
            onClick={() => setComingSoonApp("Add a Webhook")}
            className="px-5 py-2.5 bg-[#26212e] hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            Add a webhook
          </button>
        </div>
      )}

    </div>
  );
}
