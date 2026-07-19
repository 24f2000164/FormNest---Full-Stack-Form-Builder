/**
 * Typeform Clone Logic Jump Engine
 * Handles dynamic routing, score tracking, tagging, and outcome quizzes.
 */

export interface Condition {
  fieldId: number;
  op: string; // "is" | "is_not" | "contains" | "greater_than" | "less_than"
  value: string;
}

export interface LogicRule {
  id: string;
  conditions: Condition[];
  action: "go_to" | "add" | "subtract" | "multiply" | "divide";
  target: string; // Target question ID or numeric value
}

export interface QuestionLogic {
  alwaysGoTo?: string;
  rules?: LogicRule[];
  otherwise?: string;
}

export interface TagRule {
  tag: string;
  questionId: number;
  op: string;
  value: string;
}

export interface TagGroup {
  id: string;
  name: string;
  rules: TagRule[];
  fallback: string;
}

export interface OutcomeRule {
  questionId: number;
  choice: string;
  endingId: number; // Target ending screen question ID
}

/**
 * Checks if a condition is satisfied by the current answer.
 */
export function evaluateCondition(cond: Condition, answers: Record<number, any>): boolean {
  const answerEntry = answers[cond.fieldId];
  if (!answerEntry) return cond.op === "is_not"; // No answer satisfies is_not empty

  const val = answerEntry.value;
  const targetVal = cond.value;

  if (val === undefined || val === null) {
    return cond.op === "is_not";
  }

  // Handle arrays (e.g. multiple choice multiple selection)
  if (Array.isArray(val)) {
    const includes = val.some(item => String(item).toLowerCase() === targetVal.toLowerCase());
    return cond.op === "is" ? includes : !includes;
  }

  const strVal = String(val).toLowerCase();
  const strTarget = targetVal.toLowerCase();

  switch (cond.op) {
    case "is":
      // Boolean matches
      if (typeof val === "boolean") {
        if (targetVal === "Yes" || targetVal === "true") return val === true;
        if (targetVal === "No" || targetVal === "false") return val === false;
      }
      return strVal === strTarget;
    case "is_not":
      if (typeof val === "boolean") {
        if (targetVal === "Yes" || targetVal === "true") return val !== true;
        if (targetVal === "No" || targetVal === "false") return val !== false;
      }
      return strVal !== strTarget;
    case "contains":
      return strVal.includes(strTarget);
    case "not_contains":
      return !strVal.includes(strTarget);
    case "greater_than":
      return Number(val) > Number(targetVal);
    case "less_than":
      return Number(val) < Number(targetVal);
    default:
      return strVal === strTarget;
  }
}

/**
 * Evaluates the next question index based on branching rules.
 * Keeps track of score modifications that happen on-the-fly.
 */
export function getNextStepIndex({
  currentIndex,
  answers,
  questions,
  scoreRef,
}: {
  currentIndex: number;
  answers: Record<number, any>;
  questions: any[];
  scoreRef?: { current: number };
}): number {
  if (currentIndex >= questions.length - 1) return questions.length; // End of form

  const currentQuestion = questions[currentIndex];
  if (!currentQuestion) return currentIndex + 1;

  const logic: QuestionLogic = currentQuestion.settings?.logic || {};
  const rules = logic.rules || [];

  // 1. Evaluate custom rules in order
  for (const rule of rules) {
    const conditions = rule.conditions || [];
    if (conditions.length === 0) continue;

    // Check if ALL conditions match (AND logic)
    const isMatched = conditions.every(c => evaluateCondition(c, answers));

    if (isMatched) {
      // Apply score calculations if action is a calculation
      if (scoreRef && ["add", "subtract", "multiply", "divide"].includes(rule.action)) {
        const factor = parseFloat(rule.target) || 0;
        if (rule.action === "add") scoreRef.current += factor;
        else if (rule.action === "subtract") scoreRef.current -= factor;
        else if (rule.action === "multiply") scoreRef.current *= factor;
        else if (rule.action === "divide" && factor !== 0) scoreRef.current /= factor;
      }

      // If action is routing
      if (rule.action === "go_to" && rule.target) {
        const targetId = Number(rule.target);
        const idx = questions.findIndex(q => q.id === targetId);
        if (idx !== -1) return idx;
      }
    }
  }

  // 2. Otherwise route
  if (logic.otherwise) {
    const targetId = Number(logic.otherwise);
    const idx = questions.findIndex(q => q.id === targetId);
    if (idx !== -1) return idx;
  }

  // 3. Always go to route
  if (logic.alwaysGoTo) {
    const targetId = Number(logic.alwaysGoTo);
    const idx = questions.findIndex(q => q.id === targetId);
    if (idx !== -1) return idx;
  }

  // 4. Fallback: next question sequentially
  return currentIndex + 1;
}

/**
 * Calculates form score based on static option points and dynamic rules.
 */
export function calculateFormScore(answers: Record<number, any>, questions: any[]): number {
  let score = 0;

  // 1. Calculate static scores assigned in ScoringModal
  questions.forEach(q => {
    const answer = answers[q.id];
    if (!answer || answer.value === undefined || answer.value === null) return;

    const scoreConfig = q.settings?.score;
    const optionPoints = scoreConfig?.options || {};

    const val = answer.value;

    if (Array.isArray(val)) {
      val.forEach(v => {
        if (optionPoints[v] !== undefined) {
          score += Number(optionPoints[v]);
        }
      });
    } else {
      const strVal = String(val);
      if (optionPoints[strVal] !== undefined) {
        score += Number(optionPoints[strVal]);
      }
    }
  });

  // 2. Add rule-based score calculations by dry-running the path
  let currentIdx = 0;
  const scoreRef = { current: score };
  const visited = new Set<number>(); // Prevent infinite loops

  while (currentIdx < questions.length && !visited.has(currentIdx)) {
    visited.add(currentIdx);
    const nextIdx = getNextStepIndex({
      currentIndex: currentIdx,
      answers,
      questions,
      scoreRef,
    });
    if (nextIdx <= currentIdx) break; // Finished or loop
    currentIdx = nextIdx;
  }

  return scoreRef.current;
}

/**
 * Evaluates tagging rules and assigns tag group tags.
 */
export function calculateFormTags(answers: Record<number, any>, questions: any[], formSettings: any): Record<string, string> {
  const tags: Record<string, string> = {};
  const taggingConfig = formSettings?.tagging || {};
  const tagGroups: TagGroup[] = taggingConfig.tagGroups || [];

  tagGroups.forEach(group => {
    let assignedTag = group.fallback || "";

    // Find the first matching rule
    for (const rule of group.rules || []) {
      const condition: Condition = {
        fieldId: rule.questionId,
        op: rule.op,
        value: rule.value,
      };

      if (evaluateCondition(condition, answers)) {
        assignedTag = rule.tag;
        break;
      }
    }

    if (assignedTag) {
      tags[group.name] = assignedTag;
    }
  });

  return tags;
}

/**
 * Calculates which outcome ending screen has the highest score.
 */
export function calculateOutcomeEndingId(answers: Record<number, any>, questions: any[], formSettings: any): number | null {
  const outcomeConfig = formSettings?.outcomeQuiz || {};
  const rules: OutcomeRule[] = outcomeConfig.rules || [];

  if (rules.length === 0) return null;

  // Filter out ending screens
  const endingScreens = questions.filter(q => q.type === "ending_screen");
  if (endingScreens.length === 0) return null;

  // Initialize scores for each ending screen
  const endingScores: Record<number, number> = {};
  endingScreens.forEach(es => {
    endingScores[es.id] = 0;
  });

  // Evaluate rules
  rules.forEach(rule => {
    const answer = answers[rule.questionId];
    if (!answer || answer.value === undefined || answer.value === null) return;

    const val = answer.value;
    const choiceMatch = Array.isArray(val)
      ? val.some(v => String(v).toLowerCase() === rule.choice.toLowerCase())
      : String(val).toLowerCase() === rule.choice.toLowerCase();

    if (choiceMatch && endingScores[rule.endingId] !== undefined) {
      endingScores[rule.endingId]++;
    }
  });

  // Find ending screen with the highest score
  let maxScore = -1;
  let bestEndingId: number | null = null;

  endingScreens.forEach(es => {
    const score = endingScores[es.id];
    if (score > maxScore) {
      maxScore = score;
      bestEndingId = es.id;
    }
  });

  // If maxScore is 0 (no rules matched), we return the first ending screen by default
  if (maxScore === 0 && endingScreens.length > 0) {
    return endingScreens[0].id;
  }

  return bestEndingId;
}
