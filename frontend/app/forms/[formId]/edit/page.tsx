
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import QuestionTypeModal from "@/components/builder/QuestionTypeModal";
import QuestionCanvas from "@/components/builder/QuestionCanvas";
import ShapePickerModal from "@/components/builder/ShapePickerModal";
import PropertyPickerModal from "@/components/builder/PropertyPickerModal";
import ToggleSwitch from "@/components/builder/ToggleSwitch";
import ToolbarIconButton from "@/components/builder/ToolbarIconButton";
import { RatingIcon } from "@/components/builder/ratingIcons";
import { savePreviewDraft } from "@/lib/previewDraft";

import LogicModal from "@/components/builder/LogicModal";
import ScoringModal from "@/components/builder/ScoringModal";
import TaggingModal from "@/components/builder/TaggingModal";
import OutcomeQuizModal from "@/components/builder/OutcomeQuizModal";
import WorkflowCanvas from "@/components/builder/WorkflowCanvas";
import VariablesModal from "@/components/builder/VariablesModal";
import ConnectCanvas from "@/components/builder/ConnectCanvas";
import { updateForm } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Question = {
  id: number;
  type: string;
  title: string;
  description: string | null;
  required: boolean;
  order_index: number;
  options: string[] | null;
  settings: Record<string, any> | null;
};

type FormRead = {
  id: number;
  title: string;
  description: string | null;
  slug: string;
  status: string;
  created_at: string;
  updated_at: string;
  questions: Question[];
  settings?: Record<string, any> | null;
};

type QuestionUpdate = {
  type?: string;
  title?: string;
  description?: string;
  required?: boolean;
  options?: string[] | null;
  settings?: Record<string, any> | null;
};

type IconDetails = {
  icon: string;
  color: string;
};

// Helper function to get icon and theme background color for question type
const getQuestionIconDetails = (type: string): IconDetails => {
  const iconMap: Record<string, IconDetails> = {
    short_text: { icon: 'T', color: 'bg-blue-50 text-blue-600 border border-blue-100' },
    long_text: { icon: 'T', color: 'bg-blue-50 text-blue-600 border border-blue-100' },
    number: { icon: '#', color: 'bg-amber-50 text-amber-600 border border-amber-100' },
    email: { icon: '✉', color: 'bg-pink-50 text-pink-600 border border-pink-100' },
    phone: { icon: '📞', color: 'bg-green-50 text-green-600 border border-green-100' },
    date: { icon: '📅', color: 'bg-indigo-50 text-indigo-600 border border-indigo-100' },
    multiple_choice: { icon: '●', color: 'bg-purple-50 text-purple-600 border border-purple-100' },
    dropdown: { icon: '▼', color: 'bg-purple-50 text-purple-600 border border-purple-100' },
    yes_no: { icon: '✓', color: 'bg-purple-50 text-purple-600 border border-purple-100' },
    rating: { icon: '★', color: 'bg-green-50 text-green-600 border border-green-100' },
    opinion_scale: { icon: '◯', color: 'bg-teal-50 text-teal-600 border border-teal-100' },
    statement: { icon: '‖', color: 'bg-gray-100 text-gray-650 border border-gray-200' },
    contact_info: { icon: '👤', color: 'bg-pink-50 text-pink-600 border border-pink-100' },
    welcome_screen: { icon: '👋', color: 'bg-indigo-50 text-indigo-600 border border-indigo-100' },
    ending_screen: { icon: '🏁', color: 'bg-emerald-50 text-emerald-600 border border-emerald-100' }
  };
  return iconMap[type] || { icon: '•', color: 'bg-gray-100 text-gray-600' };
};

export default function BuilderPage() {
  const params = useParams();
  const formId = params.formId as string;
  const router = useRouter();
  const searchParams = useSearchParams();

  // Workflow, Branching and Modals states
  const [activeTab, setActiveTab] = useState<"content" | "workflow" | "connect">("content");

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "workflow" || tabParam === "connect" || tabParam === "content") {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isAuth = localStorage.getItem("user_authenticated") === "true";
      if (!isAuth) {
        router.push("/login");
      }
    }
  }, [router]);

  const [form, setForm] = useState<FormRead | null>(null);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [activeQuestionMenuId, setActiveQuestionMenuId] = useState<number | null>(null);
  const [showEndingsMenu, setShowEndingsMenu] = useState(false);
  const [comingSoonItem, setComingSoonItem] = useState<string | null>(null);

  // Click outside listener for question menu context dropdowns and endings dropdown
  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveQuestionMenuId(null);
      setShowEndingsMenu(false);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);
  const [welcomeTitle, setWelcomeTitle] = useState("Say hi! Recall information with @");
  const [welcomeDescription, setWelcomeDescription] = useState("");
  const [buttonText, setButtonText] = useState("Start");
  const [timeToComplete, setTimeToComplete] = useState(true);
  const [showSubmissionCount, setShowSubmissionCount] = useState(false);
  const [copied, setCopied] = useState(false);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [showShapePicker, setShowShapePicker] = useState(false);
  const [shapePickerValue, setShapePickerValue] = useState('');
  const [showPropertyPicker, setShowPropertyPicker] = useState(false);
  const [propertyPickerId, setPropertyPickerId] = useState<string | null>(null);
  const [propertyPickerName, setPropertyPickerName] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  // Currently selected question object, derived from questions + selectedQuestionId.
  // NOTE: this must be declared here (not further below) because the
  // useEffect immediately after this needs it, and `const` bindings are
  // not hoisted in JS — referencing it before this line would throw
  // "Cannot access 'selectedQuestion' before initialization".
  const selectedQuestion = questions.find((q) => q.id === selectedQuestionId) || null;

  // Local settings form state for high responsiveness
  const [localSettings, setLocalSettings] = useState<Record<string, any>>({});

  useEffect(() => {
    if (selectedQuestion) {
      setLocalSettings(selectedQuestion.settings || {});
    } else {
      setLocalSettings({});
    }
  }, [selectedQuestionId, selectedQuestion?.settings]);

  // Workflow, Branching and Modals states
  const [showLogicModal, setShowLogicModal] = useState(false);
  const [logicModalQuestionId, setLogicModalQuestionId] = useState<number | null>(null);
  const [showScoringModal, setShowScoringModal] = useState(false);
  const [showTaggingModal, setShowTaggingModal] = useState(false);
  const [showOutcomeQuizModal, setShowOutcomeQuizModal] = useState(false);
  const [showVariablesModal, setShowVariablesModal] = useState(false);
  const [workflowSubTab, setWorkflowSubTab] = useState("branching");

  async function handleSaveQuestionLogic(qId: number, logic: any) {
    const q = questions.find(o => o.id === qId);
    if (!q) return;
    const nextSettings = { ...(q.settings || {}), logic };
    await fetch(`${API_BASE}/forms/${formId}/questions/${qId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: nextSettings }),
    });
    setQuestions(prev => prev.map(o => o.id === qId ? { ...o, settings: nextSettings } : o));
  }

  async function handleSaveQuestionScore(qId: number, score: any) {
    const q = questions.find(o => o.id === qId);
    if (!q) return;
    const nextSettings = { ...(q.settings || {}), score };
    await fetch(`${API_BASE}/forms/${formId}/questions/${qId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: nextSettings }),
    });
    setQuestions(prev => prev.map(o => o.id === qId ? { ...o, settings: nextSettings } : o));
  }

  async function handleSaveFormSettings(nextFormSettings: any) {
    const updated = (await updateForm(Number(formId), { settings: nextFormSettings })) as FormRead;
    setForm(prev => prev ? { ...prev, settings: updated.settings } : prev);
  }

  async function handleSaveFormVariables(variables: any) {
    const nextFormSettings = { ...(form?.settings || {}), variables };
    await handleSaveFormSettings(nextFormSettings);
  }

  async function handlePublish() {
    if (!form) return;
    setPublishing(true);
    try {
      const res = await fetch(`${API_BASE}/forms/${formId}/publish`, { method: "POST" });
      if (!res.ok) throw new Error(`Request failed with ${res.status}`);
      const updated = await res.json();
      setForm((prev) => (prev ? { ...prev, status: updated.status } : prev));
    } catch (err) {
      console.error("Failed to publish form", err);
      alert("This form needs at least one question before it can be published.");
    } finally {
      setPublishing(false);
    }
  }

  useEffect(() => {
    if (!formId) return;
    fetch(`${API_BASE}/forms/${formId}`)
      .then((r) => r.json())
      .then((data) => {
        setForm(data);
        setQuestions(data.questions || []);
      })
      .catch(() => {});
  }, [formId]);

  async function handleAddQuestion(type: string) {
    const defaultTitles: Record<string, string> = {
      short_text: "Short Text",
      long_text: "Message",
      number: "Number",
      email: "Email",
      phone: "Phone Number",
      date: "Date",
      multiple_choice: "Multiple Choice",
      dropdown: "Dropdown",
      yes_no: "Yes/No",
      rating: "Rating",
      opinion_scale: "Opinion Scale",
      statement: "Statement",
      welcome_screen: "Welcome Screen",
      ending_screen: "Ending Screen",
      contact_info: "Contact Info"
    };

    const payload: any = {
      type,
      title: defaultTitles[type] || "",
    };

    if (type === "contact_info") {
      payload.settings = {
        fields: {
          firstName: { visible: true, required: false },
          lastName: { visible: true, required: false },
          phone: { visible: true, required: false },
          email: { visible: false, required: false },
          company: { visible: false, required: false }
        },
        defaultCountry: "India"
      };
    }

    const res = await fetch(`${API_BASE}/forms/${formId}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const newQuestion = await res.json();
    setQuestions((prev) => [...prev, newQuestion]);
    setSelectedQuestionId(newQuestion.id);
    setShowTypeModal(false);
  }

  function handleQuestionUpdate(updated: any) {
    const { form_id, ...rest } = updated;
    setQuestions((prev) => prev.map((q) => (q.id === rest.id ? rest : q)));
  }

  // Persists a partial update for the currently selected question to the backend,
  // then syncs the result back into local state. This is the function the right-hand
  // settings panel should use for every field so edits are actually saved.
  async function patchQuestion(fields: QuestionUpdate) {
    if (!selectedQuestionId) return;
    try {
      const res = await fetch(`${API_BASE}/forms/${formId}/questions/${selectedQuestionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (!res.ok) throw new Error(`Request failed with ${res.status}`);
      const updated = await res.json();
      handleQuestionUpdate(updated);
    } catch (err) {
      console.error("Failed to save question", err);
    }
  }

  // Convenience helper for updating a single key inside settings while preserving the rest
  function patchSettings(patch: Record<string, any>) {
    if (!selectedQuestion) return;
    patchQuestion({ settings: { ...(selectedQuestion.settings || {}), ...patch } });
  }

  // Handle drag and drop for reordering questions
  const updateQuestionOrder = async () => {
    if (!form) return;
    const questionIds = questions.map((q) => q.id);
    try {
      await fetch(`${API_BASE}/forms/${formId}/questions/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(questionIds),
      });
    } catch (err) {
      console.error("Failed to reorder questions", err);
    }
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      return;
    }
    // Reorder in state
    setQuestions((prev) => {
      const newArray = [...prev];
      const draggedItem = newArray.splice(dragIndex, 1)[0];
      newArray.splice(index, 0, draggedItem);
      return newArray;
    });
    setDragIndex(null);
    // Update order on backend
    updateQuestionOrder();
  };

  async function handleMoveQuestionUp(index: number) {
    if (index === 0) return;
    const reordered = [...questions];
    const temp = reordered[index];
    reordered[index] = reordered[index - 1];
    reordered[index - 1] = temp;
    setQuestions(reordered);
    setActiveQuestionMenuId(null);
    // Persist to backend
    const questionIds = reordered.map((q) => q.id);
    await fetch(`${API_BASE}/forms/${formId}/questions/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(questionIds),
    });
  }

  async function handleMoveQuestionDown(index: number) {
    if (index === questions.length - 1) return;
    const reordered = [...questions];
    const temp = reordered[index];
    reordered[index] = reordered[index + 1];
    reordered[index + 1] = temp;
    setQuestions(reordered);
    setActiveQuestionMenuId(null);
    // Persist to backend
    const questionIds = reordered.map((q) => q.id);
    await fetch(`${API_BASE}/forms/${formId}/questions/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(questionIds),
    });
  }

  async function handleDuplicateQuestion(question: Question) {
    try {
      const res = await fetch(`${API_BASE}/forms/${formId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: question.type,
          title: question.title ? `${question.title} (Copy)` : "Untitled question",
          description: question.description,
          required: question.required,
          options: question.options,
          settings: question.settings,
        }),
      });
      if (!res.ok) throw new Error("Failed to duplicate question");
      const duplicated = await res.json();
      setQuestions((prev) => [...prev, duplicated]);
      setSelectedQuestionId(duplicated.id);
      setActiveQuestionMenuId(null);
    } catch (err) {
      console.error("Failed to duplicate question", err);
    }
  }

  async function handleDeleteQuestion(questionId: number) {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      const res = await fetch(`${API_BASE}/forms/${formId}/questions/${questionId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete question");
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      if (selectedQuestionId === questionId) {
        setSelectedQuestionId(null);
      }
      setActiveQuestionMenuId(null);
    } catch (err) {
      console.error("Failed to delete question", err);
    }
  }

  const wfSubTabs = ["branching", "scoring", "tagging", "outcome"];
  const wfSubTabLabels: Record<string, string> = { branching: "Branching", scoring: "Scoring", tagging: "Tagging", outcome: "Outcome quiz" };

  return (
    <div className="flex h-screen flex-col bg-white text-sm">
      {/* Top bar: breadcrumb, tabs, publish/share */}
      <header className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-2 text-gray-500">
          <Link href="/" className="hover:text-gray-700">
            Forms
          </Link>
          <span>&gt;</span>
          <span className="text-gray-900">{form?.title || "New form"}</span>
        </div>
        <nav className="flex gap-6 font-medium text-sm">
          {[
            { id: "content", label: "Content" },
            { id: "workflow", label: "Workflow" },
            { id: "connect", label: "Connect" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-1 transition-all ${
                activeTab === tab.id
                  ? "border-b-2 border-gray-900 text-gray-900 font-semibold"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
          <Link href={`/forms/${formId}/share`} className="pb-1 text-gray-400 hover:text-gray-600">Share</Link>
          <Link href={`/forms/${formId}/results`} className="pb-1 text-gray-400 hover:text-gray-600">Results</Link>
        </nav>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <img src="/icons/play.png" alt="" className="h-3 w-3" />
            {publishing ? "Publishing..." : "Publish edits"}
          </button>
          <div className="relative">
            <button
              onClick={() => {
                const publicUrl = typeof window !== "undefined" ? `${window.location.origin}/f/${form?.slug || ""}` : "";
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(publicUrl).catch(() => {});
                }
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="rounded-md border p-1.5 text-gray-500 hover:bg-gray-50 flex items-center justify-center transition-all active:scale-95"
              aria-label="Copy link"
            >
              🔗
            </button>
            {copied && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2.5 px-3 py-1 text-xs font-bold text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap select-none z-50">
                Copied!
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
              </div>
            )}
          </div>
          <button
            onClick={() => alert("Coming soon!")}
            className="rounded-md bg-gray-900 px-3 py-1.5 font-medium text-white hover:bg-gray-800"
          >
            View plans
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-xs font-medium text-white">
            {(form?.title || "NF").slice(0, 2).toUpperCase()}
          </div>
        </div>
      </header>

      {/* Icon toolbar row — Content tab */}
      {activeTab === "content" && (
      <div className="flex items-center gap-3 border-b bg-white px-6 py-2">
        <button
          onClick={() => setShowTypeModal(true)}
          className="flex items-center gap-1.5 rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          <span>+</span> Add content
        </button>
        <button
          onClick={() => alert("Coming soon!")}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
        >
          🎨 Design
        </button>

        <div className="mx-1 h-5 w-px bg-gray-200" />

        <div className="flex items-center gap-1.5 mr-1 select-none">
          {/* Desktop View Switcher */}
          <button
            onClick={() => setPreviewDevice("desktop")}
            title="Desktop view"
            className={`p-1.5 rounded-lg transition-colors outline-none ${
              previewDevice === "desktop"
                ? "bg-gray-150 text-gray-800"
                : "text-gray-455 hover:text-gray-600 hover:bg-gray-100"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
            </svg>
          </button>
          
          {/* Mobile View Switcher */}
          <button
            onClick={() => setPreviewDevice("mobile")}
            title="Mobile view"
            className={`p-1.5 rounded-lg transition-colors outline-none ${
              previewDevice === "mobile"
                ? "bg-gray-150 text-gray-800"
                : "text-gray-455 hover:text-gray-600 hover:bg-gray-100"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-6 18h9" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <ToolbarIconButton
            icon="/icons/play.png"
            label="Preview"
            onClick={() => {
              if (!formId) return;
              // Hand off the current (possibly unsaved) welcome-screen state so
              // the Preview tab reflects the latest Builder state. Question data
              // itself is loaded by the Preview route directly from the backend.
              savePreviewDraft(formId, {
                welcomeTitle,
                welcomeDescription,
                buttonText,
                timeToComplete,
              });
              window.open(`/forms/${formId}/preview`, "_blank");
            }}
          />
          <ToolbarIconButton icon="/icons/accessibility-testing.png" label="Check accessibility" onClick={() => alert("Coming soon!")} />
          <ToolbarIconButton icon="/icons/version-history.png" label="Version history" onClick={() => alert("Coming soon!")} />
          <ToolbarIconButton icon="/icons/translations.png" label="Translations" onClick={() => alert("Coming soon!")} />
          <ToolbarIconButton icon="/icons/settings.png" label="Settings" onClick={() => alert("Coming soon!")} />
        </div>
      </div>
      )}

      {/* Secondary Workflow Sub-toolbar */}
      {activeTab === "workflow" && (
        <div className="flex items-center justify-between border-b bg-white px-6 py-1.5">
          <div className="flex items-center">
            {wfSubTabs.map((subTabId) => (
              <button
                key={subTabId}
                onClick={() => {
                  if (subTabId === "branching") { setWorkflowSubTab("branching"); setShowLogicModal(true); setLogicModalQuestionId(questions[0]?.id ?? null); }
                  else if (subTabId === "scoring") { setWorkflowSubTab("scoring"); setShowScoringModal(true); }
                  else if (subTabId === "tagging") { setWorkflowSubTab("tagging"); setShowTaggingModal(true); }
                  else if (subTabId === "outcome") { setWorkflowSubTab("outcome"); setShowOutcomeQuizModal(true); }
                }}
                className={`px-4 py-2.5 text-[13px] font-medium transition-all border-b-2 ${
                  workflowSubTab === subTabId
                    ? "border-gray-900 text-gray-900 font-semibold"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {wfSubTabLabels[subTabId]}
              </button>
            ))}
          </div>
          {/* Right side icons */}
          <div className="flex items-center gap-1">
            <button
              title="Preview"
              onClick={() => {
                if (!formId) return;
                savePreviewDraft(formId, { welcomeTitle, welcomeDescription, buttonText, timeToComplete });
                window.open(`/forms/${formId}/preview`, "_blank");
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
              </svg>
            </button>
            <button
              title="Variables"
              onClick={() => setShowVariablesModal(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors font-bold text-xs outline-none"
            >
              (x)
            </button>
            <button title="Restart" className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
            <button title="Accessibility" className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.355a7.5 7.5 0 01-3 0" />
              </svg>
            </button>
            <button title="Settings" className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {activeTab === "workflow" ? (
          <WorkflowCanvas
            form={form}
            questions={questions}
            onOpenLogicModal={(qId) => {
              setLogicModalQuestionId(qId);
              setShowLogicModal(true);
            }}
            onOpenScoringModal={() => setShowScoringModal(true)}
            onOpenTaggingModal={() => setShowTaggingModal(true)}
            onOpenOutcomeQuizModal={() => setShowOutcomeQuizModal(true)}
          />
        ) : activeTab === "connect" ? (
          <ConnectCanvas
            form={form}
            onSaveSettings={handleSaveFormSettings}
          />
        ) : (
          <>
            {/* Left sidebar: Pages */}
            <aside className="w-64 shrink-0 overflow-y-auto border-r bg-gray-50 p-4">
          <p className="mb-3 font-medium text-gray-900">Pages</p>

          <div className="mb-4 flex items-center gap-2 rounded-lg bg-gray-200 px-3 py-3">
            <span className="text-gray-600">▯|</span>
          </div>

          {/* Questions list with drag handles */}
          {questions.map((q, i) => (
            <div
              key={q.id}
              draggable={true}
              onDragStart={() => handleDragStart(i)}
              onDragOver={handleDragOver}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(i);
              }}
              onClick={() => setSelectedQuestionId(q.id)}
              className={`mb-2 flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer ${
                selectedQuestionId === q.id ? "bg-gray-200" : "bg-gray-100 hover:bg-gray-150"
              } ${dragIndex === i ? "opacity-50" : ""}`}
            >
              {/* Drag handle */}
              <div className="flex h-5 w-5 items-center justify-center rounded bg-gray-200 text-xs">
                ⋮⋮⋮
              </div>
              {/* Question number */}
              <div className="flex h-5 w-5 items-center justify-center text-xs font-medium text-gray-600">
                {i + 1}
              </div>
              {/* Question icon */}
              <div className={`flex h-6 w-6 items-center justify-center text-xs font-bold rounded-md shrink-0 ${getQuestionIconDetails(q.type).color}`}>
                {getQuestionIconDetails(q.type).icon}
              </div>
              <span className="flex-1 truncate">{q.title || "..."}</span>
              
              {/* Three-dot menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation(); // Avoid selecting the question
                    setActiveQuestionMenuId(activeQuestionMenuId === q.id ? null : q.id);
                  }}
                  className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-gray-300/60 text-gray-500 hover:text-gray-800 transition-colors"
                >
                  <span className="text-base font-bold leading-none">⋮</span>
                </button>
                
                {activeQuestionMenuId === q.id && (
                  <div
                    onClick={(e) => e.stopPropagation()} // Avoid closing on clicking options
                    className="absolute right-0 mt-1.5 w-44 rounded-xl border border-gray-150 bg-white py-1 shadow-lg ring-1 ring-black/5 z-30 font-medium text-gray-700"
                  >
                    <button
                      type="button"
                      disabled={i === 0}
                      onClick={() => handleMoveQuestionUp(i)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-left hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent"
                    >
                      <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                      </svg>
                      Move up
                    </button>
                    <button
                      type="button"
                      disabled={i === questions.length - 1}
                      onClick={() => handleMoveQuestionDown(i)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-left hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent"
                    >
                      <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                      Move down
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDuplicateQuestion(q)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-left hover:bg-gray-50"
                    >
                      <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                      </svg>
                      Duplicate
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-left text-red-650 hover:bg-red-50"
                    >
                      <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Add content button */}
          <button
            onClick={() => setShowTypeModal(true)}
            className="mb-6 flex w-full items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-gray-500 hover:bg-gray-100"
          >
            + Add content
          </button>

          <div className="flex items-center justify-between border-t pt-4">
            <p className="font-medium text-gray-900">Endings</p>
            <button className="rounded-md border p-1 text-gray-500 hover:bg-gray-100">+</button>
          </div>
        </aside>

        {/* Center canvas: Question preview */}
        <main className="flex flex-1 items-center justify-center bg-[#fafafb] p-8 overflow-y-auto">
          {previewDevice === "mobile" ? (
            /* Mobile View Container */
            <div className="w-[360px] h-[600px] bg-white rounded-[32px] border-[6px] border-[#26212e] shadow-2xl relative overflow-y-auto p-6 flex flex-col justify-between transition-all duration-300">
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 h-3.5 w-20 bg-[#26212e] rounded-full select-none pointer-events-none z-20" />
              <div className="flex-1 flex flex-col justify-center pt-2">
                {selectedQuestionId && selectedQuestion ? (
                  <QuestionCanvas
                    key={selectedQuestion.id}
                    question={{ ...selectedQuestion, form_id: formId }}
                    index={questions.findIndex((q) => q.id === selectedQuestionId)}
                    onUpdate={handleQuestionUpdate}
                  />
                ) : (
                  <div className="w-full text-center space-y-4">
                    <input
                      value={welcomeTitle}
                      onChange={(e) => setWelcomeTitle(e.target.value)}
                      className="w-full bg-transparent text-center text-xl font-bold text-gray-800 outline-none placeholder:text-gray-400"
                      placeholder="Say hi! Recall information with @"
                    />
                    <input
                      value={welcomeDescription}
                      onChange={(e) => setWelcomeDescription(e.target.value)}
                      className="w-full bg-transparent text-center text-xs text-gray-400 outline-none"
                      placeholder="Description (optional)"
                    />
                    <button className="mt-4 rounded-xl bg-gray-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-gray-800 transition-colors">
                      {buttonText}
                    </button>
                    {timeToComplete && (
                      <p className="mt-2 flex items-center justify-center gap-1 text-[10px] text-gray-400 font-semibold">
                        <span>⏱</span> Takes 1 minute
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Desktop View Container */
            <div className="w-full max-w-[850px] min-h-[480px] bg-white rounded-[32px] border border-gray-200/80 shadow-md p-10 flex flex-col justify-center transition-all duration-300">
              {selectedQuestionId && selectedQuestion ? (
                <QuestionCanvas
                  key={selectedQuestion.id}
                  question={{ ...selectedQuestion, form_id: formId }}
                  index={questions.findIndex((q) => q.id === selectedQuestionId)}
                  onUpdate={handleQuestionUpdate}
                />
              ) : (
                <div className="w-full text-center space-y-6">
                  <input
                    value={welcomeTitle}
                    onChange={(e) => setWelcomeTitle(e.target.value)}
                    className="w-full bg-transparent text-center text-3xl font-black text-gray-900 outline-none placeholder:text-gray-400"
                    placeholder="Say hi! Recall information with @"
                  />
                  <input
                    value={welcomeDescription}
                    onChange={(e) => setWelcomeDescription(e.target.value)}
                    className="mt-2 w-full bg-transparent text-center text-sm text-gray-450 outline-none"
                    placeholder="Description (optional)"
                  />
                  <button className="mt-6 rounded-xl bg-gray-900 px-6 py-3 text-xs font-bold text-white hover:bg-gray-800 transition-colors">
                    {buttonText}
                  </button>
                  {timeToComplete && (
                    <p className="mt-3 flex items-center justify-center gap-1 text-xs text-gray-450 font-semibold">
                      <span>⏱</span> Takes 1 minute
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </main>

        {/* Right sidebar: Question settings */}
        <aside className="w-72 shrink-0 overflow-y-auto border-l p-4">
          {selectedQuestionId && selectedQuestion ? (
            <>
              <div
                onClick={() => setSelectedQuestionId(null)}
                className="mb-4 flex items-center gap-2 rounded-lg bg-gray-200 px-3 py-3 cursor-pointer"
              >
                <span className="text-gray-600">▯|</span>
                <span className="ml-2">Back to questions</span>
              </div>

              {/* Question settings form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Question</label>
                  <input
                    value={selectedQuestion.title || ""}
                    onChange={(e) => {
                      // Keep the UI snappy locally...
                      handleQuestionUpdate({ ...selectedQuestion, title: e.target.value });
                    }}
                    onBlur={(e) => patchQuestion({ title: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description (optional)</label>
                  <input
                    value={selectedQuestion.description || ""}
                    onChange={(e) => {
                      handleQuestionUpdate({ ...selectedQuestion, description: e.target.value });
                    }}
                    onBlur={(e) => patchQuestion({ description: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                {selectedQuestion.type !== "welcome_screen" && selectedQuestion.type !== "ending_screen" && (
                  <>
                    {/* Text / Video Toggle */}
                    <div className="flex bg-gray-100 rounded-lg p-0.5 w-full select-none mb-3 border border-gray-200">
                      <button
                        type="button"
                        onClick={() => {}}
                        className="flex-1 text-center py-1 text-xs font-bold bg-white text-gray-800 rounded-md shadow-xs flex items-center justify-center gap-1.5 border border-gray-150"
                      >
                        <span>=</span> Text
                      </button>
                      <button
                        type="button"
                        onClick={() => setComingSoonItem("Video Question Mode")}
                        className="flex-1 text-center py-1 text-xs font-bold text-gray-500 hover:text-gray-800 rounded-md flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <span>📹</span> Video
                      </button>
                    </div>

                    {/* Answer Header & Type Selector */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide">Answer</label>
                      <select
                        value={selectedQuestion.type}
                        onChange={(e) => {
                          const newType = e.target.value;
                          patchQuestion({ type: newType });
                        }}
                        className="w-full border border-gray-300 rounded-xl px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white font-bold text-gray-700 outline-none shadow-xs"
                      >
                        <option value="short_text">✉ Short Text</option>
                        <option value="long_text">✉ Long Text</option>
                        <option value="email">✉ Email</option>
                        <option value="number">✉ Number</option>
                        <option value="phone">✉ Phone number</option>
                        <option value="multiple_choice">● Multiple choice</option>
                        <option value="dropdown">▼ Dropdown</option>
                        <option value="rating">★ Rating</option>
                        <option value="opinion_scale">◯ Opinion scale</option>
                        <option value="yes_no">✓ Yes/No</option>
                        <option value="date">📅 Date</option>
                        <option value="statement">‖ Statement</option>
                        <option value="contact_info">👤 Contact Info</option>
                      </select>
                    </div>

                    {/* Toggles dynamically based on question type */}
                    <div className="space-y-3 pt-3 border-t">
                      {/* Required Toggle */}
                      {["short_text", "long_text", "email", "number", "phone", "multiple_choice", "dropdown", "rating", "opinion_scale", "yes_no", "date"].includes(selectedQuestion.type) && (
                        <div className="flex items-center justify-between py-1">
                          <label className="text-sm font-medium text-gray-755">Required</label>
                          <ToggleSwitch
                            checked={selectedQuestion.required || false}
                            onChange={(checked) => patchQuestion({ required: checked })}
                          />
                        </div>
                      )}

                      {/* Max Characters Toggle */}
                      {["short_text", "long_text"].includes(selectedQuestion.type) && (
                        <>
                          <div className="flex items-center justify-between py-1">
                            <label className="text-sm font-medium text-gray-755">Max characters</label>
                            <ToggleSwitch
                              checked={localSettings.maxCharactersEnabled ?? false}
                              onChange={(checked) => {
                                const nextSettings: any = {
                                  ...localSettings,
                                  maxCharactersEnabled: checked,
                                };
                                if (!checked) {
                                  delete nextSettings.maxLength;
                                } else {
                                  nextSettings.maxLength = 100;
                                }
                                setLocalSettings(nextSettings);
                                handleQuestionUpdate({ ...selectedQuestion, settings: nextSettings });
                                patchQuestion({ settings: nextSettings });
                              }}
                            />
                          </div>
                          {(localSettings.maxCharactersEnabled ?? false) && (
                            <div className="space-y-1 pl-2 border-l-2 border-gray-200">
                              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide">Max Characters</label>
                              <div className="flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden h-8 w-28">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = localSettings.maxLength ?? 100;
                                    const nextVal = Math.max(1, current - 1);
                                    const nextSettings = { ...localSettings, maxLength: nextVal };
                                    setLocalSettings(nextSettings);
                                    handleQuestionUpdate({ ...selectedQuestion, settings: nextSettings });
                                    patchQuestion({ settings: nextSettings });
                                  }}
                                  className="px-2 h-full hover:bg-gray-100 font-bold border-r text-gray-650"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min={1}
                                  value={localSettings.maxLength ?? 100}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value, 10) || 1;
                                    setLocalSettings({ ...localSettings, maxLength: val });
                                  }}
                                  onBlur={(e) => {
                                    const val = parseInt(e.target.value, 10) || 1;
                                    const nextSettings = { ...localSettings, maxLength: val };
                                    setLocalSettings(nextSettings);
                                    handleQuestionUpdate({ ...selectedQuestion, settings: nextSettings });
                                    patchQuestion({ settings: nextSettings });
                                  }}
                                  className="w-12 text-center h-full outline-none text-xs font-bold bg-transparent"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = localSettings.maxLength ?? 100;
                                    const nextVal = current + 1;
                                    const nextSettings = { ...localSettings, maxLength: nextVal };
                                    setLocalSettings(nextSettings);
                                    handleQuestionUpdate({ ...selectedQuestion, settings: nextSettings });
                                    patchQuestion({ settings: nextSettings });
                                  }}
                                  className="px-2 h-full hover:bg-gray-100 font-bold border-l text-gray-650"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* Min/Max numeric validation */}
                      {selectedQuestion.type === "number" && (
                        <>
                          <div className="flex items-center justify-between py-1">
                            <label className="text-sm font-medium text-gray-755">Min/Max validation</label>
                            <ToggleSwitch
                              checked={localSettings.minMaxEnabled ?? false}
                              onChange={(checked) => {
                                const nextSettings: any = {
                                  ...localSettings,
                                  minMaxEnabled: checked,
                                };
                                if (!checked) {
                                  delete nextSettings.min;
                                  delete nextSettings.max;
                                } else {
                                  nextSettings.min = 1;
                                  nextSettings.max = 100;
                                }
                                setLocalSettings(nextSettings);
                                handleQuestionUpdate({ ...selectedQuestion, settings: nextSettings });
                                patchQuestion({ settings: nextSettings });
                              }}
                            />
                          </div>
                          {(localSettings.minMaxEnabled ?? false) && (
                            <div className="space-y-2 pl-2 border-l-2 border-gray-200">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500 font-semibold">Min value</span>
                                <div className="flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden h-8 w-28">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const current = localSettings.min ?? 1;
                                      const nextVal = current - 1;
                                      const nextSettings = { ...localSettings, min: nextVal };
                                      setLocalSettings(nextSettings);
                                      handleQuestionUpdate({ ...selectedQuestion, settings: nextSettings });
                                      patchQuestion({ settings: nextSettings });
                                    }}
                                    className="px-2 h-full hover:bg-gray-100 font-bold border-r text-gray-650"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    value={localSettings.min ?? 1}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value, 10) || 0;
                                      setLocalSettings({ ...localSettings, min: val });
                                    }}
                                    onBlur={(e) => {
                                      const val = parseInt(e.target.value, 10) || 0;
                                      const nextSettings = { ...localSettings, min: val };
                                      setLocalSettings(nextSettings);
                                      handleQuestionUpdate({ ...selectedQuestion, settings: nextSettings });
                                      patchQuestion({ settings: nextSettings });
                                    }}
                                    className="w-12 text-center h-full outline-none text-xs font-bold bg-transparent"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const current = localSettings.min ?? 1;
                                      const nextVal = current + 1;
                                      const nextSettings = { ...localSettings, min: nextVal };
                                      setLocalSettings(nextSettings);
                                      handleQuestionUpdate({ ...selectedQuestion, settings: nextSettings });
                                      patchQuestion({ settings: nextSettings });
                                    }}
                                    className="px-2 h-full hover:bg-gray-100 font-bold border-l text-gray-650"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500 font-semibold">Max value</span>
                                <div className="flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden h-8 w-28">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const current = localSettings.max ?? 100;
                                      const nextVal = current - 1;
                                      const nextSettings = { ...localSettings, max: nextVal };
                                      setLocalSettings(nextSettings);
                                      handleQuestionUpdate({ ...selectedQuestion, settings: nextSettings });
                                      patchQuestion({ settings: nextSettings });
                                    }}
                                    className="px-2 h-full hover:bg-gray-100 font-bold border-r text-gray-650"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    value={localSettings.max ?? 100}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value, 10) || 0;
                                      setLocalSettings({ ...localSettings, max: val });
                                    }}
                                    onBlur={(e) => {
                                      const val = parseInt(e.target.value, 10) || 0;
                                      const nextSettings = { ...localSettings, max: val };
                                      setLocalSettings(nextSettings);
                                      handleQuestionUpdate({ ...selectedQuestion, settings: nextSettings });
                                      patchQuestion({ settings: nextSettings });
                                    }}
                                    className="w-12 text-center h-full outline-none text-xs font-bold bg-transparent"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const current = localSettings.max ?? 100;
                                      const nextVal = current + 1;
                                      const nextSettings = { ...localSettings, max: nextVal };
                                      setLocalSettings(nextSettings);
                                      handleQuestionUpdate({ ...selectedQuestion, settings: nextSettings });
                                      patchQuestion({ settings: nextSettings });
                                    }}
                                    className="px-2 h-full hover:bg-gray-100 font-bold border-l text-gray-650"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* Answer Validation Toggle */}
                      {["short_text", "long_text", "email", "number"].includes(selectedQuestion.type) && (
                        <>
                          <div className="flex items-center justify-between py-1">
                            <label className="text-sm font-medium text-gray-755">Answer validation</label>
                            <ToggleSwitch
                              checked={localSettings.validationEnabled ?? false}
                              onChange={(checked) => {
                                const nextSettings: any = {
                                  ...localSettings,
                                  validationEnabled: checked,
                                };
                                if (!checked) {
                                  delete nextSettings.validationRegex;
                                }
                                setLocalSettings(nextSettings);
                                handleQuestionUpdate({ ...selectedQuestion, settings: nextSettings });
                                patchQuestion({ settings: nextSettings });
                              }}
                            />
                          </div>
                          {(localSettings.validationEnabled ?? false) && (
                            <div className="space-y-1 pl-2 border-l-2 border-gray-200">
                              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide">Validation Regex</label>
                              <input
                                type="text"
                                value={localSettings.validationRegex ?? ""}
                                placeholder="^[A-Za-z0-9._%+-]+@study\.iitm\.ac\.in$"
                                onChange={(e) => {
                                  setLocalSettings({ ...localSettings, validationRegex: e.target.value });
                                }}
                                onBlur={(e) => {
                                  const nextSettings: any = {
                                    ...localSettings,
                                    validationRegex: e.target.value,
                                  };
                                  setLocalSettings(nextSettings);
                                  handleQuestionUpdate({ ...selectedQuestion, settings: nextSettings });
                                  patchQuestion({ settings: nextSettings });
                                }}
                                className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white font-semibold"
                              />
                            </div>
                          )}
                        </>
                      )}

                      {/* Custom Placeholder Toggle */}
                      {["short_text", "long_text", "email", "number", "phone", "dropdown"].includes(selectedQuestion.type) && (
                        <>
                          <div className="flex items-center justify-between py-1">
                            <label className="text-sm font-medium text-gray-755">Custom placeholder text</label>
                            <ToggleSwitch
                              checked={localSettings.customPlaceholderEnabled ?? false}
                              onChange={(checked) => {
                                const nextSettings: any = {
                                  ...localSettings,
                                  customPlaceholderEnabled: checked,
                                };
                                if (!checked) {
                                  delete nextSettings.placeholder;
                                }
                                setLocalSettings(nextSettings);
                                handleQuestionUpdate({ ...selectedQuestion, settings: nextSettings });
                                patchQuestion({ settings: nextSettings });
                              }}
                            />
                          </div>
                          {(localSettings.customPlaceholderEnabled ?? false) && (
                            <div className="space-y-1 pl-2 border-l-2 border-gray-200">
                              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide">Placeholder Text</label>
                              <input
                                type="text"
                                value={localSettings.placeholder ?? ""}
                                placeholder="Type your answer here"
                                onChange={(e) => {
                                  setLocalSettings({ ...localSettings, placeholder: e.target.value });
                                }}
                                onBlur={(e) => {
                                  const nextSettings: any = {
                                    ...localSettings,
                                    placeholder: e.target.value,
                                  };
                                  setLocalSettings(nextSettings);
                                  handleQuestionUpdate({ ...selectedQuestion, settings: nextSettings });
                                  patchQuestion({ settings: nextSettings });
                                }}
                                className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white font-semibold"
                              />
                            </div>
                          )}
                        </>
                      )}

                      {/* Map to Contacts Toggle */}
                      {["short_text", "long_text", "email", "number", "phone", "multiple_choice", "dropdown", "rating", "opinion_scale", "yes_no", "date", "contact_info"].includes(selectedQuestion.type) && (
                        <>
                          <div className="flex items-center justify-between py-1">
                            <label className="text-sm font-medium text-gray-755">Map to contacts</label>
                            <ToggleSwitch
                              checked={localSettings.mapToContactsEnabled ?? false}
                              onChange={(checked) => {
                                const nextSettings: any = {
                                  ...localSettings,
                                  mapToContactsEnabled: checked,
                                };
                                if (!checked) {
                                  delete nextSettings.mappedPropertyId;
                                  delete nextSettings.mappedPropertyName;
                                }
                                setLocalSettings(nextSettings);
                                handleQuestionUpdate({ ...selectedQuestion, settings: nextSettings });
                                patchQuestion({ settings: nextSettings });
                              }}
                            />
                          </div>
                          {(localSettings.mapToContactsEnabled ?? false) && (
                            <div className="space-y-1 pl-2 border-l-2 border-gray-200">
                              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide">Map to</label>
                              <select
                                value={localSettings.mappedPropertyId ?? ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const nameMap: any = {
                                    "email": "email",
                                    "firstName": "first_name",
                                    "lastName": "last_name",
                                    "phone": "phone",
                                    "company": "company"
                                  };
                                  const nextSettings = {
                                    ...localSettings,
                                    mappedPropertyId: val,
                                    mappedPropertyName: nameMap[val] || ""
                                  };
                                  setLocalSettings(nextSettings);
                                  handleQuestionUpdate({ ...selectedQuestion, settings: nextSettings });
                                  patchQuestion({ settings: nextSettings });
                                }}
                                className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white font-semibold text-gray-700 outline-none"
                              >
                                <option value="">Select property...</option>
                                <option value="email">Email</option>
                                <option value="firstName">First name</option>
                                <option value="lastName">Last name</option>
                                <option value="phone">Phone number</option>
                                <option value="company">Company</option>
                              </select>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Image or Video media section */}
                    <div className="flex items-center justify-between border-t pt-3 mt-3">
                      <label className="text-sm font-medium">Image or video</label>
                      <label className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-gray-300 bg-white text-lg leading-none text-gray-650 hover:bg-gray-50">
                        +
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = () => {
                              patchSettings({ imageUrl: reader.result as string });
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                    </div>
                    {selectedQuestion.settings?.imageUrl && (
                      <div className="mt-2 flex items-center gap-2">
                        <img
                          src={selectedQuestion.settings.imageUrl}
                          alt="Question media"
                          className="h-12 w-12 rounded object-cover border"
                        />
                        <button
                          type="button"
                          onClick={() => patchSettings({ imageUrl: null })}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* Contact Info Settings */}
                {selectedQuestion.type === "contact_info" && (
                  <div className="border-t pt-4">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Answer</h3>
                    
                    {/* Fields List with Eye and Required Asterisk Toggles */}
                    <div className="space-y-2">
                      {[
                        { key: "firstName", label: "First name" },
                        { key: "lastName", label: "Last name" },
                        { key: "phone", label: "Phone number" },
                        { key: "email", label: "Email" },
                        { key: "company", label: "Company" }
                      ].map((field) => {
                        const fieldConfig = selectedQuestion.settings?.fields?.[field.key] || {};
                        // default values if not explicitly set
                        const isVisible = fieldConfig.visible ?? (field.key !== "email" && field.key !== "company");
                        const isRequired = fieldConfig.required ?? false;

                        return (
                          <div key={field.key} className="flex items-center justify-between py-1.5 px-3 rounded-xl border border-gray-150 hover:bg-gray-50/50 bg-white">
                            <span className="text-sm font-medium text-gray-700">{field.label}</span>
                            <div className="flex items-center gap-1.5">
                              {/* Eye icon button to toggle visibility */}
                              <button
                                type="button"
                                onClick={() => {
                                  const currentFields = selectedQuestion.settings?.fields || {};
                                  const newFields = {
                                    ...currentFields,
                                    [field.key]: {
                                      ...currentFields[field.key],
                                      visible: !isVisible
                                    }
                                  };
                                  patchSettings({ fields: newFields });
                                }}
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                                title={isVisible ? "Hide from form" : "Show in form"}
                              >
                                {isVisible ? (
                                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                    <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                                    <path fillRule="evenodd" d="M.664 9.576a10.03 10.03 0 0118.672 0 1.002 1.002 0 010 .848 10.03 10.03 0 01-18.672 0 1.002 1.002 0 010-.848zM10 15a5 5 0 100-10 5 5 0 000 10z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-350">
                                    <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06L3.28 2.22zM10.15 13.33L8.35 11.53c.18-.3.3-.65.3-1.03 0-.6-.28-1.12-.72-1.47l-1.8-1.8a2.5 2.5 0 013.9 3.9l.12.2zm4.72.63L13.12 12.2a6.012 6.012 0 001.99-2.2 1.002 1.002 0 000-.848A10.046 10.046 0 006.12 4.417L4.57 2.868A11.968 11.968 0 0110 3a11.963 11.963 0 019.336 6.576 1.002 1.002 0 010 .848 11.942 11.942 0 01-4.466 4.137zm-9.74-.29A10.03 10.03 0 01.664 10a1.002 1.002 0 010-.848 11.941 11.941 0 013.066-3.469l1.4 1.4A6.013 6.013 0 003.11 10a6.013 6.013 0 005.88 4.417l.79.79a7.973 7.973 0 01-4.65-1.5z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </button>

                              {/* Required Asterisk Toggle */}
                              <button
                                type="button"
                                onClick={() => {
                                  const currentFields = selectedQuestion.settings?.fields || {};
                                  const newFields = {
                                    ...currentFields,
                                    [field.key]: {
                                      ...currentFields[field.key],
                                      required: !isRequired
                                    }
                                  };
                                  patchSettings({ fields: newFields });
                                }}
                                className="p-1 rounded hover:bg-gray-150 flex items-center justify-center h-7 w-7 transition-colors"
                                title={isRequired ? "Make field optional" : "Make field required"}
                              >
                                {isRequired ? (
                                  <span className="text-red-500 font-bold text-base leading-none select-none">*</span>
                                ) : (
                                  <span className="text-gray-300 font-bold text-base leading-none select-none">*</span>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Phone Country default select dropdown */}
                    {(selectedQuestion.settings?.fields?.phone?.visible ?? true) && (
                      <div className="mt-3">
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Phone Country Default</label>
                        <select
                          value={selectedQuestion.settings?.defaultCountry ?? "India"}
                          onChange={(e) => patchSettings({ defaultCountry: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        >
                          <option value="India">🇮🇳 India</option>
                          <option value="United States">🇺🇸 United States</option>
                          <option value="United Kingdom">🇬🇧 United Kingdom</option>
                          <option value="Canada">🇨🇦 Canada</option>
                          <option value="Australia">🇦🇺 Australia</option>
                        </select>
                      </div>
                    )}

                    {/* Map to contacts */}
                    <div className="flex items-center justify-between py-1.5 mt-3 border-t pt-3">
                      <label className="text-sm font-medium text-gray-700">Map to Contacts</label>
                      <ToggleSwitch
                        checked={selectedQuestion.settings?.map_to_contacts_enabled ?? false}
                        onChange={(checked) => patchSettings({ map_to_contacts_enabled: checked })}
                      />
                    </div>

                    {/* Image or video */}
                    <div className="flex items-center justify-between border-t pt-3 mt-3">
                      <label className="text-sm font-medium">Image or video</label>
                      <label className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-gray-300 bg-white text-lg leading-none text-gray-600 hover:bg-gray-50">
                        +
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = () => {
                              patchSettings({ imageUrl: reader.result as string });
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                    </div>
                    {selectedQuestion.settings?.imageUrl && (
                      <div className="mt-2 flex items-center gap-2">
                        <img
                          src={selectedQuestion.settings.imageUrl}
                          alt="Question media"
                          className="h-12 w-12 rounded object-cover border"
                        />
                        <button
                          onClick={() => patchSettings({ imageUrl: null })}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Multiple Choice Settings */}
                {selectedQuestion.type === "multiple_choice" && (
                  <div className="border-t pt-4">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Answer</h3>

                    {/* Multiple Selection */}
                    <div className="flex items-center justify-between py-1.5">
                      <label className="text-sm font-medium text-gray-700">Multiple selection</label>
                      <ToggleSwitch
                        checked={localSettings.allowMultiple ?? false}
                        onChange={(checked) => {
                          const nextSettings: any = {
                            ...(selectedQuestion.settings || {}),
                            allowMultiple: checked,
                          };
                          if (!checked) {
                            delete nextSettings.selectionMode;
                            delete nextSettings.exactSelectionCount;
                            delete nextSettings.minSelection;
                            delete nextSettings.maxSelection;
                          } else {
                            nextSettings.selectionMode = "unlimited";
                          }
                          setLocalSettings(nextSettings);
                          handleQuestionUpdate({ ...selectedQuestion, settings: nextSettings });
                          patchQuestion({ settings: nextSettings });
                        }}
                      />
                    </div>

                    {/* Multiple Selection Mode Controls */}
                    {localSettings.allowMultiple && (
                      <div className="space-y-3 mt-2">
                        <div className="mb-3">
                          <select
                            value={localSettings.selectionMode ?? "unlimited"}
                            onChange={(e) => {
                              const mode = e.target.value as "unlimited" | "exact" | "range";
                              const nextSettings: any = {
                                ...(selectedQuestion.settings || {}),
                                selectionMode: mode,
                              };
                              if (mode !== "exact") {
                                delete nextSettings.exactSelectionCount;
                              } else {
                                nextSettings.exactSelectionCount = 1;
                              }
                              if (mode !== "range") {
                                delete nextSettings.minSelection;
                                delete nextSettings.maxSelection;
                              } else {
                                nextSettings.minSelection = 1;
                                nextSettings.maxSelection = Math.max(1, selectedQuestion.options?.length ?? 1);
                              }
                              setLocalSettings(nextSettings);
                              handleQuestionUpdate({ ...selectedQuestion, settings: nextSettings });
                              patchQuestion({ settings: nextSettings });
                            }}
                            className="w-full border border-gray-300 rounded-xl px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white font-bold text-gray-700 outline-none shadow-xs"
                          >
                            <option value="unlimited">Unlimited</option>
                            <option value="exact">Exact number</option>
                            <option value="range">Range</option>
                          </select>
                        </div>

                        {/* Exact number input */}
                        {localSettings.selectionMode === "exact" && (
                          <div className="flex items-center justify-between py-1.5 border-t border-gray-150 pt-2.5">
                            <span className="text-sm font-medium text-gray-700">Exact number</span>
                            <div className="flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden h-8">
                              <button
                                type="button"
                                onClick={() => {
                                  const current = localSettings.exactSelectionCount ?? 1;
                                  const nextVal = Math.max(1, current - 1);
                                  const nextSettings = { ...localSettings, exactSelectionCount: nextVal };
                                  setLocalSettings(nextSettings);
                                  handleQuestionUpdate({ ...selectedQuestion, settings: nextSettings });
                                  patchQuestion({ settings: nextSettings });
                                }}
                                className="px-2 h-full hover:bg-gray-100 font-bold border-r text-gray-650"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min={1}
                                max={Math.max(1, selectedQuestion.options?.length ?? 1)}
                                value={localSettings.exactSelectionCount ?? 1}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10) || 1;
                                  const maxOptions = Math.max(1, selectedQuestion.options?.length ?? 1);
                                  const clamped = Math.min(Math.max(1, val), maxOptions);
                                  setLocalSettings({ ...localSettings, exactSelectionCount: clamped });
                                }}
                                onBlur={(e) => {
                                  const val = parseInt(e.target.value, 10) || 1;
                                  const maxOptions = Math.max(1, selectedQuestion.options?.length ?? 1);
                                  const clamped = Math.min(Math.max(1, val), maxOptions);
                                  const nextSettings = { ...localSettings, exactSelectionCount: clamped };
                                  setLocalSettings(nextSettings);
                                  handleQuestionUpdate({ ...selectedQuestion, settings: nextSettings });
                                  patchQuestion({ settings: nextSettings });
                                }}
                                className="w-12 text-center h-full outline-none text-xs font-bold bg-transparent"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const current = localSettings.exactSelectionCount ?? 1;
                                  const maxOptions = Math.max(1, selectedQuestion.options?.length ?? 1);
                                  const nextVal = Math.min(maxOptions, current + 1);
                                  const nextSettings = { ...localSettings, exactSelectionCount: nextVal };
                                  setLocalSettings(nextSettings);
                                  handleQuestionUpdate({ ...selectedQuestion, settings: nextSettings });
                                  patchQuestion({ settings: nextSettings });
                                }}
                                className="px-2 h-full hover:bg-gray-100 font-bold border-l text-gray-650"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Range inputs */}
                        {localSettings.selectionMode === "range" && (
                          <div className="space-y-2.5 border-t border-gray-150 pt-2.5">
                            {/* Min Selection Row */}
                            <div className="flex items-center justify-between py-1">
                              <span className="text-sm font-medium text-gray-700">Minimum</span>
                              <div className="flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden h-8">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = localSettings.minSelection ?? 1;
                                    const nextVal = Math.max(1, current - 1);
                                    const nextSettings = { ...localSettings, minSelection: nextVal };
                                    setLocalSettings(nextSettings);
                                    handleQuestionUpdate({ ...selectedQuestion, settings: nextSettings });
                                    patchQuestion({ settings: nextSettings });
                                  }}
                                  className="px-2 h-full hover:bg-gray-100 font-bold border-r text-gray-650"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min={1}
                                  max={localSettings.maxSelection ?? Math.max(1, selectedQuestion.options?.length ?? 1)}
                                  value={localSettings.minSelection ?? 1}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value, 10) || 1;
                                    const maxOptions = localSettings.maxSelection ?? Math.max(1, selectedQuestion.options?.length ?? 1);
                                    const clamped = Math.min(Math.max(1, val), maxOptions);
                                    setLocalSettings({ ...localSettings, minSelection: clamped });
                                  }}
                                  onBlur={(e) => {
                                    const val = parseInt(e.target.value, 10) || 1;
                                    const maxOptions = localSettings.maxSelection ?? Math.max(1, selectedQuestion.options?.length ?? 1);
                                    const clamped = Math.min(Math.max(1, val), maxOptions);
                                    const nextSettings = { ...localSettings, minSelection: clamped };
                                    setLocalSettings(nextSettings);
                                    handleQuestionUpdate({ ...selectedQuestion, settings: nextSettings });
                                    patchQuestion({ settings: nextSettings });
                                  }}
                                  className="w-12 text-center h-full outline-none text-xs font-bold bg-transparent"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = localSettings.minSelection ?? 1;
                                    const maxOptions = localSettings.maxSelection ?? Math.max(1, selectedQuestion.options?.length ?? 1);
                                    const nextVal = Math.min(maxOptions, current + 1);
                                    const nextSettings = { ...localSettings, minSelection: nextVal };
                                    setLocalSettings(nextSettings);
                                    handleQuestionUpdate({ ...selectedQuestion, settings: nextSettings });
                                    patchQuestion({ settings: nextSettings });
                                  }}
                                  className="px-2 h-full hover:bg-gray-100 font-bold border-l text-gray-650"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            {/* Max Selection Row */}
                            <div className="flex items-center justify-between py-1">
                              <span className="text-sm font-medium text-gray-700">Maximum</span>
                              <div className="flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden h-8">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = localSettings.maxSelection ?? Math.max(1, selectedQuestion.options?.length ?? 1);
                                    const minVal = localSettings.minSelection ?? 1;
                                    const nextVal = Math.max(minVal, current - 1);
                                    const nextSettings = { ...localSettings, maxSelection: nextVal };
                                    setLocalSettings(nextSettings);
                                    handleQuestionUpdate({ ...selectedQuestion, settings: nextSettings });
                                    patchQuestion({ settings: nextSettings });
                                  }}
                                  className="px-2 h-full hover:bg-gray-100 font-bold border-r text-gray-650"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min={localSettings.minSelection ?? 1}
                                  max={Math.max(1, selectedQuestion.options?.length ?? 1)}
                                  value={localSettings.maxSelection ?? Math.max(1, selectedQuestion.options?.length ?? 1)}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value, 10) || 1;
                                    const minVal = localSettings.minSelection ?? 1;
                                    const maxOptions = Math.max(1, selectedQuestion.options?.length ?? 1);
                                    const clamped = Math.min(Math.max(minVal, val), maxOptions);
                                    setLocalSettings({ ...localSettings, maxSelection: clamped });
                                  }}
                                  onBlur={(e) => {
                                    const val = parseInt(e.target.value, 10) || 1;
                                    const minVal = localSettings.minSelection ?? 1;
                                    const maxOptions = Math.max(1, selectedQuestion.options?.length ?? 1);
                                    const clamped = Math.min(Math.max(minVal, val), maxOptions);
                                    const nextSettings = { ...localSettings, maxSelection: clamped };
                                    setLocalSettings(nextSettings);
                                    handleQuestionUpdate({ ...selectedQuestion, settings: nextSettings });
                                    patchQuestion({ settings: nextSettings });
                                  }}
                                  className="w-12 text-center h-full outline-none text-xs font-bold bg-transparent"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = localSettings.maxSelection ?? Math.max(1, selectedQuestion.options?.length ?? 1);
                                    const maxOptions = Math.max(1, selectedQuestion.options?.length ?? 1);
                                    const nextVal = Math.min(maxOptions, current + 1);
                                    const nextSettings = { ...localSettings, maxSelection: nextVal };
                                    setLocalSettings(nextSettings);
                                    handleQuestionUpdate({ ...selectedQuestion, settings: nextSettings });
                                    patchQuestion({ settings: nextSettings });
                                  }}
                                  className="px-2 h-full hover:bg-gray-100 font-bold border-l text-gray-650"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Randomize */}
                    <div className="flex items-center justify-between py-1.5">
                      <label className="text-sm font-medium text-gray-700">Randomize</label>
                      <ToggleSwitch
                        checked={selectedQuestion.settings?.randomizeChoices ?? false}
                        onChange={(checked) => patchSettings({ randomizeChoices: checked })}
                      />
                    </div>

                    {/* Other option */}
                    <div className="flex items-center justify-between py-1.5">
                      <label className="text-sm font-medium text-gray-700">"Other" option</label>
                      <ToggleSwitch
                        checked={selectedQuestion.settings?.includeOther ?? false}
                        onChange={(checked) => patchSettings({ includeOther: checked })}
                      />
                    </div>

                    {/* None option */}
                    <div className="flex items-center justify-between py-1.5">
                      <label className="text-sm font-medium text-gray-700">"None" option</label>
                      <ToggleSwitch
                        checked={selectedQuestion.settings?.includeNone ?? false}
                        onChange={(checked) => patchSettings({ includeNone: checked })}
                      />
                    </div>

                    {/* Layout */}
                    <div className="flex items-center justify-between py-1.5">
                      <label className="text-sm font-medium text-gray-700">Vertical alignment</label>
                      <ToggleSwitch
                        checked={selectedQuestion.settings?.layout === "vertical"}
                        onChange={(checked) =>
                          patchSettings({ layout: checked ? "vertical" : "horizontal" })
                        }
                      />
                    </div>
                  </div>
                )}

                
                {/* Rating settings */}
                {selectedQuestion.type === "rating" && (
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-3">
                      {/* Rating Count */}
                      <select
                        value={String(selectedQuestion.settings?.rating_count ?? selectedQuestion.settings?.max_rating ?? 5)}
                        onChange={(e) => {
                          const count = parseInt(e.target.value, 10);
                          // Also update max_rating for backward compatibility
                          patchSettings({ rating_count: count, max_rating: count });
                        }}
                        className="flex-1 border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {[3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                          <option key={num} value={String(num)}>
                            {num}
                          </option>
                        ))}
                      </select>

                      {/* Shape Picker (dropdown-styled trigger + anchored popover) */}
                      <div className="relative flex-1">
                        <button
                          type="button"
                          onClick={() => {
                            setShapePickerValue(selectedQuestion.settings?.rating_shape ?? "star");
                            setShowShapePicker((prev) => !prev);
                          }}
                          className="flex w-full items-center justify-between gap-2 rounded-md border border-gray-300 px-2 py-1.5 text-sm hover:bg-gray-50"
                        >
                          <RatingIcon
                            shape={selectedQuestion.settings?.rating_shape ?? "star"}
                            className="h-4 w-4 text-gray-700"
                          />
                          <span className="ml-auto text-gray-400">⌄</span>
                        </button>
                        {showShapePicker && (
                          <ShapePickerModal
                            isOpen={showShapePicker}
                            onClose={() => setShowShapePicker(false)}
                            currentShape={shapePickerValue}
                            onShapeChange={(shape) => {
                              if (!selectedQuestion) return;
                              setShapePickerValue(shape);
                              patchSettings({ rating_shape: shape });
                            }}
                          />
                        )}
                      </div>
                    </div>

                  </div>
                )}

                {/* Dropdown settings */}
                {selectedQuestion.type === "dropdown" && (
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-medium mb-2">Settings</h3>

                    {/* Randomize */}
                    <div className="flex items-center space-x-3 mb-3">
                      <label className="text-sm font-medium">Randomize</label>
                      <ToggleSwitch
                        checked={selectedQuestion.settings?.randomizeChoices ?? false}
                        onChange={(checked) => patchSettings({ randomizeChoices: checked })}
                        className="ml-auto"
                      />
                    </div>

                    {/* Alphabetical order */}
                    <div className="flex items-center space-x-3 mb-3">
                      <label className="text-sm font-medium">Alphabetical order</label>
                      <ToggleSwitch
                        checked={selectedQuestion.settings?.alphabeticalOrder ?? false}
                        onChange={(checked) => patchSettings({ alphabeticalOrder: checked })}
                        className="ml-auto"
                      />
                    </div>
                  </div>
                )}

                {/* Ending Screen Settings */}
                {selectedQuestion.type === "ending_screen" && (
                  <div className="border-t pt-4 space-y-4">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Settings</h3>

                    {/* Social share icons toggle */}
                    <div className="flex items-center justify-between py-1.5">
                      <label className="text-sm font-medium text-gray-700">Social share icons</label>
                      <ToggleSwitch
                        checked={selectedQuestion.settings?.socialShare ?? true}
                        onChange={(checked) => patchSettings({ socialShare: checked })}
                      />
                    </div>

                    {/* Button toggle */}
                    <div className="flex items-center justify-between py-1.5">
                      <label className="text-sm font-medium text-gray-700">Button</label>
                      <ToggleSwitch
                        checked={selectedQuestion.settings?.buttonEnabled ?? true}
                        onChange={(checked) => patchSettings({ buttonEnabled: checked })}
                      />
                    </div>

                    {/* Button text input */}
                    {(selectedQuestion.settings?.buttonEnabled ?? true) && (
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">Button Text</label>
                        <input
                          type="text"
                          value={selectedQuestion.settings?.buttonText ?? "Create a typeform"}
                          maxLength={24}
                          placeholder="Button text"
                          onChange={(e) => {
                            // Live update the canvas as user types
                            handleQuestionUpdate({
                              ...selectedQuestion,
                              settings: {
                                ...(selectedQuestion.settings || {}),
                                buttonText: e.target.value,
                              },
                            });
                          }}
                          onBlur={(e) => patchSettings({ buttonText: e.target.value })}
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        />
                        <div className="text-[10px] text-gray-400 text-right">
                          {(selectedQuestion.settings?.buttonText ?? "Create a typeform").length}/24
                        </div>
                      </div>
                    )}

                    {/* Button link toggle */}
                    {(selectedQuestion.settings?.buttonEnabled ?? true) && (
                      <div className="flex items-center justify-between py-1.5">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                          Button link
                          <span className="text-[10px] bg-green-50 text-green-600 px-1 py-0.5 rounded font-bold uppercase tracking-wider scale-90">
                            ⚡ AI
                          </span>
                        </label>
                        <ToggleSwitch
                          checked={selectedQuestion.settings?.buttonLinkEnabled ?? false}
                          onChange={(checked) => patchSettings({ buttonLinkEnabled: checked })}
                        />
                      </div>
                    )}

                    {/* Image or Video */}
                    <div className="flex items-center justify-between border-t pt-3">
                      <label className="text-sm font-medium">Image or video</label>
                      <label className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-gray-300 bg-white text-lg leading-none text-gray-600 hover:bg-gray-50">
                        +
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = () => {
                              patchSettings({ imageUrl: reader.result as string });
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                    </div>
                    {selectedQuestion.settings?.imageUrl && (
                      <div className="mt-2 flex items-center gap-2">
                        <img
                          src={selectedQuestion.settings.imageUrl}
                          alt="Question media"
                          className="h-12 w-12 rounded object-cover border"
                        />
                        <button
                          onClick={() => patchSettings({ imageUrl: null })}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {/* Branching Logic Section */}
                {selectedQuestion.type !== "welcome_screen" && selectedQuestion.type !== "ending_screen" && (
                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-750">Branching</span>
                      <button
                        type="button"
                        onClick={() => {
                          setLogicModalQuestionId(selectedQuestion.id);
                          setShowLogicModal(true);
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 bg-white text-lg leading-none text-gray-650 hover:bg-gray-50 font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="pt-8 text-center text-gray-500">
              Select a question to edit its settings
            </div>
          )}
        </aside>
          </>
        )}
      </div>

      <div className="border-t px-6 py-2 text-xs text-gray-400">Edits are always autosaved.</div>

      {showTypeModal && (
        <QuestionTypeModal onSelect={handleAddQuestion} onClose={() => setShowTypeModal(false)} />
      )}
      {showPropertyPicker && (
        <PropertyPickerModal
          isOpen={showPropertyPicker}
          onClose={() => setShowPropertyPicker(false)}
          currentPropertyId={propertyPickerId}
          currentPropertyName={propertyPickerName}
          onPropertyChange={(id, name) => {
            if (!selectedQuestion) return;
            setPropertyPickerId(id);
            setPropertyPickerName(name);
            patchSettings({
              mapped_property_id: id,
              mapped_property_name: name,
              mappedPropertyId: id,
              mappedPropertyName: name,
            });
          }}
        />
      )}
      {showLogicModal && (
        <LogicModal
          isOpen={showLogicModal}
          onClose={() => setShowLogicModal(false)}
          questions={questions}
          onSave={handleSaveQuestionLogic}
        />
      )}
      {showScoringModal && (
        <ScoringModal
          isOpen={showScoringModal}
          onClose={() => setShowScoringModal(false)}
          questions={questions}
          onSave={handleSaveQuestionScore}
        />
      )}
      {showTaggingModal && (
        <TaggingModal
          isOpen={showTaggingModal}
          onClose={() => setShowTaggingModal(false)}
          formSettings={form?.settings}
          questions={questions}
          onSave={handleSaveFormSettings}
        />
      )}
      {showOutcomeQuizModal && (
        <OutcomeQuizModal
          isOpen={showOutcomeQuizModal}
          onClose={() => setShowOutcomeQuizModal(false)}
          formSettings={form?.settings}
          questions={questions}
          onSave={handleSaveFormSettings}
        />
      )}
      {showVariablesModal && (
        <VariablesModal
          isOpen={showVariablesModal}
          onClose={() => setShowVariablesModal(false)}
          formSettings={form?.settings}
          onSave={handleSaveFormVariables}
        />
      )}
    </div>
  );
}
 