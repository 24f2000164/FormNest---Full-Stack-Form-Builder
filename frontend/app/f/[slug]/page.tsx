"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { getFormBySlug, submitResponse, trackFormView, trackFormStart, trackFormProgress } from "@/lib/api";
import { validateAnswer } from "@/lib/validation";
import PreviewProgressBar from "@/components/preview/PreviewProgressBar";
import PreviewQuestionScreen from "@/components/preview/PreviewQuestionScreen";

type QuestionRead = {
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
  questions: QuestionRead[];
};

type Step = { kind: "question"; question: QuestionRead } | { kind: "end" };

type AnswerEntry = { questionId: number; value: any; updatedAt: string };

const SCREEN_TYPES = new Set(["welcome_screen", "ending_screen"]);

export default function PublicFormPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const router = useRouter();

  const [form, setForm] = useState<FormRead | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState<"idle" | "leaving" | "entering">("idle");
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [answers, setAnswers] = useState<Record<number, AnswerEntry>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [viewId, setViewId] = useState<number | null>(null);
  const startedRef = useRef(false);
  const maxIndexRef = useRef(0);
  const questionRef = useRef<HTMLDivElement>(null);

  const getDeviceType = () => {
    if (typeof window === "undefined") return "desktop";
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return "tablet";
    }
    if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) {
      return "mobile";
    }
    return "desktop";
  };

  useEffect(() => {
    if (!slug) return;
    getFormBySlug(slug)
      .then((f) => {
        setForm(f);

        // Track View
        const device = getDeviceType();
        trackFormView(slug, device)
          .then((res) => setViewId(res.view_id))
          .catch((err) => console.error("Failed to track view:", err));
      })
      .catch((err) => {
        setError("Failed to load form");
        console.error(err);
      });
  }, [slug]);

  const steps: Step[] = useMemo(() => {
    if (!form) return [];
    const list: Step[] = [];
    const sortedQuestions = [...(form.questions || [])].sort((a, b) => a.order_index - b.order_index);
    sortedQuestions.forEach((q) => list.push({ kind: "question", question: q }));
    const last = sortedQuestions[sortedQuestions.length - 1];
    if (!last || last.type !== "ending_screen") list.push({ kind: "end" });
    return list;
  }, [form]);

  const countedQuestions = useMemo(() => {
    const sorted = [...(form?.questions || [])].sort((a, b) => a.order_index - b.order_index);
    return sorted.filter((q) => !SCREEN_TYPES.has(q.type));
  }, [form]);

  const currentStep = steps[stepIndex];

  // Track start filling out the form
  useEffect(() => {
    if (viewId && !startedRef.current) {
      const hasAnswers = Object.keys(answers).length > 0;
      if (hasAnswers) {
        startedRef.current = true;
        trackFormStart(viewId).catch(console.error);
      }
    }
  }, [answers, viewId]);

  // Track progress as stepIndex changes
  useEffect(() => {
    if (viewId && stepIndex > maxIndexRef.current) {
      maxIndexRef.current = stepIndex;
      trackFormProgress(viewId, stepIndex).catch(console.error);
    }
  }, [stepIndex, viewId]);

  const goNext = useCallback(() => {
    if (stepIndex >= steps.length - 1) return;
    setDirection("forward");
    setPhase("leaving");
    window.setTimeout(() => {
      setPhase("entering");
      setStepIndex((i) => Math.min(i + 1, steps.length - 1));
    }, 260);
  }, [stepIndex, steps.length]);

  const goBack = useCallback(() => {
    if (stepIndex <= 0) return;
    setDirection("backward");
    setPhase("leaving");
    window.setTimeout(() => {
      setPhase("entering");
      setStepIndex((i) => Math.max(i - 1, 0));
    }, 260);
  }, [stepIndex]);

  const nextStep = steps[stepIndex + 1];
  const isLastQuestion = useMemo(() => {
    const currentStep = steps[stepIndex];
    return (
      currentStep?.kind === "question" &&
      !SCREEN_TYPES.has(currentStep.question.type) &&
      (!nextStep || nextStep.kind === "end" || (nextStep.kind === "question" && nextStep.question.type === "ending_screen"))
    );
  }, [steps, stepIndex, nextStep]);

  const attemptAdvance = useCallback(async () => {
    if (submitting) return;
    const step = steps[stepIndex];
    if (step?.kind === "question" && !SCREEN_TYPES.has(step.question.type)) {
      const currentValue = answers[step.question.id]?.value;
      const message = validateAnswer(step.question, currentValue);
      if (message) {
        setFieldErrors((prev) => ({ ...prev, [step.question.id]: message }));
        return;
      }
    }

    if (isLastQuestion && form) {
      setSubmitting(true);
      setError(null);
      try {
        const answerList = Object.values(answers).map((entry) => ({
          question_id: entry.questionId,
          value: entry.value,
        }));
        await submitResponse(form.id, answerList, viewId || undefined);
        setSubmitSuccess(true);
        goNext();
      } catch (err: any) {
        console.error("Failed to submit response:", err);
        setError("Failed to submit response. Please try again.");
      } finally {
        setSubmitting(false);
      }
    } else {
      goNext();
    }
  }, [submitting, steps, stepIndex, answers, isLastQuestion, form, viewId, goNext]);

  const handleAnswerChange = useCallback((questionId: number, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { questionId, value, updatedAt: new Date().toISOString() },
    }));
    setFieldErrors((prev) => {
      if (!(questionId in prev)) return prev;
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (submitSuccess || submitting) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "SELECT") return;

      if (e.key === "Enter") {
        if (tag === "TEXTAREA" && e.shiftKey) return;
        e.preventDefault();
        attemptAdvance();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        attemptAdvance();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        goBack();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [stepIndex, steps.length, answers, submitSuccess, submitting, attemptAdvance, goBack]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setPhase("idle"));
    return () => cancelAnimationFrame(raf);
  }, [stepIndex]);

  if (error && !form) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-white text-gray-500">
        <p>{error}</p>
      </div>
    );
  }

  if (!form || !currentStep) {
    return (
      <div className="flex h-screen items-center justify-center bg-white text-gray-400">
        Loading...
      </div>
    );
  }

  // Progress calculations
  let progressPercent = 0;
  let showProgressBar = false;
  let badgeNumber: number | null = null;

  if (currentStep?.kind === "question" && !SCREEN_TYPES.has(currentStep.question.type)) {
    showProgressBar = true;
    const posInCounted = countedQuestions.findIndex((q) => q.id === currentStep.question.id);
    progressPercent = countedQuestions.length ? (posInCounted / countedQuestions.length) * 100 : 0;
    badgeNumber = posInCounted + 1;
  } else if (
    currentStep?.kind === "end" ||
    (currentStep?.kind === "question" && currentStep.question.type === "ending_screen")
  ) {
    showProgressBar = true;
    progressPercent = 100;
  }

  const leavingOffset = direction === "forward" ? "-translate-y-8" : "translate-y-8";
  const enteringOffset = direction === "forward" ? "translate-y-8" : "-translate-y-8";
  const transitionClass =
    phase === "leaving"
      ? `${leavingOffset} opacity-0`
      : phase === "entering"
      ? `${enteringOffset} opacity-0`
      : "translate-y-0 opacity-100";

  const isEndingScreen =
    currentStep?.kind === "end" ||
    (currentStep?.kind === "question" && currentStep.question.type === "ending_screen");

  const isAnswerableQuestion =
    currentStep?.kind === "question" && !SCREEN_TYPES.has(currentStep.question.type);

  return (
    <div className="flex min-h-screen w-full flex-col bg-white text-gray-900 relative overflow-x-hidden">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 z-30">
        {showProgressBar && <PreviewProgressBar percent={progressPercent} />}
      </div>

      {/* Main Content Area */}
      <main className="flex flex-1 items-center justify-center px-6 py-12 md:px-20 max-w-4xl mx-auto w-full pb-32 sm:pb-24">
        <div key={stepIndex} className={`w-full transition-all duration-300 ease-in-out ${transitionClass}`} ref={questionRef}>
          {currentStep.kind === "question" && currentStep.question.type === "welcome_screen" ? (
            <div className="text-center max-w-xl mx-auto">
              <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                {currentStep.question.title || "Welcome"}
              </h1>
              {currentStep.question.description && (
                <p className="mt-4 text-lg text-gray-500">{currentStep.question.description}</p>
              )}
              <button
                onClick={attemptAdvance}
                className="mt-8 transform-gpu rounded-lg bg-[#222222] px-8 py-3.5 font-bold text-white transition-transform duration-150 ease-out hover:scale-105 hover:bg-gray-800 active:scale-95"
              >
                Start
              </button>
            </div>
          ) : currentStep.kind === "question" && currentStep.question.type === "ending_screen" ? (
            <div className="text-center max-w-xl mx-auto flex flex-col items-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-gray-900 text-gray-900">
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                {currentStep.question.title || "Thanks for completing this form"}
              </h1>
              {currentStep.question.description && (
                <p className="mt-4 text-lg text-gray-500">{currentStep.question.description}</p>
              )}

              {/* Social Share Icons */}
              {(currentStep.question.settings?.socialShare ?? true) && (
                <div className="flex items-center justify-center gap-2.5 mt-6 select-none">
                  {/* Facebook Icon */}
                  <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`} target="_blank" rel="noopener noreferrer" className="h-8 w-8 rounded-lg bg-[#1877f2] flex items-center justify-center text-white text-sm font-black shadow hover:opacity-90 transition-opacity">
                    f
                  </a>
                  {/* X Icon */}
                  <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`} target="_blank" rel="noopener noreferrer" className="h-8 w-8 rounded-lg bg-black flex items-center justify-center text-white text-xs font-bold shadow hover:opacity-90 transition-opacity">
                    𝕏
                  </a>
                  {/* LinkedIn Icon */}
                  <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`} target="_blank" rel="noopener noreferrer" className="h-8 w-8 rounded-lg bg-[#0a66c2] flex items-center justify-center text-white text-xs font-bold shadow hover:opacity-90 transition-opacity">
                    in
                  </a>
                </div>
              )}

              {/* Action Button */}
              {(currentStep.question.settings?.buttonEnabled ?? true) && (
                <a
                  href="/"
                  className="mt-8 transform-gpu rounded-lg bg-[#222222] px-8 py-3.5 font-bold text-white transition-all duration-150 ease-out hover:scale-105 hover:bg-gray-800 active:scale-95 shadow-md"
                >
                  {currentStep.question.settings?.buttonText || "Create your own"}
                </a>
              )}
            </div>
          ) : currentStep.kind === "question" ? (
            <PreviewQuestionScreen
              question={currentStep.question}
              badgeNumber={badgeNumber}
              value={answers[currentStep.question.id]?.value}
              onChange={(val) => handleAnswerChange(currentStep.question.id, val)}
              onSubmit={attemptAdvance}
              error={fieldErrors[currentStep.question.id] ?? null}
              isLastQuestion={isLastQuestion}
            />
          ) : (
            /* Fallback ending screen */
            <div className="text-center max-w-xl mx-auto">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-gray-900 text-gray-900">
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Thanks for completing this form
              </h1>
              <p className="mt-4 text-lg text-gray-500">
                Now <span className="font-semibold text-gray-800">create your own</span> — it's free, easy & beautiful
              </p>
            </div>
          )}

          {/* Submitting error display */}
          {error && !isEndingScreen && (
            <div className="mt-4 text-sm text-red-600 font-medium text-center">
              {error}
            </div>
          )}
        </div>
      </main>

      {/* Navigation Bars */}
      
      {/* 1. Mobile bottom navigation bar (visible only on mobile view/screens) */}
      {steps.length > 1 && isAnswerableQuestion && !isEndingScreen && (
        <div className="flex sm:hidden fixed bottom-0 left-0 right-0 border-t border-gray-200/50 bg-[#f5f5f5] p-4 gap-2 items-center shrink-0 z-30">
          <button
            type="button"
            onClick={goBack}
            disabled={stepIndex === 0}
            className="flex h-11 w-12 items-center justify-center rounded-lg bg-[#222222] text-white hover:bg-zinc-800 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
              <path d="M12 5l-5 5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={attemptAdvance}
            disabled={submitting}
            className="flex-1 flex h-11 items-center justify-center font-bold text-sm text-white bg-[#222222] hover:bg-zinc-800 active:scale-95 rounded-lg transition-all disabled:opacity-50"
          >
            {submitting ? "Submitting..." : isLastQuestion ? "Submit" : "OK"}
          </button>
        </div>
      )}

      {/* 2. Desktop bottom-right navigation arrows and Powered by FormNest (visible only on desktop) */}
      {steps.length > 1 && !isEndingScreen && (
        <div className="hidden sm:flex fixed bottom-8 right-8 z-30 gap-2 items-center">
          {/* Up/Down Arrows */}
          <div className="flex overflow-hidden rounded-lg bg-[#222222] text-white shadow-sm border border-zinc-700/50">
            <button
              type="button"
              aria-label="Previous"
              onClick={goBack}
              disabled={stepIndex === 0}
              className="flex h-9 w-9 items-center justify-center text-white/90 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                <path d="M5 12l5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="w-px bg-zinc-700/50 h-9" />
            <button
              type="button"
              aria-label="Next"
              onClick={attemptAdvance}
              disabled={stepIndex >= steps.length - 1 || submitting}
              className="flex h-9 w-9 items-center justify-center text-white/90 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* Powered by FormNest Badge */}
          <div className="flex items-center gap-1.5 rounded-lg bg-[#222222] px-3 py-2 text-xs text-white/70 shadow-sm border border-zinc-700/50">
            <span className="text-[10px] uppercase tracking-wide opacity-80">Powered by</span>
            <div className="flex items-center gap-1 font-semibold text-white">
              <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>FormNest</span>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Ending Screen Gray Footer */}
      {isEndingScreen && (
        <div className="flex sm:hidden fixed bottom-0 left-0 right-0 bg-[#e6e6e6] px-6 py-4 justify-center items-center border-t border-gray-200/50 shrink-0 z-30">
          <a
            href="/"
            className="px-6 py-2 bg-black hover:bg-zinc-800 text-white rounded text-[11px] font-bold transition-all shadow-sm uppercase tracking-wider text-center w-full"
          >
            Create a form
          </a>
        </div>
      )}

      {/* Desktop Ending Screen Gray Footer */}
      {isEndingScreen && (
        <div className="hidden sm:flex fixed bottom-0 left-0 right-0 bg-[#e6e6e6] px-6 py-4 justify-between items-center border-t border-gray-200/50 shrink-0 z-30">
          <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
            How you ask is everything
          </span>
          <a
            href="/"
            className="px-6 py-2 bg-black hover:bg-zinc-800 text-white rounded text-[11px] font-bold transition-all shadow-sm uppercase tracking-wider"
          >
            Create a form
          </a>
        </div>
      )}
    </div>
  );
}