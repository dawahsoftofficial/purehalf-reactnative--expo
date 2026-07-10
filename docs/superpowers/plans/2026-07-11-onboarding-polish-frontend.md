# Onboarding Polish — Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a one-time intro screen to the onboarding wizard, require every question to be answered before advancing, add color swatches to the eye-color question, and surface the profile-completion gift (backend: `2026-07-11-onboarding-gift-backend.md` in `admin/`) via a tappable icon on both the onboarding header and the ME profile header.

**Architecture:** Pure logic (fill-checking, eye-color swatch lookup) lives in small standalone modules with jest coverage. Two new presentational components (`GiftBadge`, `GiftClaimModal`) are shared between the two screens that need them. `OnboardingProfile.tsx` and `Header.tsx` each own their own eligibility/claim state and wire the shared components in — no new shared state container.

**Tech Stack:** React Native 0.82, TypeScript, Zustand (`useSettingsStore`), i18next, jest (pure-logic tests only — RN component-level jest is broken in this repo, see Global Constraints).

## Global Constraints

- Path alias `@/*` exists but this codebase's existing profile-screen files use relative imports throughout — match that, don't switch to `@/`.
- Every user-visible string goes through `LanguageKeys` + `t()`; keys must exist in `English.json`, `Urdu.json`, and `RomanUrdu.json` identically (`i18n-json/identical-keys` fails the build otherwise) and in `Keys.tsx`.
- Use `wp()`/`hp()` from `src/global/Scalling.tsx` for sizing, never raw pixels.
- `yarn type-check` (`tsc --noEmit`) must stay clean after every task.
- RN component-level jest is broken in this repo (known issue) — only genuinely pure, RN-free logic gets an automated jest test here. UI wiring is verified by a manual walkthrough step instead of a fabricated automated test; say so explicitly in each such task rather than skip verification silently.
- Backend dependency: Tasks 6–8 call `POST auth/profile/claim-gift` and read the `profile_completion_gift_credits`/`profile_completion_threshold_percent` settings — both come from the companion backend plan (`admin/docs/superpowers/plans/2026-07-11-onboarding-gift-backend.md`). The frontend code is correct and type-checks independently of whether that backend work has shipped yet; the claim call simply won't succeed against a backend that doesn't have the route.

---

### Task 1: `isFieldFilled` shared helper

**Files:**

- Modify: `src/screens/profile/profile-editor-flow.ts`
- Modify: `src/screens/profile/profile-editor-flow.test.ts`
- Modify: `src/screens/profile/profile-hub.tsx`

**Interfaces:**

- Produces (for Task 2): `isFieldFilled(item: ProfileEditorField): boolean` — exported from `profile-editor-flow.ts`.

- [ ] **Step 1: Write the failing tests**

Append to `src/screens/profile/profile-editor-flow.test.ts` (add `isFieldFilled` to the existing import list at the top of the file, then add this new `describe` block at the end of the file):

```ts
describe('isFieldFilled', () => {
  it('is unfilled for a dropdown with no id selected', () => {
    expect(isFieldFilled(field({ type: 'dropDown', selected: {} }))).toBe(
      false
    );
  });

  it('is filled once a dropdown option id is selected', () => {
    expect(
      isFieldFilled(
        field({ type: 'dropDown', selected: { id: 4, value: 'Engineer' } })
      )
    ).toBe(true);
  });

  it('is filled for a binary field even when the value is falsy (No = 0)', () => {
    expect(
      isFieldFilled(
        field({ type: 'dropDownBinary', selected: { id: 'No', value: 0 } })
      )
    ).toBe(true);
  });

  it('is unfilled for a binary field with no value yet', () => {
    expect(isFieldFilled(field({ type: 'dropDownBinary', selected: {} }))).toBe(
      false
    );
  });

  it('is filled for a scalling field once a value is committed', () => {
    expect(
      isFieldFilled(
        field({ type: 'scalling', selected: { value: 178, scale: 'cm' } })
      )
    ).toBe(true);
  });

  it('is unfilled for a scalling field with no committed value', () => {
    expect(
      isFieldFilled(field({ type: 'scalling', selected: { scale: 'cm' } }))
    ).toBe(false);
  });

  it('is filled for free text once non-empty', () => {
    expect(
      isFieldFilled(
        field({ type: 'input', selected: { value: 'Kind and practising' } })
      )
    ).toBe(true);
  });

  it('is unfilled for empty free text', () => {
    expect(
      isFieldFilled(field({ type: 'input', selected: { value: '' } }))
    ).toBe(false);
    expect(isFieldFilled(field({ type: 'input', selected: {} }))).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test src/screens/profile/profile-editor-flow.test.ts`
Expected: FAIL — `isFieldFilled` is not exported from `./profile-editor-flow` (import error).

- [ ] **Step 3: Add `isFieldFilled` to `profile-editor-flow.ts`**

Add this export anywhere among the other exports (e.g. right after `isOptionSelected`):

```ts
// Whether a field's current selection counts as "answered" — used to gate
// the wizard's Next button and, indirectly, profile-strength completion.
export const isFieldFilled = (item: ProfileEditorField) => {
  const sel: any = item?.selected ?? {};
  if (item?.type === 'scalling') return sel.value != null && sel.value !== '';
  if (item?.type === 'dropDown') return sel.id != null;
  if (item?.type === 'dropDownBinary') return sel.value != null;
  return sel.value != null && sel.value !== '';
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `yarn test src/screens/profile/profile-editor-flow.test.ts`
Expected: PASS (all tests in the file, including the 8 new ones).

- [ ] **Step 5: Dedupe `profile-hub.tsx`'s private copy**

In `src/screens/profile/profile-hub.tsx`, remove the private `itemFilled` function (currently right before `countFilled`):

```ts
const itemFilled = (item: any) => {
  const sel = item?.selected ?? {};
  if (item?.type === 'scalling') return sel.value != null && sel.value !== '';
  if (item?.type === 'dropDown') return sel.id != null;
  if (item?.type === 'dropDownBinary') return sel.value != null;
  return sel.value != null && sel.value !== '';
};
```

Add `isFieldFilled` to the import from `../../screens/profile/profile-editor-flow`... — this file has no such import yet, so add one at the top of `profile-hub.tsx` (after the existing `Colors, Fonts` import):

```ts
import { isFieldFilled } from './profile-editor-flow';
```

Replace both call sites that used `itemFilled(item)` with `isFieldFilled(item)`: inside `countFilled` (`if (itemFilled(item)) filled += 1;`) and inside `previewOf` (`if (isHidden(item, gender) || !itemFilled(item)) return;`).

- [ ] **Step 6: Type-check**

Run: `yarn type-check`
Expected: clean, no errors.

- [ ] **Step 7: Commit**

```bash
git add src/screens/profile/profile-editor-flow.ts src/screens/profile/profile-editor-flow.test.ts src/screens/profile/profile-hub.tsx
git commit -m "refactor(profile): extract isFieldFilled as a shared helper"
```

---

### Task 2: Require an answer before Next

**Files:**

- Modify: `src/screens/profile/components/profile-question-wizard.tsx`

**Interfaces:**

- Consumes: `isFieldFilled(item: ProfileEditorField): boolean` (Task 1).

- [ ] **Step 1: Add the import**

In `profile-question-wizard.tsx`, add `isFieldFilled` to the existing named import from `../profile-editor-flow` (alphabetically, between `getVisibleProfileFields` and `isOptionSelected`):

```ts
import {
  buildScalingSelected,
  convertScaleValue,
  formatScaleValue,
  getOptionKey,
  getOptionLabel,
  getProgressLabel,
  getScalingDisplay,
  getVisibleProfileFields,
  isFieldFilled,
  isOptionSelected,
  normalizeScalingSelected,
  shouldUseTagOptions,
} from '../profile-editor-flow';
```

- [ ] **Step 2: Compute `isAnswered`**

Find this block (computing `isFirstStep`/`isLastStep`):

```ts
const activeItem = visibleFields[activeIndex];
const progressLabel = getProgressLabel('', activeIndex, visibleFields.length);
const isFirstStep = activeIndex === 0;
const isLastStep =
  visibleFields.length > 0 && activeIndex === visibleFields.length - 1;
```

Add one line after it:

```ts
const isAnswered = isFieldFilled(activeItem);
```

- [ ] **Step 3: Gate the primary button**

Find the primary `Button` in the footer:

```tsx
<View style={Styles.primaryBtnWrap}>
  <Button
    text={
      saving
        ? LanguageKeys.updating
        : isLastStep
          ? finalLabel
          : LanguageKeys.next
    }
    onPress={saving || visibleFields.length === 0 ? undefined : advance}
    disabled={saving || visibleFields.length === 0}
  />
</View>
```

Replace the `onPress`/`disabled` lines:

```tsx
<View style={Styles.primaryBtnWrap}>
  <Button
    text={
      saving
        ? LanguageKeys.updating
        : isLastStep
          ? finalLabel
          : LanguageKeys.next
    }
    onPress={
      saving || visibleFields.length === 0 || !isAnswered ? undefined : advance
    }
    disabled={saving || visibleFields.length === 0 || !isAnswered}
  />
</View>
```

No style changes: the shared `Button` component already renders `disabled` as a faded/translucent background and enabled as solid (`src/components/buttons/Button.tsx`), so the button visually lights up the moment `isAnswered` flips true.

- [ ] **Step 4: Type-check**

Run: `yarn type-check`
Expected: clean.

- [ ] **Step 5: Manual verification**

RN component-level jest is broken in this repo (Global Constraints), so verify by hand once a device/simulator is available (or defer to Task 7/8's combined manual walkthrough, which covers this too): open onboarding or ME → Edit Profile, confirm Next is greyed out and unresponsive on a fresh unanswered question, then lights up solid and becomes tappable the instant an option/value is picked. Confirm a question that already has a saved value (ME edit, re-opening a filled field) shows Next enabled immediately.

- [ ] **Step 6: Commit**

```bash
git add src/screens/profile/components/profile-question-wizard.tsx
git commit -m "feat(profile): require an answer before advancing the question wizard"
```

---

### Task 3: Intro screen

**Files:**

- Modify: `src/services/storageManager/StorageManager.tsx`
- Modify: `src/screens/onboardingProfile/OnboardingProfile.tsx`
- Modify: `src/languages/Keys.tsx`
- Modify: `src/languages/English.json`
- Modify: `src/languages/Urdu.json`
- Modify: `src/languages/RomanUrdu.json`

**Interfaces:**

- Consumes: `StorageManager.getData`/`setData` (existing), `LanguageKeys.onboardingIntroTitle`/`onboardingIntroBody`/`onboardingIntroRewardChip`/`onboardingIntroCta` (new, this task).
- Produces: nothing consumed by later tasks — self-contained.

- [ ] **Step 1: Add the storage key**

In `src/services/storageManager/StorageManager.tsx`, add one line to `storageKeys` (after `PRIMER_ANSWERS`):

```ts
    PRIMER_ANSWERS: 'PRIMER_ANSWERS',
    ONBOARDING_INTRO_SEEN: 'ONBOARDING_INTRO_SEEN',
```

- [ ] **Step 2: Add the i18n keys**

`src/languages/Keys.tsx` — insert after `onboardingDoneBody: 'onboardingDoneBody',` (currently line 28):

```ts
  onboardingDoneBody: 'onboardingDoneBody',
  onboardingIntroTitle: 'onboardingIntroTitle',
  onboardingIntroBody: 'onboardingIntroBody',
  onboardingIntroRewardChip: 'onboardingIntroRewardChip',
  onboardingIntroCta: 'onboardingIntroCta',
```

`src/languages/English.json` — insert after the `"onboardingDoneBody"` line (currently line 162):

```json
    "onboardingDoneBody": "Your profile is looking great. You can always add more from your profile.",
    "onboardingIntroTitle": "Let's Build Your Best Profile",
    "onboardingIntroBody": "A few more details about your appearance, lifestyle, and values help us find matches who are truly right for you. Finish every section and we'll thank you with free chat credits — enough to start real conversations.",
    "onboardingIntroRewardChip": "Free chat credits when you finish",
    "onboardingIntroCta": "Let's Go",
```

`src/languages/Urdu.json` and `src/languages/RomanUrdu.json` — insert the **same English text** at the equivalent point (after `"onboardingDoneBody"`, currently line 153 in `Urdu.json` and line 159 in `RomanUrdu.json`). This is intentional, matching this feature's existing pattern (per `[[project_onboarding_feature]]`) of shipping new copy in English pending product-owner translation, while still satisfying `i18n-json/identical-keys`:

```json
    "onboardingIntroTitle": "Let's Build Your Best Profile",
    "onboardingIntroBody": "A few more details about your appearance, lifestyle, and values help us find matches who are truly right for you. Finish every section and we'll thank you with free chat credits — enough to start real conversations.",
    "onboardingIntroRewardChip": "Free chat credits when you finish",
    "onboardingIntroCta": "Let's Go",
```

- [ ] **Step 3: Add the `intro` phase**

In `src/screens/onboardingProfile/OnboardingProfile.tsx`, change the `Phase` type:

```ts
type Phase = 'loading' | 'intro' | 'question' | 'done';
```

Change the storage destructure to include `getData`:

```ts
const { setData, getData, storageKeys } = StorageManager;
```

Replace the hydration effect's `hydrateAll` so it decides between `'intro'` and `'question'` instead of always going to `'question'`:

```ts
const hydrateAll = async (attribute: any) => {
  const detail = detailSnapshotRef.current;
  const hydrated: Record<string, any[]> = {};
  GROUP_SEQUENCE.forEach(({ key }) => {
    hydrated[key] = hydrateGroupFields(
      Data[key] ?? [],
      attribute ?? {},
      detail
    );
  });
  setCategoriesData(hydrated);
  const introSeen = await getData(storageKeys.ONBOARDING_INTRO_SEEN);
  if (!alive) return;
  setPhase(introSeen ? 'question' : 'intro');
};
```

(The `ApiServices.getAttribute().then(...)`/`.catch(...)` calls immediately below stay exactly as they are — they already call `hydrateAll(attribute)` / `hydrateAll({})`, and `hydrateAll` being `async` now doesn't change those call sites.)

- [ ] **Step 4: Add the intro CTA handler**

Add near the other `useCallback`s (e.g. right after `bailFlow`):

```ts
const onIntroContinue = useCallback(() => {
  setData(storageKeys.ONBOARDING_INTRO_SEEN, true);
  setPhase('question');
}, [setData, storageKeys.ONBOARDING_INTRO_SEEN]);
```

- [ ] **Step 5: Render the intro screen**

Insert a new phase block between the `phase === 'loading'` block and the `phase === 'done'` block:

```tsx
if (phase === 'intro') {
  return (
    <Container style={Styles.screen}>
      <View style={Styles.center}>
        <View style={Styles.doneBadge}>
          <Ionicons name="gift-outline" size={wp(9)} color={Colors.color2} />
        </View>
        <Text variant="display" style={Styles.doneTitle}>
          {LanguageKeys.onboardingIntroTitle}
        </Text>
        <Text style={Styles.doneBody}>{LanguageKeys.onboardingIntroBody}</Text>
        <View style={Styles.introRewardChip}>
          <Ionicons name="gift" size={wp(4)} color={Colors.primary} />
          <Text style={Styles.introRewardChipTxt}>
            {LanguageKeys.onboardingIntroRewardChip}
          </Text>
        </View>
      </View>
      <View style={Styles.footer}>
        <Button
          text={LanguageKeys.onboardingIntroCta}
          onPress={onIntroContinue}
        />
      </View>
    </Container>
  );
}
```

- [ ] **Step 6: Add the new styles**

In the `Styles` `StyleSheet.create` block, add (near `doneBadge`/`doneTitle`/`doneBody`):

```ts
  introRewardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    backgroundColor: Colors.lavender,
    borderRadius: 999,
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
    marginTop: hp(2.5),
  },
  introRewardChipTxt: {
    color: Colors.primary,
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small2,
  },
```

- [ ] **Step 7: Type-check**

Run: `yarn type-check`
Expected: clean.

- [ ] **Step 8: Manual verification**

RN component-level jest is broken in this repo. Verify by hand: fresh signup → onboarding wizard → intro screen appears before the first (Appearance & Health) question → tap "Let's Go" → lands on the first question → force-quit/relaunch or navigate away and back into onboarding via "Finish Later" → intro screen does **not** reappear.

- [ ] **Step 9: Commit**

```bash
git add src/services/storageManager/StorageManager.tsx src/screens/onboardingProfile/OnboardingProfile.tsx src/languages/Keys.tsx src/languages/English.json src/languages/Urdu.json src/languages/RomanUrdu.json
git commit -m "feat(onboarding): add a one-time intro screen before the profile wizard"
```

---

### Task 4: Eye color swatches

**Files:**

- Create: `src/screens/profile/eye-color-swatches.ts`
- Create: `src/screens/profile/eye-color-swatches.test.ts`
- Modify: `src/screens/profile/components/profile-question-wizard.tsx`

**Interfaces:**

- Produces: `getEyeColorSwatch(label?: string): { color?: string; icon?: string }`.

- [ ] **Step 1: Write the failing tests**

Create `src/screens/profile/eye-color-swatches.test.ts`:

```ts
import { getEyeColorSwatch } from './eye-color-swatches';

describe('getEyeColorSwatch', () => {
  it('returns a hex color for each of the six real eye colors', () => {
    expect(getEyeColorSwatch('Brown')).toEqual({ color: '#6F4E37' });
    expect(getEyeColorSwatch('Amber')).toEqual({ color: '#C68E17' });
    expect(getEyeColorSwatch('Hazel')).toEqual({ color: '#8E7618' });
    expect(getEyeColorSwatch('Green')).toEqual({ color: '#4C9A5B' });
    expect(getEyeColorSwatch('Blue')).toEqual({ color: '#4A7FBF' });
    expect(getEyeColorSwatch('Grey')).toEqual({ color: '#9AA0A6' });
  });

  it('matches case-insensitively', () => {
    expect(getEyeColorSwatch('BROWN')).toEqual({ color: '#6F4E37' });
    expect(getEyeColorSwatch('brown')).toEqual({ color: '#6F4E37' });
  });

  it('returns a palette icon for Multicolor instead of a flat color', () => {
    expect(getEyeColorSwatch('Multicolor')).toEqual({
      icon: 'color-palette-outline',
    });
  });

  it('returns no swatch for "Prefer not to say"', () => {
    expect(getEyeColorSwatch('Prefer not to say')).toEqual({});
  });

  it('returns no swatch for unrecognized or missing labels', () => {
    expect(getEyeColorSwatch('Something new')).toEqual({});
    expect(getEyeColorSwatch(undefined)).toEqual({});
    expect(getEyeColorSwatch('')).toEqual({});
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test src/screens/profile/eye-color-swatches.test.ts`
Expected: FAIL — cannot find module `./eye-color-swatches`.

- [ ] **Step 3: Implement `getEyeColorSwatch`**

Create `src/screens/profile/eye-color-swatches.ts`:

```ts
const EYE_COLOR_HEX: Record<string, string> = {
  brown: '#6F4E37',
  amber: '#C68E17',
  hazel: '#8E7618',
  green: '#4C9A5B',
  blue: '#4A7FBF',
  grey: '#9AA0A6',
};

export type EyeColorSwatch = { color?: string; icon?: string };

// Eye-color options don't carry a hex value from the backend (attr_type is
// 'hex' but the column is NULL), so the six real colors are a small
// client-side lookup by label. "Multicolor" gets a palette icon instead of a
// flat swatch (one color can't represent it); "Prefer not to say" and
// anything unrecognized render no swatch at all.
export const getEyeColorSwatch = (label?: string): EyeColorSwatch => {
  const key = (label ?? '').trim().toLowerCase();
  if (EYE_COLOR_HEX[key]) return { color: EYE_COLOR_HEX[key] };
  if (key === 'multicolor') return { icon: 'color-palette-outline' };
  return {};
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `yarn test src/screens/profile/eye-color-swatches.test.ts`
Expected: PASS (all 5 tests).

- [ ] **Step 5: Wire the swatch into `OptionTags`**

In `profile-question-wizard.tsx`, add the import (near the other local imports):

```ts
import Ionicons from 'react-native-vector-icons/Ionicons';

import { getEyeColorSwatch } from '../eye-color-swatches';
```

Replace the `OptionTags` component:

```tsx
// Inline single-select option list for fields with only a few choices
// (e.g. Yes/No, Future Plans). Each option is a full-width row. Larger option
// lists keep the modal PickerButton.
const OptionTags = ({ item, options, onSelect, rtl }: any) => (
  <View style={Styles.optionList}>
    {options.map((opt: any) => {
      const on = isOptionSelected(item, opt);
      const optLabel = getOptionLabel(item, opt);
      const swatch = item?.id === 'eye-0' ? getEyeColorSwatch(optLabel) : {};
      const hasSwatch = Boolean(swatch.color || swatch.icon);
      const label = (
        <Text
          style={[
            Styles.optionRowTxt,
            { textAlign: rtl ? 'right' : 'left' },
            on && Styles.optionRowTxtOn,
          ]}
        >
          {optLabel}
        </Text>
      );
      return (
        <Ripple
          key={getOptionKey(opt)}
          onPress={() => onSelect(item, opt)}
          style={[Styles.optionRow, on && Styles.optionRowOn]}
        >
          {hasSwatch ? (
            <View
              style={[
                Styles.optionRowInner,
                { flexDirection: rtl ? 'row-reverse' : 'row' },
              ]}
            >
              {swatch.color ? (
                <View
                  style={[
                    Styles.optionSwatch,
                    { backgroundColor: swatch.color },
                  ]}
                />
              ) : (
                <Ionicons
                  name={swatch.icon}
                  size={wp(4.5)}
                  color={on ? Colors.color2 : Colors.primary}
                  style={Styles.optionSwatchIcon}
                />
              )}
              {label}
            </View>
          ) : (
            label
          )}
        </Ripple>
      );
    })}
  </View>
);
```

- [ ] **Step 6: Add the new styles**

In the `Styles` block, add (near `optionRow`/`optionRowTxt`):

```ts
  optionRowInner: {
    alignItems: 'center',
    gap: wp(2.5),
  },
  optionSwatch: {
    width: wp(4.5),
    height: wp(4.5),
    borderRadius: wp(2.25),
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  optionSwatchIcon: {
    marginTop: -1,
  },
```

- [ ] **Step 7: Type-check**

Run: `yarn type-check`
Expected: clean.

- [ ] **Step 8: Manual verification**

RN component-level jest is broken in this repo. Verify by hand: open the eye-color question (onboarding Appearance & Health, or ME → Edit Profile → Appearance & Health) and confirm each option shows a small color dot before its label matching the color name (a pale grey dot for "Grey" should still be visible against its row background thanks to the border), "Multicolor" shows a palette icon instead, and "Prefer not to say" shows no dot. Confirm no other option list (body type, complexion, disability, etc.) changed appearance.

- [ ] **Step 9: Commit**

```bash
git add src/screens/profile/eye-color-swatches.ts src/screens/profile/eye-color-swatches.test.ts src/screens/profile/components/profile-question-wizard.tsx
git commit -m "feat(profile): add color swatches to the eye-color question"
```

---

### Task 5: `GiftBadge` component

**Files:**

- Create: `src/screens/profile/components/gift-badge.tsx`

**Interfaces:**

- Produces (for Tasks 7–8): `GiftBadge({ eligible: boolean; claimed: boolean; onPress: () => void }): JSX.Element`.

- [ ] **Step 1: Implement the component**

Create `src/screens/profile/components/gift-badge.tsx`:

```tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { wp } from '../../../global';
import { Colors } from '../../../res';

type GiftBadgeProps = {
  eligible: boolean;
  claimed: boolean;
  onPress: () => void;
};

// Three states: locked (muted, below the completion threshold), eligible
// (solid primary, tappable — opens the claim modal), claimed (checkmark,
// inert). Used identically in both the OnboardingProfile header and the ME
// profile header so the gift reads the same wherever the user reaches it.
const GiftBadge = ({ eligible, claimed, onPress }: GiftBadgeProps) => {
  if (claimed) {
    return (
      <View style={[Styles.chip, Styles.chipClaimed]}>
        <Ionicons name="checkmark" size={wp(4.2)} color={Colors.verified} />
      </View>
    );
  }

  if (!eligible) {
    return (
      <View style={[Styles.chip, Styles.chipLocked]}>
        <Ionicons name="gift-outline" size={wp(4.2)} color={Colors.muted} />
      </View>
    );
  }

  return (
    <Ripple style={[Styles.chip, Styles.chipEligible]} onPress={onPress}>
      <Ionicons name="gift" size={wp(4.2)} color={Colors.color2} />
    </Ripple>
  );
};

export default GiftBadge;

const Styles = StyleSheet.create({
  chip: {
    width: wp(8.5),
    height: wp(8.5),
    borderRadius: wp(4.25),
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLocked: {
    backgroundColor: Colors.lavender,
  },
  chipEligible: {
    backgroundColor: Colors.primary,
  },
  chipClaimed: {
    backgroundColor: 'rgba(46,158,91,0.12)',
  },
});
```

- [ ] **Step 2: Type-check**

Run: `yarn type-check`
Expected: clean.

- [ ] **Step 3: Manual verification**

RN component-level jest is broken in this repo. This component has no standalone screen yet — its three states are verified as part of Task 7/8's manual walkthrough once it's wired in.

- [ ] **Step 4: Commit**

```bash
git add src/screens/profile/components/gift-badge.tsx
git commit -m "feat(profile): add GiftBadge presentational component"
```

---

### Task 6: Claim API, settings getters, and `GiftClaimModal`

**Files:**

- Modify: `src/services/api/EndPoints.tsx`
- Modify: `src/services/api/Services.tsx`
- Modify: `src/stores/settings-store.ts`
- Create: `src/screens/profile/components/gift-claim-modal.tsx`
- Modify: `src/languages/Keys.tsx`
- Modify: `src/languages/English.json`
- Modify: `src/languages/Urdu.json`
- Modify: `src/languages/RomanUrdu.json`

**Interfaces:**

- Consumes: nothing from earlier tasks.
- Produces (for Tasks 7–8): `ApiServices.claimProfileGift(): Promise<{status: string; awarded: number; new_balance: number; multiplier: number}>`, `useSettingsStore().getProfileCompletionGiftCredits(): number`, `useSettingsStore().getProfileCompletionThresholdPercent(): number`, `GiftClaimModal({ visible, giftCredits, onClose, onClaimed, claim }): JSX.Element`.

- [ ] **Step 1: Add the endpoint**

In `src/services/api/EndPoints.tsx`, add one line (after `updateDetails`):

```ts
  updateDetails: '/auth/update/detail',
  claimProfileGift: '/auth/profile/claim-gift',
```

- [ ] **Step 2: Add the service method**

In `src/services/api/Services.tsx`, add a new method right after `collectChatCredits` (matching its exact promise/error-handling shape):

```ts
/**
 * Claim the one-time profile-completion gift. Only succeeds once the
 * backend independently confirms the profile is at/above the completion
 * threshold; a second call after a successful claim resolves with
 * status 'already_claimed' rather than rejecting.
 * @returns Promise resolving to { status, awarded, new_balance, multiplier }
 */
claimProfileGift = () => {
  return new Promise((resolve, reject) => {
    Api.post(EndPoints.claimProfileGift)
      .then((response) => {
        const data = response?.data;
        if (data?.error === false && data?.results) {
          resolve(data.results);
        } else {
          const errorMessage = data?.message || 'Failed to claim gift';
          console.error(
            '[ApiServices.claimProfileGift] API returned error:',
            errorMessage
          );
          reject(errorMessage);
        }
      })
      .catch((error) => {
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          'Failed to claim gift';
        console.error('[ApiServices.claimProfileGift] Error:', {
          message: errorMessage,
          status: error?.response?.status,
          data: error?.response?.data,
        });
        reject(errorMessage);
      });
  });
};
```

- [ ] **Step 3: Add the settings getters**

In `src/stores/settings-store.ts`, add `| number` to the `SettingValue` union:

```ts
type SettingValue =
  | AuthenticationMethod
  | ChatCredits
  | boolean
  | number
  | MaxChatsPerDay
  | BadgesAndPayments
  | DailyRecommendations
  | PackagesAndEntitlements
  | RatingPromptConfig
  | AppLink[];
```

Add two entries to the `SettingsState` type (after `getEnableMatchCountReveal`):

```ts
getEnableMatchCountReveal: () => boolean;
getProfileCompletionGiftCredits: () => number;
getProfileCompletionThresholdPercent: () => number;
```

Add the two implementations to the store (after `getEnableMatchCountReveal`'s implementation):

```ts
  getEnableMatchCountReveal: () => {
    const state = get();
    return state.getSettingByKey<boolean>('enable_match_count_reveal') ?? false;
  },

  getProfileCompletionGiftCredits: () => {
    const state = get();
    return state.getSettingByKey<number>('profile_completion_gift_credits') ?? 150;
  },

  getProfileCompletionThresholdPercent: () => {
    const state = get();
    return (
      state.getSettingByKey<number>('profile_completion_threshold_percent') ?? 90
    );
  },
```

- [ ] **Step 4: Add the i18n keys**

`src/languages/Keys.tsx` — insert after the `onboardingIntroCta` line added in Task 3:

```ts
  onboardingIntroCta: 'onboardingIntroCta',
  giftClaimTitle: 'giftClaimTitle',
  giftClaimBody: 'giftClaimBody',
  claimGift: 'claimGift',
  maybeLater: 'maybeLater',
```

`src/languages/English.json` — insert after the `"onboardingIntroCta"` line added in Task 3. Note `giftClaimBody` carries an i18next `{{amount}}` interpolation, the same syntax already used by the existing `noRcommendedUserAvailable` key:

```json
    "onboardingIntroCta": "Let's Go",
    "giftClaimTitle": "You've completed your profile!",
    "giftClaimBody": "Claim {{amount}} free chat credits — our gift for finishing your full profile.",
    "claimGift": "Claim Gift",
    "maybeLater": "Maybe Later",
```

`src/languages/Urdu.json` and `src/languages/RomanUrdu.json` — same English text at the equivalent point, same rationale as Task 3 Step 2:

```json
    "giftClaimTitle": "You've completed your profile!",
    "giftClaimBody": "Claim {{amount}} free chat credits — our gift for finishing your full profile.",
    "claimGift": "Claim Gift",
    "maybeLater": "Maybe Later",
```

- [ ] **Step 5: Implement `GiftClaimModal`**

Create `src/screens/profile/components/gift-claim-modal.tsx`:

```tsx
import { t } from 'i18next';
import React, { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Button, Text } from '../../../components';
import { hp, Typography, wp } from '../../../global';
import { LanguageKeys } from '../../../languages';
import { Colors, Fonts } from '../../../res';
import { flashErrorMessage } from '../../../services';

type ClaimResult = {
  status: string;
  awarded: number;
  new_balance: number;
  multiplier: number;
};

type GiftClaimModalProps = {
  visible: boolean;
  giftCredits: number;
  onClose: () => void;
  onClaimed: (result: ClaimResult) => void;
  claim: () => Promise<ClaimResult>;
};

// Presented when the user taps an eligible GiftBadge. Owns only the
// confirm/claim round trip; the parent decides what eligible/claimed mean
// and how to persist the result on currentUser.
const GiftClaimModal = ({
  visible,
  giftCredits,
  onClose,
  onClaimed,
  claim,
}: GiftClaimModalProps) => {
  const [claiming, setClaiming] = useState(false);

  const onClaimPress = () => {
    if (claiming) return;
    setClaiming(true);
    claim()
      .then((result) => {
        setClaiming(false);
        onClaimed(result);
      })
      .catch((error) => {
        setClaiming(false);
        flashErrorMessage(
          typeof error === 'string' ? error : 'Failed to claim gift'
        );
      });
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={claiming ? undefined : onClose}
    >
      <View style={Styles.wrapper}>
        <View style={Styles.card}>
          <View style={Styles.iconChip}>
            <Ionicons name="gift" size={wp(7)} color={Colors.primary} />
          </View>
          <Text variant="display" style={Styles.title}>
            {LanguageKeys.giftClaimTitle}
          </Text>
          <Text style={Styles.body}>
            {t(LanguageKeys.giftClaimBody, { amount: giftCredits })}
          </Text>
          <View style={Styles.buttonRow}>
            <Button
              variant="outline"
              onPress={claiming ? undefined : onClose}
              buttonStyle={Styles.button}
              text={LanguageKeys.maybeLater}
              disabled={claiming}
            />
            <Button
              onPress={onClaimPress}
              buttonStyle={Styles.button}
              text={LanguageKeys.claimGift}
              disabled={claiming}
              loading={claiming}
              loadingMessage={LanguageKeys.updating}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default GiftClaimModal;

const Styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(6),
  },
  card: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: wp(4),
    padding: wp(5),
    alignItems: 'center',
  },
  iconChip: {
    width: wp(16),
    height: wp(16),
    borderRadius: wp(8),
    backgroundColor: Colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(1.5),
  },
  title: {
    color: Colors.ink,
    fontSize: Typography.medium1,
    textAlign: 'center',
  },
  body: {
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    textAlign: 'center',
    marginTop: hp(1),
  },
  buttonRow: {
    flexDirection: 'row',
    gap: wp(3),
    marginTop: hp(2.5),
    width: '100%',
  },
  button: {
    flex: 1,
  },
});
```

- [ ] **Step 6: Type-check**

Run: `yarn type-check`
Expected: clean.

- [ ] **Step 7: Manual verification**

RN component-level jest is broken in this repo. Verified as part of Task 7/8's manual walkthrough, since this modal has no standalone entry point yet.

- [ ] **Step 8: Commit**

```bash
git add src/services/api/EndPoints.tsx src/services/api/Services.tsx src/stores/settings-store.ts src/screens/profile/components/gift-claim-modal.tsx src/languages/Keys.tsx src/languages/English.json src/languages/Urdu.json src/languages/RomanUrdu.json
git commit -m "feat(profile): add claim-gift API, settings getters, and GiftClaimModal"
```

---

### Task 7: Wire the gift into the onboarding header

**Files:**

- Modify: `src/screens/onboardingProfile/OnboardingProfile.tsx`

**Interfaces:**

- Consumes: `GiftBadge` (Task 5), `GiftClaimModal` + `ApiServices.claimProfileGift` + `useSettingsStore().getProfileCompletionGiftCredits/getProfileCompletionThresholdPercent` (Task 6).

- [ ] **Step 1: Add imports**

Add near the other local imports in `OnboardingProfile.tsx`:

```ts
import GiftBadge from '../profile/components/gift-badge';
import GiftClaimModal from '../profile/components/gift-claim-modal';
```

Add `useSettingsStore` — this file doesn't currently import from `../../stores`, so add a new import line:

```ts
import { useSettingsStore } from '../../stores';
```

- [ ] **Step 2: Add gift state and derived values**

Add near the other `useState` declarations (after `const [categoriesData, setCategoriesData] = useState...`):

```ts
const [giftModalVisible, setGiftModalVisible] = useState(false);
```

Add near `strengthPct`'s `useMemo` (after it):

```ts
const giftThreshold = useSettingsStore().getProfileCompletionThresholdPercent();
const giftCredits = useSettingsStore().getProfileCompletionGiftCredits();
const giftClaimed = Boolean((currentUser as any)?.profile_finish_bonus_awarded);
const giftEligible = !giftClaimed && strengthPct >= giftThreshold;
```

- [ ] **Step 3: Add gift handlers**

Add near the other `useCallback`s (after `onIntroContinue` from Task 3):

```ts
const openGiftModal = useCallback(() => setGiftModalVisible(true), []);
const closeGiftModal = useCallback(() => setGiftModalVisible(false), []);

// Services.tsx's Promise executors are untyped (bare `Promise<unknown>`),
// so callers cast at the call site — matching the existing
// `as unknown as User` idiom already used elsewhere in this codebase
// (e.g. Header.tsx's getCurrentUserDetail call) rather than a bare `as`,
// which TS rejects between unrelated types.
const claimGift = useCallback(
  () =>
    ApiServices.claimProfileGift() as unknown as Promise<{
      status: string;
      awarded: number;
      new_balance: number;
      multiplier: number;
    }>,
  []
);

const onGiftClaimed = useCallback(
  (result: any) => {
    setGiftModalVisible(false);
    const updatedUser: any = {
      ...(currentUser as any),
      chat_credits: result.new_balance,
      profile_finish_bonus_awarded: true,
    };
    setData(storageKeys.USER, updatedUser);
    updateCurrentUser(updatedUser);
    const chats = Math.round(result.awarded / (result.multiplier || 50));
    flashSuccessMessage(
      `${t(LanguageKeys.youEarned)} +${chats} ${t(LanguageKeys.chatCredits)}`
    );
  },
  [currentUser, setData, storageKeys.USER, updateCurrentUser]
);
```

- [ ] **Step 4: Render the badge and modal**

Find the header row:

```tsx
<View style={Styles.headerRow}>
  <View style={Styles.groupNameRow}>
    <View style={Styles.groupIconChip}>
      <Ionicons
        name={currentGroup.icon}
        size={wp(4.5)}
        color={Colors.primary}
      />
    </View>
    <Text style={Styles.groupName} numberOfLines={1}>
      {currentGroup.title}
    </Text>
  </View>
  <Ripple onPress={saving ? undefined : bailFlow} disabled={saving}>
    <Text style={Styles.finishLaterText}>{LanguageKeys.finishLater}</Text>
  </Ripple>
</View>
```

Replace it — wrap "Finish Later" and the new badge in one end-aligned row so `headerRow`'s `space-between` still only sees two direct children:

```tsx
<View style={Styles.headerRow}>
  <View style={Styles.groupNameRow}>
    <View style={Styles.groupIconChip}>
      <Ionicons
        name={currentGroup.icon}
        size={wp(4.5)}
        color={Colors.primary}
      />
    </View>
    <Text style={Styles.groupName} numberOfLines={1}>
      {currentGroup.title}
    </Text>
  </View>
  <View style={Styles.headerEndRow}>
    <Ripple onPress={saving ? undefined : bailFlow} disabled={saving}>
      <Text style={Styles.finishLaterText}>{LanguageKeys.finishLater}</Text>
    </Ripple>
    <GiftBadge
      eligible={giftEligible}
      claimed={giftClaimed}
      onPress={openGiftModal}
    />
  </View>
</View>
```

Find the `ProfileQuestionWizard` element and add the modal as a sibling right after it (still inside the same `<Container>`):

```tsx
      <ProfileQuestionWizard
        key={currentGroup.key}
        fields={categoriesData[currentGroup.key] ?? []}
        gender={gender}
        saving={saving}
        finalLabel={LanguageKeys.continue}
        showSkip={false}
        startAtEnd={startAtEnd}
        onBack={groupIndex > 0 ? goToPrevGroup : undefined}
        onComplete={onGroupComplete}
      />
      <GiftClaimModal
        visible={giftModalVisible}
        giftCredits={giftCredits}
        onClose={closeGiftModal}
        onClaimed={onGiftClaimed}
        claim={claimGift}
      />
    </Container>
  );
};
```

- [ ] **Step 5: Add the `headerEndRow` style**

Add to the `Styles` block (near `headerRow`/`groupNameRow`):

```ts
  headerEndRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2.5),
  },
```

- [ ] **Step 6: Type-check**

Run: `yarn type-check`
Expected: clean.

- [ ] **Step 7: Manual verification**

RN component-level jest is broken in this repo. Verify by hand: start onboarding fresh, confirm the gift icon shows locked/grey in the header while below the completion threshold, answer every question in all 6 groups (Task 2's gating ensures none are skipped), and confirm the icon turns solid/tappable once the header's percentage crosses the threshold (default 90%) — this should happen before or exactly when the last group is saved, since the wizard alone can reach roughly 94–97%. Tap it, confirm the claim modal shows the configured credit amount, tap "Claim Gift", confirm a success toast appears, the balance updates, and the icon flips to the claimed checkmark state and stays that way if you back out and re-enter a group.

- [ ] **Step 8: Commit**

```bash
git add src/screens/onboardingProfile/OnboardingProfile.tsx
git commit -m "feat(onboarding): surface the completion gift in the wizard header"
```

---

### Task 8: Wire the gift into the ME profile header

**Files:**

- Modify: `src/screens/profile/Header.tsx`

**Interfaces:**

- Consumes: `GiftBadge` (Task 5), `GiftClaimModal` + `ApiServices.claimProfileGift` + `useSettingsStore().getProfileCompletionGiftCredits/getProfileCompletionThresholdPercent` (Task 6).

- [ ] **Step 1: Add imports**

Add near the other local imports in `Header.tsx`:

```ts
import GiftBadge from './components/gift-badge';
import GiftClaimModal from './components/gift-claim-modal';
```

Add `useSettingsStore` to the existing stores import:

```ts
import { usePremiumStore, useSettingsStore } from '../../stores';
```

- [ ] **Step 2: Add gift state and derived values**

Add after the existing `const [menuVisible, setMenuVisible] = useState(false);`:

```ts
const [giftModalVisible, setGiftModalVisible] = useState(false);
const giftThreshold = useSettingsStore().getProfileCompletionThresholdPercent();
const giftCredits = useSettingsStore().getProfileCompletionGiftCredits();
const giftClaimed = Boolean((currentUser as any)?.profile_finish_bonus_awarded);
const giftEligible =
  !giftClaimed &&
  typeof profileStrength === 'number' &&
  profileStrength >= giftThreshold;
```

- [ ] **Step 3: Add gift handlers**

Add near the other handlers (e.g. after `onToggleBlur`):

```ts
const openGiftModal = useCallback(() => setGiftModalVisible(true), []);
const closeGiftModal = useCallback(() => setGiftModalVisible(false), []);

// Services.tsx's Promise executors are untyped (bare `Promise<unknown>`),
// so callers cast at the call site — matching the existing
// `as unknown as User` idiom already used elsewhere in this file
// (getCurrentUserDetail, a few lines up) rather than a bare `as`, which TS
// rejects between unrelated types.
const claimGift = useCallback(
  () =>
    ApiServices.claimProfileGift() as unknown as Promise<{
      status: string;
      awarded: number;
      new_balance: number;
      multiplier: number;
    }>,
  []
);

const onGiftClaimed = useCallback(
  (result: any) => {
    setGiftModalVisible(false);
    const { setData, storageKeys } = StorageManager;
    const updatedUser: any = {
      ...(currentUser as any),
      chat_credits: result.new_balance,
      profile_finish_bonus_awarded: true,
    };
    setData(storageKeys.USER, updatedUser);
    updateCurrentUser(updatedUser);
    const chats = Math.round(result.awarded / (result.multiplier || 50));
    flashSuccessMessage(
      `${t(LanguageKeys.youEarned)} +${chats} ${t(LanguageKeys.chatCredits)}`
    );
  },
  [currentUser, updateCurrentUser]
);
```

(`t` here is the `const { t } = useTranslation();` already destructured at the top of `Header.tsx` — do not add a separate `i18next` import.)

- [ ] **Step 4: Render the badge**

Find the profile-strength block inside `renderSelfHeader`:

```tsx
{
  typeof profileStrength === 'number' ? (
    <View style={Styles.strengthWrap}>
      <View
        style={[
          Styles.strengthRow,
          { flexDirection: Rtl ? 'row-reverse' : 'row' },
        ]}
      >
        <Text style={Styles.strengthLabel}>{LanguageKeys.profileStrength}</Text>
        <ReactText style={Styles.strengthPct}>
          {`${profileStrength}%`}
        </ReactText>
      </View>
      <View style={Styles.strengthTrack}>
        <View
          style={[
            Styles.strengthFill,
            {
              width: `${Math.max(0, Math.min(100, profileStrength))}%`,
            },
          ]}
        />
      </View>
    </View>
  ) : null;
}
```

Replace it — wrap the percentage text and the new badge in one row so `strengthRow`'s `space-between` still only sees two direct children:

```tsx
{
  typeof profileStrength === 'number' ? (
    <View style={Styles.strengthWrap}>
      <View
        style={[
          Styles.strengthRow,
          { flexDirection: Rtl ? 'row-reverse' : 'row' },
        ]}
      >
        <Text style={Styles.strengthLabel}>{LanguageKeys.profileStrength}</Text>
        <View style={Styles.strengthEndRow}>
          <ReactText style={Styles.strengthPct}>
            {`${profileStrength}%`}
          </ReactText>
          <GiftBadge
            eligible={giftEligible}
            claimed={giftClaimed}
            onPress={openGiftModal}
          />
        </View>
      </View>
      <View style={Styles.strengthTrack}>
        <View
          style={[
            Styles.strengthFill,
            {
              width: `${Math.max(0, Math.min(100, profileStrength))}%`,
            },
          ]}
        />
      </View>
    </View>
  ) : null;
}
```

- [ ] **Step 5: Render the modal**

Find the closing sequence of the component's main `return` — the three existing `<Modal>` elements (`menuVisible`, `blurModalVisible`, `taglineEditing`) sit at the bottom, inside the outermost `<View>`, after the `{!fromUserProfile ? renderSelfHeader() : (...)}` block. The last of the three (`taglineEditing`) currently ends the file like this:

```tsx
      <Modal
        transparent
        visible={Boolean(taglineEditing)}
        animationType="fade"
        onRequestClose={onTaglineCancel}
      >
        <View style={Styles.taglineModalWrap}>
          <View style={Styles.taglineModalCard}>
            <Text style={Styles.taglineModalTitle}>{LanguageKeys.tagline}</Text>
            <TextInput
              style={Styles.taglineModalInput}
              placeholder={LanguageKeys.enterTagline}
              placeholderTextColor={Colors.muted}
              value={taglineInput}
              onChangeText={onTaglineChange}
              multiline
              maxLength={30}
            />
            <ReactText style={Styles.taglineCounter}>
              {`${taglineInput.length}/30`}
            </ReactText>
            <View style={Styles.blurModalButtons}>
              <Button
                onPress={onTaglineCancel}
                buttonStyle={[
                  Styles.blurModalButton,
                  Styles.blurModalButtonSecondary,
                ]}
                text={LanguageKeys.cancel}
                textStyle={Styles.blurModalButtonTextSecondary}
              />
              <Button
                onPress={onTaglineSubmit}
                buttonStyle={[
                  Styles.blurModalButton,
                  Styles.blurModalButtonPrimary,
                ]}
                text={LanguageKeys.update}
                textStyle={Styles.blurModalButtonTextPrimary}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
```

Add `GiftClaimModal` as a fourth modal, right after the `taglineEditing` Modal's closing tag and before the outer `</View>` (it naturally never opens when viewing someone else's profile, since only `renderSelfHeader`'s badge can call `openGiftModal`):

```tsx
      </Modal>

      <GiftClaimModal
        visible={giftModalVisible}
        giftCredits={giftCredits}
        onClose={closeGiftModal}
        onClaimed={onGiftClaimed}
        claim={claimGift}
      />
    </View>
  );
};
```

- [ ] **Step 6: Add the `strengthEndRow` style**

Add to the `Styles` block (near `strengthRow`/`strengthPct`):

```ts
  strengthEndRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
```

- [ ] **Step 7: Type-check**

Run: `yarn type-check`
Expected: clean.

- [ ] **Step 8: Manual verification**

RN component-level jest is broken in this repo. Verify by hand: open your own Profile (ME) tab. If below the completion threshold, confirm the gift icon shows locked/grey next to the strength percentage. Fill in remaining fields (including interests and a tagline, since those only exist here, not in onboarding) until the percentage crosses the threshold; confirm the icon lights up, tapping it opens the same claim modal, claiming updates the balance and flips the icon to claimed. Then re-open the onboarding entry point (if reachable) or just re-open ME again and confirm the claimed state persists (backed by `currentUser.profile_finish_bonus_awarded`, not local-only state).

- [ ] **Step 9: Commit**

```bash
git add src/screens/profile/Header.tsx
git commit -m "feat(profile): surface the completion gift in the ME profile header"
```
