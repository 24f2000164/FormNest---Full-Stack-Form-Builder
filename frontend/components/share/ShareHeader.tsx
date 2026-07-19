"use client";

import Link from "next/link";
import { LinkIcon } from "./icons";

// Mirrors the Builder's top tab bar so navigating to /share doesn't feel
// like leaving the app - but it's its own component, not a change to the
// Builder page itself. Content/Workflow/Connect go back to the Builder
// (Workflow/Connect aren't implemented there either, so they alert the
// same "Coming soon" the Builder already uses); Results goes to the real
// results page; Share is the active tab.
export default function ShareHeader({ formId, title }: { formId: string; title: string }) {
  return (
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
        <button onClick={() => alert("Coming soon!")} className="pb-1 text-gray-400 hover:text-gray-600">
          Workflow
        </button>
        <button onClick={() => alert("Coming soon!")} className="pb-1 text-gray-400 hover:text-gray-600">
          Connect
        </button>
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
        <button
          className="flex h-7 w-7 items-center justify-center rounded-full border text-gray-400 hover:bg-gray-50"
          aria-label="Help"
        >
          ?
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-xs font-medium text-white">
          {(title || "NF").slice(0, 2).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
