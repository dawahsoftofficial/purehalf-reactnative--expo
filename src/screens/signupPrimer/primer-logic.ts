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
