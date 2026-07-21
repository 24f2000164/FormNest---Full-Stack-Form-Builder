"use client";

import { useState } from "react";
import Link from "next/link";
import { LinkIcon } from "./icons";
import FeedbackModal from "./FeedbackModal";

export default function ShareHeader({ formId, title }: { formId: string; title: string }) {
  const [showHelpDropdown, setShowHelpDropdown] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between border-b px-6 py-3 text-sm">
        <div className="flex items-center gap-2 text-gray-500">
          <Link href="/" className="hover:text-gray-700">
            Forms
          </Link>
          <span>&gt;</span>
          <span className="text-gray-900">{title || "New form"}</span>
        </div>
        <nav className="flex gap-6 font-medium">
          <Link href={`/forms/${formId}/edit`} className="pb-1 text-gray-400 hover:text-gray-600">
            Content
          </Link>
          <Link href={`/forms/${formId}/edit?tab=workflow`} className="pb-1 text-gray-400 hover:text-gray-600">
            Workflow
          </Link>
          <Link href={`/forms/${formId}/edit?tab=connect`} className="pb-1 text-gray-400 hover:text-gray-600">
            Connect
          </Link>
          <span className="border-b-2 border-gray-900 pb-1 text-gray-900">Share</span>
          <Link href={`/forms/${formId}/results`} className="pb-1 text-gray-400 hover:text-gray-600">
            Results
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <button
            className="rounded-md border p-1.5 text-gray-500 hover:bg-gray-50"
            aria-label="Copy link"
            onClick={() => alert("Coming soon!")}
          >
            <LinkIcon />
          </button>
          <button className="rounded-md bg-[#0f6b52] px-3 py-1.5 font-medium text-white hover:bg-[#0c5943]">
            View plans
          </button>
          <div className="relative">
            <button
              onClick={() => setShowHelpDropdown(!showHelpDropdown)}
              className="flex h-7 w-7 items-center justify-center rounded-full border text-gray-455 hover:bg-gray-50 font-bold"
              aria-label="Help"
            >
              ?
            </button>
            {showHelpDropdown && (
              <div className="absolute right-0 top-full mt-2 w-40 rounded-xl border border-gray-150 bg-white shadow-xl py-1.5 z-50 text-left">
                <button
                  onClick={() => { alert("Coming soon!"); setShowHelpDropdown(false); }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors"
                >
                  Help center
                </button>
                <button
                  onClick={() => { alert("Coming soon!"); setShowHelpDropdown(false); }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors"
                >
                  Community
                </button>
                <button
                  onClick={() => { setShowFeedbackModal(true); setShowHelpDropdown(false); }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors border-y border-gray-100 bg-gray-50/50"
                >
                  Give Feedback
                </button>
                <button
                  onClick={() => { alert("Coming soon!"); setShowHelpDropdown(false); }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors"
                >
                  Support
                </button>
              </div>
            )}
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-xs font-medium text-white">
            {(title || "NF").slice(0, 2).toUpperCase()}
          </div>
        </div>
      </header>
      <FeedbackModal isOpen={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} />
    </>
  );
}
