// Lightweight helper for handing the Builder's in-progress (possibly unsaved)
// welcome-screen state over to the Preview tab.
//
// Persisted question data (title, options, settings, etc.) already lives in
// the backend and is loaded by the Preview route via the normal read-only
// GET /forms/{id} endpoint. The welcome screen fields, however, only exist
// as local React state in the Builder (there's no backend column for them
// yet), so the only way for a brand-new tab to see "the latest Builder
// state" for those fields is to hand them off explicitly. localStorage is
// used (rather than sessionStorage) so it reliably survives the jump to a
// new tab opened via window.open().
//
// This never talks to the backend, so it can't modify Builder/server data.

export type PreviewDraft = {
  formId: string;
  welcomeTitle: string;
  welcomeDescription: string;
  buttonText: string;
  timeToComplete: boolean;
  savedAt: string;
};

function storageKey(formId: string | number) {
  return `preview_draft_${formId}`;
}

export function savePreviewDraft(formId: string | number, draft: Omit<PreviewDraft, "formId" | "savedAt">) {
  if (typeof window === "undefined") return;
  try {
    const payload: PreviewDraft = {
      formId: String(formId),
      ...draft,
      savedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(storageKey(formId), JSON.stringify(payload));
  } catch (err) {
    console.error("Failed to save preview draft", err);
  }
}

export function loadPreviewDraft(formId: string | number): PreviewDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(formId));
    if (!raw) return null;
    return JSON.parse(raw) as PreviewDraft;
  } catch (err) {
    console.error("Failed to load preview draft", err);
    return null;
  }
}
