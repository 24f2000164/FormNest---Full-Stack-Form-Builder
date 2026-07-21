"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  listForms,
  createForm,
  FormSummary,
  listWorkspaces,
  createWorkspace,
  renameWorkspace,
  deleteWorkspace,
  listWorkspaceForms,
  moveForm,
  copyForm,
  duplicateForm,
  updateForm,
  deleteForm,
  inviteToWorkspace,
  leaveWorkspace,
  WorkspaceSummary
} from "@/lib/api";
import FeedbackModal from "@/components/share/FeedbackModal";

export default function DashboardPage() {
  const router = useRouter();

  // State Management
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(null);
  const [forms, setForms] = useState<FormSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Persisted view & sorting state
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sortBy, setSortBy] = useState<"created" | "updated" | "alphabetical">("created");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [formsLoading, setFormsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelpDropdown, setShowHelpDropdown] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);


  // Modals & Menu States
  const [activeMenuWorkspaceId, setActiveMenuWorkspaceId] = useState<number | null>(null);
  const [activeMenuFormId, setActiveMenuFormId] = useState<number | null>(null);
  
  // Workspace Modals
  const [showCreateWorkspaceModal, setShowCreateWorkspaceModal] = useState(false);
  const [showRenameWorkspaceModal, setShowRenameWorkspaceModal] = useState(false);
  const [showDeleteWorkspaceModal, setShowDeleteWorkspaceModal] = useState(false);
  const [showLeaveWorkspaceModal, setShowLeaveWorkspaceModal] = useState(false);
  const [workspaceNameInput, setWorkspaceNameInput] = useState("");
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [deleteWorkspaceConfirmInput, setDeleteWorkspaceConfirmInput] = useState("");

  // Form Modals
  const [showRenameFormModal, setShowRenameFormModal] = useState(false);
  const [showDeleteFormModal, setShowDeleteFormModal] = useState(false);
  const [showWorkspacePickerModal, setShowWorkspacePickerModal] = useState<{ type: "copy" | "move"; formId: number } | null>(null);
  const [formNameInput, setFormNameInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [actionFormId, setActionFormId] = useState<number | null>(null);

  // Other UI States
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [copiedFormId, setCopiedFormId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isPrivateWorkspaceExpanded, setIsPrivateWorkspaceExpanded] = useState(true);

  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [userName, setUserName] = useState("24f2000");
  const [userInitials, setUserInitials] = useState("SK");

  const [showWorkspaceActionsMenu, setShowWorkspaceActionsMenu] = useState(false);

  // Refs for closing menus
  const workspaceMenuRef = useRef<HTMLDivElement>(null);
  const formMenuRef = useRef<HTMLDivElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const workspaceActionsMenuRef = useRef<HTMLDivElement>(null);

  // Load Workspaces on mount
  useEffect(() => {
    // Check mock authentication
    if (typeof window !== "undefined") {
      const isAuth = localStorage.getItem("user_authenticated") === "true";
      if (!isAuth) {
        router.push("/login");
        return;
      }

      // Retrieve dynamic user profile info
      const storedName = localStorage.getItem("user_name");
      if (storedName) {
        setUserName(storedName);
        const parts = storedName.trim().split(/\s+/);
        const initials = parts.map((p) => p[0]).join("").toUpperCase().slice(0, 2);
        setUserInitials(initials || "SK");
      } else {
        const storedEmail = localStorage.getItem("user_email");
        if (storedEmail) {
          const localPart = storedEmail.split("@")[0];
          setUserName(localPart);
          setUserInitials(localPart.slice(0, 2).toUpperCase());
        }
      }
    }

    // Read persisted selections
    if (typeof window !== "undefined") {
      const persistedView = localStorage.getItem("dashboard_view_mode") as "list" | "grid" | null;
      if (persistedView) setViewMode(persistedView);

      const persistedSortBy = localStorage.getItem("dashboard_sort_by") as any;
      if (persistedSortBy) setSortBy(persistedSortBy);

      const persistedSortOrder = localStorage.getItem("dashboard_sort_order") as "asc" | "desc" | null;
      if (persistedSortOrder) setSortOrder(persistedSortOrder);
    }

    loadInitialData();
  }, []);

  // Fetch workspaces & determine active workspace
  async function loadInitialData() {
    setLoading(true);
    setError(null);
    try {
      const wsList = await listWorkspaces();
      setWorkspaces(wsList);

      if (wsList.length > 0) {
        // Read persisted workspace ID if valid
        const persistedWsId = localStorage.getItem("dashboard_selected_workspace_id");
        const found = wsList.find((w) => w.id.toString() === persistedWsId);
        const wsId = found ? found.id : wsList[0].id;
        setSelectedWorkspaceId(wsId);
        localStorage.setItem("dashboard_selected_workspace_id", wsId.toString());
      }
    } catch (err) {
      setError("Failed to load initial workspace data.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Load Forms inside the active workspace
  useEffect(() => {
    if (selectedWorkspaceId === null) return;
    
    setFormsLoading(true);
    listWorkspaceForms(selectedWorkspaceId, sortBy, sortOrder)
      .then((data) => setForms(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error(err);
        setForms([]);
      })
      .finally(() => setFormsLoading(false));
  }, [selectedWorkspaceId, sortBy, sortOrder]);

  // Click outside to close menus
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (workspaceMenuRef.current && !workspaceMenuRef.current.contains(event.target as Node)) {
        setActiveMenuWorkspaceId(null);
      }
      if (formMenuRef.current && !formMenuRef.current.contains(event.target as Node)) {
        setActiveMenuFormId(null);
      }
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
      }
      if (workspaceActionsMenuRef.current && !workspaceActionsMenuRef.current.contains(event.target as Node)) {
        setShowWorkspaceActionsMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Active Workspace Helper
  const activeWorkspace = useMemo(() => {
    return workspaces.find((w) => w.id === selectedWorkspaceId) || null;
  }, [workspaces, selectedWorkspaceId]);

  // Handle Workspace creation
  async function handleCreateWorkspace(e: React.FormEvent) {
    e.preventDefault();
    setWorkspaceError(null);
    const nameClean = workspaceNameInput.trim();
    if (!nameClean) {
      setWorkspaceError("Workspace name is required.");
      return;
    }
    
    // Duplicate check
    const isDup = workspaces.some((w) => w.name.toLowerCase() === nameClean.toLowerCase());
    if (isDup) {
      setWorkspaceError("A workspace with this name already exists.");
      return;
    }

    setSubmitting(true);
    try {
      const newWs = await createWorkspace(nameClean);
      const wsList = await listWorkspaces();
      setWorkspaces(wsList);
      
      setSelectedWorkspaceId(newWs.id);
      localStorage.setItem("dashboard_selected_workspace_id", newWs.id.toString());
      
      setShowCreateWorkspaceModal(false);
      setWorkspaceNameInput("");
    } catch (err: any) {
      setWorkspaceError(err.message || "Failed to create workspace.");
    } finally {
      setSubmitting(false);
    }
  }

  // Handle Workspace rename
  async function handleRenameWorkspace(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedWorkspaceId) return;
    setWorkspaceError(null);
    const nameClean = workspaceNameInput.trim();
    if (!nameClean) {
      setWorkspaceError("Workspace name is required.");
      return;
    }

    // Duplicate check
    const isDup = workspaces.some((w) => w.id !== selectedWorkspaceId && w.name.toLowerCase() === nameClean.toLowerCase());
    if (isDup) {
      setWorkspaceError("A workspace with this name already exists.");
      return;
    }

    setSubmitting(true);
    try {
      await renameWorkspace(selectedWorkspaceId, nameClean);
      const wsList = await listWorkspaces();
      setWorkspaces(wsList);
      setShowRenameWorkspaceModal(false);
      setWorkspaceNameInput("");
    } catch (err: any) {
      setWorkspaceError(err.message || "Failed to rename workspace.");
    } finally {
      setSubmitting(false);
    }
  }

  // Handle Workspace deletion
  async function handleDeleteWorkspace() {
    if (!selectedWorkspaceId) return;
    setSubmitting(true);
    try {
      await deleteWorkspace(selectedWorkspaceId);
      setShowDeleteWorkspaceModal(false);
      setDeleteWorkspaceConfirmInput("");
      
      const wsList = await listWorkspaces();
      setWorkspaces(wsList);
      if (wsList.length > 0) {
        setSelectedWorkspaceId(wsList[0].id);
        localStorage.setItem("dashboard_selected_workspace_id", wsList[0].id.toString());
      } else {
        setSelectedWorkspaceId(null);
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete workspace.");
    } finally {
      setSubmitting(false);
    }
  }

  // Handle Leave Workspace
  async function handleLeaveWorkspace() {
    if (!selectedWorkspaceId) return;
    setSubmitting(true);
    try {
      await leaveWorkspace(selectedWorkspaceId);
      setShowLeaveWorkspaceModal(false);
      
      const wsList = await listWorkspaces();
      setWorkspaces(wsList);
      if (wsList.length > 0) {
        setSelectedWorkspaceId(wsList[0].id);
        localStorage.setItem("dashboard_selected_workspace_id", wsList[0].id.toString());
      } else {
        setSelectedWorkspaceId(null);
      }
    } catch (err: any) {
      alert(err.message || "Failed to leave workspace.");
    } finally {
      setSubmitting(false);
    }
  }

  // Handle Form creation
  async function handleCreateForm() {
    let wsId = selectedWorkspaceId;
    if (!wsId) {
      // Create a default workspace first
      try {
        const newWs = await createWorkspace("My first workspace");
        const wsSummary = { ...newWs, form_count: 0 };
        setWorkspaces((prev) => [...prev, wsSummary]);
        setSelectedWorkspaceId(newWs.id);
        localStorage.setItem("dashboard_selected_workspace_id", newWs.id.toString());
        wsId = newWs.id;
      } catch (err) {
        console.error(err);
        alert("Failed to create workspace. Please try again.");
        return;
      }
    }
    setSubmitting(true);
    try {
      const form = await createForm("New form", wsId);
      setWorkspaces((prev) =>
        prev.map((w) =>
          w.id === wsId ? { ...w, form_count: w.form_count + 1 } : w
        )
      );
      router.push(`/forms/${form.id}/edit`);
    } catch (err) {
      console.error(err);
      alert("Failed to create new form.");
    } finally {
      setSubmitting(false);
    }
  }

  // Handle Form Rename
  async function handleRenameForm(e: React.FormEvent) {
    e.preventDefault();
    if (!actionFormId) return;
    setFormError(null);
    const titleClean = formNameInput.trim();
    if (!titleClean) {
      setFormError("Form name is required.");
      return;
    }

    setSubmitting(true);
    try {
      await updateForm(actionFormId, { title: titleClean });
      setForms((prev) => prev.map((f) => (f.id === actionFormId ? { ...f, title: titleClean } : f)));
      setShowRenameFormModal(false);
      setFormNameInput("");
      setActionFormId(null);
    } catch (err: any) {
      setFormError(err.message || "Failed to rename form.");
    } finally {
      setSubmitting(false);
    }
  }

  // Handle Form Duplication
  async function handleDuplicateForm(formId: number) {
    try {
      await duplicateForm(formId);
      if (selectedWorkspaceId) {
        const data = await listWorkspaceForms(selectedWorkspaceId);
        setForms(data);
        setWorkspaces((prev) =>
          prev.map((w) =>
            w.id === selectedWorkspaceId ? { ...w, form_count: w.form_count + 1 } : w
          )
        );
      }
    } catch (err) {
      console.error(err);
      alert("Failed to duplicate form.");
    }
  }

  // Handle Form Move/Copy Workspace Picker Choice
  async function handlePickerSelection(targetWorkspaceId: number) {
    if (!showWorkspacePickerModal) return;
    const { type, formId } = showWorkspacePickerModal;
    
    setSubmitting(true);
    try {
      if (type === "move") {
        await moveForm(formId, targetWorkspaceId);
        setForms((prev) => prev.filter((f) => f.id !== formId));
      } else {
        await copyForm(formId, targetWorkspaceId);
      }
      
      const wsList = await listWorkspaces();
      setWorkspaces(wsList);
      
      setShowWorkspacePickerModal(null);
      setActiveMenuFormId(null);
    } catch (err) {
      console.error(err);
      alert(`Failed to ${type} form.`);
    } finally {
      setSubmitting(false);
    }
  }

  // Handle Form Deletion
  async function handleDeleteForm() {
    if (!actionFormId) return;
    setSubmitting(true);
    try {
      await deleteForm(actionFormId);
      setForms((prev) => prev.filter((f) => f.id !== actionFormId));
      
      setWorkspaces((prev) =>
        prev.map((w) =>
          w.id === selectedWorkspaceId ? { ...w, form_count: Math.max(0, w.form_count - 1) } : w
        )
      );
      
      setShowDeleteFormModal(false);
      setActionFormId(null);
    } catch (err) {
      console.error(err);
      alert("Failed to delete form.");
    } finally {
      setSubmitting(false);
    }
  }

  // Handle Copy Form Public Link
  const handleCopyLink = (slug: string, formId: number) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const publicUrl = `${origin}/f/${slug}`;
    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopiedFormId(formId);
      setTimeout(() => setCopiedFormId(null), 2000);
    });
  };

  // Handle Invite Workspace User
  async function handleInviteUser() {
    if (!selectedWorkspaceId) return;
    const emailClean = inviteEmail.trim();
    if (!emailClean) {
      alert("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await inviteToWorkspace(selectedWorkspaceId, emailClean);
      alert(res.message);
      setInviteEmail("");
      setShowInviteModal(false);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to send workspace invitation.");
    } finally {
      setSubmitting(false);
    }
  }

  // View Mode Change Helper
  const handleViewModeChange = (mode: "list" | "grid") => {
    setViewMode(mode);
    localStorage.setItem("dashboard_view_mode", mode);
  };

  // Sort Option Change Helpers
  const handleSortByChange = (val: typeof sortBy) => {
    setSortBy(val);
    localStorage.setItem("dashboard_sort_by", val);
  };

  const toggleSortOrder = () => {
    const next = sortOrder === "asc" ? "desc" : "asc";
    setSortOrder(next);
    localStorage.setItem("dashboard_sort_order", next);
  };

  // Filter & Sort Forms
  const filteredAndSortedForms = useMemo(() => {
    let result = [...forms];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((f) => (f.title || "").toLowerCase().includes(q));
    }

    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "alphabetical") {
        const titleA = a.title || "";
        const titleB = b.title || "";
        comparison = titleA.localeCompare(titleB);
      } else if (sortBy === "created") {
        comparison = (a.id || 0) - (b.id || 0);
      } else {
        const timeA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const timeB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        comparison = timeA - timeB;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [forms, searchQuery, sortBy, sortOrder]);

  return (
    <div className="flex flex-col h-screen bg-[#fafafb] text-gray-800 font-sans antialiased overflow-hidden">
      
      {/* 1. TOP NAVIGATION BAR */}
      <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-6 shrink-0 z-25">
        <div className="flex items-center gap-2">
          {/* Logo Badge */}
          <div className="h-7 w-7 rounded bg-[#262626] text-white flex items-center justify-center font-bold text-xs select-none">
            2
          </div>
          <span className="text-sm font-semibold text-gray-800">{userName}</span>
          <span className="text-gray-400 text-[10px] select-none ml-0.5 cursor-pointer">▼</span>
        </div>
        
        <div className="flex items-center gap-6">
          <button 
            onClick={() => alert("Integrations settings coming soon!")}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
          >
            {/* Puzzle icon */}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 11.517 1.255l-.042.02a.75.75 0 01-.516-1.255zm3.75 3.75l.042-.02a.75.75 0 11.516 1.255l-.042.02a.75.75 0 01-.516-1.255zm-7.5-7.5l.041-.02a.75.75 0 11.517 1.255l-.042.02a.75.75 0 01-.516-1.255zm3.75-3.75l.042-.02a.75.75 0 11.516 1.255l-.042.02a.75.75 0 01-.516-1.255z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            Integrations
          </button>
          
          <button 
            onClick={() => alert("Brand kit configuration coming soon!")}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
          >
            {/* Palette/Brand kit icon */}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-1.224 2.25 2.25 0 012.25-2.25 2.25 2.25 0 002.25-2.25 2.25 2.25 0 012.25-2.25 4.5 4.5 0 001.224-8.4 2.25 2.25 0 01-2.245 2.4 3 3 0 00-1.128 5.78z" />
            </svg>
            Brand kit
          </button>
          
          <div className="relative flex items-center">
            <button
              onClick={() => setShowHelpDropdown(!showHelpDropdown)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              {/* Help circle icon */}
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
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
          <FeedbackModal isOpen={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} />
          
          {/* User Initials Avatar */}
          <div 
            onClick={() => {
              if (confirm("Are you sure you want to log out?")) {
                localStorage.removeItem("user_authenticated");
                router.push("/");
              }
            }}
            className="h-7 w-7 rounded-full bg-[#fde3cf] text-[#f56a00] flex items-center justify-center font-bold text-xs shadow-inner cursor-pointer select-none hover:opacity-85 transition-opacity"
            title="Click to Log Out"
          >
            {userInitials}
          </div>
        </div>
      </header>

      {/* Main Grid: Sidebar + Canvas */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        
        {/* 2. LEFT SIDEBAR */}
        <aside
          className={`${
            sidebarOpen ? "w-64" : "w-0 -translate-x-full lg:w-16 lg:translate-x-0"
          } shrink-0 bg-[#f7f7f9] border-r border-gray-200 flex flex-col justify-between transition-all duration-300 z-30`}
        >
          <div className="flex-1 flex flex-col min-h-0">
            {/* Navigation Tabs (Forms, Contacts, Automations, Research Flow) */}
            {sidebarOpen && (
              <div className="px-4 py-2 border-b border-gray-200/60 flex gap-4 text-xs font-semibold text-gray-500">
                <button className="pb-2 border-b-2 border-gray-900 text-gray-900 font-bold">Forms</button>
                <button className="pb-2 border-b-2 border-transparent hover:text-gray-800 transition-colors">Contacts</button>
                <button className="pb-2 border-b-2 border-transparent hover:text-gray-800 transition-colors">Automations</button>
                <button className="pb-2 border-b-2 border-transparent hover:text-gray-800 transition-colors flex items-center gap-0.5">
                  Flow
                  <span className="bg-blue-50 text-blue-600 text-[8px] px-1 rounded font-bold uppercase tracking-wider scale-90">Demo</span>
                </button>
              </div>
            )}

            {/* Action Sections */}
            <div className="p-4 space-y-4">
              {/* Create Form Button */}
              <button
                onClick={handleCreateForm}
                disabled={submitting}
                className="w-full h-10 bg-[#26212e] text-white rounded-lg text-xs font-bold hover:bg-[#342d3e] transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>+</span>
                {sidebarOpen && <span>Create form</span>}
              </button>

              {/* Search Bar */}
              {sidebarOpen && (
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-gray-400 select-none">
                    <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-8.5 rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-gray-400 focus:bg-white transition-all placeholder-gray-400"
                  />
                </div>
              )}
            </div>

            {/* Workspace List Section */}
            <div className="flex-1 flex flex-col min-h-0 px-2">
              {sidebarOpen && (
                <div className="px-3 py-1 flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider select-none">
                  <div className="flex items-center gap-1 hover:text-gray-700 cursor-pointer">
                    <span>Workspaces</span>
                  </div>
                  <button
                    onClick={() => setShowCreateWorkspaceModal(true)}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none text-sm p-0.5"
                    title="Create Workspace"
                  >
                    +
                  </button>
                </div>
              )}

              {/* Private collapsible category */}
              {sidebarOpen && (
                <div className="mt-2">
                  <div
                    onClick={() => setIsPrivateWorkspaceExpanded(!isPrivateWorkspaceExpanded)}
                    className="px-3 py-1.5 flex items-center justify-between text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors cursor-pointer select-none"
                  >
                    <span className="flex items-center gap-1">
                      <span>Private</span>
                    </span>
                    <span className="text-[9px] text-gray-400 transition-transform">
                      {isPrivateWorkspaceExpanded ? "▲" : "▼"}
                    </span>
                  </div>

                  {isPrivateWorkspaceExpanded && (
                    <div className="mt-1 pl-1 space-y-0.5 overflow-y-auto max-h-56">
                      {workspaces.map((ws) => {
                        const isActive = ws.id === selectedWorkspaceId;
                        return (
                          <div
                            key={ws.id}
                            onClick={() => {
                              setSelectedWorkspaceId(ws.id);
                              localStorage.setItem("dashboard_selected_workspace_id", ws.id.toString());
                            }}
                            className={`group relative flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                              isActive ? "bg-gray-200/70 text-gray-900" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                            }`}
                          >
                            <span className="truncate">{ws.name}</span>
                            
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] text-gray-400 font-bold bg-white/70 px-1.5 py-0.5 rounded-full border border-gray-200/50">
                                {ws.form_count}
                              </span>

                              {/* Three dot context menu */}
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedWorkspaceId(ws.id);
                                    setActiveMenuWorkspaceId(activeMenuWorkspaceId === ws.id ? null : ws.id);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 hover:bg-gray-300 p-0.5 rounded text-gray-400 hover:text-gray-600 transition-opacity"
                                >
                                  •••
                                </button>
                                
                                {activeMenuWorkspaceId === ws.id && (
                                  <div
                                    ref={workspaceMenuRef}
                                    className="absolute left-0 mt-1 w-28 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-40 text-xs font-normal"
                                  >
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setWorkspaceNameInput(ws.name);
                                        setShowRenameWorkspaceModal(true);
                                        setActiveMenuWorkspaceId(null);
                                      }}
                                      className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-gray-700"
                                    >
                                      Rename
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        alert("To leave shared workspaces, please contact your administrator. (Coming soon)");
                                        setActiveMenuWorkspaceId(null);
                                      }}
                                      className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-gray-700"
                                    >
                                      Leave
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setShowDeleteWorkspaceModal(true);
                                        setActiveMenuWorkspaceId(null);
                                      }}
                                      className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-red-600"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>


          {/* Ask Typeform AI Gradient Input Block */}
          {sidebarOpen && (
            <div className="p-3 border-t border-gray-200/40 bg-white">
              <div className="relative flex items-center rounded-xl p-[1px] bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">
                <div className="flex items-center w-full bg-white rounded-[11px] px-3 py-2">
                  <span className="text-gray-400 text-sm mr-2 select-none">🎙️</span>
                  <input
                    type="text"
                    placeholder="Ask FormNest AI"
                    className="flex-1 bg-transparent text-xs text-gray-700 outline-none placeholder-gray-400"
                  />
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg className="w-3.5 h-3.5 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* 3. MAIN CONTENT WORKSPACE VIEW */}
        <main className="flex-1 flex flex-col min-w-0 bg-white overflow-y-auto">
          {/* Header section */}
          <header className="px-8 py-5 border-b border-gray-150 flex items-center justify-between bg-white relative z-40">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-gray-400 hover:text-gray-600 outline-none pr-1 lg:hidden"
                aria-label="Toggle sidebar"
              >
                ☰
              </button>
              
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                {activeWorkspace ? activeWorkspace.name : "Workspace"}
              </h1>

              {/* Three dots Settings Menu */}
              <div className="relative" ref={workspaceActionsMenuRef}>
                <button
                  onClick={() => setShowWorkspaceActionsMenu(!showWorkspaceActionsMenu)}
                  className="h-8 w-8 hover:bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                  title="Workspace Actions"
                >
                  •••
                </button>

                {showWorkspaceActionsMenu && activeWorkspace && (
                  <div className="absolute left-0 mt-1 w-32 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-50 text-left text-xs font-semibold">
                    <button
                      onClick={() => {
                        setWorkspaceNameInput(activeWorkspace.name);
                        setShowRenameWorkspaceModal(true);
                        setShowWorkspaceActionsMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700"
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => {
                        setShowLeaveWorkspaceModal(true);
                        setShowWorkspaceActionsMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700"
                    >
                      Leave
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteWorkspaceModal(true);
                        setShowWorkspaceActionsMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600 border-t border-gray-100 mt-1 pt-2"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {/* Invite button */}
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-xs"
              >
                <span>👤+</span>
                Invite
              </button>

              {/* Settings button */}
              <button
                onClick={() => setShowSettingsModal(true)}
                className="h-8 w-8 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-500 shadow-xs"
                title="Workspace Settings"
              >
                🛡️
              </button>
            </div>

            {/* Sorting & view mode selectors */}
            <div className="flex items-center gap-3">
              {/* Custom Sort Dropdown */}
              <div className="relative" ref={sortMenuRef}>
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="flex items-center gap-2 px-3.5 py-1.5 border border-gray-200 bg-white rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-xs"
                >
                  {sortBy === "alphabetical" && (
                    <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 text-gray-500" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m9-6.75H21m-4.5 3H21m-6 3H21m-6 3H21M13.5 15h.008v.008H13.5V15z" />
                    </svg>
                  )}
                  {sortBy === "created" && (
                    <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 text-gray-500" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                  )}
                  {sortBy === "updated" && (
                    <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 text-gray-500" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.83 20.013a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                    </svg>
                  )}
                  <span>
                    {sortBy === "created" && "Date created"}
                    {sortBy === "updated" && "Last updated"}
                    {sortBy === "alphabetical" && "Alphabetical"}
                  </span>
                  <span className="text-[10px] text-gray-400">▼</span>
                </button>

                {showSortDropdown && (
                  <div className="absolute right-0 mt-1.5 w-44 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-50 text-left text-xs font-semibold">
                    <button
                      onClick={() => {
                        handleSortByChange("created");
                        setShowSortDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2.5 ${
                        sortBy === "created" ? "text-blue-600 bg-blue-50/20" : "text-gray-600"
                      }`}
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-gray-500" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      </svg>
                      Date created
                    </button>
                    <button
                      onClick={() => {
                        handleSortByChange("updated");
                        setShowSortDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2.5 ${
                        sortBy === "updated" ? "text-blue-600 bg-blue-50/20" : "text-gray-600"
                      }`}
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-gray-500" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.83 20.013a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                      </svg>
                      Last updated
                    </button>
                    <button
                      onClick={() => {
                        handleSortByChange("alphabetical");
                        setShowSortDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2.5 ${
                        sortBy === "alphabetical" ? "text-blue-600 bg-blue-50/20" : "text-gray-600"
                      }`}
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-gray-500" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m9-6.75H21m-4.5 3H21m-6 3H21m-6 3H21M13.5 15h.008v.008H13.5V15z" />
                      </svg>
                      Alphabetical
                    </button>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={() => {
                        toggleSortOrder();
                        setShowSortDropdown(false);
                      }}
                      className="w-full text-left px-4 py-1.5 hover:bg-gray-50 text-gray-500 flex items-center justify-between text-[11px]"
                    >
                      <span>Direction</span>
                      <span className="font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded uppercase tracking-wide">
                        {sortOrder === "asc" ? "Asc" : "Desc"}
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* Grid/List View switcher */}
              <div className="flex rounded-lg bg-gray-100 p-0.5 border border-gray-200/40">
                <button
                  onClick={() => handleViewModeChange("list")}
                  className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 ${
                    viewMode === "list" ? "bg-white text-gray-800 shadow-xs" : "text-gray-400 hover:text-gray-600"
                  }`}
                  title="List View"
                >
                  <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="2.2">
                    <line x1="2" y1="2" x2="2" y2="14" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="5" y1="4" x2="14" y2="4" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="5" y1="8" x2="14" y2="8" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="5" y1="12" x2="14" y2="12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  List
                </button>
                <button
                  onClick={() => handleViewModeChange("grid")}
                  className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 ${
                    viewMode === "grid" ? "bg-white text-gray-800 shadow-xs" : "text-gray-400 hover:text-gray-600"
                  }`}
                  title="Grid View"
                >
                  <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="2.2">
                    <rect x="2" y="2" width="5" height="5" rx="0.5" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="9" y="2" width="5" height="5" rx="0.5" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="2" y="9" width="5" height="5" rx="0.5" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="9" y="9" width="5" height="5" rx="0.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Grid
                </button>
              </div>
            </div>
          </header>

          {/* Forms listing section */}
          <section className="flex-1 px-8 py-6">
            {formsLoading && forms.length === 0 ? (
              <div className="flex justify-center items-center py-20 text-gray-400">Loading forms...</div>
            ) : filteredAndSortedForms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="text-4xl mb-3 select-none">📝</span>
                <h3 className="text-base font-bold text-gray-800">No forms found</h3>
                <p className="text-sm text-gray-400 mt-1 max-w-xs">
                  Create a form inside this workspace or check your search keywords.
                </p>
                <button
                  onClick={handleCreateForm}
                  className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors shadow-xs"
                >
                  Create form
                </button>
              </div>
            ) : viewMode === "list" ? (
              /* LIST VIEW WITH CARD BORDERS, ROUNDED CORNERS, AND SEPARATION */
              <div className="w-full">
                {/* Header labels */}
                <div className="flex items-center text-xs font-bold text-gray-400 select-none px-4 pb-2">
                  <div className="w-2/5">Form Name</div>
                  <div className="w-20 text-center">Responses</div>
                  <div className="w-20 text-center">Completed</div>
                  <div className="w-28 text-left pl-4">Updated</div>
                  <div className="w-20 text-center">Integrations</div>
                  <div className="flex-1 text-right pr-6">Actions</div>
                </div>

                {/* Vertical stack of row-cards */}
                <div className="space-y-3">
                  {filteredAndSortedForms.map((f) => (
                    <div
                      key={f.id}
                      className={`bg-white border border-gray-200/80 rounded-xl hover:border-gray-300 hover:shadow-xs hover:bg-gray-50/10 transition-all duration-150 flex items-center p-3.5 relative ${
                        activeMenuFormId === f.id ? "z-30" : "z-10"
                      }`}
                    >
                      {/* Name and Icon */}
                      <div 
                        onClick={() => router.push(`/forms/${f.id}/edit`)}
                        className="w-2/5 min-w-0 flex items-center gap-3 cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#4f70db] flex items-center justify-center shrink-0 shadow-xs">
                          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                        </div>
                        <span className="font-semibold text-gray-800 truncate group-hover:text-blue-600 transition-colors pr-4">
                          {f.title}
                        </span>
                      </div>

                      {/* Response count */}
                      <div className="w-20 text-center text-xs font-semibold text-gray-700">
                        {f.response_count > 0 ? (
                          <Link href={`/forms/${f.id}/results/responses`} onClick={(e) => e.stopPropagation()}>
                            <span className="text-gray-700 hover:text-blue-600 hover:underline">{f.response_count}</span>
                          </Link>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>

                      {/* Completed percent */}
                      <div className="w-20 text-center text-xs font-semibold text-gray-700">
                        {f.response_count > 0 ? (
                          <span>{f.completion_rate}%</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>

                      {/* Updated Date */}
                      <div className="w-28 text-left text-gray-500 font-medium pl-4 text-xs">
                        {new Date(f.updated_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </div>

                      {/* Integrations mock */}
                      <div className="w-20 text-center flex justify-center">
                        <div 
                          className="inline-flex justify-center"
                          onClick={(e) => { e.stopPropagation(); alert("Manage integrations in Connect tab."); }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
                          </svg>
                        </div>
                      </div>

                      {/* Action trigger */}
                      <div className="flex-1 text-right pr-2 relative">
                        <div onClick={(e) => e.stopPropagation()} className="inline-block text-left">
                          <button
                            onClick={() => {
                              setFormNameInput(f.title);
                              setActiveMenuFormId(activeMenuFormId === f.id ? null : f.id);
                            }}
                            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                          >
                            •••
                          </button>
                          
                          {activeMenuFormId === f.id && (
                            <FormContextMenu
                              form={f}
                              copiedFormId={copiedFormId}
                              onCopyLink={handleCopyLink}
                              onRename={() => {
                                setActionFormId(f.id);
                                setShowRenameFormModal(true);
                                setActiveMenuFormId(null);
                              }}
                              onDuplicate={() => handleDuplicateForm(f.id)}
                              onMoveTo={() => {
                                setActionFormId(f.id);
                                setShowWorkspacePickerModal({ type: "move", formId: f.id });
                                setActiveMenuFormId(null);
                              }}
                              onCopyTo={() => {
                                setActionFormId(f.id);
                                setShowWorkspacePickerModal({ type: "copy", formId: f.id });
                                setActiveMenuFormId(null);
                              }}
                              onDelete={() => {
                                setActionFormId(f.id);
                                setShowDeleteFormModal(true);
                                setActiveMenuFormId(null);
                              }}
                              onClose={() => setActiveMenuFormId(null)}
                              menuRef={formMenuRef}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* GRID VIEW ROW-BY-ROW CARDS */
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredAndSortedForms.map((f) => (
                  <div
                    key={f.id}
                    className={`rounded-2xl border border-gray-150 bg-white p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group relative h-44 ${
                      activeMenuFormId === f.id ? "z-30" : "z-10"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        {/* Clickable Icon to go to builder */}
                        <div 
                          onClick={() => router.push(`/forms/${f.id}/edit`)}
                          className="w-10 h-10 rounded-xl bg-[#4f70db] flex items-center justify-center shrink-0 shadow-xs cursor-pointer"
                        >
                          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                        </div>
                        
                        <div onClick={(e) => e.stopPropagation()} className="relative">
                          <button
                            onClick={() => {
                              setFormNameInput(f.title);
                              setActiveMenuFormId(activeMenuFormId === f.id ? null : f.id);
                            }}
                            className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                          >
                            •••
                          </button>
                          
                          {activeMenuFormId === f.id && (
                            <FormContextMenu
                              form={f}
                              copiedFormId={copiedFormId}
                              onCopyLink={handleCopyLink}
                              onRename={() => {
                                setActionFormId(f.id);
                                setShowRenameFormModal(true);
                                setActiveMenuFormId(null);
                              }}
                              onDuplicate={() => handleDuplicateForm(f.id)}
                              onMoveTo={() => {
                                setActionFormId(f.id);
                                setShowWorkspacePickerModal({ type: "move", formId: f.id });
                                setActiveMenuFormId(null);
                              }}
                              onCopyTo={() => {
                                setActionFormId(f.id);
                                setShowWorkspacePickerModal({ type: "copy", formId: f.id });
                                setActiveMenuFormId(null);
                              }}
                              onDelete={() => {
                                setActionFormId(f.id);
                                setShowDeleteFormModal(true);
                                setActiveMenuFormId(null);
                              }}
                              onClose={() => setActiveMenuFormId(null)}
                              menuRef={formMenuRef}
                            />
                          )}
                        </div>
                      </div>

                      <h4 
                        onClick={() => router.push(`/forms/${f.id}/edit`)}
                        className="mt-4 text-sm font-bold text-gray-800 truncate pr-6 group-hover:text-blue-600 transition-colors cursor-pointer"
                      >
                        {f.title}
                      </h4>
                    </div>

                    <div className="border-t border-gray-100 pt-3 mt-4 flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-gray-600">{f.response_count}</span> responses
                      </div>
                      
                      <span
                        className={`rounded-full px-2 py-0.5 font-bold ${
                          f.status === "published"
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-50 text-gray-500"
                        }`}
                      >
                        {f.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* 4. MODALS AND OVERLAYS */}
      <AnimatePresence>
        {/* Workspace Creation Modal */}
        {showCreateWorkspaceModal && (
          <ModalWrapper onClose={() => setShowCreateWorkspaceModal(false)}>
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <h3 className="text-base font-bold text-gray-800">Create workspace</h3>
              <div>
                <label htmlFor="ws-name-input" className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Workspace name</label>
                <input
                  id="ws-name-input"
                  type="text"
                  placeholder="e.g. Clients, College, Personal"
                  value={workspaceNameInput}
                  onChange={(e) => setWorkspaceNameInput(e.target.value)}
                  className="w-full h-10 border border-gray-200 bg-gray-50 rounded-lg px-3 mt-1.5 text-sm outline-none focus:border-gray-400"
                />
                {workspaceError && <p className="text-xs text-red-600 font-semibold mt-1.5">{workspaceError}</p>}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateWorkspaceModal(false);
                    setWorkspaceNameInput("");
                    setWorkspaceError(null);
                  }}
                  className="px-4 py-2 border border-gray-200 text-sm font-semibold rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Create Workspace"}
                </button>
              </div>
            </form>
          </ModalWrapper>
        )}

        {/* Workspace Rename Modal */}
        {showRenameWorkspaceModal && (
          <ModalWrapper onClose={() => setShowRenameWorkspaceModal(false)}>
            <form onSubmit={handleRenameWorkspace} className="space-y-4">
              <h3 className="text-base font-bold text-gray-800">Rename workspace</h3>
              <div>
                <label htmlFor="ws-name-rename-input" className="text-xs font-semibold text-gray-400 uppercase tracking-wide">New workspace name</label>
                <input
                  id="ws-name-rename-input"
                  type="text"
                  value={workspaceNameInput}
                  onChange={(e) => setWorkspaceNameInput(e.target.value)}
                  className="w-full h-10 border border-gray-200 bg-gray-50 rounded-lg px-3 mt-1.5 text-sm outline-none focus:border-gray-400"
                />
                {workspaceError && <p className="text-xs text-red-600 font-semibold mt-1.5">{workspaceError}</p>}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowRenameWorkspaceModal(false);
                    setWorkspaceNameInput("");
                    setWorkspaceError(null);
                  }}
                  className="px-4 py-2 border border-gray-200 text-sm font-semibold rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50"
                >
                  {submitting ? "Renaming..." : "Rename"}
                </button>
              </div>
            </form>
          </ModalWrapper>
        )}

        {/* Workspace Delete Modal */}
        {showDeleteWorkspaceModal && activeWorkspace && (
          <ModalWrapper
            onClose={() => {
              setShowDeleteWorkspaceModal(false);
              setDeleteWorkspaceConfirmInput("");
            }}
          >
            <div className="space-y-4 relative pr-6">
              <button
                onClick={() => {
                  setShowDeleteWorkspaceModal(false);
                  setDeleteWorkspaceConfirmInput("");
                }}
                className="absolute top-0 right-0 text-gray-400 hover:text-gray-600 text-lg outline-none select-none"
              >
                ✕
              </button>
              <h3 className="text-lg font-bold text-gray-800">Delete this workspace?</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <p>You're about to delete <strong>"{activeWorkspace.name}"</strong>.</p>
                <p>This will permanently delete the workspace. You'll lose all forms and responses collected in it.</p>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide pt-1">Please enter the workspace name to confirm.</p>
              </div>

              <input
                type="text"
                value={deleteWorkspaceConfirmInput}
                onChange={(e) => setDeleteWorkspaceConfirmInput(e.target.value)}
                placeholder="Workspace name"
                className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm outline-none focus:border-gray-500 transition-all placeholder-gray-400"
              />

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100/50 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteWorkspaceModal(false);
                    setDeleteWorkspaceConfirmInput("");
                  }}
                  className="px-4 py-2 border border-gray-200 text-sm font-semibold rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteWorkspace}
                  disabled={submitting || deleteWorkspaceConfirmInput !== activeWorkspace.name}
                  className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${
                    deleteWorkspaceConfirmInput === activeWorkspace.name && !submitting
                      ? "bg-[#c54b48] text-white hover:bg-[#b0403e] cursor-pointer"
                      : "bg-gray-100 text-gray-400 opacity-50 cursor-not-allowed"
                  }`}
                >
                  {submitting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </ModalWrapper>
        )}

        {/* Workspace Leave Modal */}
        {showLeaveWorkspaceModal && activeWorkspace && (
          <ModalWrapper onClose={() => setShowLeaveWorkspaceModal(false)}>
            <div className="space-y-4 relative pr-6">
              <button
                onClick={() => setShowLeaveWorkspaceModal(false)}
                className="absolute top-0 right-0 text-gray-400 hover:text-gray-600 text-lg outline-none select-none"
              >
                ✕
              </button>
              <h3 className="text-lg font-bold text-gray-800">Leave workspace?</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>You're about to leave workspace with name <strong>"{activeWorkspace.name}"</strong>.</p>
                <p>You'll lose access to all forms in it.</p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100/50 mt-2">
                <button
                  type="button"
                  onClick={() => setShowLeaveWorkspaceModal(false)}
                  className="px-4 py-2 border border-gray-200 text-sm font-semibold rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLeaveWorkspace}
                  disabled={submitting}
                  className="px-5 py-2 bg-[#c54b48] hover:bg-[#b0403e] text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors"
                >
                  {submitting ? "Leaving..." : "Leave"}
                </button>
              </div>
            </div>
          </ModalWrapper>
        )}

        {/* Form Rename Modal */}
        {showRenameFormModal && (
          <ModalWrapper onClose={() => setShowRenameFormModal(false)}>
            <form onSubmit={handleRenameForm} className="space-y-4">
              <h3 className="text-base font-bold text-gray-800">Rename form</h3>
              <div>
                <label htmlFor="form-name-rename-input" className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Form name</label>
                <input
                  id="form-name-rename-input"
                  type="text"
                  value={formNameInput}
                  onChange={(e) => setFormNameInput(e.target.value)}
                  className="w-full h-10 border border-gray-200 bg-gray-50 rounded-lg px-3 mt-1.5 text-sm outline-none focus:border-gray-400"
                />
                {formError && <p className="text-xs text-red-600 font-semibold mt-1.5">{formError}</p>}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowRenameFormModal(false);
                    setFormNameInput("");
                    setFormError(null);
                    setActiveMenuFormId(null);
                  }}
                  className="px-4 py-2 border border-gray-200 text-sm font-semibold rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50"
                >
                  {submitting ? "Renaming..." : "Rename"}
                </button>
              </div>
            </form>
          </ModalWrapper>
        )}

        {/* Form Delete Modal */}
        {showDeleteFormModal && (
          <ModalWrapper onClose={() => setShowDeleteFormModal(false)}>
            <div className="space-y-4">
              <h3 className="text-base font-bold text-gray-800">Delete form?</h3>
              <p className="text-sm text-gray-500">
                Are you sure you want to delete this form permanently? This action cannot be undone and will delete all response analytics as well.
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteFormModal(false);
                    setActiveMenuFormId(null);
                  }}
                  className="px-4 py-2 border border-gray-200 text-sm font-semibold rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteForm}
                  disabled={submitting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
                >
                  {submitting ? "Deleting..." : "Delete permanently"}
                </button>
              </div>
            </div>
          </ModalWrapper>
        )}

        {/* Workspace Picker Modal for Copy To / Move To */}
        {showWorkspacePickerModal && (
          <ModalWrapper onClose={() => setShowWorkspacePickerModal(null)}>
            <div className="space-y-4">
              <h3 className="text-base font-bold text-gray-800">
                {showWorkspacePickerModal.type === "move" ? "Move form to workspace" : "Copy form to workspace"}
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => handlePickerSelection(ws.id)}
                    className="w-full text-left px-4 py-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 text-sm font-medium text-gray-700 flex items-center justify-between"
                  >
                    <span>{ws.name}</span>
                    <span className="text-xs bg-gray-200 text-gray-500 rounded px-1.5">{ws.form_count}</span>
                  </button>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowWorkspacePickerModal(null);
                    setActiveMenuFormId(null);
                  }}
                  className="px-4 py-2 border border-gray-200 text-sm font-semibold rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </ModalWrapper>
        )}

        {/* Invite Workspace Modal */}
        {showInviteModal && (
          <ModalWrapper onClose={() => setShowInviteModal(false)}>
            <div className="space-y-4">
              <h3 className="text-base font-bold text-gray-800">Invite people to workspace</h3>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 h-10 border border-gray-200 bg-gray-50 rounded-lg px-3 text-sm outline-none focus:border-gray-400"
                />
                <button
                  onClick={handleInviteUser}
                  disabled={submitting}
                  className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50"
                >
                  {submitting ? "Sending..." : "Send"}
                </button>
              </div>
              <div className="border-t border-gray-50 pt-4 flex items-center justify-between text-xs text-gray-500">
                <span>Or share workspace link:</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert("Workspace link copied!");
                  }}
                  className="text-[#0f6b52] font-semibold hover:underline"
                >
                  Copy Link
                </button>
              </div>
            </div>
          </ModalWrapper>
        )}

        {/* Workspace Settings Mock Modal */}
        {showSettingsModal && (
          <ModalWrapper onClose={() => setShowSettingsModal(false)}>
            <div className="space-y-4">
              <h3 className="text-base font-bold text-gray-800">Workspace settings</h3>
              <p className="text-sm text-gray-500">Configure access levels, workspace integrations, and branding defaults for this workspace.</p>
              
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800"
                >
                  Close
                </button>
              </div>
            </div>
          </ModalWrapper>
        )}
      </AnimatePresence>
    </div>
  );
}

// Modal Backdrop Wrapper Component
function ModalWrapper({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.95, y: 15 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 15 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl border border-gray-100"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

// Form Context Menu Dropdown Component
function FormContextMenu({
  form,
  copiedFormId,
  onCopyLink,
  onRename,
  onDuplicate,
  onMoveTo,
  onCopyTo,
  onDelete,
  onClose,
  menuRef
}: {
  form: FormSummary;
  copiedFormId: number | null;
  onCopyLink: (slug: string, id: number) => void;
  onRename: () => void;
  onDuplicate: () => void;
  onMoveTo: () => void;
  onCopyTo: () => void;
  onDelete: () => void;
  onClose: () => void;
  menuRef: React.RefObject<HTMLDivElement>;
}) {
  const router = useRouter();

  return (
    <div
      ref={menuRef}
      className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-40 text-left text-xs font-normal"
    >
      <button
        onClick={() => {
          onCopyLink(form.slug, form.id);
        }}
        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 flex items-center justify-between"
      >
        <span>Copy link</span>
        {copiedFormId === form.id && <span className="text-[#0f6b52] font-semibold text-[10px]">Copied!</span>}
      </button>

      <div className="border-t border-gray-100 my-1" />

      {/* Pages Navigation */}
      <button
        onClick={() => router.push(`/forms/${form.id}/edit`)}
        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700"
      >
        Content
      </button>
      <button
        onClick={() => router.push(`/forms/${form.id}/edit?tab=workflow`)}
        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700"
      >
        Workflow
      </button>
      <button
        onClick={() => router.push(`/forms/${form.id}/edit?tab=connect`)}
        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700"
      >
        Connect
      </button>
      <button
        onClick={() => router.push(`/forms/${form.id}/share`)}
        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700"
      >
        Share
      </button>
      <button
        onClick={() => router.push(`/forms/${form.id}/results/summary`)}
        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700"
      >
        Results
      </button>

      <div className="border-t border-gray-100 my-1" />

      {/* Actions */}
      <button
        onClick={onRename}
        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700"
      >
        Rename
      </button>
      <button
        onClick={onDuplicate}
        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700"
      >
        Duplicate
      </button>
      <button
        onClick={onCopyTo}
        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700"
      >
        Copy to
      </button>
      <button
        onClick={onMoveTo}
        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700"
      >
        Move to
      </button>

      <div className="border-t border-gray-100 my-1" />

      <button
        onClick={onDelete}
        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600 font-semibold"
      >
        Delete
      </button>
    </div>
  );
}