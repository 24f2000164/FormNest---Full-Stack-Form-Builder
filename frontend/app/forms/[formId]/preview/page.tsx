"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getFormById, FormRead, submitResponse } from "@/lib/api";
import { loadPreviewDraft, PreviewDraft } from "@/lib/previewDraft";
import { validateAnswer } from "@/lib/validation";
import PreviewHeaderButton from "@/components/preview/PreviewHeaderButton";
import PreviewProgressBar from "@/components/preview/PreviewProgressBar";
import PreviewQuestionScreen from "@/components/preview/PreviewQuestionScreen";
import { getNextStepIndex, calculateFormScore, calculateFormTags, calculateOutcomeEndingId } from "@/lib/logicEngine";

type Question = FormRead["questions"][number];

type Step = { kind: "welcome" } | { kind: "question"; question: Question } | { kind: "end" };

// Each answer keeps the value alongside which question it belongs to and
// when it was last touched, per the ANSWER STATE requirement - even though
// the question id is already the map key, storing it on the record too
// keeps every entry self-describing once it's read out of the map (e.g.
// when building the payload below).
type AnswerEntry = { questionId: number; value: any; updatedAt: string };

const SCREEN_TYPES = new Set(["welcome_screen", "ending_screen"]);

// Phase 2: full Builder-accurate rendering for every question + local-only
// navigation between them.
// - No answer validation
// - No submission (answers never leave this tab)
// - No restart
// - Builder is never touched from here (read-only fetch only)
//
// Phase 3: rounds out the preview chrome that Phase 2 left stubbed.
// - Restart: jumps back to step 0 and clears in-memory answers
// - Mobile view: renders the question area inside a phone-width frame
// - Back navigation: previous button + Up/Down arrow keys, mirroring the
//   Enter-to-advance affordance already in place
//
// Phase 4: validation. Forward navigation (OK button, Enter, Down arrow,
// the next chevron) is blocked with an inline, Typeform-style error
// whenever the current answer fails validateAnswer() (lib/validation.ts) -
// required fields, email/phone/regex format, number range, character
// limits, dropdown/multiple-choice/rating/yes-no selection rules. Backward
// navigation is never blocked. Answers are still local-only; a submission
// payload is assembled in-memory (see responsePayload below) but nothing
// is POSTed anywhere yet.
export default function PreviewPage() {
  const params = useParams();
  const formId = params.formId as string;
  const router = useRouter();

  const [form, setForm] = useState<FormRead | null>(null);
  const [draft, setDraft] = useState<PreviewDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stepIndex, setStepIndex] = useState(0);
  const [visitedHistory, setVisitedHistory] = useState<number[]>([]);
  const [phase, setPhase] = useState<"idle" | "leaving" | "entering">("idle");
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [answers, setAnswers] = useState<Record<number, AnswerEntry>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<number, string>>({});
  const [mobileView, setMobileView] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!formId) return;
    // Read-only: the same GET the Builder itself uses to load a form.
    // This never writes anything back, so Preview can't modify Builder data.
    getFormById(Number(formId))
      .then((data) => setForm(data))
      .catch(() => setError("Couldn't load this form."))
      .finally(() => setLoading(false));

    // Welcome-screen text has no backend column yet, so it only exists as
    // Builder state - pick up whatever the Builder handed off right before
    // opening this tab.
    setDraft(loadPreviewDraft(formId));
  }, [formId]);

  const hasWelcomeScreen = Boolean(draft?.welcomeTitle?.trim());

  const steps: Step[] = useMemo(() => {
    const list: Step[] = [];
    if (hasWelcomeScreen) list.push({ kind: "welcome" });
    (form?.questions || []).forEach((q) => list.push({ kind: "question", question: q }));
    const last = form?.questions[form.questions.length - 1];
    if (!last || last.type !== "ending_screen") list.push({ kind: "end" });
    return list;
  }, [form, hasWelcomeScreen]);

  const countedQuestions = useMemo(
    () => (form?.questions || []).filter((q) => !SCREEN_TYPES.has(q.type)),
    [form]
  );

  // Keep the step index in range if the underlying data changes.
  useEffect(() => {
    if (stepIndex > steps.length - 1) setStepIndex(Math.max(0, steps.length - 1));
  }, [steps, stepIndex]);

  function goNext() {
    if (stepIndex >= steps.length - 1) return;

    let nextStepIdx = stepIndex + 1;
    const step = steps[stepIndex];
    if (step?.kind === "question" && !SCREEN_TYPES.has(step.question.type) && form) {
      const qCurrIdx = form.questions.findIndex((q) => q.id === step.question.id);
      if (qCurrIdx !== -1) {
        const nextQIdx = getNextStepIndex({
          currentIndex: qCurrIdx,
          answers,
          questions: form.questions,
        });
        if (nextQIdx >= form.questions.length) {
          // Check outcome quiz mappings
          const outcomeEndingId = calculateOutcomeEndingId(answers, form.questions, form.settings);
          if (outcomeEndingId) {
            const endingStepIdx = steps.findIndex(
              (s) => s.kind === "question" && s.question.id === outcomeEndingId
            );
            if (endingStepIdx !== -1) {
              nextStepIdx = endingStepIdx;
            } else {
              nextStepIdx = steps.length - 1;
            }
          } else {
            nextStepIdx = steps.length - 1; // End step
          }
        } else {
          const targetQ = form.questions[nextQIdx];
          const targetStepIdx = steps.findIndex(
            (s) => s.kind === "question" && s.question.id === targetQ.id
          );
          if (targetStepIdx !== -1) {
            nextStepIdx = targetStepIdx;
          }
        }
      }
    }

    setDirection("forward");
    setPhase("leaving");
    window.setTimeout(() => {
      setPhase("entering");
      setVisitedHistory((prev) => [...prev, stepIndex]);
      setStepIndex(nextStepIdx);
    }, 260);
  }

  // Every forward trigger (OK button, Enter, Down arrow, next chevron)
  // routes through here first. If the current step is a question and its
  // answer fails validation, the step never advances - an inline error is
  // set instead. Backward navigation (goBack) is never gated.
  async function attemptAdvance() {
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
    
    if (isLastQuestion) {
      setSubmitting(true);
      setSubmitError(null);
      try {
        const answerList = Object.values(answers).map((entry) => ({
          question_id: entry.questionId,
          value: entry.value,
        }));
        await submitResponse(Number(formId), answerList);
        goNext();
      } catch (err: any) {
        console.error("Failed to submit preview response:", err);
        setSubmitError("Failed to submit response. Please try again.");
      } finally {
        setSubmitting(false);
      }
    } else {
      goNext();
    }
  }

  function goBack() {
    if (stepIndex <= 0) return;
    setDirection("backward");
    setPhase("leaving");
    window.setTimeout(() => {
      setPhase("entering");
      if (visitedHistory.length > 0) {
        const prevIndex = visitedHistory[visitedHistory.length - 1];
        setVisitedHistory((prev) => prev.slice(0, -1));
        setStepIndex(prevIndex);
      } else {
        setStepIndex((i) => Math.max(i - 1, 0));
      }
    }, 260);
  }

  // Jumps back to the very first step and clears every in-memory answer
  // and error. Answers were never sent anywhere (see PreviewQuestionField),
  // so this is just resetting local state - nothing to undo on the backend.
  function handleRestart() {
    setDirection("backward");
    setPhase("leaving");
    window.setTimeout(() => {
      setAnswers({});
      setFieldErrors({});
      setVisitedHistory([]);
      setPhase("entering");
      setStepIndex(0);
    }, 260);
  }

  // Stores the value with its question id and a fresh timestamp, and
  // clears any inline error for that question now that it's been touched.
  function handleAnswerChange(questionId: number, value: any) {
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
  }

  // Submission-ready shape (question_id/value, matching the backend's
  // ResponseSubmit.answers) assembled purely in memory. Nothing here ever
  // calls the API - this only prepares the payload for a future submit.
  const responsePayload = useMemo(
    () =>
      Object.values(answers).map((entry) => ({
        question_id: entry.questionId,
        value: entry.value,
        answered_at: entry.updatedAt,
      })),
    [answers]
  );

  useEffect(() => {
    const raf = requestAnimationFrame(() => setPhase("idle"));
    return () => cancelAnimationFrame(raf);
  }, [stepIndex]);

  // Dev visibility only: confirms the payload is being assembled locally.
  // No request is ever sent - see the BACKEND section of the validation
  // spec ("Prepare payload. No submission yet.").
  useEffect(() => {
    if (responsePayload.length === 0) return;
    console.debug("[Preview] response payload prepared (not submitted):", responsePayload);
  }, [responsePayload]);

  // Enter advances (Shift+Enter inserts a newline in Long Text instead),
  // Up/Down arrows step back and forth - mirrors the respondent flow's
  // keyboard navigation. Forward movement always goes through
  // attemptAdvance so an invalid answer blocks Enter/Down exactly like it
  // blocks the OK button and the next chevron.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "SELECT") return; // let the native dropdown handle its own Enter/keys

      if (e.key === "Enter") {
        if (tag === "TEXTAREA" && e.shiftKey) return; // Shift+Enter -> newline, not navigation
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
    // Re-subscribed whenever the step or the answers change so Enter/Down
    // always validates against the latest typed value, not a stale closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, steps.length, answers]);

  function handleClose() {
    // Preview always opens in its own tab (see the Builder's Preview
    // button), so closing the tab is the correct way to "return" to the
    // Builder tab sitting behind it. If this tab wasn't opened by script
    // window.close() silently does nothing, so fall back to navigating
    // back to the Builder instead.
    window.close();
    setTimeout(() => {
      router.push(`/forms/${formId}/edit`);
    }, 150);
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white text-gray-400">
        Loading preview...
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-white text-gray-500">
        <p>{error || "Form not found."}</p>
        <button onClick={handleClose} className="text-sm font-medium text-gray-900 underline">
          Back to Builder
        </button>
      </div>
    );
  }

  const currentStep: Step | undefined = steps[stepIndex];

  // Progress: proportion of "real" questions completed so far (welcome and
  // ending/screen types aren't counted, matching Typeform).
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

  // The very last answerable question - the one right before the ending
  // screen/end step - gets a Submit button instead of OK, matching
  // Typeform (see PreviewQuestionScreen).
  const nextStep = steps[stepIndex + 1];
  const isLastQuestion =
    currentStep?.kind === "question" &&
    !SCREEN_TYPES.has(currentStep.question.type) &&
    (!nextStep || nextStep.kind === "end" || (nextStep.kind === "question" && nextStep.question.type === "ending_screen"));

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
    <div className="flex min-h-screen flex-col bg-white">
      {/* Floating capsule toolbar: Close, Mobile/Desktop View toggle, Restart */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 rounded-full border border-gray-200 bg-white/80 px-3 py-1.5 shadow-sm backdrop-blur-md">
        <button
          type="button"
          onClick={handleClose}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
          title="Close Preview"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="h-4 w-px bg-gray-200" />
        <button
          type="button"
          onClick={() => setMobileView((v) => !v)}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
          title={mobileView ? "Desktop view" : "Mobile view"}
        >
          {mobileView ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          )}
        </button>
        <div className="h-4 w-px bg-gray-200" />
        <button
          type="button"
          onClick={handleRestart}
          disabled={stepIndex === 0 && Object.keys(answers).length === 0}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors disabled:cursor-not-allowed disabled:opacity-30"
          title="Restart Preview"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </button>
      </div>

      {/* Main Content Area */}
      <main className="flex flex-1 items-center justify-center px-4 py-16 bg-white">
        {mobileView ? (
          /* Mobile View Frame - Simple */
          <div className="relative flex h-[580px] w-[340px] max-w-full flex-col overflow-hidden rounded-xl border border-gray-200/60 bg-[#f5f5f5] shadow-md">
            {/* Progress Bar inside Mobile View */}
            <div className="h-1 w-full shrink-0">
              {showProgressBar && <PreviewProgressBar percent={progressPercent} />}
            </div>
            {/* Mobile Question Content */}
            <div className="flex-1 overflow-y-auto px-6 py-10 pb-20 flex flex-col justify-center">
              <div key={stepIndex} className={`w-full transition-all duration-300 ease-in-out ${transitionClass}`}>
                {!currentStep ? (
                  <p className="text-center text-gray-400">This form doesn't have any content yet.</p>
                ) : currentStep.kind === "welcome" ? (
                  <div className="text-center">
                    <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">{draft?.welcomeTitle}</h1>
                    {draft?.welcomeDescription && <p className="mt-3 text-gray-500">{draft.welcomeDescription}</p>}
                    <button
                      onClick={goNext}
                      className="mt-8 transform-gpu rounded-lg bg-gray-900 px-6 py-3 font-medium text-white transition-transform duration-150 ease-out hover:scale-110 hover:bg-gray-800 active:scale-95"
                    >
                      {draft?.buttonText || "Start"}
                    </button>
                    {draft?.timeToComplete && (
                      <p className="mt-4 flex items-center justify-center gap-1 text-sm text-gray-400">
                        <span>⏱</span> Takes a few minutes
                      </p>
                    )}
                  </div>
                ) : currentStep.kind === "question" && currentStep.question.type === "welcome_screen" ? (
                  <div className="text-center">
                    <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
                      {currentStep.question.title || "Welcome"}
                    </h1>
                    {currentStep.question.description && (
                      <p className="mt-3 text-gray-500">{currentStep.question.description}</p>
                    )}
                    <button
                      onClick={goNext}
                      className="mt-8 transform-gpu rounded-lg bg-gray-900 px-6 py-3 font-medium text-white transition-transform duration-150 ease-out hover:scale-110 hover:bg-gray-800 active:scale-95"
                    >
                      Start
                    </button>
                  </div>
                ) : currentStep.kind === "question" && currentStep.question.type === "ending_screen" ? (
                  <div className="text-center">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-gray-900 text-gray-900">
                      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
                      {currentStep.question.title || "Thanks for completing this form"}
                    </h1>
                    {currentStep.question.description ? (
                      <p className="mt-3 text-gray-500">{currentStep.question.description}</p>
                    ) : (
                      <p className="mt-3 text-gray-500">
                        Now <span className="font-semibold text-gray-800">create your own</span> — it's free, easy & beautiful
                      </p>
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
                    hideActionButtons={true}
                  />
                ) : (
                  /* Fallback ending screen */
                  <div className="text-center">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-gray-900 text-gray-900">
                      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
                      Thanks for completing this form
                    </h1>
                    <p className="mt-3 text-gray-500">
                      Now <span className="font-semibold text-gray-800">create your own</span> — it's free, easy & beautiful
                    </p>
                  </div>
                )}

                {/* Submitting error display */}
                {submitError && !isEndingScreen && (
                  <div className="mt-3 text-sm text-red-600 font-medium text-center">
                    {submitError}
                  </div>
                )}
              </div>
            </div>

            {/* Mobile bottom navigation bar */}
            {steps.length > 1 && isAnswerableQuestion && !isEndingScreen && (
              <div className="border-t border-gray-200/50 bg-[#f5f5f5] p-4 flex gap-2 items-center shrink-0">
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

            {/* Mobile Ending Screen Gray Footer */}
            {isEndingScreen && (
              <div className="absolute bottom-0 left-0 right-0 bg-[#e6e6e6] px-6 py-4 flex justify-center items-center border-t border-gray-200/50 shrink-0 z-20">
                <a
                  href="/"
                  className="px-6 py-2 bg-black hover:bg-zinc-800 text-white rounded text-[11px] font-bold transition-all shadow-sm uppercase tracking-wider text-center w-full"
                >
                  Create a form
                </a>
              </div>
            )}
          </div>
        ) : (
          /* Desktop View Card */
          <div className="relative flex h-[450px] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-gray-200/60 bg-[#f5f5f5] shadow-lg">
            {/* Progress Bar inside Desktop Card */}
            <div className="h-1 w-full shrink-0">
              {showProgressBar && <PreviewProgressBar percent={progressPercent} />}
            </div>
            {/* Desktop Question Content */}
            <div className="flex-1 overflow-y-auto px-12 md:px-20 py-8 pb-20 flex flex-col justify-center">
              <div key={stepIndex} className={`w-full transition-all duration-300 ease-in-out ${transitionClass}`}>
                {!currentStep ? (
                  <p className="text-center text-gray-400">This form doesn't have any content yet.</p>
                ) : currentStep.kind === "welcome" ? (
                  <div className="text-center">
                    <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">{draft?.welcomeTitle}</h1>
                    {draft?.welcomeDescription && <p className="mt-3 text-gray-500">{draft.welcomeDescription}</p>}
                    <button
                      onClick={goNext}
                      className="mt-8 transform-gpu rounded-lg bg-gray-900 px-6 py-3 font-medium text-white transition-transform duration-150 ease-out hover:scale-110 hover:bg-gray-800 active:scale-95"
                    >
                      {draft?.buttonText || "Start"}
                    </button>
                    {draft?.timeToComplete && (
                      <p className="mt-4 flex items-center justify-center gap-1 text-sm text-gray-400">
                        <span>⏱</span> Takes a few minutes
                      </p>
                    )}
                  </div>
                ) : currentStep.kind === "question" && currentStep.question.type === "welcome_screen" ? (
                  <div className="text-center">
                    <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
                      {currentStep.question.title || "Welcome"}
                    </h1>
                    {currentStep.question.description && (
                      <p className="mt-3 text-gray-500">{currentStep.question.description}</p>
                    )}
                    <button
                      onClick={goNext}
                      className="mt-8 transform-gpu rounded-lg bg-gray-900 px-6 py-3 font-medium text-white transition-transform duration-150 ease-out hover:scale-110 hover:bg-gray-800 active:scale-95"
                    >
                      Start
                    </button>
                  </div>
                ) : currentStep.kind === "question" && currentStep.question.type === "ending_screen" ? (
                  <div className="text-center">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-gray-900 text-gray-900">
                      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
                      {currentStep.question.title || "Thanks for completing this form"}
                    </h1>
                    {currentStep.question.description ? (
                      <p className="mt-3 text-gray-500">{currentStep.question.description}</p>
                    ) : (
                      <p className="mt-3 text-gray-500">
                        Now <span className="font-semibold text-gray-800">create your own</span> — it's free, easy & beautiful
                      </p>
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
                  <div className="text-center">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-gray-900 text-gray-900">
                      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
                      Thanks for completing this form
                    </h1>
                    <p className="mt-3 text-gray-500">
                      Now <span className="font-semibold text-gray-800">create your own</span> — it's free, easy & beautiful
                    </p>
                  </div>
                )}

                {/* Submitting error display */}
                {submitError && !isEndingScreen && (
                  <div className="mt-3 text-sm text-red-600 font-medium text-center">
                    {submitError}
                  </div>
                )}
              </div>
            </div>

            {/* Desktop bottom-right navigation arrows and Powered by FormNest */}
            {steps.length > 1 && !isEndingScreen && (
              <div className="absolute bottom-4 right-4 z-20 flex gap-2 items-center">
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

            {/* Desktop Ending Screen Gray Footer */}
            {isEndingScreen && (
              <div className="absolute bottom-0 left-0 right-0 bg-[#e6e6e6] px-6 py-4 flex justify-between items-center border-t border-gray-200/50 shrink-0 z-20">
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
        )}
      </main>
    </div>
  );
}
