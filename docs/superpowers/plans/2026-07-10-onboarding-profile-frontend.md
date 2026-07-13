# Onboarding Profile-Building — Frontend (app-old) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After "Tell us about yourself", walk the new member through a guided, grouped, one-question-per-screen profile-building flow with per-group checkpoints, a climbing strength meter, chat-credit reward celebrations, and a config-gated skip of the signup subscription paywall — reusing the existing ME wizard engine.

**Architecture:** Extract the reusable question-runner out of `EditProfileGroup` into a shared `ProfileQuestionWizard` (owns stepping, controls, within-group progress, Back/Skip/Next; calls `onComplete(formData)` and takes a `saving` flag — it does NOT own the save or navigation). `EditProfileGroup` becomes a thin wrapper (behavior unchanged). A new `OnboardingProfile` screen sequences the six groups through that wizard, owns the checkpoints/strength/reward chrome, and reads the backend's `results.reward`. A small `resolve-post-signup-route` helper + a settings getter gate the signup paywall. A home banner and a local reminder recapture users who bail.

**Tech Stack:** React Native 0.82 / React 19.1, TypeScript, `@react-navigation/native-stack`, Zustand (`settings-store`), MMKV (`StorageManager`), `@notifee/react-native`, i18next.

## Global Constraints

- **Branch off `staging`; merge to `staging` first.** Never `main`. No force-pushes. (This plan runs in the `app-old/` repo.)
- **Respect versions** — RN 0.82 / React 19.1. No dependency bumps. Yarn, not npm.
- **Path alias** `@/*` → `src/*`; import sort is auto-fixed by `eslint-plugin-simple-import-sort` (don't hand-order); `import type` is enforced. `max-params: 3` (use an options object beyond that).
- **Scaling:** use `wp()`/`hp()` from `src/global`, never raw pixels. **Colors/Fonts** from `src/res` tokens (`primary`, `lavender`, `ink`, `muted`, `hairline`, `surface`, `appBg`, `verified`). RTL via `CheckRtl()`.
- **i18n:** every user-visible string goes through `t()`/`LanguageKeys`. New keys MUST be added to `Keys.tsx` **and all three** locale JSONs (`English.json`, `Urdu.json`, `RomanUrdu.json`) to keep `i18n-json/identical-keys` parity. The custom `Text` component auto-translates its string children.
- **No "optional"/"skip"-as-optional wording** in the onboarding flow copy. The bail affordance is "Finish later" at checkpoints.
- **Group category keys** (on each field's `category`): `appearance-0`, `islamicval-0`, `life-0`, `futureplan-0`, `familybg-0`, `personality-0`. Accessed from `Data` by the camelCase property (`appearanceAndHealth`, `islamicValues`, `lifeStyle`, `futurePlan`, `familyBackground`, `personalityRequirements`).
- **Reward contract** (from the backend plan): `updateDetails(...)` resolves the `results` object, which contains `reward = { awarded, reason, new_balance, rewarded_groups, multiplier }` (or `null`). `awarded`/`new_balance` are in **raw credit units**; display chats = `Math.round(awarded / multiplier)`. Treat `reward` as **optional** — the flow must work if it's absent.
- **jest is currently broken** in this repo (per the design spec's Known Issues). Author unit tests for the pure helpers anyway (Tasks 2 & 5), and use the **manual verification checklists** as the primary gate for UI tasks. Type-check with `yarn type-check` (must stay clean) and `yarn lint` on touched files after every task.
- **Conventional Commits** for every commit.

## Before you start

```bash
cd "D:/GitHub/Pure Half/app-old"
git checkout staging && git pull
git checkout -b feat/onboarding-profile-building
yarn type-check
```

Expected: `tsc --noEmit` clean (baseline). Fix nothing pre-existing; just confirm the baseline is green so regressions are attributable.

---

## File Structure

Phase A — core flow (shippable on its own):

- `src/languages/Keys.tsx` + `English.json` + `Urdu.json` + `RomanUrdu.json` — **modify.** New onboarding keys.
- `src/screens/profile/hydrate-group-fields.ts` — **create.** Pure hydration helper extracted from `Profile.tsx` `getAttribute`.
- `src/screens/profile/components/profile-question-wizard.tsx` — **create.** The extracted wizard.
- `src/screens/profile/EditProfileGroup.tsx` — **modify.** Thin wrapper around the wizard.
- `src/screens/onboardingProfile/OnboardingProfile.tsx` + `index.tsx` — **create.** The container.
- `src/screens/index.tsx` + `src/navigation/RootNavigation.tsx` — **modify.** Register the screen.
- `src/screens/userInput/UserInput.tsx` — **modify.** Signup continue → `OnboardingProfile`.

Phase B — paywall skip:

- `src/stores/settings-store.ts` — **modify.** `getSkipSignupMembershipPaywall()`.
- `src/navigation/resolve-post-signup-route.ts` — **create.** Shared paywall decision.
- `src/screens/otp/Otp.tsx`, `src/screens/phoneNumber/AuthWelcome.tsx`, `src/screens/welcomeUser/WelcomeUser.tsx` — **modify.** Route the paywall branch through the helper.

Phase C — motivators & re-engagement:

- `src/screens/welcome/Welcome.tsx` — **modify.** Profile-completion banner (deep-links to `OnboardingProfile`).
- `src/notifications/profile-reminder.ts` — **create.** Local reminder scheduler; called from `OnboardingProfile` on "Finish later".

---

# Phase A — Core onboarding flow

## Task 1: i18n keys

**Files:**

- Modify: `src/languages/Keys.tsx`, `src/languages/English.json`, `src/languages/Urdu.json`, `src/languages/RomanUrdu.json`

**Interfaces:**

- Produces: `LanguageKeys.buildYourProfile`, `.onboardingSubtitle`, `.finishLater`, `.youEarned`, `.profileStrength`, `.group`, `.onboardingDoneTitle`, `.onboardingDoneBody`, `.completeProfileCta`, `.completeProfileBannerBody`, `.matchQualityHint`, `.profileReminderTitle`, `.profileReminderBody`.

- [ ] **Step 1: Add the keys to `Keys.tsx`**

In `src/languages/Keys.tsx`, add these entries inside the `Keys` object (near the other signup keys):

```ts
  buildYourProfile: 'buildYourProfile',
  onboardingSubtitle: 'onboardingSubtitle',
  finishLater: 'finishLater',
  youEarned: 'youEarned',
  profileStrength: 'profileStrength',
  group: 'group',
  onboardingDoneTitle: 'onboardingDoneTitle',
  onboardingDoneBody: 'onboardingDoneBody',
  completeProfileCta: 'completeProfileCta',
  completeProfileBannerBody: 'completeProfileBannerBody',
  matchQualityHint: 'matchQualityHint',
  profileReminderTitle: 'profileReminderTitle',
  profileReminderBody: 'profileReminderBody',
```

- [ ] **Step 2: Add English strings**

In `src/languages/English.json`, add inside the `translation` object:

```json
    "buildYourProfile": "Build your profile",
    "onboardingSubtitle": "A complete profile gets seen by more matches. Answer a few and earn chat credits.",
    "finishLater": "Finish later",
    "youEarned": "You earned",
    "profileStrength": "Profile strength",
    "group": "Group",
    "onboardingDoneTitle": "You're all set",
    "onboardingDoneBody": "Your profile is looking great. You can always add more from your profile.",
    "completeProfileCta": "Complete your profile",
    "completeProfileBannerBody": "Finish it to get seen by more matches",
    "matchQualityHint": "Members with a complete profile get far more interest.",
    "profileReminderTitle": "Your profile is waiting",
    "profileReminderBody": "Finish it to get seen by more matches and earn chat credits.",
```

- [ ] **Step 3: Add Urdu strings**

In `src/languages/Urdu.json`, add inside `translation`:

```json
    "buildYourProfile": "اپنا پروفائل مکمل کریں",
    "onboardingSubtitle": "مکمل پروفائل کو زیادہ میچز دیکھتے ہیں۔ چند سوالوں کے جواب دیں اور چیٹ کریڈٹ کمائیں۔",
    "finishLater": "بعد میں مکمل کریں",
    "youEarned": "آپ نے حاصل کیے",
    "profileStrength": "پروفائل مضبوطی",
    "group": "گروپ",
    "onboardingDoneTitle": "سب تیار ہے",
    "onboardingDoneBody": "آپ کا پروفائل بہت اچھا لگ رہا ہے۔ آپ اپنے پروفائل سے مزید شامل کر سکتے ہیں۔",
    "completeProfileCta": "اپنا پروفائل مکمل کریں",
    "completeProfileBannerBody": "زیادہ میچز تک پہنچنے کے لیے مکمل کریں",
    "matchQualityHint": "مکمل پروفائل والے ممبرز کو کہیں زیادہ دلچسپی ملتی ہے۔",
    "profileReminderTitle": "آپ کا پروفائل منتظر ہے",
    "profileReminderBody": "زیادہ میچز تک پہنچنے اور چیٹ کریڈٹ کمانے کے لیے اسے مکمل کریں۔",
```

- [ ] **Step 4: Add Roman Urdu strings**

In `src/languages/RomanUrdu.json`, add inside `translation`:

```json
    "buildYourProfile": "Apna profile mukammal karein",
    "onboardingSubtitle": "Mukammal profile ko zyada matches dekhte hain. Chand sawalon kay jawab dein aur chat credits kamayein.",
    "finishLater": "Baad mein mukammal karein",
    "youEarned": "Aap ne hasil kiye",
    "profileStrength": "Profile mazbooti",
    "group": "Group",
    "onboardingDoneTitle": "Sab tayyar hai",
    "onboardingDoneBody": "Aap ka profile bohat acha lag raha hai. Aap apne profile se mazeed shamil kar sakte hain.",
    "completeProfileCta": "Apna profile mukammal karein",
    "completeProfileBannerBody": "Zyada matches tak pohanchne ke liye mukammal karein",
    "matchQualityHint": "Mukammal profile wale members ko kaheen zyada dilchaspi milti hai.",
    "profileReminderTitle": "Aap ka profile muntazir hai",
    "profileReminderBody": "Zyada matches tak pohanchne aur chat credits kamane ke liye ise mukammal karein.",
```

- [ ] **Step 5: Verify parity + type-check**

Run: `yarn type-check`
Expected: clean. Then confirm key parity:

Run: `node -e "const en=require('./src/languages/English.json').translation,ur=require('./src/languages/Urdu.json').translation,ru=require('./src/languages/RomanUrdu.json').translation;const k=['buildYourProfile','onboardingSubtitle','finishLater','youEarned','profileStrength','group','onboardingDoneTitle','onboardingDoneBody','completeProfileCta','completeProfileBannerBody','matchQualityHint','profileReminderTitle','profileReminderBody'];console.log(k.filter(x=>!(x in en)||!(x in ur)||!(x in ru)))"`
Expected: `[]` (all keys present in all three).

- [ ] **Step 6: Commit**

```bash
git add src/languages/Keys.tsx src/languages/English.json src/languages/Urdu.json src/languages/RomanUrdu.json
git commit -m "feat(onboarding): add i18n keys for profile-building flow"
```

---

## Task 2: Extract the attribute-hydration helper

**Files:**

- Create: `src/screens/profile/hydrate-group-fields.ts`
- Test: `src/screens/profile/hydrate-group-fields.test.ts`

**Interfaces:**

- Produces: `hydrateGroupFields(fields: any[], attribute: any, detail: any): any[]` — returns a deep-cloned copy of `fields` with each field's `data` filled from `attribute[category][id]` and `selected` seeded from `detail[apiKey]`, using the exact shape rules from `Profile.tsx` `getAttribute`. Pure; never mutates inputs.

This lifts the per-field merge logic out of `Profile.tsx:261–339` (verbatim rules) into a reusable, testable function so `OnboardingProfile` builds the same field shape ME does.

- [ ] **Step 1: Write the failing test**

Create `src/screens/profile/hydrate-group-fields.test.ts`:

```ts
import { hydrateGroupFields } from './hydrate-group-fields';

const dropdownField = {
  title: 'Body Type',
  type: 'dropDown',
  id: 'bdy-0',
  category: 'appearance-0',
  apiKey: 'body_type_id',
  data: [],
  selected: {},
};

const textField = {
  title: 'About',
  type: 'input',
  id: 'aboutYourself',
  category: 'personality-0',
  apiKey: 'about_you',
  data: [],
  selected: {},
};

describe('hydrateGroupFields', () => {
  it('fills dropdown options from the attribute cache', () => {
    const attribute = {
      'appearance-0': { 'bdy-0': [{ id: 5, value: 'Athletic' }] },
    };
    const [out] = hydrateGroupFields([dropdownField], attribute, {});
    expect(out.data).toEqual([{ id: 5, value: 'Athletic' }]);
    expect(dropdownField.data).toEqual([]); // input not mutated
  });

  it('seeds a dropdown selection from the saved detail value', () => {
    const attribute = {
      'appearance-0': { 'bdy-0': [{ id: 5, value: 'Athletic' }] },
    };
    const [out] = hydrateGroupFields([dropdownField], attribute, {
      body_type_id: 5,
    });
    expect(out.selected).toEqual({ id: 5, value: 'Athletic' });
  });

  it('seeds a text field selection with {id,value,category}', () => {
    const [out] = hydrateGroupFields([textField], {}, { about_you: 'Kind' });
    expect(out.selected).toEqual({
      id: 'aboutYourself',
      value: 'Kind',
      category: 'personality-0',
    });
  });

  it('leaves selected untouched when detail has no value', () => {
    const [out] = hydrateGroupFields([textField], {}, {});
    expect(out.selected).toEqual({});
  });
});
```

- [ ] **Step 2: Run test to verify it fails** (jest may be broken — if it errors on setup rather than the assertion, note it and proceed; the logic is still verified by Task 4's manual walk)

Run: `yarn jest hydrate-group-fields`
Expected: FAIL — module not found.

- [ ] **Step 3: Create the helper**

Create `src/screens/profile/hydrate-group-fields.ts`:

```ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import _ from 'lodash';

// Merge cached ATTRIBUTE option lists + the user's saved detail values into a
// group's field definitions. Mirrors Profile.tsx getAttribute per-field rules
// exactly, but as a pure function over a single group's fields. Never mutates
// its inputs (deep-clones first).
export const hydrateGroupFields = (
  fields: any[] = [],
  attribute: any = {},
  detail: any = {}
): any[] => {
  const clone: any[] = JSON.parse(JSON.stringify(fields ?? []));

  clone.forEach((element: any) => {
    // 1) Options for dropDown fields come from attribute[category][id].
    const options = attribute?.[element.category]?.[element.id];
    if (options) {
      element.data = options;
    }

    // 2) Seed selected from the saved detail value (if present).
    if (detail && Object.keys(detail).length !== 0) {
      const value = detail?.[element.apiKey];
      if (value === null || value === undefined) return;

      if (element.type === 'dropDown') {
        const match = _.find(element?.data, (n: any) => n?.id === value);
        if (match) {
          element.selected = match;
        } else if (element.id === 'language' || element.id === 'nationality') {
          element.selected = {
            id: (value as any)?.id,
            value: (value as any)?.name,
          };
        }
      } else if (element.type === 'scalling') {
        if (element.id === 'height') {
          element.selected = {
            scale: detail?.height_scale,
            value: detail?.height,
          };
        } else {
          element.selected = {
            scale: detail?.weight_scale,
            value: detail?.weight,
          };
        }
      } else {
        element.selected = {
          id: element?.id,
          value,
          category: element?.category,
        };
      }
    }
  });

  return clone;
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn jest hydrate-group-fields`
Expected: PASS (if the runner executes). If jest is broken at the harness level, instead run `yarn type-check` (clean) and rely on Task 4's manual verification that dropdowns show options and saved values pre-fill.

- [ ] **Step 5: Commit**

```bash
git add src/screens/profile/hydrate-group-fields.ts src/screens/profile/hydrate-group-fields.test.ts
git commit -m "feat(onboarding): extract pure attribute-hydration helper"
```

---

## Task 3: Extract `ProfileQuestionWizard` and slim down `EditProfileGroup`

**Files:**

- Create: `src/screens/profile/components/profile-question-wizard.tsx`
- Modify: `src/screens/profile/EditProfileGroup.tsx`

**Interfaces:**

- Produces: `ProfileQuestionWizard` — default export, props:
  ```ts
  type ProfileQuestionWizardProps = {
    fields: any[]; // hydrated group field array (wizard deep-clones + normalizes)
    gender?: string; // 'male' | 'female'
    saving?: boolean; // parent-controlled; disables buttons + shows saving row
    finalLabel?: string; // primary button label on the last step (default LanguageKeys.update)
    showSkip?: boolean; // render the "Skip" button (default true, ME). Onboarding passes false.
    onComplete: (formData: any[]) => void; // called on the last-step primary press
  };
  ```
- Consumes: none new. The wizard renders the question area + footer + Picker; the **parent** provides `Container`/`Header` and owns the save + navigation.

This is a **verbatim move** of the self-contained pieces of `EditProfileGroup.tsx` plus three behavioral edits (drop the save/navigation, replace `currentUser.gender` with the `gender` prop, replace `updateLoader` with the `saving` prop). Do the move mechanically, then apply the deltas.

- [ ] **Step 1: Create the wizard file — move the self-contained pieces**

Create `src/screens/profile/components/profile-question-wizard.tsx`. Copy **verbatim** from `EditProfileGroup.tsx` into it, in order:

- The `RULER_TICK_WIDTH` const (line 46).
- `PickerState` and `FocusedInputState` types (lines 48–59).
- `OptionTags` (lines 61–88), `RulerTicks` (lines 90–117), `ScaleRuler` (lines 119–265) — unchanged.
- The `Styles` StyleSheet keys used by the wizard: everything **except** `screen` (i.e. copy `content`, `questionCard`, `questionEyebrow`, `progressTrack`, `progressFill`, `questionTitle`, `controlWrap`, `emptyCard`, `emptyText`, `input`, `hiddenControlLabel`, `labelLessControl`, `labelLessPickerButton`, and all `scale*`/`ruler*`/`option*`/`footer*`/`saving*`/`secondaryBtn*`/`disabledBtn`/`primaryBtnWrap` keys — EditProfileGroup Styles lines 665–899, minus the `screen` key at 666–668).

Use these imports at the top (note: `Container`/`Header` are **removed**; `useGlobalContext`/`StorageManager`/`updateDetails`/`flashSuccessMessage`/`useTranslation` are **removed**):

```tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';

import {
  Button,
  IconInput,
  Picker,
  PickerButton,
  Text,
} from '../../../components';
import { hp, Typography, wp } from '../../../global';
import { CheckRtl, LanguageKeys } from '../../../languages';
import { Colors, Fonts } from '../../../res';
import { ApiServices } from '../../../services';
import {
  buildScalingSelected,
  convertScaleValue,
  formatScaleValue,
  getOptionKey,
  getOptionLabel,
  getProgressLabel,
  getScalingDisplay,
  getVisibleProfileFields,
  isOptionSelected,
  normalizeScalingSelected,
  shouldUseTagOptions,
} from '../profile-editor-flow';
```

(`OptionTags`/`RulerTicks`/`ScaleRuler` and `Styles` follow, moved verbatim as described.)

- [ ] **Step 2: Add the wizard component (the moved body with three deltas)**

Append this component to `profile-question-wizard.tsx`. It is `EditProfileGroup`'s body with: (a) props instead of route/globals, (b) `gender` prop instead of `currentUser?.gender`, (c) `onComplete(formData)` instead of the save, (d) `saving` prop instead of `updateLoader`, and (e) no `Container`/`Header` (parent owns those):

```tsx
type ProfileQuestionWizardProps = {
  fields: any[];
  gender?: string;
  saving?: boolean;
  finalLabel?: string;
  onComplete: (formData: any[]) => void;
};

const ProfileQuestionWizard = ({
  fields,
  gender,
  saving = false,
  finalLabel = LanguageKeys.update,
  showSkip = true,
  onComplete,
}: ProfileQuestionWizardProps) => {
  const Rtl = CheckRtl();

  const [formData, setFormData] = useState<any[]>(() =>
    JSON.parse(JSON.stringify(fields ?? [])).map(normalizeScalingSelected)
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [pickerDataLoader, setPickerDataLoader] = useState(false);
  const [focusedInput, setFocusedInput] = useState<FocusedInputState>({
    activeInputId: '',
    value: '',
    item: {},
  });
  const [picker, setPicker] = useState<PickerState>({
    visible: false,
    data: [],
    headerTitle: '',
    activePicker: '',
  });

  const visibleFields = useMemo(
    () => getVisibleProfileFields(formData, gender),
    [gender, formData]
  );

  const activeItem = visibleFields[activeIndex];
  const progressLabel = getProgressLabel('', activeIndex, visibleFields.length);
  const isFirstStep = activeIndex === 0;
  const isLastStep =
    visibleFields.length > 0 && activeIndex === visibleFields.length - 1;

  useEffect(() => {
    if (activeIndex > 0 && activeIndex >= visibleFields.length) {
      setActiveIndex(Math.max(visibleFields.length - 1, 0));
    }
  }, [activeIndex, visibleFields.length]);

  const onClosePicker = useCallback(
    () =>
      setPicker({
        visible: false,
        headerTitle: '',
        data: [],
        activePicker: '',
      }),
    []
  );

  const getApiData = useCallback((id: any) => {
    return new Promise((resolve, reject) => {
      if (id === 'language') {
        ApiServices.getLanguages()
          .then((d: any) => resolve(d))
          .catch(() => reject(''));
      } else if (id === 'nationality') {
        ApiServices.getNationality()
          .then((d: any) => resolve(d))
          .catch(() => reject(''));
      } else {
        reject('');
      }
    });
  }, []);

  const openPicker = useCallback(
    async (pData: any, headerTitle: any, id: any) => {
      if (id === 'language' || id === 'nationality') {
        setPickerDataLoader(true);
        getApiData(id)
          .then(async (d: any) => {
            if (d) {
              const newData: any[] = [];
              for await (const element of d) {
                newData.push({ id: element?.id, value: element?.name });
              }
              setPicker({
                visible: true,
                headerTitle,
                data: newData,
                activePicker: headerTitle,
              });
            }
            setPickerDataLoader(false);
          })
          .catch(() => setPickerDataLoader(false));
        return;
      }
      if (gender === 'male' && id === 'martial-0') {
        setPicker({
          visible: true,
          headerTitle,
          data: pData?.filter((val: any) => val?.value !== 'Widowed'),
          activePicker: headerTitle,
        });
      } else {
        setPicker({
          visible: true,
          headerTitle,
          data: pData,
          activePicker: headerTitle,
        });
      }
    },
    [gender, getApiData]
  );

  const onInputFocus = useCallback((id: any, value: any, item: any) => {
    setFocusedInput({ activeInputId: id, value, item });
  }, []);

  const onBlurInput = useCallback(() => {
    const { activeInputId, item, value } = focusedInput;
    const { category } = item;
    setFormData((prev: any[]) =>
      prev.map((element: any) =>
        element.id === activeInputId
          ? { ...element, selected: { id: activeInputId, value, category } }
          : element
      )
    );
  }, [focusedInput]);

  const onChangeInput = useCallback(
    (text: any) => {
      setFocusedInput((prev) => ({ ...prev, value: text }));
      setFormData((prev: any[]) =>
        prev.map((element: any) =>
          element.title === focusedInput?.item?.title
            ? { ...element, selected: { ...element.selected, value: text } }
            : element
        )
      );
    },
    [focusedInput]
  );

  const onPickerItemPress = useCallback(
    (item: any) => {
      setFormData((prev: any[]) =>
        prev.map((element: any) =>
          element.title === picker.activePicker
            ? { ...element, selected: item }
            : element
        )
      );
      onClosePicker();
    },
    [onClosePicker, picker.activePicker]
  );

  const onSelectOption = useCallback((tappedItem: any, opt: any) => {
    setFormData((prev: any[]) =>
      prev.map((element: any) =>
        element.id === tappedItem.id ? { ...element, selected: opt } : element
      )
    );
  }, []);

  const goBackStep = useCallback(() => {
    setActiveIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const goNextStep = useCallback(() => {
    setActiveIndex((prev) =>
      visibleFields.length ? Math.min(prev + 1, visibleFields.length - 1) : 0
    );
  }, [visibleFields.length]);

  const advance = useCallback(() => {
    if (isLastStep) {
      onComplete(formData);
      return;
    }
    goNextStep();
  }, [formData, goNextStep, isLastStep, onComplete]);

  const renderActiveControl = useCallback(
    (item: any) => {
      if (!item) return null;
      const {
        data: iData,
        title: iTitle,
        selected,
        type,
        placeholder,
        id,
      } = item;
      const { value } = selected ?? {};

      const isOptionType = type === 'dropDown' || type === 'dropDownBinary';
      let tagOptions: any[] = isOptionType && Array.isArray(iData) ? iData : [];
      if (gender === 'male' && id === 'martial-0') {
        tagOptions = tagOptions.filter((v: any) => v?.value !== 'Widowed');
      }
      const useTags = shouldUseTagOptions(item, tagOptions);

      return (
        <View style={Styles.questionCard}>
          <Text style={Styles.questionEyebrow}>{progressLabel}</Text>
          <View style={Styles.progressTrack}>
            <View
              style={[
                Styles.progressFill,
                {
                  width: `${
                    visibleFields.length
                      ? ((activeIndex + 1) / visibleFields.length) * 100
                      : 0
                  }%`,
                },
              ]}
            />
          </View>
          <Text style={Styles.questionTitle}>{iTitle}</Text>

          <View style={Styles.controlWrap}>
            {type === 'input' ? (
              <IconInput
                placeholder={placeholder}
                outerLabelStyle={Styles.hiddenControlLabel}
                containerStyle={Styles.labelLessControl}
                inputStyle={Styles.input}
                value={
                  focusedInput.activeInputId === id ? focusedInput.value : value
                }
                onChangeText={onChangeInput}
                onFocus={onInputFocus.bind(null, id, value, item)}
                onBlur={onBlurInput}
              />
            ) : type === 'scalling' ? (
              <ScaleRuler item={item} onSelect={onSelectOption} />
            ) : useTags ? (
              <OptionTags
                item={item}
                options={tagOptions}
                onSelect={onSelectOption}
                rtl={Rtl}
              />
            ) : (
              <PickerButton
                buttonText={
                  typeof value === 'number'
                    ? value === 1
                      ? 'Yes'
                      : value === 0
                        ? 'No'
                        : JSON.stringify(value)
                    : value && value.length !== 0
                      ? value
                      : LanguageKeys.notYetProvided
                }
                onPress={openPicker.bind(null, iData, iTitle, id)}
                buttonContainer={Styles.labelLessPickerButton}
              />
            )}
          </View>
        </View>
      );
    },
    [
      gender,
      focusedInput,
      onBlurInput,
      onChangeInput,
      onInputFocus,
      openPicker,
      onSelectOption,
      Rtl,
      progressLabel,
      activeIndex,
      visibleFields.length,
    ]
  );

  return (
    <>
      <View style={Styles.content}>
        {visibleFields.length > 0 ? (
          renderActiveControl(activeItem)
        ) : (
          <View style={Styles.emptyCard}>
            <Text style={Styles.emptyText}>{LanguageKeys.notYetProvided}</Text>
          </View>
        )}
      </View>
      <View style={Styles.footer}>
        {saving ? (
          <View style={Styles.savingStatus}>
            <View style={Styles.savingAccent} />
            <Text style={Styles.savingStatusText}>{LanguageKeys.updating}</Text>
          </View>
        ) : null}
        <View style={Styles.footerRow}>
          {!isFirstStep ? (
            <Ripple
              onPress={saving ? undefined : goBackStep}
              style={[Styles.secondaryBtn, saving && Styles.disabledBtn]}
              disabled={saving}
            >
              <Text style={Styles.secondaryBtnText}>{LanguageKeys.back}</Text>
            </Ripple>
          ) : null}
          {showSkip ? (
            <Ripple
              onPress={
                saving || visibleFields.length === 0 ? undefined : advance
              }
              style={[
                Styles.secondaryBtn,
                (saving || visibleFields.length === 0) && Styles.disabledBtn,
              ]}
              disabled={saving || visibleFields.length === 0}
            >
              <Text style={Styles.secondaryBtnText}>{LanguageKeys.skip}</Text>
            </Ripple>
          ) : null}
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
                saving || visibleFields.length === 0 ? undefined : advance
              }
              disabled={saving || visibleFields.length === 0}
            />
          </View>
        </View>
      </View>

      <Picker
        visible={picker.visible}
        onClose={onClosePicker}
        onPress={onPickerItemPress}
        data={picker.data}
        headerTitle={picker.headerTitle}
        loader={pickerDataLoader}
      />
    </>
  );
};

export default ProfileQuestionWizard;
```

Note: "Skip" and "Next" both call `advance` (same as the original `onSkipPress`/`onPrimaryPress`, which were identical). The `skip` label is retained only inside the ME `EditProfileGroup` usage; `OnboardingProfile` passes a flow that never surfaces it as "optional" — but the label text is unchanged here to preserve the ME screen exactly.

- [ ] **Step 3: Rewrite `EditProfileGroup.tsx` as a thin wrapper**

Replace the ENTIRE contents of `src/screens/profile/EditProfileGroup.tsx` with:

```tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';

import { Container, Header } from '../../components';
import { LanguageKeys } from '../../languages';
import { Colors } from '../../res';
import {
  flashSuccessMessage,
  StorageManager,
  useGlobalContext,
} from '../../services';
import ProfileQuestionWizard from './components/profile-question-wizard';
import { updateDetails } from './Funtions';

const EditProfileGroup = ({ navigation, route }: any) => {
  const { title = '', data: initialData = [] } = route?.params ?? {};
  const { currentUser, updateCurrentUser } = useGlobalContext();
  const { setData, storageKeys } = StorageManager;
  const [saving, setSaving] = useState(false);

  const onComplete = useCallback(
    (formData: any[]) => {
      setSaving(true);
      updateDetails(formData)
        .then(async (res: any) => {
          if (res && Object.keys(res).length !== 0) {
            const updatedUser = { ...currentUser, detail: res };
            await setData(storageKeys.USER, updatedUser);
            updateCurrentUser(updatedUser);
          }
          flashSuccessMessage();
          setSaving(false);
          navigation.goBack();
        })
        .catch(() => setSaving(false));
    },
    [currentUser, navigation, setData, storageKeys.USER, updateCurrentUser]
  );

  return (
    <Container style={Styles.screen}>
      <Header title={title} navigation={navigation} titleVariant="display" />
      <ProfileQuestionWizard
        fields={initialData}
        gender={currentUser?.gender}
        saving={saving}
        finalLabel={LanguageKeys.update}
        onComplete={onComplete}
      />
    </Container>
  );
};

export default EditProfileGroup;

const Styles = StyleSheet.create({
  screen: {
    backgroundColor: Colors.appBg,
  },
});
```

Note: `onComplete` preserves the original `onSavePress` behavior exactly, including the existing `detail: res` assignment (unchanged, so `EditProfileGroup.test.tsx` expectations hold).

- [ ] **Step 4: Type-check and lint**

Run: `yarn type-check`
Expected: clean.
Run: `yarn lint src/screens/profile/EditProfileGroup.tsx src/screens/profile/components/profile-question-wizard.tsx`
Expected: no errors (warnings acceptable). Fix import order / type-import issues with `yarn lint:fix` on those files if flagged.

- [ ] **Step 5: Manual verification (ME screen unchanged)**

Build the app (`yarn android` or `yarn ios`), open ME → tap any group (e.g. Appearance & health). Verify: the one-question-per-screen wizard works exactly as before — progress bar, Back/Skip/Next, ruler for height/weight, option pills, the modal picker for language/nationality, and Save on the last step returns to ME with a success flash. If `EditProfileGroup.test.tsx` runs, `yarn jest EditProfileGroup` should still pass.

- [ ] **Step 6: Commit**

```bash
git add src/screens/profile/components/profile-question-wizard.tsx src/screens/profile/EditProfileGroup.tsx
git commit -m "refactor(profile): extract ProfileQuestionWizard from EditProfileGroup"
```

---

## Task 4: The `OnboardingProfile` screen + wiring

**Files:**

- Create: `src/screens/onboardingProfile/OnboardingProfile.tsx`, `src/screens/onboardingProfile/index.tsx`
- Modify: `src/screens/index.tsx`, `src/navigation/RootNavigation.tsx`, `src/screens/userInput/UserInput.tsx`

**Interfaces:**

- Consumes: `hydrateGroupFields` (Task 2), `ProfileQuestionWizard` (Task 3), `Data` (`../profile/Data`), `computeCompletion` (`../profile/profile-hub`), `updateDetails` (`../profile/Funtions`), `ApiServices.getAttribute`, `res.reward` contract.
- Produces: route `OnboardingProfile`; export `OnboardingProfile`.

- [ ] **Step 1: Create the screen**

Create `src/screens/onboardingProfile/OnboardingProfile.tsx`:

```tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Button, Container, Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import { LanguageKeys } from '../../languages';
import { Colors, Fonts } from '../../res';
import { ApiServices, StorageManager, useGlobalContext } from '../../services';
import Data from '../profile/Data';
import { computeCompletion } from '../profile/profile-hub';
import { updateDetails } from '../profile/Funtions';
import ProfileQuestionWizard from '../profile/components/profile-question-wizard';
import { hydrateGroupFields } from '../profile/hydrate-group-fields';

// The six onboarding groups, in the approved order, mapped to their Data key.
const GROUP_SEQUENCE: { key: string; title: string }[] = [
  { key: 'appearanceAndHealth', title: LanguageKeys.appearanceHealth },
  { key: 'islamicValues', title: LanguageKeys.islamicValues },
  { key: 'lifeStyle', title: LanguageKeys.lifeStyle },
  { key: 'futurePlan', title: LanguageKeys.futurePlans },
  { key: 'familyBackground', title: LanguageKeys.familyBackground },
  {
    key: 'personalityRequirements',
    title: LanguageKeys.personalityRequirements,
  },
];

type Phase = 'loading' | 'question' | 'checkpoint' | 'done';

const OnboardingProfile = ({ navigation }: any) => {
  const { currentUser, updateCurrentUser } = useGlobalContext();
  const { setData, storageKeys } = StorageManager;
  const gender = (currentUser as any)?.gender;

  const [phase, setPhase] = useState<Phase>('loading');
  const [groupIndex, setGroupIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [categoriesData, setCategoriesData] = useState<Record<string, any[]>>(
    {}
  );
  const [lastRewardChats, setLastRewardChats] = useState(0);

  // Onboarding runs before the home screen populates the ATTRIBUTE cache, so
  // fetch it here and hydrate every group up front.
  useEffect(() => {
    let alive = true;
    ApiServices.getAttribute()
      .then((attribute: any) => {
        if (!alive) return;
        const detail = (currentUser as any)?.detail ?? {};
        const hydrated: Record<string, any[]> = {};
        GROUP_SEQUENCE.forEach(({ key }) => {
          hydrated[key] = hydrateGroupFields(
            Data[key] ?? [],
            attribute ?? {},
            detail
          );
        });
        setCategoriesData(hydrated);
        setPhase('question');
      })
      .catch(() => {
        if (!alive) return;
        // Options-less questions (input/scalling/binary) still work without the cache.
        const detail = (currentUser as any)?.detail ?? {};
        const hydrated: Record<string, any[]> = {};
        GROUP_SEQUENCE.forEach(({ key }) => {
          hydrated[key] = hydrateGroupFields(Data[key] ?? [], {}, detail);
        });
        setCategoriesData(hydrated);
        setPhase('question');
      });
    return () => {
      alive = false;
    };
  }, [currentUser, storageKeys.ATTRIBUTE]);

  const strengthPct = useMemo(
    () =>
      computeCompletion({
        categoriesData,
        interests: [],
        tagline: (currentUser as any)?.detail?.tagline,
        gender,
      }),
    [categoriesData, currentUser, gender]
  );

  const goToProfilePicture = useCallback(() => {
    navigation.reset({ index: 0, routes: [{ name: 'ProfilePicture' }] });
  }, [navigation]);

  const currentGroup = GROUP_SEQUENCE[groupIndex];
  const isLastGroup = groupIndex >= GROUP_SEQUENCE.length - 1;

  const onGroupComplete = useCallback(
    (formData: any[]) => {
      setSaving(true);
      // Persist this group and reflect the saved values in the meter.
      setCategoriesData((prev) => ({ ...prev, [currentGroup.key]: formData }));
      updateDetails(formData)
        .then(async (res: any) => {
          const reward = res?.reward;
          if (reward && reward.awarded > 0) {
            const chats = Math.round(
              reward.awarded / (reward.multiplier || 50)
            );
            setLastRewardChats(chats);
          } else {
            setLastRewardChats(0);
          }
          if (res?.detail) {
            const updatedUser = { ...(currentUser as any), detail: res.detail };
            if (reward && typeof reward.new_balance === 'number') {
              updatedUser.chat_credits = reward.new_balance;
            }
            await setData(storageKeys.USER, updatedUser);
            updateCurrentUser(updatedUser);
          }
          setSaving(false);
          setPhase('checkpoint');
        })
        .catch(() => setSaving(false));
    },
    [
      currentGroup.key,
      currentUser,
      setData,
      storageKeys.USER,
      updateCurrentUser,
    ]
  );

  const onContinueFromCheckpoint = useCallback(() => {
    if (isLastGroup) {
      setPhase('done');
      return;
    }
    setGroupIndex((i) => i + 1);
    setPhase('question');
  }, [isLastGroup]);

  if (phase === 'loading') {
    return (
      <Container style={Styles.screen}>
        <View style={Styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      </Container>
    );
  }

  if (phase === 'done') {
    return (
      <Container style={Styles.screen}>
        <View style={Styles.center}>
          <View style={Styles.doneBadge}>
            <Ionicons name="checkmark" size={wp(9)} color={Colors.color2} />
          </View>
          <Text variant="display" style={Styles.doneTitle}>
            {LanguageKeys.onboardingDoneTitle}
          </Text>
          <Text style={Styles.doneBody}>{LanguageKeys.onboardingDoneBody}</Text>
        </View>
        <View style={Styles.footer}>
          <Button text={LanguageKeys.continue} onPress={goToProfilePicture} />
        </View>
      </Container>
    );
  }

  return (
    <Container style={Styles.screen}>
      <View style={Styles.header}>
        <View style={Styles.headerRow}>
          <Text style={Styles.groupLabel}>
            {`${LanguageKeys.group} ${groupIndex + 1}/${GROUP_SEQUENCE.length}`}
          </Text>
          <Text style={Styles.strengthLabel}>{`${strengthPct}%`}</Text>
        </View>
        <View style={Styles.meterTrack}>
          <View style={[Styles.meterFill, { width: `${strengthPct}%` }]} />
        </View>
        <Text style={Styles.groupTitle}>{currentGroup.title}</Text>
      </View>

      {phase === 'question' ? (
        <ProfileQuestionWizard
          key={currentGroup.key}
          fields={categoriesData[currentGroup.key] ?? []}
          gender={gender}
          saving={saving}
          finalLabel={LanguageKeys.continue}
          showSkip={false}
          onComplete={onGroupComplete}
        />
      ) : (
        <>
          <View style={Styles.checkpointBody}>
            <View style={Styles.checkpointCard}>
              {lastRewardChats > 0 ? (
                <View style={Styles.rewardChip}>
                  <Ionicons
                    name="chatbubbles"
                    size={wp(5)}
                    color={Colors.verified}
                  />
                  <Text style={Styles.rewardText}>
                    {`${LanguageKeys.youEarned} +${lastRewardChats} ${LanguageKeys.chatCredits}`}
                  </Text>
                </View>
              ) : null}
              <Text style={Styles.checkpointStrength}>{`${strengthPct}%`}</Text>
              <Text style={Styles.checkpointHint}>
                {LanguageKeys.matchQualityHint}
              </Text>
            </View>
          </View>
          <View style={Styles.footer}>
            <Button
              text={LanguageKeys.continue}
              onPress={onContinueFromCheckpoint}
            />
            <Ripple style={Styles.finishLaterBtn} onPress={goToProfilePicture}>
              <Text style={Styles.finishLaterText}>
                {LanguageKeys.finishLater}
              </Text>
            </Ripple>
          </View>
        </>
      )}
    </Container>
  );
};

export default OnboardingProfile;

const Styles = StyleSheet.create({
  screen: { backgroundColor: Colors.appBg, flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(8),
  },
  header: { paddingHorizontal: wp(4), paddingTop: hp(2), paddingBottom: hp(1) },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupLabel: {
    color: Colors.primaryMid,
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small1,
  },
  strengthLabel: {
    color: Colors.primary,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.small1,
  },
  meterTrack: {
    height: hp(0.9),
    borderRadius: hp(0.45),
    backgroundColor: Colors.lavender,
    overflow: 'hidden',
    marginTop: hp(1),
  },
  meterFill: {
    height: '100%',
    borderRadius: hp(0.45),
    backgroundColor: Colors.primary,
  },
  groupTitle: {
    color: Colors.ink,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.medium1,
    marginTop: hp(1.5),
  },
  checkpointBody: { flex: 1, paddingHorizontal: wp(4), paddingTop: hp(2) },
  checkpointCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 16,
    padding: wp(5),
    alignItems: 'center',
  },
  rewardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    backgroundColor: 'rgba(46,158,91,0.12)',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    borderRadius: 999,
    marginBottom: hp(2),
  },
  rewardText: {
    color: Colors.verified,
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small2,
  },
  checkpointStrength: {
    color: Colors.primary,
    fontFamily: Fonts.APPFONT_B,
    fontSize: wp(11),
  },
  checkpointHint: {
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    textAlign: 'center',
    marginTop: hp(1),
  },
  footer: {
    paddingHorizontal: wp(4),
    paddingTop: hp(1.5),
    paddingBottom: hp(2),
  },
  finishLaterBtn: {
    alignSelf: 'center',
    paddingVertical: hp(1.4),
    paddingHorizontal: wp(6),
  },
  finishLaterText: {
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small2,
  },
  doneBadge: {
    width: wp(18),
    height: wp(18),
    borderRadius: wp(9),
    backgroundColor: Colors.verified,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(2),
  },
  doneTitle: {
    color: Colors.ink,
    fontSize: Typography.large2,
    textAlign: 'center',
    alignSelf: 'center',
  },
  doneBody: {
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    textAlign: 'center',
    alignSelf: 'center',
    marginTop: hp(1),
  },
});
```

- [ ] **Step 2: Barrel + folder index**

Create `src/screens/onboardingProfile/index.tsx`:

```tsx
export { default as OnboardingProfile } from './OnboardingProfile';
```

In `src/screens/index.tsx`, add in alphabetical position (between `./notifications` and `./otp`):

```tsx
export * from './onboardingProfile';
```

- [ ] **Step 3: Register the route**

In `src/navigation/RootNavigation.tsx`, add `OnboardingProfile` to the `from '../screens'` import block (alphabetical, near `Otp`/`ProfilePicture`), then add the screen right after the `UserInput` registration (line ~151):

```tsx
          <Stack.Screen name="UserInput" component={UserInput} />
          <Stack.Screen name="OnboardingProfile" component={OnboardingProfile} />
```

- [ ] **Step 4: Point `UserInput` at `OnboardingProfile`**

In `src/screens/userInput/UserInput.tsx`, inside `onContinuePress`'s success callback, change the signup-path navigation (the `if (!fromSettings)` block) from resetting to `ProfilePicture` to resetting to `OnboardingProfile`:

```tsx
if (!fromSettings) {
  props.navigation.reset({
    index: 0,
    routes: [{ name: 'OnboardingProfile' }],
  });
}
```

- [ ] **Step 5: Type-check + lint**

Run: `yarn type-check`
Expected: clean.
Run: `yarn lint src/screens/onboardingProfile/OnboardingProfile.tsx src/screens/userInput/UserInput.tsx src/navigation/RootNavigation.tsx src/screens/index.tsx`
Expected: no errors (run `yarn lint:fix` on them if import-order/type-import is flagged).

- [ ] **Step 6: Manual verification (the flow)**

Build and run. Complete signup to "Tell us about yourself" → Continue. Verify:

1. `OnboardingProfile` loads (spinner → first group "Appearance & health"), header shows "Group 1/6" + a strength meter.
2. Answer through the group; last step's primary button reads "Continue"; on tap it saves (spinner) and shows the **checkpoint** with an updated strength %, the match-quality hint, and — if the backend granted credits — a "You earned +N chat credits" chip.
3. "Continue" advances to group 2; the meter has climbed. "Finish later" jumps straight to Add photo (ProfilePicture).
4. After the 6th group's checkpoint, "Continue" shows the "You're all set" summary → Continue → ProfilePicture.
5. Dropdowns (e.g. sect, education) show options; height/weight rulers work; previously-saved values (if any) pre-fill. If the ATTRIBUTE fetch fails (airplane mode), input/binary questions still render.

- [ ] **Step 7: Commit**

```bash
git add src/screens/onboardingProfile/ src/screens/index.tsx src/navigation/RootNavigation.tsx src/screens/userInput/UserInput.tsx
git commit -m "feat(onboarding): add OnboardingProfile flow after core signup"
```

> **Phase A is shippable here.** Reward celebration degrades gracefully if the backend isn't deployed (no chip, flow works). Phases B and C are independent enhancements.

---

# Phase B — Config-gated signup paywall skip

## Task 5: Settings getter + shared paywall decision + wire the three callers

**Files:**

- Modify: `src/stores/settings-store.ts`
- Create: `src/navigation/resolve-post-signup-route.ts`
- Test: `src/navigation/resolve-post-signup-route.test.ts`
- Modify: `src/screens/otp/Otp.tsx`, `src/screens/phoneNumber/AuthWelcome.tsx`, `src/screens/welcomeUser/WelcomeUser.tsx`

**Interfaces:**

- Produces: `useSettingsStore().getSkipSignupMembershipPaywall(): boolean`; `postSignupMembershipRoute({ membershipStatus, skipPaywall, hasMembershipGift }): { name: string; params?: any }`.

Only the **paywall decision** is shared (the four resolvers' step-ordering genuinely differs and is left alone). `Location.tsx` never shows the paywall and is not touched.

- [ ] **Step 1: Write the failing test**

Create `src/navigation/resolve-post-signup-route.test.ts`:

```ts
import { postSignupMembershipRoute } from './resolve-post-signup-route';

describe('postSignupMembershipRoute', () => {
  it('returns the paywall for a non-member when skip is off', () => {
    const r = postSignupMembershipRoute({
      membershipStatus: 0,
      skipPaywall: false,
    });
    expect(r.name).toBe('ProFeaturesPromotion');
    expect(r.params).toEqual({ navigateTo: 'BottomTab', from: 'SignUp' });
  });

  it('skips straight to BottomTab for a non-member when skip is on', () => {
    const r = postSignupMembershipRoute({
      membershipStatus: 0,
      skipPaywall: true,
    });
    expect(r.name).toBe('BottomTab');
    expect(r.params).toBeUndefined();
  });

  it('skips for a null membership when skip is on', () => {
    expect(
      postSignupMembershipRoute({ membershipStatus: null, skipPaywall: true })
        .name
    ).toBe('BottomTab');
  });

  it('sends a member to the gift-congrats route when requested', () => {
    const r = postSignupMembershipRoute({
      membershipStatus: 1,
      skipPaywall: true,
      hasMembershipGift: true,
    });
    expect(r.name).toBe('GiftMembershipCongrats');
  });

  it('sends a member to BottomTab by default', () => {
    expect(
      postSignupMembershipRoute({ membershipStatus: 1, skipPaywall: false })
        .name
    ).toBe('BottomTab');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn jest resolve-post-signup-route`
Expected: FAIL — module not found.

- [ ] **Step 3: Create the helper**

Create `src/navigation/resolve-post-signup-route.ts`:

```ts
type PostSignupInput = {
  membershipStatus: number | null | undefined;
  skipPaywall: boolean;
  hasMembershipGift?: boolean;
};

type Route = { name: string; params?: { navigateTo: string; from: string } };

// The shared decision for the FINAL step of the signup chain. Non-members
// normally see the subscription paywall; when the remote flag skips it, they go
// straight to the app. Members either see the gift-congrats screen (WelcomeUser
// case) or go to BottomTab. Step-ordering (lat/long, basic-info, image) stays
// in each caller — only this membership decision is shared.
export const postSignupMembershipRoute = ({
  membershipStatus,
  skipPaywall,
  hasMembershipGift = false,
}: PostSignupInput): Route => {
  const isNonMember = membershipStatus === null || membershipStatus === 0;

  if (isNonMember) {
    if (skipPaywall) {
      return { name: 'BottomTab' };
    }
    return {
      name: 'ProFeaturesPromotion',
      params: { navigateTo: 'BottomTab', from: 'SignUp' },
    };
  }

  if (hasMembershipGift) {
    return {
      name: 'GiftMembershipCongrats',
      params: { navigateTo: 'BottomTab', from: 'SignUp' },
    };
  }

  return { name: 'BottomTab' };
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn jest resolve-post-signup-route`
Expected: PASS. (If jest is broken at the harness level, rely on `yarn type-check` + the manual check in Step 8.)

- [ ] **Step 5: Add the settings getter**

In `src/stores/settings-store.ts`: add to the `SettingsState` type (next to `getForceUpdate`):

```ts
getSkipSignupMembershipPaywall: () => boolean;
```

And implement it in the store body (next to `getForceUpdate`):

```ts
  getSkipSignupMembershipPaywall: () => {
    const state = get();
    return (
      state.getSettingByKey<boolean>('skip_signup_membership_paywall') ?? true
    );
  },
```

Note the default is `true` (skip) — matching the backend default and the design decision (absent ⇒ skip).

- [ ] **Step 6: Wire `Otp.tsx`**

In `src/screens/otp/Otp.tsx`, import the helper and settings store, then replace the paywall block in `navigateAfterLogin`. Add near the top imports:

```tsx
import { postSignupMembershipRoute } from '../../navigation/resolve-post-signup-route';
import { useSettingsStore } from '../../stores';
```

Inside the component, read the flag:

```tsx
const skipPaywall = useSettingsStore().getSkipSignupMembershipPaywall();
```

Replace the membership `if` block (the one doing `reset` to `ProFeaturesPromotion`) with:

```tsx
if (userData?.membership_status === null || userData?.membership_status === 0) {
  const route = postSignupMembershipRoute({
    membershipStatus: userData?.membership_status,
    skipPaywall,
  });
  props.navigation.reset({ index: 0, routes: [route] });
  return;
}
```

Add `skipPaywall` to `navigateAfterLogin`'s `useCallback` dependency array.

- [ ] **Step 7: Wire `AuthWelcome.tsx` and `WelcomeUser.tsx`**

In `src/screens/phoneNumber/AuthWelcome.tsx`: add the same two imports, read `const skipPaywall = useSettingsStore().getSkipSignupMembershipPaywall();` (the store hook is already used here — add the getter to the existing destructure or call it inline), and replace the membership `if` block in `navigateAfterVerification` with:

```tsx
if (user?.membership_status === null || user?.membership_status === 0) {
  const route = postSignupMembershipRoute({
    membershipStatus: user?.membership_status,
    skipPaywall,
  });
  navigation.reset({ index: 0, routes: [route] });
  return;
}
```

Add `skipPaywall` to the `navigateAfterVerification` dependency array.

In `src/screens/welcomeUser/WelcomeUser.tsx`: add the imports, read the flag, and replace the whole `onGetStartedPress` body with a single resolver call (this preserves its three-way behavior — non-member paywall/skip, member→gift, else BottomTab):

```tsx
const skipPaywall = useSettingsStore().getSkipSignupMembershipPaywall();

const onGetStartedPress = () => {
  const route = postSignupMembershipRoute({
    membershipStatus: currentUser?.membership_status,
    skipPaywall,
    hasMembershipGift: !!currentUser?.membership_status,
  });
  props.navigation.reset({ index: 0, routes: [route] });
};
```

- [ ] **Step 8: Type-check, lint, manual check**

Run: `yarn type-check` → clean. `yarn lint` on the four changed files → fix ordering with `yarn lint:fix`.
Manual: with the backend `skip_signup_membership_paywall` = true (default), finish signup as a non-member and confirm you land on the app (Home) with **no** subscription paywall. Temporarily set the setting to `false` in admin and confirm the paywall shows again. Confirm members still reach BottomTab / gift-congrats.

- [ ] **Step 9: Commit**

```bash
git add src/stores/settings-store.ts src/navigation/resolve-post-signup-route.ts src/navigation/resolve-post-signup-route.test.ts src/screens/otp/Otp.tsx src/screens/phoneNumber/AuthWelcome.tsx src/screens/welcomeUser/WelcomeUser.tsx
git commit -m "feat(onboarding): config-gated skip of signup membership paywall"
```

---

# Phase C — Motivators & re-engagement

## Task 6: Home profile-completion banner

**Files:**

- Modify: `src/screens/welcome/Welcome.tsx`

**Interfaces:**

- Consumes: `computeCompletion` from `../profile/profile-hub` OR the existing `profileCompleteProgress` state already in `Welcome.tsx`. Deep-links to `OnboardingProfile`.

A dismissible banner shown while the profile is incomplete, mirroring the existing `pendingApprovalBanner` pattern, inserted right after it (Welcome.tsx line ~687).

- [ ] **Step 1: Add dismiss state + completion flag**

In `src/screens/welcome/Welcome.tsx`, add near the other `useState`s:

```tsx
const [profileBannerDismissed, setProfileBannerDismissed] = useState(false);
```

Compute incompleteness from the existing `profileCompleteProgress` state (already maintained by `handleProfileCompleteData`):

```tsx
const profileIncomplete =
  profileCompleteProgress.length > 0 &&
  profileCompleteProgress.filter((i: any) => i.completed).length <
    profileCompleteProgress.length;
```

- [ ] **Step 2: Add the banner JSX**

Immediately after the existing `pendingApprovalBanner` block (the `{!currentUser?.is_approved && (…)}` Ripple ending at line ~687), add:

```tsx
{
  profileIncomplete && !profileBannerDismissed && (
    <Ripple
      style={[
        Styles.pendingApprovalBanner,
        { flexDirection: Rtl ? 'row-reverse' : 'row' },
      ]}
      onPress={() => navigation.navigate('OnboardingProfile', { from: 'Home' })}
    >
      <View style={Styles.pendingIconChip}>
        <Ionicons
          name="sparkles-outline"
          size={wp(4.5)}
          color={Colors.primary}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={Styles.pendingApprovalText}>
          {t(LanguageKeys.completeProfileCta)}
        </Text>
        <Text style={Styles.completeBannerSub}>
          {t(LanguageKeys.completeProfileBannerBody)}
        </Text>
      </View>
      <Ripple
        onPress={() => setProfileBannerDismissed(true)}
        style={Styles.bannerDismiss}
      >
        <Ionicons name="close" size={wp(4.5)} color={Colors.muted} />
      </Ripple>
    </Ripple>
  );
}
```

(`t`, `Rtl`, `Ionicons`, `Ripple`, `Text`, `wp`, `Colors`, `navigation` are all already imported/available in this file.)

- [ ] **Step 3: Add the two new styles**

In the Welcome `Styles` (next to `pendingApprovalText`):

```tsx
  completeBannerSub: {
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small,
    marginTop: hp(0.2),
  },
  bannerDismiss: {
    padding: wp(1.5),
  },
```

(`Fonts`, `Typography`, `hp` are already imported in Welcome.tsx; if `Fonts`/`Typography` are not, add them to the existing `../../res` / `../../global` imports.)

- [ ] **Step 4: Make `OnboardingProfile` resumable from Home**

`OnboardingProfile` already deep-links fine (it re-hydrates from `currentUser.detail`, so completed groups pre-fill and their checkpoints still recompute). One adjustment: when entered from Home (`route.params.from === 'Home'`), "Finish later" and the done screen should return Home, not reset to `ProfilePicture`. In `OnboardingProfile.tsx`, change `goToProfilePicture` to branch on the param:

```tsx
const OnboardingProfile = ({ navigation, route }: any) => {
  const fromHome = route?.params?.from === 'Home';
  ...
  const exitFlow = useCallback(() => {
    if (fromHome) {
      navigation.reset({ index: 0, routes: [{ name: 'BottomTab' }] });
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'ProfilePicture' }] });
    }
  }, [fromHome, navigation]);
```

Replace the two `goToProfilePicture` usages (checkpoint "Finish later" and the done "Continue") with `exitFlow`.

- [ ] **Step 5: Type-check, lint, manual check**

Run: `yarn type-check` → clean; `yarn lint` on `Welcome.tsx` and `OnboardingProfile.tsx` → fix ordering.
Manual: as a user with an incomplete profile, open Home → the banner shows; tapping it opens `OnboardingProfile` at group 1 with any previously-saved answers pre-filled; "Finish later" returns to Home; the ✕ dismisses the banner for the session.

- [ ] **Step 6: Commit**

```bash
git add src/screens/welcome/Welcome.tsx src/screens/onboardingProfile/OnboardingProfile.tsx
git commit -m "feat(onboarding): home banner to resume profile building"
```

---

## Task 7: Local reminder on "Finish later"

**Files:**

- Create: `src/notifications/profile-reminder.ts`
- Modify: `src/screens/onboardingProfile/OnboardingProfile.tsx`

**Interfaces:**

- Produces: `scheduleProfileReminder(delayMs?: number): Promise<void>` and `cancelProfileReminder(): Promise<void>`, using the existing notifee `'default'` channel.

- [ ] **Step 1: Create the scheduler**

Create `src/notifications/profile-reminder.ts`:

```ts
import notifee, { AndroidImportance, TriggerType } from '@notifee/react-native';
import i18next from 'i18next';

import { LanguageKeys } from '../languages';

const REMINDER_ID = 'profile-completion-reminder';
const DEFAULT_DELAY_MS = 6 * 60 * 60 * 1000; // 6 hours

// One-shot local reminder for users who bail on profile building. Uses the
// existing 'default' channel created in index.js. Safe to call repeatedly —
// the fixed id means a new schedule replaces the old one.
export const scheduleProfileReminder = async (
  delayMs: number = DEFAULT_DELAY_MS
): Promise<void> => {
  try {
    await notifee.requestPermission();
    await notifee.createTriggerNotification(
      {
        id: REMINDER_ID,
        title: i18next.t(LanguageKeys.profileReminderTitle) as string,
        body: i18next.t(LanguageKeys.profileReminderBody) as string,
        android: {
          channelId: 'default',
          importance: AndroidImportance.DEFAULT,
          pressAction: { id: 'default', launchActivity: 'default' },
          smallIcon: 'ic_launcher',
        },
      },
      { type: TriggerType.TIMESTAMP, timestamp: Date.now() + delayMs }
    );
  } catch (error) {
    console.error('Failed to schedule profile reminder:', error);
  }
};

export const cancelProfileReminder = async (): Promise<void> => {
  try {
    await notifee.cancelTriggerNotification(REMINDER_ID);
  } catch (error) {
    console.error('Failed to cancel profile reminder:', error);
  }
};
```

- [ ] **Step 2: Schedule on bail, cancel on completion**

In `src/screens/onboardingProfile/OnboardingProfile.tsx`, import the scheduler:

```tsx
import {
  cancelProfileReminder,
  scheduleProfileReminder,
} from '../../notifications/profile-reminder';
```

In `exitFlow` (Task 6, Step 4), schedule the reminder **only** when leaving with an incomplete profile — i.e. from the checkpoint "Finish later" path, not from the "done" screen. Split the two exits: keep `exitFlow` for the done screen (which also cancels any pending reminder), and add `bailFlow` for "Finish later":

```tsx
const exitFlow = useCallback(() => {
  cancelProfileReminder();
  if (fromHome) {
    navigation.reset({ index: 0, routes: [{ name: 'BottomTab' }] });
  } else {
    navigation.reset({ index: 0, routes: [{ name: 'ProfilePicture' }] });
  }
}, [fromHome, navigation]);

const bailFlow = useCallback(() => {
  scheduleProfileReminder();
  if (fromHome) {
    navigation.reset({ index: 0, routes: [{ name: 'BottomTab' }] });
  } else {
    navigation.reset({ index: 0, routes: [{ name: 'ProfilePicture' }] });
  }
}, [fromHome, navigation]);
```

Use `bailFlow` for the checkpoint "Finish later" Ripple; keep `exitFlow` for the done-screen "Continue".

- [ ] **Step 3: Type-check, lint, manual check**

Run: `yarn type-check` → clean; `yarn lint` on the two files.
Manual: reach a checkpoint, tap "Finish later", grant notification permission if prompted. (For a quick test, temporarily pass a small delay, e.g. `scheduleProfileReminder(60 * 1000)`, background the app, and confirm the reminder fires ~1 min later; revert to the default before committing.) Completing all six groups (done → Continue) cancels any pending reminder.

- [ ] **Step 4: Commit**

```bash
git add src/notifications/profile-reminder.ts src/screens/onboardingProfile/OnboardingProfile.tsx
git commit -m "feat(onboarding): local reminder to finish an abandoned profile"
```

---

## Final verification

- [ ] `yarn type-check` → clean.
- [ ] `yarn lint` → no NEW errors on touched files (repo has pre-existing warnings; don't introduce errors).
- [ ] Full manual walk: fresh signup → "Tell us about yourself" → OnboardingProfile (6 groups, checkpoints, reward chips when backend deployed, strength climbing, Finish later) → ProfilePicture → **no** signup paywall (flag on) → Home. Home banner appears for incomplete profiles and resumes the flow. ME group editing still works unchanged.

---

## Notes carried from the design spec

- **Reward display unit:** `res.reward.awarded`/`new_balance` are raw units; chats shown = `Math.round(awarded / multiplier)`. If the app's `ChatCreditsBadge` displays a different unit, reconcile the badge and this celebration to the same convention (design spec §7.2) — the value is correct; only the label unit needs confirming.
- **Strength meter caps below 100** in onboarding because interests and tagline (two of `computeCompletion`'s points) aren't collected here. That's honest ("more to add later"); leave as-is unless product wants a group-only percentage.
- **Depends on the backend plan** (`admin/docs/superpowers/plans/2026-07-10-onboarding-rewards-backend.md`) for real reward chips and the `skip_signup_membership_paywall` setting. Phase A works without it (no chips); Phase B's skip needs the setting row to exist (defaults to skip when absent).
- **Not touched:** `Location.tsx` resolver (never shows the paywall), interests/tagline/photo collection, and any ME redesign beyond the wizard extraction.
- **Deferred (spec §3.5b "complete profile" badge):** rendering a completeness badge on the user's own/visitor profile is intentionally NOT in this plan — the strength meter (in-flow), the match-quality framing, and the home banner already carry the outcome-motivator load for v1. Add the badge as a small follow-up once the flow is validated; it's a display-only change in `Profile.tsx`/`InfoCard.tsx` keyed off `computeCompletion`.
