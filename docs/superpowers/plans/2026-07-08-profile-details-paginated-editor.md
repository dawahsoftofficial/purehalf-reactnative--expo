# Profile Details Paginated Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Me profile detail group editor with a one-question-at-a-time guided flow.

**Architecture:** Keep the existing `EditProfileGroup` route and save path. Extract small pure helpers for field visibility, progress labels, option labels, and tag eligibility, then use those helpers from `EditProfileGroup.tsx` to render a single active field with Back, Skip, Next, and Save controls.

**Tech Stack:** React Native 0.82, React 19, TypeScript strict mode, Jest, existing Pure Half components (`Container`, `Header`, `Button`, `IconInput`, `PickerButton`, `Picker`, `HeightWeightPicker`).

---

## File Structure

- Create: `src/screens/profile/profile-editor-flow.ts`
  - Pure helper functions for visible-field filtering, progress labels, option keys, option labels, tag eligibility, and selected-option matching.
- Create: `src/screens/profile/profile-editor-flow.test.ts`
  - Jest tests for gender filtering, progress labels, short-option tag logic, binary option labels, and option selected matching.
- Modify: `src/screens/profile/EditProfileGroup.tsx`
  - Replace the full `FlatList` editor with a single active-question layout.
  - Reuse existing update handlers, save handler, picker behavior, and height/weight picker behavior.
- Modify: `src/languages/Keys.tsx`
  - Add plain `next`, `back`, and `skip` keys.
- Modify: `src/languages/English.json`
  - Add English translations for `next`, `back`, and `skip`.
- Modify: `src/languages/RomanUrdu.json`
  - Add Roman Urdu translations for `next`, `back`, and `skip`.
- Modify: `src/languages/Urdu.json`
  - Add Urdu translations for `next`, `back`, and `skip`. Existing Urdu files already use `"not available"` for some missing strings; use real labels here because these buttons are visible in a primary flow.

---

### Task 1: Add Tested Profile Editor Flow Helpers

**Files:**

- Create: `src/screens/profile/profile-editor-flow.ts`
- Create: `src/screens/profile/profile-editor-flow.test.ts`

- [ ] **Step 1: Write the failing helper tests**

Create `src/screens/profile/profile-editor-flow.test.ts`:

```ts
import {
  getOptionKey,
  getOptionLabel,
  getProgressLabel,
  getVisibleProfileFields,
  isOptionSelected,
  shouldUseTagOptions,
} from './profile-editor-flow';

const field = (overrides: Record<string, unknown>) => ({
  id: 'field-1',
  title: 'Field',
  type: 'dropDown',
  data: [],
  selected: {},
  ...overrides,
});

describe('getVisibleProfileFields', () => {
  it('hides beard for female users', () => {
    const fields = [field({ id: 'doYouHaveABeard' }), field({ id: 'sect-0' })];

    expect(
      getVisibleProfileFields(fields, 'female').map((item) => item.id)
    ).toEqual(['sect-0']);
  });

  it('hides hijab for male users', () => {
    const fields = [field({ id: 'hijab-0' }), field({ id: 'sect-0' })];

    expect(
      getVisibleProfileFields(fields, 'male').map((item) => item.id)
    ).toEqual(['sect-0']);
  });

  it('treats missing gender as male for existing behavior compatibility', () => {
    const fields = [field({ id: 'hijab-0' }), field({ id: 'doYouHaveABeard' })];

    expect(getVisibleProfileFields(fields).map((item) => item.id)).toEqual([
      'doYouHaveABeard',
    ]);
  });
});

describe('getProgressLabel', () => {
  it('formats the group title and one-based progress', () => {
    expect(getProgressLabel('Lifestyle', 0, 11)).toBe('Lifestyle - 1 of 11');
  });

  it('keeps progress inside range', () => {
    expect(getProgressLabel('Lifestyle', 20, 11)).toBe('Lifestyle - 11 of 11');
  });
});

describe('option helpers', () => {
  it('uses binary option id as the visible label', () => {
    const item = field({ type: 'dropDownBinary' });
    expect(getOptionLabel(item, { id: 'Yes', value: 1 })).toBe('Yes');
  });

  it('uses dropdown option value as the visible label', () => {
    const item = field({ type: 'dropDown' });
    expect(getOptionLabel(item, { id: 5, value: 'Masters' })).toBe('Masters');
  });

  it('builds stable option keys from id and value', () => {
    expect(getOptionKey({ id: 'Yes', value: 1 })).toBe('Yes-1');
  });

  it('matches binary selected value', () => {
    const item = field({
      type: 'dropDownBinary',
      selected: { id: 'No', value: 0 },
    });
    expect(isOptionSelected(item, { id: 'No', value: 0 })).toBe(true);
  });

  it('matches dropdown selected id', () => {
    const item = field({
      type: 'dropDown',
      selected: { id: 4, value: 'Engineer' },
    });
    expect(isOptionSelected(item, { id: 4, value: 'Engineer' })).toBe(true);
  });

  it('uses tags for binary fields', () => {
    const item = field({
      type: 'dropDownBinary',
      data: [
        { id: 'Yes', value: 1 },
        { id: 'No', value: 0 },
      ],
    });

    expect(shouldUseTagOptions(item, item.data)).toBe(true);
  });

  it('uses tags for dropdown fields with two to five local options', () => {
    const item = field({
      type: 'dropDown',
      data: [
        { id: 1, value: 'A' },
        { id: 2, value: 'B' },
        { id: 3, value: 'C' },
      ],
    });

    expect(shouldUseTagOptions(item, item.data)).toBe(true);
  });

  it('does not use tags for larger dropdown fields', () => {
    const item = field({
      type: 'dropDown',
      data: [
        { id: 1, value: 'A' },
        { id: 2, value: 'B' },
        { id: 3, value: 'C' },
        { id: 4, value: 'D' },
        { id: 5, value: 'E' },
        { id: 6, value: 'F' },
      ],
    });

    expect(shouldUseTagOptions(item, item.data)).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm test -- src/screens/profile/profile-editor-flow.test.ts --runInBand
```

Expected: FAIL because `src/screens/profile/profile-editor-flow.ts` does not exist.

- [ ] **Step 3: Implement the helpers**

Create `src/screens/profile/profile-editor-flow.ts`:

```ts
/* eslint-disable @typescript-eslint/no-explicit-any */

export type ProfileEditorField = {
  id?: string;
  title?: string;
  type?: string;
  data?: any[];
  selected?: any;
};

export const isFieldHiddenForGender = (
  item: ProfileEditorField,
  gender?: string
) => {
  const isMale = gender !== 'female';
  return (
    (item?.id === 'doYouHaveABeard' && !isMale) ||
    (item?.id === 'hijab-0' && isMale)
  );
};

export const getVisibleProfileFields = (
  fields: ProfileEditorField[] = [],
  gender?: string
) => fields.filter((item) => !isFieldHiddenForGender(item, gender));

export const getProgressLabel = (
  title: string,
  activeIndex: number,
  total: number
) => {
  const safeTotal = Math.max(total, 0);
  const safeIndex = safeTotal
    ? Math.min(Math.max(activeIndex, 0), safeTotal - 1)
    : 0;
  return `${title} - ${safeTotal ? safeIndex + 1 : 0} of ${safeTotal}`;
};

export const getOptionKey = (option: any) =>
  `${String(option?.id ?? '')}-${String(option?.value ?? '')}`;

export const getOptionLabel = (item: ProfileEditorField, option: any) => {
  const label = item?.type === 'dropDownBinary' ? option?.id : option?.value;
  if (label === null || label === undefined) return '';
  return String(label);
};

export const isOptionSelected = (item: ProfileEditorField, option: any) =>
  item?.type === 'dropDownBinary'
    ? item?.selected?.value === option?.value
    : item?.selected?.id === option?.id;

export const shouldUseTagOptions = (
  item: ProfileEditorField,
  options: any[] = []
) => {
  if (item?.type === 'dropDownBinary') return options.length >= 2;
  return (
    item?.type === 'dropDown' && options.length >= 2 && options.length <= 5
  );
};
```

- [ ] **Step 4: Run helper tests to verify they pass**

Run:

```bash
npm test -- src/screens/profile/profile-editor-flow.test.ts --runInBand
```

Expected: PASS.

- [ ] **Step 5: Commit helper work**

Run:

```bash
git add src/screens/profile/profile-editor-flow.ts src/screens/profile/profile-editor-flow.test.ts
git commit -m "test(app): cover profile editor flow helpers"
```

Expected: commit succeeds.

---

### Task 2: Convert `EditProfileGroup` to One-Question Flow

**Files:**

- Modify: `src/screens/profile/EditProfileGroup.tsx`

- [ ] **Step 1: Update imports**

In `src/screens/profile/EditProfileGroup.tsx`, replace:

```ts
import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
```

with:

```ts
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
```

Add helper imports after the service/function imports:

```ts
import {
  getOptionKey,
  getOptionLabel,
  getProgressLabel,
  getVisibleProfileFields,
  isOptionSelected,
  shouldUseTagOptions,
} from './profile-editor-flow';
```

Remove the local `isOptionSelected` function because the helper now provides it.

- [ ] **Step 2: Add active-step state and visible fields**

Inside `EditProfileGroup`, after `formData` state, add:

```ts
const [activeIndex, setActiveIndex] = useState(0);
```

After picker state declarations, add:

```ts
const visibleFields = useMemo(
  () => getVisibleProfileFields(formData, currentUser?.gender),
  [currentUser?.gender, formData]
);

const activeItem = visibleFields[activeIndex];
const progressLabel = getProgressLabel(
  title,
  activeIndex,
  visibleFields.length
);
const isFirstStep = activeIndex === 0;
const isLastStep =
  visibleFields.length > 0 && activeIndex === visibleFields.length - 1;
```

Add this effect after those constants:

```ts
useEffect(() => {
  if (activeIndex > 0 && activeIndex >= visibleFields.length) {
    setActiveIndex(Math.max(visibleFields.length - 1, 0));
  }
}, [activeIndex, visibleFields.length]);
```

- [ ] **Step 3: Add step navigation handlers**

After the existing `onSavePress` callback, add:

```ts
const goBackStep = useCallback(() => {
  setActiveIndex((prev) => Math.max(prev - 1, 0));
}, []);

const goNextStep = useCallback(() => {
  setActiveIndex((prev) => Math.min(prev + 1, visibleFields.length - 1));
}, [visibleFields.length]);

const onPrimaryPress = useCallback(() => {
  if (isLastStep) {
    void onSavePress();
    return;
  }
  goNextStep();
}, [goNextStep, isLastStep, onSavePress]);

const onSkipPress = useCallback(() => {
  if (isLastStep) {
    void onSavePress();
    return;
  }
  goNextStep();
}, [goNextStep, isLastStep, onSavePress]);
```

- [ ] **Step 4: Update `OptionTags` to use helper labels**

Replace the option label/key block inside `OptionTags`:

```ts
const on = isOptionSelected(item, opt);
const optLabel = item?.type === 'dropDownBinary' ? opt?.id : opt?.value;
return (
  <Ripple
    key={`${opt?.id}-${opt?.value}`}
    onPress={() => onSelect(item, opt)}
    style={[Styles.tag, on && Styles.tagOn]}
  >
    <Text style={[Styles.tagTxt, on && Styles.tagTxtOn]}>
      {String(optLabel)}
    </Text>
  </Ripple>
);
```

with:

```ts
const on = isOptionSelected(item, opt);
const optLabel = getOptionLabel(item, opt);
return (
  <Ripple
    key={getOptionKey(opt)}
    onPress={() => onSelect(item, opt)}
    style={[Styles.tag, on && Styles.tagOn]}
  >
    <Text style={[Styles.tagTxt, on && Styles.tagTxtOn]}>{optLabel}</Text>
  </Ripple>
);
```

- [ ] **Step 5: Replace `renderItem` with `renderActiveControl`**

Replace the entire `renderItem` callback with:

```ts
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
    const { value } = selected;

    let tagOptions: any[] =
      (type === 'dropDown' || type === 'dropDownBinary') && Array.isArray(iData)
        ? iData
        : [];
    if (currentUser?.gender === 'male' && id === 'martial-0') {
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
              label={iTitle}
              placeholder={placeholder}
              inputStyle={Styles.input}
              value={
                focusedInput.activeInputId === id ? focusedInput.value : value
              }
              onChangeText={onChangeInput}
              onFocus={onInputFocus.bind(null, id, value, item)}
              onBlur={onBlurInput}
            />
          ) : type === 'scalling' ? (
            <ScallingButton item={item} />
          ) : useTags ? (
            <OptionTags
              label={iTitle}
              item={item}
              options={tagOptions}
              onSelect={onSelectOption}
              rtl={Rtl}
            />
          ) : (
            <PickerButton
              outerLabel={iTitle}
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
            />
          )}
        </View>
      </View>
    );
  },
  [
    Rtl,
    ScallingButton,
    activeIndex,
    currentUser?.gender,
    focusedInput,
    onBlurInput,
    onChangeInput,
    onInputFocus,
    onSelectOption,
    openPicker,
    progressLabel,
    visibleFields.length,
  ]
);
```

- [ ] **Step 6: Replace the `FlatList` JSX**

Replace:

```tsx
<FlatList
  data={formData}
  renderItem={renderItem}
  keyExtractor={(item: any, index: number) => `${item?.id ?? index}`}
  contentContainerStyle={Styles.listContent}
  showsVerticalScrollIndicator={false}
  keyboardDismissMode="none"
  keyboardShouldPersistTaps="handled"
/>
```

with:

```tsx
<View style={Styles.content}>
  {visibleFields.length > 0 ? (
    renderActiveControl(activeItem)
  ) : (
    <View style={Styles.emptyCard}>
      <Text style={Styles.emptyText}>{LanguageKeys.notYetProvided}</Text>
    </View>
  )}
</View>
```

- [ ] **Step 7: Replace the footer actions**

Replace the existing footer `Button`:

```tsx
<Button
  text={LanguageKeys.update}
  onPress={updateLoader ? undefined : onSavePress}
  disabled={updateLoader}
  loading={updateLoader}
  loadingMessage={LanguageKeys.updating}
/>
```

with:

```tsx
<View style={Styles.footerRow}>
  {!isFirstStep ? (
    <Ripple
      onPress={updateLoader ? undefined : goBackStep}
      style={[Styles.secondaryBtn, updateLoader && Styles.disabledBtn]}
      disabled={updateLoader}
    >
      <Text style={Styles.secondaryBtnText}>{LanguageKeys.back}</Text>
    </Ripple>
  ) : null}
  <Ripple
    onPress={
      updateLoader || visibleFields.length === 0 ? undefined : onSkipPress
    }
    style={[
      Styles.secondaryBtn,
      (updateLoader || visibleFields.length === 0) && Styles.disabledBtn,
    ]}
    disabled={updateLoader || visibleFields.length === 0}
  >
    <Text style={Styles.secondaryBtnText}>{LanguageKeys.skip}</Text>
  </Ripple>
  <View style={Styles.primaryBtnWrap}>
    <Button
      text={isLastStep ? LanguageKeys.update : LanguageKeys.next}
      onPress={
        updateLoader || visibleFields.length === 0 ? undefined : onPrimaryPress
      }
      disabled={updateLoader || visibleFields.length === 0}
      loading={updateLoader}
      loadingMessage={LanguageKeys.updating}
    />
  </View>
</View>
```

On the last step, Skip leaves that field unchanged and saves the group, while the primary button saves after any current selection/input has already been written to `formData`.

- [ ] **Step 8: Replace list styles with flow styles**

In the stylesheet, remove `listContent` and `itemContainer`. Keep `input`, `scallingRow`, tag styles, and footer base. Add:

```ts
content: {
  flex: 1,
  paddingHorizontal: wp(4),
  paddingTop: hp(2),
},
questionCard: {
  backgroundColor: Colors.surface,
  borderWidth: 1,
  borderColor: Colors.hairline,
  borderRadius: 16,
  paddingHorizontal: wp(4),
  paddingVertical: hp(2.2),
},
questionEyebrow: {
  color: Colors.primary,
  fontFamily: Fonts.APPFONT_SB,
  fontSize: Typography.small1,
},
progressTrack: {
  height: 8,
  borderRadius: 4,
  backgroundColor: Colors.lavender,
  overflow: 'hidden',
  marginTop: hp(1),
  marginBottom: hp(2),
},
progressFill: {
  height: '100%',
  borderRadius: 4,
  backgroundColor: Colors.primary,
},
questionTitle: {
  color: Colors.ink,
  fontFamily: Fonts.APPFONT_B,
  fontSize: Typography.small4,
  lineHeight: wp(6.2),
},
controlWrap: {
  marginTop: hp(2),
},
emptyCard: {
  backgroundColor: Colors.surface,
  borderWidth: 1,
  borderColor: Colors.hairline,
  borderRadius: 16,
  padding: wp(5),
  alignItems: 'center',
},
emptyText: {
  color: Colors.muted,
  fontFamily: Fonts.APPFONT_M,
  fontSize: Typography.small2,
},
footerRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: wp(2),
},
secondaryBtn: {
  minHeight: hp(5.5),
  paddingHorizontal: wp(4),
  borderRadius: 999,
  backgroundColor: Colors.lavender,
  alignItems: 'center',
  justifyContent: 'center',
},
secondaryBtnText: {
  color: Colors.primary,
  fontFamily: Fonts.APPFONT_SB,
  fontSize: Typography.small2,
},
disabledBtn: {
  opacity: 0.45,
},
primaryBtnWrap: {
  flex: 1,
},
```

- [ ] **Step 9: Run type-check**

Run:

```bash
npm run type-check
```

Expected: PASS.

- [ ] **Step 10: Run helper tests**

Run:

```bash
npm test -- src/screens/profile/profile-editor-flow.test.ts --runInBand
```

Expected: PASS.

- [ ] **Step 11: Commit editor conversion**

Run:

```bash
git add src/screens/profile/EditProfileGroup.tsx
git commit -m "feat(app): paginate profile detail editor"
```

Expected: commit succeeds.

---

### Task 3: Add Language Keys and Verify the Full Change

**Files:**

- Modify: `src/languages/Keys.tsx`
- Modify: `src/languages/English.json`
- Modify: `src/languages/RomanUrdu.json`
- Modify: `src/languages/Urdu.json`

- [ ] **Step 1: Add keys to `Keys.tsx`**

In `src/languages/Keys.tsx`, near the existing action keys (`save`, `continue`, `skipForNow`, `goBack`), add:

```ts
next: 'next',
back: 'back',
skip: 'skip',
```

- [ ] **Step 2: Add English labels**

In `src/languages/English.json`, add:

```json
"next": "Next",
"back": "Back",
"skip": "Skip"
```

Place them near `"continue"`, `"save"`, or `"skipForNow"` and keep valid JSON commas.

- [ ] **Step 3: Add Roman Urdu labels**

In `src/languages/RomanUrdu.json`, add:

```json
"next": "Agla",
"back": "Wapas",
"skip": "Skip"
```

Place them near `"continue"`, `"save"`, or `"skipForNow"` and keep valid JSON commas.

- [ ] **Step 4: Add Urdu labels**

In `src/languages/Urdu.json`, add:

```json
"next": "اگلا",
"back": "واپس",
"skip": "چھوڑ دیں"
```

Place them near `"continue"`, `"save"`, or `"skipForNow"` and keep valid JSON commas.

- [ ] **Step 5: Run focused tests**

Run:

```bash
npm test -- src/screens/profile/profile-editor-flow.test.ts --runInBand
```

Expected: PASS.

- [ ] **Step 6: Run type-check**

Run:

```bash
npm run type-check
```

Expected: PASS.

- [ ] **Step 7: Run lint on touched TypeScript files**

Run:

```bash
npx eslint src/screens/profile/EditProfileGroup.tsx src/screens/profile/profile-editor-flow.ts src/screens/profile/profile-editor-flow.test.ts src/languages/Keys.tsx
```

Expected: PASS.

- [ ] **Step 8: Manual app verification**

Start Metro:

```bash
npm start
```

In a simulator/device, verify:

- Open Me > Profile details > Lifestyle.
- Confirm the screen shows `Lifestyle - 1 of 11`.
- Select a tag answer and press `Next`.
- Press `Back` and confirm the selected tag remains selected.
- Press `Skip` and confirm it advances without changing the field.
- Open a long dropdown field and confirm the existing picker opens.
- Open height/weight and confirm the existing height/weight picker opens.
- Reach the last step and confirm the primary button says `Update`.
- Save and confirm the Me hub preview/count updates after returning.
- With a male user, confirm hijab does not appear and marital status excludes `Widowed`.
- With a female user, confirm beard does not appear.
- Open another user's profile and confirm the read-only cards remain unchanged.

- [ ] **Step 9: Commit language and verification changes**

Run:

```bash
git add src/languages/Keys.tsx src/languages/English.json src/languages/RomanUrdu.json src/languages/Urdu.json
git commit -m "chore(app): add profile editor navigation labels"
```

Expected: commit succeeds.

---

## Final Verification

- [ ] Run all app checks:

```bash
npm run check-all
```

Expected: lint, type-check, and Jest all pass.

- [ ] Confirm working tree is clean:

```bash
git status --short
```

Expected: no output.
