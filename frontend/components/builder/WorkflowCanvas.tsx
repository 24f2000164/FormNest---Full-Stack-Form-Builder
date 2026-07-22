"use client";

import { useState, useRef, useEffect, MouseEvent, useCallback } from "react";
import { RatingIcon } from "./ratingIcons";

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

// ─── Icon helpers ─────────────────────────────────────────────────────────────

const TYPE_META: Record<string, { icon: string; bg: string; text: string; border: string }> = {
  short_text:     { icon: "T",  bg: "bg-blue-100",   text: "text-blue-700",   border: "border-blue-200" },
  long_text:      { icon: "T",  bg: "bg-blue-100",   text: "text-blue-700",   border: "border-blue-200" },
  number:         { icon: "#",  bg: "bg-amber-100",  text: "text-amber-700",  border: "border-amber-200" },
  email:          { icon: "✉",  bg: "bg-pink-100",   text: "text-pink-700",   border: "border-pink-200" },
  phone:          { icon: "☎",  bg: "bg-green-100",  text: "text-green-700",  border: "border-green-200" },
  date:           { icon: "📅", bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-200" },
  multiple_choice:{ icon: "●",  bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
  dropdown:       { icon: "▼",  bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
  yes_no:         { icon: "✓",  bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
  rating:         { icon: "★",  bg: "bg-green-100",  text: "text-green-700",  border: "border-green-200" },
  opinion_scale:  { icon: "◯",  bg: "bg-teal-100",   text: "text-teal-700",   border: "border-teal-200" },
  statement:      { icon: "‖",  bg: "bg-gray-100",   text: "text-gray-600",   border: "border-gray-200" },
  contact_info:   { icon: "👤", bg: "bg-pink-100",   text: "text-pink-700",   border: "border-pink-200" },
  welcome_screen: { icon: "👋", bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-200" },
  ending_screen:  { icon: "🏁", bg: "bg-emerald-100",text: "text-emerald-700",border: "border-emerald-200" },
};

function getTypeMeta(type: string) {
  return TYPE_META[type] ?? { icon: "•", bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200" };
}

// ─── Node dimensions ──────────────────────────────────────────────────────────

const NODE_W = 260;
const NODE_H = 76;
const H_SPACING = 340; // horizontal gap between node centers
const NODE_Y = 100;     // vertical position of the single row

// ─── WorkflowCanvas ───────────────────────────────────────────────────────────

export default function WorkflowCanvas({
  form,
  questions,
  onOpenLogicModal,
  onOpenScoringModal,
  onOpenTaggingModal,
  onOpenOutcomeQuizModal,
}: {
  form: any;
  questions: Question[];
  onOpenLogicModal: (qId: number) => void;
  onOpenScoringModal: () => void;
  onOpenTaggingModal: () => void;
  onOpenOutcomeQuizModal: () => void;
}) {
  const [zoom, setZoom] = useState(0.9);
  const [pan, setPan] = useState({ x: 60, y: 60 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // ─── Zoom via scroll wheel ─────────────────────────────────────────────────
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoom((z) => Math.min(2, Math.max(0.3, z - e.deltaY * 0.001)));
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // ─── Mouse pan ────────────────────────────────────────────────────────────
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (
      target.closest(".wf-node") ||
      target.closest(".wf-controls") ||
      target.closest(".wf-sidebar")
    ) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleZoomIn  = () => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(1)));
  const handleZoomOut = () => setZoom((z) => Math.max(0.3, +(z - 0.1).toFixed(1)));
  const handleZoomReset = () => { setZoom(1); setPan({ x: 60, y: 60 }); };

  const handleFitView = useCallback(() => {
    if (questions.length === 0) return;
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const vw = canvasEl.clientWidth;
    const totalW = questions.length * H_SPACING;
    const fitZoom = Math.min(1, Math.floor((vw / totalW) * 10) / 10);
    setZoom(Math.max(0.3, fitZoom));
    setPan({ x: 32, y: 80 });
  }, [questions.length]);

  // ─── Build connections ─────────────────────────────────────────────────────
  type Conn = { fromIdx: number; toIdx: number; label?: string; isBranch: boolean };
  const connections: Conn[] = [];

  questions.forEach((q, i) => {
    const logic = q.settings?.logic || {};
    const rules: any[] = logic.rules || [];

    rules.forEach((rule: any) => {
      if (rule.action === "go_to" && rule.target) {
        const toIdx = questions.findIndex((o) => o.id === Number(rule.target));
        if (toIdx !== -1) {
          connections.push({ fromIdx: i, toIdx, label: "rule", isBranch: true });
        }
      }
    });

    if (logic.otherwise) {
      const toIdx = questions.findIndex((o) => o.id === Number(logic.otherwise));
      if (toIdx !== -1) {
        connections.push({ fromIdx: i, toIdx, label: "else", isBranch: true });
      }
    }

    if (logic.alwaysGoTo) {
      const toIdx = questions.findIndex((o) => o.id === Number(logic.alwaysGoTo));
      if (toIdx !== -1) {
        connections.push({ fromIdx: i, toIdx, label: "always", isBranch: true });
      }
    }

    if (i < questions.length - 1) {
      connections.push({ fromIdx: i, toIdx: i + 1, isBranch: false });
    }
  });

  // ─── SVG paths ────────────────────────────────────────────────────────────
  const SVG_W = Math.max(5000, questions.length * H_SPACING + 400);
  const SVG_H = 600;

  function buildPath(conn: Conn) {
    const x1 = conn.fromIdx * H_SPACING + NODE_W; // right edge of from-node
    const y1 = NODE_Y + NODE_H / 2;
    const x2 = conn.toIdx * H_SPACING;              // left edge of to-node
    const y2 = NODE_Y + NODE_H / 2;

    // Sequential straight line
    if (!conn.isBranch && conn.toIdx === conn.fromIdx + 1) {
      return { d: `M ${x1} ${y1} L ${x2} ${y2}`, isSimple: true };
    }

    // Curved bezier for jumps
    const diff = conn.toIdx - conn.fromIdx;
    const magnitude = Math.abs(diff);
    const arcH = Math.min(180, magnitude * 40);
    const sign = diff > 0 ? -1 : 1;
    const cy = y1 + sign * arcH;

    // Control point offset scaled dynamically with distance to prevent crossing/squishing
    const dx = x2 - x1;
    const ctrlOffset = Math.min(60, Math.abs(dx) * 0.45);
    const cp1x = x1 + (dx > 0 ? ctrlOffset : -ctrlOffset);
    const cp2x = x2 - (dx > 0 ? ctrlOffset : -ctrlOffset);

    const d = `M ${x1} ${y1} C ${cp1x} ${cy}, ${cp2x} ${cy}, ${x2} ${y2}`;
    return { d, isSimple: false };
  }

  // ─── Label badge position ─────────────────────────────────────────────────
  function labelPos(conn: Conn) {
    const x1 = conn.fromIdx * H_SPACING + NODE_W;
    const y1 = NODE_Y + NODE_H / 2;
    const x2 = conn.toIdx * H_SPACING;
    const y2 = NODE_Y + NODE_H / 2;
    const diff = conn.toIdx - conn.fromIdx;
    const magnitude = Math.abs(diff);
    const arcH = Math.min(180, magnitude * 40);
    const sign = diff > 0 ? -1 : 1;
    return { x: (x1 + x2) / 2, y: y1 + sign * arcH * 0.7 };
  }

  const CONN_LABEL_COLORS: Record<string, string> = {
    rule:   "bg-indigo-100 text-indigo-600 border-indigo-200",
    else:   "bg-amber-100 text-amber-600 border-amber-200",
    always: "bg-blue-100 text-blue-600 border-blue-200",
  };

  return (
    <div className="flex flex-1 h-full overflow-hidden bg-[#f4f4f6] select-none relative">

      {/* ── Main pan/zoom canvas ───────────────────────────────────────────── */}
      <div
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`flex-1 h-full overflow-hidden relative ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
        style={{
          backgroundImage: "radial-gradient(#d1d5db 1.2px, transparent 1.2px)",
          backgroundSize: "22px 22px",
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      >
        {/* Transformable layer */}
        <div
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0" }}
          className="absolute inset-0 pointer-events-none"
        >
          {/* SVG Connectors */}
          <svg
            width={SVG_W}
            height={SVG_H}
            className="absolute top-0 left-0 overflow-visible pointer-events-none"
            style={{ zIndex: 0 }}
          >
            <defs>
              <marker
                id="wf-arrow-seq"
                viewBox="0 0 10 10" refX="8" refY="5"
                markerWidth="5" markerHeight="5" orient="auto-start-reverse"
              >
                <path d="M 0 2 L 8 5 L 0 8 z" fill="#94a3b8" />
              </marker>
              <marker
                id="wf-arrow-branch"
                viewBox="0 0 10 10" refX="8" refY="5"
                markerWidth="5" markerHeight="5" orient="auto-start-reverse"
              >
                <path d="M 0 2 L 8 5 L 0 8 z" fill="#6366f1" />
              </marker>
            </defs>

            {connections.map((conn, idx) => {
              const { d, isSimple } = buildPath(conn);
              const lp = conn.label ? labelPos(conn) : null;

              return (
                <g key={idx}>
                  <path
                    d={d}
                    fill="none"
                    stroke={isSimple ? "#cbd5e1" : "#6366f1"}
                    strokeWidth={isSimple ? 1.5 : 2}
                    strokeDasharray={conn.label === "else" ? "5 3" : undefined}
                    markerEnd={isSimple ? "url(#wf-arrow-seq)" : "url(#wf-arrow-branch)"}
                    opacity={isSimple ? 0.8 : 1}
                  />
                  {conn.label && lp && (
                    <foreignObject x={lp.x - 24} y={lp.y - 10} width={48} height={20}>
                      <div
                        className={`inline-flex items-center justify-center rounded-full border px-1.5 py-0.5 text-[8px] font-bold shadow-xs whitespace-nowrap ${CONN_LABEL_COLORS[conn.label] || "bg-gray-100 text-gray-500 border-gray-200"}`}
                      >
                        {conn.label}
                      </div>
                    </foreignObject>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Question Nodes */}
          <div className="absolute top-0 left-0" style={{ width: SVG_W, height: SVG_H, zIndex: 10 }}>
            {questions.map((q, i) => {
              const meta = getTypeMeta(q.type);
              const hasLogic =
                q.settings?.logic &&
                (
                  (q.settings.logic.rules?.length ?? 0) > 0 ||
                  q.settings.logic.alwaysGoTo ||
                  q.settings.logic.otherwise
                );

              return (
                <div
                  key={q.id}
                  className="wf-node absolute pointer-events-auto"
                  style={{ left: i * H_SPACING, top: NODE_Y, width: NODE_W, height: NODE_H }}
                >
                  {/* Left connector dot */}
                  {i > 0 && (
                    <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-slate-300 shadow-xs z-20" />
                  )}

                  {/* Card */}
                  <div className="w-full h-full bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-150 flex items-center gap-3 px-3.5 group">
                    {/* Type icon pill */}
                    <div className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold border ${meta.bg} ${meta.text} ${meta.border}`}>
                      {/* Number badge */}
                      <span className="absolute -top-2 -left-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-md bg-gray-800 px-1 text-[9px] font-bold text-white leading-none">
                        {i + 1}
                      </span>
                      {meta.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-800 truncate leading-tight">
                        {q.title || "Untitled question"}
                      </p>
                      <p className="mt-0.5 text-[10px] text-gray-400 capitalize truncate">
                        {q.type.replace(/_/g, " ")}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Logic button */}
                      <button
                        type="button"
                        onClick={() => onOpenLogicModal(q.id)}
                        title="Branching logic"
                        className={`flex h-7 w-7 items-center justify-center rounded-lg border text-xs font-bold transition-all ${
                          hasLogic
                            ? "bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100"
                            : "bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100 opacity-0 group-hover:opacity-100"
                        }`}
                      >
                        ⌥
                      </button>
                      {/* Menu button */}
                      <button
                        type="button"
                        title="More options"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Right connector dot */}
                  {i < questions.length - 1 && (
                    <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-slate-300 shadow-xs z-20" />
                  )}
                </div>
              );
            })}

            {/* Empty state */}
            {questions.length === 0 && (
              <div
                style={{ left: 60, top: NODE_Y - 40 }}
                className="absolute pointer-events-auto"
              >
                <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-gray-300 bg-white/60 px-12 py-10 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">
                    ⌥
                  </div>
                  <p className="text-sm font-semibold text-gray-600">No questions yet</p>
                  <p className="text-xs text-gray-400">Add questions in the Content tab to start building branching logic.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Zoom controls (bottom-left) ─────────────────────────────────── */}
        <div className="wf-controls absolute bottom-5 left-5 z-30 flex items-center gap-1 rounded-2xl border border-gray-200 bg-white px-2.5 py-1.5 shadow-md text-sm text-gray-600">
          <button
            onClick={handleZoomOut}
            title="Zoom out"
            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-gray-100 hover:text-gray-800 transition-colors font-bold text-base leading-none"
          >
            −
          </button>
          <button
            onClick={handleZoomReset}
            title="Reset zoom"
            className="min-w-[42px] px-1.5 py-0.5 text-center rounded-md hover:bg-gray-100 text-xs font-semibold transition-colors"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={handleZoomIn}
            title="Zoom in"
            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-gray-100 hover:text-gray-800 transition-colors font-bold text-base leading-none"
          >
            +
          </button>
          <div className="h-4 w-px bg-gray-200 mx-1" />
          <button
            onClick={handleFitView}
            title="Fit all nodes into view"
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-gray-100 text-xs font-semibold transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            Fit view
          </button>
        </div>

        {/* ── Legend (bottom-right of canvas) ───────────────────────────── */}
        <div className="wf-controls absolute bottom-5 right-[336px] z-20 hidden lg:flex items-center gap-3 rounded-xl border border-gray-200 bg-white/90 px-3 py-1.5 text-[10px] text-gray-500 font-medium shadow-sm">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-6 h-0.5 bg-slate-300 rounded" /> Sequential
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-6 h-0.5 bg-indigo-400 rounded" /> Branch
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-6 h-0 border-t-2 border-dashed border-amber-400" /> Fallback
          </span>
        </div>
      </div>

      {/* ── Right Actions Sidebar ─────────────────────────────────────────── */}
      <aside className="wf-sidebar w-72 shrink-0 border-l border-gray-200 bg-white flex flex-col z-10 overflow-y-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-sm">Actions</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">Integrate, automate and manage form data</p>
        </div>

        <div className="flex-1 p-4 space-y-6">
          {/* ── Connect ── */}
          <section className="space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Connect</span>
            <div className="space-y-2">
              {[
                { icon: "📊", name: "Google Sheets", desc: "Send responses to sheets", status: "Active", statusCls: "bg-indigo-50 text-indigo-600 border-indigo-100" },
                { icon: "⚡", name: "Zapier", desc: "Trigger 5000+ app actions", status: "Connect", statusCls: "bg-gray-50 text-gray-400 border-gray-200" },
                { icon: "🔴", name: "Mailchimp", desc: "Sync contacts to lists", status: "Connect", statusCls: "bg-gray-50 text-gray-400 border-gray-200" },
              ].map((item) => (
                <div key={item.name} className="flex items-center gap-3 border border-gray-150 p-3 rounded-xl hover:bg-gray-50 bg-white cursor-pointer transition-colors">
                  <span className="text-xl shrink-0">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800">{item.name}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 truncate">{item.desc}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border shrink-0 ${item.statusCls}`}>{item.status}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ── Automations ── */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Automations</span>
              <span className="text-[9px] font-bold uppercase text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full border border-indigo-100">New</span>
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Create personalized response emails and flows with URL params/pixel tracking.
            </p>
            <div className="space-y-2">
              {[
                { icon: "✉", name: "Email Notifications", desc: "Notify yourself or respondent", enabled: false },
                { icon: "🔗", name: "Webhooks", desc: "POST JSON submissions", enabled: false },
              ].map((item) => (
                <div key={item.name} className="flex items-center justify-between border border-gray-150 p-3 rounded-xl bg-white hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-base shrink-0">{item.icon}</span>
                    <div>
                      <p className="text-xs font-semibold text-gray-800">{item.name}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                  {/* Toggle */}
                  <div
                    className={`relative w-9 h-5 rounded-full cursor-pointer transition-colors shrink-0 ${item.enabled ? "bg-indigo-500" : "bg-gray-200"}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${item.enabled ? "translate-x-4" : "translate-x-0.5"}`} />
                  </div>
                </div>
              ))}
              <button className="flex items-center gap-1.5 text-xs text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add automation
              </button>
            </div>
          </section>

          {/* ── Contacts ── */}
          <section className="space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Contacts</span>
            <div className="border border-gray-150 p-3.5 rounded-xl bg-white space-y-3">
              <p className="text-xs font-medium text-gray-700 leading-relaxed">
                Map form respondents directly to your system contacts list.
              </p>
              <button className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors">
                Configure Contact Sync
              </button>
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}
