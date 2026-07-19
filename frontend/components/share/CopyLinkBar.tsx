"use client";

import { useState } from "react";
import { LinkIcon, PencilIcon, QrGridIcon } from "./icons";
import { updateSlug, SlugConflictError, SlugInvalidError, ShareInfo } from "@/lib/api";

export default function CopyLinkBar({
  formId,
  shareInfo,
  origin,
  onSlugUpdated,
  onCopied,
  onOpenQr,
}: {
  formId: number;
  shareInfo: ShareInfo;
  origin: string;
  onSlugUpdated: (info: ShareInfo) => void;
  onCopied: () => void;
  onOpenQr: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [slugDraft, setSlugDraft] = useState(shareInfo.slug);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const publicUrl = `${origin}/f/${shareInfo.slug}`;
  const prefix = `${origin}/f/`;

  function startEditing() {
    setSlugDraft(shareInfo.slug);
    setError(null);
    setEditing(true);
  }

  async function saveSlug() {
    const cleaned = slugDraft.trim().toLowerCase();
    if (cleaned === shareInfo.slug) {
      setEditing(false);
      return;
    }
    // Same a-z/0-9/hyphen rule the backend enforces - checked here too so
    // the respondent gets instant feedback instead of waiting on a 422.
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(cleaned)) {
      setError("Only lowercase letters, numbers, and hyphens are allowed.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await updateSlug(formId, cleaned);
      onSlugUpdated(updated);
      setEditing(false);
    } catch (err) {
      if (err instanceof SlugConflictError) setError("That link is already taken.");
      else if (err instanceof SlugInvalidError) setError("Only lowercase letters, numbers, and hyphens are allowed.");
      else setError("Couldn't update the link. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(publicUrl);
    } catch {
      // Clipboard API can fail (permissions, non-secure context); the
      // toast still confirms intent even if the browser silently no-ops.
    }
    onCopied();
  }

  return (
    <div>
      <div className="flex items-stretch gap-2">
        <button
          onClick={handleCopy}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          <LinkIcon className="h-4 w-4" />
          Copy link
        </button>

        <div className="flex min-w-0 flex-1 items-center rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700">
          {editing ? (
            <div className="flex min-w-0 flex-1 items-center gap-1">
              <span className="shrink-0 text-gray-400">{prefix}</span>
              <input
                autoFocus
                value={slugDraft}
                onChange={(e) => setSlugDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveSlug();
                  if (e.key === "Escape") setEditing(false);
                }}
                className="min-w-0 flex-1 border-b border-gray-300 bg-transparent outline-none focus:border-gray-900"
              />
            </div>
          ) : (
            <span className="truncate">{publicUrl}</span>
          )}
        </div>

        {editing ? (
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              onClick={saveSlug}
              disabled={saving}
              className="rounded-md bg-gray-900 px-3 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-md border px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={startEditing}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <PencilIcon />
              Edit
            </button>
            <button
              onClick={onOpenQr}
              aria-label="Show QR code"
              className="flex shrink-0 items-center justify-center rounded-lg border border-gray-300 px-3 py-2.5 text-gray-700 hover:bg-gray-50"
            >
              <QrGridIcon />
            </button>
          </>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
