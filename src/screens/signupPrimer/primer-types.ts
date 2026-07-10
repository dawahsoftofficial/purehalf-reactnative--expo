import type { PrimerAnswers } from './primer-logic';

// The control kinds the step engine knows how to render.
export type PrimerControl =
  | 'single' // auto-advance single-select
  | 'reason' // single-select presets + an open "in your own words" text field
  | 'multi' // multi-select (optional `max`)
  | 'text' // free text
  | 'slider' // dual-thumb age range
  | 'casteCombo' // khandan free-text + "does it matter?" yes/no
  | 'sectCombo' // sect single-select + "prefer same?" yes/no
  | 'deen' // practice single-select (+ optional independent revert checkbox)
  | 'habits' // smoke + drink toggles
  | 'status' // marital single-select + Advanced polygamy toggle
  | 'work' // profession single-select + optional income band
  | 'traits'; // self-praise chips (multi)

export type PrimerOption = { id: string; label: string };

export type PrimerGender = 'female' | 'male';

// One question in a journey. `id` + optional `showIf` also satisfy the
// PrimerStep shape consumed by primer-logic (nextStepIndex / computeProgress).
export type PrimerStepDef = {
  id: string;
  control: PrimerControl;
  question: string;
  subtitle?: string;
  options?: PrimerOption[];
  max?: number; // multi cap
  sliderMin?: number;
  sliderMax?: number;
  visibility: 'public' | 'private';
  required?: boolean; // blocks advance until answered (e.g. M-HABITS)
  hasRevert?: boolean; // deen: show the independent "I'm a revert" checkbox
  hasIncome?: boolean; // work: show the optional income band
  placeholder?: string; // text
  support?: string; // affirming / supportive line, always shown
  supportIf?: (answers: PrimerAnswers) => boolean; // conditional support (M6)
  showIf?: (answers: PrimerAnswers) => boolean; // conditional visibility
};

export type PrimerJourney = {
  gender: PrimerGender;
  steps: PrimerStepDef[];
};
