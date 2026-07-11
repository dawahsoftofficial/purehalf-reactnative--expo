/* eslint-disable @typescript-eslint/no-explicit-any */
// Pure completion-math for the profile groups — deliberately free of React
// Native imports (unlike profile-hub.tsx, which re-exports these alongside
// its RN components) so it can be imported by non-RN consumers (e.g.
// gift-status.ts) and unit-tested directly under jest.
import LanguageKeys from '../../languages/Keys';
import { isFieldFilled, isFieldHiddenForGender } from './profile-editor-flow';

export type GroupMeta = { key: string; title: string; icon: string };

export const GROUP_META: GroupMeta[] = [
  {
    key: 'appearanceAndHealth',
    title: LanguageKeys.appearanceHealth,
    icon: 'body-outline',
  },
  {
    key: 'familyBackground',
    title: LanguageKeys.familyBackground,
    icon: 'earth-outline',
  },
  {
    key: 'lifeStyle',
    title: LanguageKeys.lifeStyle,
    icon: 'briefcase-outline',
  },
  {
    key: 'islamicValues',
    title: LanguageKeys.islamicValues,
    icon: 'moon-outline',
  },
  {
    key: 'personalityRequirements',
    title: LanguageKeys.personalityRequirements,
    icon: 'sparkles-outline',
  },
  {
    key: 'futurePlan',
    title: LanguageKeys.futurePlans,
    icon: 'heart-circle-outline',
  },
];

export const countFilled = (group: any[], gender?: string) => {
  let filled = 0;
  let total = 0;
  (group ?? []).forEach((item) => {
    if (isFieldHiddenForGender(item, gender)) return;
    total += 1;
    if (isFieldFilled(item)) filled += 1;
  });
  return { filled, total };
};

export const previewOf = (group: any[], gender?: string) => {
  const values: string[] = [];
  (group ?? []).forEach((item) => {
    if (isFieldHiddenForGender(item, gender) || !isFieldFilled(item)) return;
    if (item?.type === 'dropDownBinary') return;
    const sel = item?.selected ?? {};
    let display: any;
    if (item?.type === 'scalling') {
      display = `${sel.value}${sel.scale ? ' ' + sel.scale : ''}`;
    } else {
      display = sel.value;
    }
    if (typeof display === 'number') display = String(display);
    if (typeof display === 'string' && display.trim().length) {
      values.push(display.trim());
    }
  });
  return values.slice(0, 3).join(' · ');
};

export const computeCompletion = ({
  categoriesData,
  interests,
  tagline,
  gender,
}: {
  categoriesData: any;
  interests: any[];
  tagline?: string;
  gender?: string;
}) => {
  let filled = 0;
  let total = 0;
  GROUP_META.forEach((g) => {
    const c = countFilled(categoriesData?.[g.key], gender);
    filled += c.filled;
    total += c.total;
  });
  total += 1;
  if ((interests ?? []).some((i) => i?.selected)) filled += 1;
  total += 1;
  if (tagline && tagline.trim().length) filled += 1;
  return total ? Math.round((filled / total) * 100) : 0;
};
