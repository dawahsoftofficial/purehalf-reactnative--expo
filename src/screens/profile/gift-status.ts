/* eslint-disable @typescript-eslint/no-explicit-any */
import Data from './Data';
import { GROUP_META } from './profile-completion';
import { isFieldHiddenForGender } from './profile-editor-flow';

const hasValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim() !== '';
  return true;
};

// Best-effort profile-strength percentage computed straight from
// currentUser.detail (no extra fetch) — for surfaces that only have the
// global user object (Home banner, bottom tab badge), unlike the ME/
// onboarding headers which fetch+hydrate categoriesData against the
// attribute catalog for the exact same number. Reads apiKey presence
// directly rather than reusing hydrateGroupFields/computeCompletion,
// because those seed a dropDown field's `selected` by matching its raw id
// against attribute-fetched option lists — with no attribute catalog here,
// that match always misses and under-counts filled dropdowns. This mirrors
// the backend's ProfileRewardService::completionPercent(), which also just
// checks the raw stored value's presence, not a catalog match.
export const computeStrengthFromUser = (currentUser: any): number => {
  const detail = currentUser?.detail ?? {};
  const gender = detail?.gender ?? currentUser?.gender;

  let filled = 0;
  let total = 0;
  GROUP_META.forEach(({ key }) => {
    const fields: any[] = (Data as any)[key] ?? [];
    fields.forEach((field) => {
      if (isFieldHiddenForGender(field, gender)) return;
      total += 1;
      if (hasValue(detail?.[field.apiKey])) filled += 1;
    });
  });

  total += 1;
  if (hasValue(detail?.interest_id)) filled += 1;
  total += 1;
  if (hasValue(detail?.tagline)) filled += 1;

  return total > 0 ? Math.round((filled / total) * 100) : 0;
};

export type GiftStatus = {
  strengthPct: number;
  claimed: boolean;
  eligible: boolean;
};

export const computeGiftStatus = (
  currentUser: any,
  giftThreshold: number
): GiftStatus => {
  const claimed = Boolean(currentUser?.profile_finish_bonus_awarded);
  const strengthPct = computeStrengthFromUser(currentUser);
  const eligible = !claimed && strengthPct >= giftThreshold;

  return { strengthPct, claimed, eligible };
};
