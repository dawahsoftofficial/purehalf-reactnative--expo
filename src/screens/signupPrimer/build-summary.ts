// Composes the public profile-summary blurb from the primer answers. It lives on
// the client (not the backend) so it reuses the journey's own option copy — no
// label map is duplicated in PHP, so there's no drift. The backend stores this
// verbatim (the user can edit it later); it falls back to a minimal server-side
// builder if the client sends nothing.
//
// Only PUBLIC answers feed the summary. The male "what matters most in her"
// (M4) is private/matching-only and is deliberately never included.

import { HABIT_OPTIONS, INCOME_BANDS, journeyFor } from './journeys';
import type { PrimerAnswers } from './primer-logic';
import type { PrimerGender, PrimerOption } from './primer-types';

const buildLabelMap = (gender: PrimerGender): Record<string, string> => {
  const map: Record<string, string> = {};
  const add = (opts?: PrimerOption[]): void => {
    (opts ?? []).forEach((op) => {
      map[op.id] = op.label;
    });
  };
  journeyFor(gender).forEach((step) => add(step.options));
  add(INCOME_BANDS);
  add(HABIT_OPTIONS);
  return map;
};

const asArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

const labelList = (
  map: Record<string, string>,
  ids: string[],
  exclude: string[] = []
): string[] =>
  ids.filter((id) => !exclude.includes(id)).map((id) => map[id] ?? id);

export const buildIntroSummary = (
  answers: PrimerAnswers,
  gender: PrimerGender
): string => {
  const map = buildLabelMap(gender);
  const segments: string[] = [];

  // Caste — free text; skip the "prefer not to say" sentinel and blanks.
  const caste = (answers.caste as { caste?: string } | undefined)?.caste;
  if (typeof caste === 'string' && caste.trim() !== '' && caste !== '__pns__') {
    segments.push(caste.trim());
  }

  const strengths = labelList(map, asArray(answers.strengths));
  const note = typeof answers.note === 'string' ? answers.note.trim() : '';

  if (gender === 'female') {
    const priorities = labelList(map, asArray(answers.priorities));
    if (priorities.length) segments.push(`Values ${priorities.join(', ')}`);

    const dealbreakers = labelList(map, asArray(answers.dealbreakers), [
      'no_dealbreakers',
    ]);
    if (dealbreakers.length) {
      segments.push(`Non-negotiables: ${dealbreakers.join(', ')}`);
    }

    const work = labelList(map, asArray(answers.preferred_work), [
      'no_preference',
    ]);
    if (work.length) segments.push(`Prefers ${work.join(', ')}`);

    if (strengths.length) {
      segments.push(`Describes herself as ${strengths.join(', ')}`);
    }
  } else {
    const offerings = labelList(map, asArray(answers.offerings));
    if (offerings.length) segments.push(`Offers ${offerings.join(', ')}`);

    const openness = labelList(map, asArray(answers.partner_openness), [
      'open_all',
    ]);
    if (openness.length) segments.push(`Open to ${openness.join(', ')}`);

    if (strengths.length) {
      segments.push(`Describes himself as ${strengths.join(', ')}`);
    }
  }

  if (note) segments.push(note);

  return segments.join(' · ');
};
