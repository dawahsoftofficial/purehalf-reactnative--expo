// Pure, framework-free helpers for the signup welcome primer. Kept isolated so
// they are unit-testable under the (working) pure-TS jest setup — RN component
// tests are broken, so all branching/formatting logic lives here.

export type PrimerAnswers = Record<string, unknown>;

export type PrimerStep = {
  id: string;
  // A step is shown only when showIf(answers) is true (or when it's absent).
  // Powers conditional/skippable steps and the auto-advance flow.
  showIf?: (answers: PrimerAnswers) => boolean;
};

// Gate: the primer shows only on a first install for a not-logged-in user with
// the feature enabled.
export const shouldShowPrimer = ({
  loggedIn,
  enabled,
  seen,
}: {
  loggedIn: boolean;
  enabled: boolean;
  seen: boolean;
}): boolean => !loggedIn && enabled && !seen;

// Minimal structural shape of a step, for the auto-advance rule. Declared here
// rather than imported from primer-types to avoid a primer-logic <-> primer-types
// cycle (primer-types already imports PrimerAnswers from this file, and
// import/no-cycle is an error). PrimerStepDef satisfies this structurally.
export type AutoAdvanceStep = {
  control: string;
  hasPolygamy?: boolean;
  hasRevert?: boolean;
};

// A step self-advances on tap when it's a single choice with nothing else on
// screen to touch. The optional checkboxes on status/deen are exactly what
// disqualify a step — you can't tick a box on a screen that's already leaving.
// Unknown controls fall through to false: a step that waits for Continue is
// recoverable, a step that skips itself is not.
export const isAutoAdvance = (step: AutoAdvanceStep): boolean => {
  switch (step.control) {
    case 'single':
      return true;
    case 'status':
      return !step.hasPolygamy;
    case 'deen':
      return !step.hasRevert;
    default:
      return false;
  }
};

// Display-format the (already server-shaped) match count. Guards against float
// artefacts, NaN, and negatives so the reveal never shows garbage.
export const formatMatchCount = (n: number): string => {
  if (!Number.isFinite(n) || n < 0) return '0';
  return Math.round(n).toLocaleString('en-US');
};

const isVisible = (step: PrimerStep, answers: PrimerAnswers): boolean =>
  step.showIf ? step.showIf(answers) : true;

// Index of the next visible step after `fromIndex`, or -1 if none remain.
export const nextStepIndex = (
  steps: PrimerStep[],
  answers: PrimerAnswers,
  fromIndex: number
): number => {
  for (let i = fromIndex + 1; i < steps.length; i += 1) {
    if (isVisible(steps[i], answers)) return i;
  }
  return -1;
};

// Index of the previous visible step before `fromIndex`, or -1 if none remain
// (i.e. we're at the first question — the caller then sends the user back to the
// gender step). Skips conditionally-hidden steps, mirroring nextStepIndex.
export const prevStepIndex = (
  steps: PrimerStep[],
  answers: PrimerAnswers,
  fromIndex: number
): number => {
  for (let i = fromIndex - 1; i >= 0; i -= 1) {
    if (isVisible(steps[i], answers)) return i;
  }
  return -1;
};

// Whole-journey progress (0–100), computed over currently-visible steps so the
// global bar stays honest when conditional steps drop out.
export const computeProgress = (
  steps: PrimerStep[],
  answers: PrimerAnswers,
  currentIndex: number
): number => {
  const visibleTotal = steps.filter((s) => isVisible(s, answers)).length;
  if (visibleTotal === 0) return 0;
  const done = steps
    .slice(0, currentIndex + 1)
    .filter((s) => isVisible(s, answers)).length;
  return Math.round((done / visibleTotal) * 100);
};

// Human-readable position for the header. Uses only visible steps so the count
// stays aligned with the progress bar when conditional questions are skipped.
export const questionPosition = (
  steps: PrimerStep[],
  answers: PrimerAnswers,
  currentIndex: number
): { current: number; total: number } => {
  const visibleIndexes = steps
    .map((step, index) => (isVisible(step, answers) ? index : -1))
    .filter((index) => index >= 0);
  const position = visibleIndexes.indexOf(currentIndex);

  return {
    current: position >= 0 ? position + 1 : 0,
    total: visibleIndexes.length,
  };
};
