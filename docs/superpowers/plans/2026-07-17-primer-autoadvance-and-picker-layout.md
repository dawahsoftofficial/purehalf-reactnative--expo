# Primer Auto-Advance + Picker Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the primer's single-choice questions self-advance with a visible selection highlight and no tick, and fix the shared Picker's vertical alignment, corner radius, and row height.

**Architecture:** Part A adds one pure predicate (`isAutoAdvance`) to `primer-logic.ts` that both `step-control.tsx` (how to render/behave) and `SignupPrimer.tsx` (whether to show Continue) read, so the rule lives in exactly one place. The 200ms pause is owned by `SignupPrimer` — `StepControl` stays a dumb renderer that just calls `onAdvance`. Part B is confined to `Picker.tsx` styles plus a modal-container restructure; no consumer changes.

**Tech Stack:** React Native 0.82, React 19.1, TypeScript, Jest (pure-TS suites only — RN component tests are broken in this repo).

**Spec:** `docs/superpowers/specs/2026-07-17-primer-autoadvance-and-picker-layout-design.md`

## Global Constraints

- **Worktree:** `D:/GitHub/Pure-Half-worktrees/app-primer-picker-fixes`, branch `fix/primer-autoadvance-and-picker-layout` (off `staging`). `node_modules` is a junction to the main checkout — do not run `yarn install` here.
- **Never merge to `main`.** This branch targets `staging` only.
- **`import/no-cycle` is an ESLint error.** `primer-types.ts` imports `PrimerAnswers` from `primer-logic.ts`, so `primer-logic.ts` must **never** import from `primer-types.ts`. Use local structural types instead.
- **Do not modify `src/components/Text.tsx`.** Its injected `alignSelf` is load-bearing for RTL across ~35 screens. Override it at the call site only.
- **Do not add or extend guardian code** (standing removal decision, root `CLAUDE.md`).
- **Commit style:** Conventional Commits (commitlint is wired). End every commit message with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- **Do not run native builds** (`yarn android` / `yarn ios`). Static checks only; on-device checks belong to the user.
- **Verification commands:** `npx jest <path>`, `yarn type-check`, `yarn lint`.
- **Delay value:** 200ms, named constant `HIGHLIGHT_PAUSE_MS`.
- **Row height:** flat `48` px, named constant `ROW_MIN_HEIGHT`. Deliberate deviation from the repo's `wp()`/`hp()` convention — touch targets must not scale with screen height.
- **Sheet cap:** `maxHeight: '80%'`.

---

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `src/screens/signupPrimer/primer-logic.ts` | Add `AutoAdvanceStep` type + `isAutoAdvance` predicate | 1 |
| `src/screens/signupPrimer/primer-logic.test.ts` | Unit tests for the predicate | 1 |
| `src/screens/signupPrimer/components/step-control.tsx` | `Row` tick opt-out; auto-advance wiring for `single`/`status`/`deen` | 2 |
| `src/screens/signupPrimer/SignupPrimer.tsx` | 200ms pause, fresh-answers ref, footer visibility | 3 |
| `src/components/pickers/Picker.tsx` | Alignment + row height (Task 4); bottom-sheet container (Task 5) | 4, 5 |

Tasks 1→2→3 are sequential (2 and 3 consume Task 1's export). Tasks 4→5 are sequential and independent of Part A.

---

### Task 1: `isAutoAdvance` predicate

**Files:**
- Modify: `src/screens/signupPrimer/primer-logic.ts` (append after `shouldShowPrimer`, ~line 24)
- Test: `src/screens/signupPrimer/primer-logic.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `export type AutoAdvanceStep = { control: string; hasPolygamy?: boolean; hasRevert?: boolean }` and `export const isAutoAdvance: (step: AutoAdvanceStep) => boolean`. Tasks 2 and 3 import `isAutoAdvance` from `./primer-logic` and `../primer-logic` respectively. `PrimerStepDef` satisfies `AutoAdvanceStep` structurally — no cast needed at call sites.

- [ ] **Step 1: Write the failing test**

Append to `src/screens/signupPrimer/primer-logic.test.ts`:

```ts
describe('isAutoAdvance', () => {
  it("'single' always self-advances", () =>
    expect(isAutoAdvance({ control: 'single' })).toBe(true));

  it("'status' self-advances without the polygamy checkbox (woman Q2)", () =>
    expect(isAutoAdvance({ control: 'status' })).toBe(true));

  it("'status' waits for Continue when the polygamy checkbox is shown (man Q1)", () =>
    expect(isAutoAdvance({ control: 'status', hasPolygamy: true })).toBe(false));

  it("'deen' self-advances without the revert checkbox (man Q3)", () =>
    expect(isAutoAdvance({ control: 'deen' })).toBe(true));

  it("'deen' waits for Continue when the revert checkbox is shown (woman Q3)", () =>
    expect(isAutoAdvance({ control: 'deen', hasRevert: true })).toBe(false));

  it('controls with extra inputs never self-advance', () => {
    expect(isAutoAdvance({ control: 'multi' })).toBe(false);
    expect(isAutoAdvance({ control: 'work' })).toBe(false);
    expect(isAutoAdvance({ control: 'sectCombo' })).toBe(false);
    expect(isAutoAdvance({ control: 'slider' })).toBe(false);
    expect(isAutoAdvance({ control: 'text' })).toBe(false);
    expect(isAutoAdvance({ control: 'traits' })).toBe(false);
    expect(isAutoAdvance({ control: 'habits' })).toBe(false);
    expect(isAutoAdvance({ control: 'casteCombo' })).toBe(false);
  });

  it('an unknown control needs Continue (safe direction)', () =>
    expect(isAutoAdvance({ control: 'something-new' })).toBe(false));
});
```

Add `isAutoAdvance` to the existing import block at the top of the file (keep it alphabetical — `simple-import-sort` is enforced):

```ts
import {
  computeProgress,
  formatMatchCount,
  isAutoAdvance,
  nextStepIndex,
  prevStepIndex,
  type PrimerStep,
  questionPosition,
  shouldShowPrimer,
} from './primer-logic';
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd "D:/GitHub/Pure-Half-worktrees/app-primer-picker-fixes" && npx jest src/screens/signupPrimer/primer-logic.test.ts`

Expected: FAIL — TypeScript/Jest reports `isAutoAdvance` is not exported from `./primer-logic`.

- [ ] **Step 3: Write minimal implementation**

In `src/screens/signupPrimer/primer-logic.ts`, insert after the `shouldShowPrimer` export (after line 24) and before `formatMatchCount`:

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd "D:/GitHub/Pure-Half-worktrees/app-primer-picker-fixes" && npx jest src/screens/signupPrimer/primer-logic.test.ts`

Expected: PASS — 21 tests (14 pre-existing + 7 new). All suites green.

- [ ] **Step 5: Type-check and lint**

Run: `cd "D:/GitHub/Pure-Half-worktrees/app-primer-picker-fixes" && yarn type-check && yarn lint src/screens/signupPrimer`

Expected: `type-check` clean. `lint` reports no **errors** on these files (the repo has pre-existing warnings elsewhere; new errors are a failure).

- [ ] **Step 6: Commit**

```bash
cd "D:/GitHub/Pure-Half-worktrees/app-primer-picker-fixes"
git add src/screens/signupPrimer/primer-logic.ts src/screens/signupPrimer/primer-logic.test.ts
git commit -m "feat(primer): add isAutoAdvance rule for single-choice steps

Derives auto-advance from the step definition: 'single' always, 'status'
without the polygamy checkbox (woman Q2), 'deen' without the revert
checkbox (man Q3). Those checkboxes are what disqualify a step — you
can't tick a box on a screen that's leaving — so deriving means a later
checkbox addition disables auto-advance on its own.

Typed structurally to avoid a primer-logic <-> primer-types cycle.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Tick opt-out + auto-advance wiring in StepControl

**Files:**
- Modify: `src/screens/signupPrimer/components/step-control.tsx` (`Row` ~63-78; `single` ~97-112; `status` ~187-214; `deen` ~273-298)

**Interfaces:**
- Consumes: `isAutoAdvance` from `../primer-logic` (Task 1).
- Produces: no new exports. `StepControl`'s props are unchanged — `onAdvance` keeps its existing meaning ("move on now"). The 200ms pause is Task 3's job, not this file's.

**Context:** `Row` renders a `Radio` (circle tick) or `Square` (checkbox tick). `Styles.rowTxt` has `flex: 1`, so removing the tick leaves the label filling the row — no layout change needed. `Styles.rowOn` (primary border + lavender fill) is what signals selection once the tick is gone; `Chip` already relies on that alone.

- [ ] **Step 1: Add the `isAutoAdvance` import**

In `src/screens/signupPrimer/components/step-control.tsx`, add to the existing import block (after the `journeys` import, keeping sort order):

```ts
import { isAutoAdvance } from '../primer-logic';
```

- [ ] **Step 2: Give `Row` a tick opt-out**

Replace the `Row` component (lines ~63-78) with:

```tsx
const Row = ({
  label,
  on,
  square,
  tick = true,
  onPress,
}: {
  label: string;
  on: boolean;
  square?: boolean;
  // Auto-advancing rows hide the tick: a tick reads as "confirm this", which is
  // wrong for a row that leaves the screen on tap. rowOn carries the selection.
  tick?: boolean;
  onPress: () => void;
}) => (
  <Ripple onPress={onPress} style={[Styles.row, on && Styles.rowOn]}>
    <RNText style={Styles.rowTxt}>{label}</RNText>
    {tick ? square ? <Square on={on} /> : <Radio on={on} /> : null}
  </Ripple>
);
```

- [ ] **Step 3: Drop the tick from the `single` case**

Replace the `case 'single':` block (lines ~97-112) with:

```tsx
    case 'single':
      return (
        <View style={Styles.list}>
          {opts.map((op) => (
            <Row
              key={op.id}
              label={op.label}
              on={value === op.id}
              tick={false}
              onPress={() => {
                onChange(op.id);
                onAdvance();
              }}
            />
          ))}
        </View>
      );
```

- [ ] **Step 4: Wire the `status` case**

Replace the `case 'status': {` block (lines ~187-214) with:

```tsx
    case 'status': {
      const v = value ?? {};
      const auto = isAutoAdvance(step);
      return (
        <View style={Styles.list}>
          {opts.map((op) => (
            <Row
              key={op.id}
              label={op.label}
              on={v.status === op.id}
              tick={!auto}
              onPress={() => {
                onChange({ ...v, status: op.id });
                if (auto) onAdvance();
              }}
            />
          ))}
          {step.hasPolygamy ? (
            <Ripple
              style={[
                Styles.row,
                Styles.advancedRow,
                v.polygamy && Styles.rowOn,
              ]}
              onPress={() => onChange({ ...v, polygamy: !v.polygamy })}
            >
              <RNText style={Styles.rowTxt}>{SECOND_MARRIAGE_LABEL}</RNText>
              <Square on={!!v.polygamy} />
            </Ripple>
          ) : null}
        </View>
      );
    }
```

Note `auto` and `step.hasPolygamy` are mutually exclusive by construction, so the polygamy branch is unreachable when `auto` is true. It is left intact rather than restructured — the rule stays in `isAutoAdvance`, not duplicated here.

- [ ] **Step 5: Wire the `deen` case**

Replace the `case 'deen': {` block (lines ~273-298) with:

```tsx
    case 'deen': {
      const v = value ?? {};
      const auto = isAutoAdvance(step);
      return (
        <View style={Styles.list}>
          {opts.map((op) => (
            <Row
              key={op.id}
              label={op.label}
              on={v.practice === op.id}
              tick={!auto}
              onPress={() => {
                onChange({ ...v, practice: op.id });
                if (auto) onAdvance();
              }}
            />
          ))}
          {step.hasRevert ? (
            <Ripple
              style={[Styles.row, Styles.advancedRow, v.revert && Styles.rowOn]}
              onPress={() => onChange({ ...v, revert: !v.revert })}
            >
              <Square on={!!v.revert} />
              <RNText style={[Styles.rowTxt, { marginLeft: wp(3) }]}>
                I&apos;m a revert Muslim
              </RNText>
            </Ripple>
          ) : null}
        </View>
      );
    }
```

- [ ] **Step 6: Type-check and lint**

Run: `cd "D:/GitHub/Pure-Half-worktrees/app-primer-picker-fixes" && yarn type-check && yarn lint src/screens/signupPrimer`

Expected: `type-check` clean, no new lint errors.

If lint flags the nested ternary in `Row` (`tick ? square ? ... : ... : null`), rewrite as:

```tsx
    {tick ? <>{square ? <Square on={on} /> : <Radio on={on} />}</> : null}
```

- [ ] **Step 7: Commit**

```bash
cd "D:/GitHub/Pure-Half-worktrees/app-primer-picker-fixes"
git add src/screens/signupPrimer/components/step-control.tsx
git commit -m "feat(primer): auto-advance woman Q2 and man Q3, drop tick from self-advancing rows

status and deen rows now self-advance when the step has no extra
checkbox, matching 'single'. Auto-advancing rows no longer render a
radio tick — the rowOn highlight carries selection, as Chip already
does. Rows that still need Continue keep their tick.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: 200ms highlight pause + footer visibility

**Files:**
- Modify: `src/screens/signupPrimer/SignupPrimer.tsx` (imports line 2; `primer-logic` import ~22-28; after `advance` ~144-170; `StepControl` ~377-383; footer ~392)

**Interfaces:**
- Consumes: `isAutoAdvance` from `./primer-logic` (Task 1); `StepControl`'s `onAdvance` prop (Task 2).
- Produces: no exports. Internal only.

**Context:** `StepControl`'s `onAdvance` and the footer `Button`'s `onPress` are already separate props both pointing at `advance`. Only the former gets the pause — the Continue button stays instant.

- [ ] **Step 1: Add `useRef` to the React import**

Line 2 of `src/screens/signupPrimer/SignupPrimer.tsx` becomes:

```ts
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
```

- [ ] **Step 2: Import `isAutoAdvance`**

Update the `./primer-logic` import block (~lines 22-28) to:

```ts
import {
  computeProgress,
  formatMatchCount,
  isAutoAdvance,
  nextStepIndex,
  prevStepIndex,
  questionPosition,
} from './primer-logic';
```

- [ ] **Step 3: Add the pause constant**

Add near the other module constants, directly above `const TWINKLE = {` (~line 40):

```ts
// Beat between tapping an auto-advancing option and the next question, so the
// selected row's highlight actually paints. Long enough to register, short
// enough not to feel like lag across eleven questions.
const HIGHLIGHT_PAUSE_MS = 200;
```

- [ ] **Step 4: Add the delayed-advance wrapper**

Insert directly after the `advance` `useCallback` closes (after line ~170, before the `goBack` definition):

```tsx
  // `advance` closes over `answers`, so the copy captured at tap time predates
  // the onChange from that same tap. Calling through a ref means the timeout
  // runs the current `advance` — by then React has re-rendered with the answer.
  const advanceRef = useRef(advance);
  useEffect(() => {
    advanceRef.current = advance;
  });

  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    },
    []
  );

  // Used only by auto-advancing options. The Continue button stays instant.
  const advanceAfterHighlight = useCallback(() => {
    if (advanceTimer.current) return; // a second tap must not skip a question
    advanceTimer.current = setTimeout(() => {
      advanceTimer.current = null;
      advanceRef.current();
    }, HIGHLIGHT_PAUSE_MS);
  }, []);
```

- [ ] **Step 5: Point StepControl at the delayed wrapper**

At `<StepControl>` (~line 382), change `onAdvance={advance}` to:

```tsx
            onAdvance={advanceAfterHighlight}
```

- [ ] **Step 6: Gate the footer on the rule, not the control name**

Replace line ~392, `{current.control !== 'single' ? (` with:

```tsx
      {!isAutoAdvance(current) ? (
```

- [ ] **Step 7: Type-check, lint, and re-run the primer tests**

Run:
```bash
cd "D:/GitHub/Pure-Half-worktrees/app-primer-picker-fixes"
yarn type-check && yarn lint src/screens/signupPrimer && npx jest src/screens/signupPrimer/primer-logic.test.ts
```

Expected: `type-check` clean; no new lint errors; 21/21 tests pass.

If `react-hooks/exhaustive-deps` warns that the `useEffect` at Step 4 has no dependency array, that is intentional (it must run after **every** render to keep the ref current). Leave it. Do not add `[advance]` — that is equivalent but noisier; do not add `[]` — that would freeze the ref and reintroduce the stale-answers bug.

- [ ] **Step 8: Commit**

```bash
cd "D:/GitHub/Pure-Half-worktrees/app-primer-picker-fixes"
git add src/screens/signupPrimer/SignupPrimer.tsx
git commit -m "feat(primer): pause 200ms on auto-advance so the highlight is visible

Auto-advancing options previously advanced synchronously inside the tap
handler, so the selected row's highlight never painted. Route those taps
through a 200ms timer, cleared on unmount and guarded against
double-taps skipping a question.

The timer calls advance through a ref, which also fixes a latent bug:
advance closed over pre-tap answers, so nextStepIndex could evaluate
showIf against stale state. Harmless today, but the delay would have
baked it in.

Footer visibility now derives from isAutoAdvance instead of hardcoding
the 'single' control, so woman Q2 and man Q3 lose their redundant
Continue button.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Picker alignment + row height

**Files:**
- Modify: `src/components/pickers/Picker.tsx` (`headerTxt` ~185-192; `itemCon` ~201-214; `itemLabel` ~215-221)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: module constant `ROW_MIN_HEIGHT = 48`, used by `Styles.itemCon` in this file and referenced again in Task 5. No exports.

**Context — the bug:** `src/components/Text.tsx:34-36` injects `alignSelf: Rtl ? 'flex-end' : 'flex-start'` into every `Text`. Inside a `flexDirection: 'row'` container the cross axis is vertical, so that override pins text to the **top**, beating the container's `alignItems: 'center'`. The close icon and chevron are bare `Ionicons`, so they stay centred — hence the offset. `Text` composes styles as `[alignSelf, display, style]` and RN applies the last entry last, so a passed `alignSelf` wins.

- [ ] **Step 1: Add the row-height constant**

In `src/components/pickers/Picker.tsx`, add directly above `const displayValue = ` (~line 36):

```ts
// A finger is the same size on every phone, so this must not use hp(): hp() is a
// percentage of screen height (src/global/Scalling.tsx), which rendered ~63px on
// a tall device and ~45px on a small one — under the 48px minimum tap target.
// Deliberate deviation from the wp()/hp() convention in CLAUDE.md.
const ROW_MIN_HEIGHT = 48;
```

- [ ] **Step 2: Centre the header title**

Replace the `headerTxt` style block (~lines 185-192) with:

```js
  headerTxt: {
    flex: 1,
    // Beats the alignSelf that Text injects for RTL, which lands on this row's
    // cross axis (vertical) and would pin the title to the top. See Text.tsx.
    alignSelf: 'center',
    color: Colors.ink,
    textAlign: 'center',
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.small3,
    lineHeight: wp(5.5),
  },
```

- [ ] **Step 3: Shrink the row and centre its label**

Replace the `itemCon` and `itemLabel` style blocks (~lines 201-221) with:

```js
  itemCon: {
    minHeight: ROW_MIN_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: wp(3),
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    marginBottom: hp(0.7),
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: Colors.surface,
  },
  itemLabel: {
    flex: 1,
    // Same as headerTxt: overrides Text's injected RTL alignSelf so the label
    // sits beside its chevron instead of above it. Horizontal alignment is
    // still governed by textAlign (default 'auto'), so RTL is unaffected.
    alignSelf: 'center',
    color: Colors.ink,
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small2,
    lineHeight: wp(5.2),
  },
```

- [ ] **Step 4: Type-check and lint**

Run: `cd "D:/GitHub/Pure-Half-worktrees/app-primer-picker-fixes" && yarn type-check && yarn lint src/components/pickers`

Expected: `type-check` clean, no new lint errors.

- [ ] **Step 5: Commit**

```bash
cd "D:/GitHub/Pure-Half-worktrees/app-primer-picker-fixes"
git add src/components/pickers/Picker.tsx
git commit -m "fix(picker): centre title and row labels, tighten row height

Text.tsx injects alignSelf for RTL, but alignSelf is a cross-axis
property — inside these rows the cross axis is vertical, so it pinned
the title above the close button and every label above its chevron.
Override it at both call sites; Text itself is untouched because that
injection is load-bearing across ~35 screens.

Row height moves from hp(7) to a flat 48px. hp() is a percentage of
screen height, which is why rows looked oversized on tall devices while
dropping under the minimum tap target on small ones.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Picker bottom-sheet conversion

**Files:**
- Modify: `src/components/pickers/Picker.tsx` (imports 1-15; `Modal` tree 64-157; `Styles` 162-232)

**Interfaces:**
- Consumes: `ROW_MIN_HEIGHT` (Task 4).
- Produces: no exports. `PickerProps` is unchanged, so all four consumers keep working untouched.

**Context:** The picker is shared by `profile-question-wizard.tsx:900`, `RefineSearch.tsx:899`, `ContactSupport.tsx:164`, and `AgeRange.tsx:119`. This task changes how all four look. The height is **capped, not fixed** — the sheet sizes to its content and stops at 80%, so short lists (Age Range, Contact Support) get a short sheet, and the top edge can never be cropped on a small device.

**This is the highest-risk task in the plan.** Static checks cannot verify it. See Step 5.

- [ ] **Step 1: Update the imports**

Replace lines 1-15 of `src/components/pickers/Picker.tsx` with:

```tsx
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Ripple from 'react-native-material-ripple';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { hp, Typography, wp } from '../../global';
import { Colors, Fonts } from '../../res';
import Text from '../Text';
import SearchBar from './SearchBar';
```

`StatusBar` is dropped (the modal no longer owns the status bar); `Pressable` is added for the backdrop.

- [ ] **Step 2: Restructure the modal into a sheet**

Replace the `return (` block (lines ~64-157) — from `<Modal` through `</Modal>` — with:

```tsx
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onShow={() => setQuery('')}
      onRequestClose={() => {
        setQuery('');
        onClose();
      }}
    >
      <Pressable
        style={Styles.backdrop}
        accessibilityRole="button"
        accessibilityLabel="Close"
        onPress={() => {
          setQuery('');
          onClose();
        }}
      />
      <KeyboardAvoidingView
        style={Styles.sheetAnchor}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        pointerEvents="box-none"
      >
        <SafeAreaView style={Styles.sheet} edges={['bottom']}>
          <View style={Styles.headerCon}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={() => {
                setQuery('');
                onClose();
              }}
              style={Styles.closeBtn}
            >
              <Ionicons name="close" color={Colors.ink} size={wp(6)} />
            </TouchableOpacity>
            <Text style={Styles.headerTxt} numberOfLines={2}>
              {headerTitle}
            </Text>
            <View style={Styles.headerSpacer} />
          </View>

          {data.length > 10 ? (
            <SearchBar
              key={visible ? 'picker-search-open' : 'picker-search-closed'}
              onChangeText={setQuery}
              autoFocus={false}
            />
          ) : null}

          <FlatList
            data={filteredData}
            style={Styles.list}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={
              Platform.OS === 'ios' ? 'interactive' : 'on-drag'
            }
            keyExtractor={(item, index) => String(item?.id ?? index)}
            renderItem={({ item }) => (
              <Ripple
                style={Styles.itemCon}
                onPress={() => {
                  setQuery('');
                  onPress(item);
                }}
              >
                <Text style={Styles.itemLabel}>
                  {displayValue(item?.value)}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  color={Colors.primaryLite}
                  size={wp(4.5)}
                />
              </Ripple>
            )}
            contentContainerStyle={Styles.listContainer}
            ListEmptyComponent={
              loader ? (
                <ActivityIndicator
                  color={Colors.primary}
                  size="small"
                  style={Styles.loader}
                />
              ) : (
                <Text style={Styles.emptyText}>No matching options</Text>
              )
            }
            ListFooterComponent={
              loader && filteredData.length > 0 ? (
                <ActivityIndicator
                  color={Colors.primary}
                  size="small"
                  style={Styles.loader}
                />
              ) : null
            }
          />
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
```

Changes from the original: `presentationStyle="fullScreen"` → `transparent`; `StatusBar` removed; `SafeAreaView` moved inside and reduced to `edges={['bottom']}`; a `Pressable` backdrop added behind; `KeyboardAvoidingView` now anchors the sheet to the bottom with `pointerEvents="box-none"` so taps beside the sheet reach the backdrop; `FlatList` gains `style={Styles.list}`.

- [ ] **Step 3: Replace the container styles**

In the `Styles` block, delete the `safeArea` and `keyboardAvoidingView` entries and add these four in their place (keep `headerCon` and everything below it as-is, including Task 4's changes):

```js
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheetAnchor: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    // Capped, not fixed: the sheet grows with its content and stops at 80%.
    // Measured from the bottom, so its top edge can't be cropped on a small
    // device, and short lists (Age Range, Contact Support) stay short.
    maxHeight: '80%',
    backgroundColor: Colors.appBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    // Clips the white header to the rounded top corners.
    overflow: 'hidden',
  },
  list: {
    // Lets the list shrink inside the capped, content-sized sheet instead of
    // forcing it to full height.
    flexShrink: 1,
  },
```

- [ ] **Step 4: Type-check and lint**

Run: `cd "D:/GitHub/Pure-Half-worktrees/app-primer-picker-fixes" && yarn type-check && yarn lint src/components/pickers`

Expected: `type-check` clean, no new lint errors.

- [ ] **Step 5: Commit, then flag for device verification**

```bash
cd "D:/GitHub/Pure-Half-worktrees/app-primer-picker-fixes"
git add src/components/pickers/Picker.tsx
git commit -m "feat(picker): convert to a height-capped bottom sheet with rounded top

Modal goes transparent with a dimmed, tap-to-close backdrop and a
bottom-anchored sheet capped at 80% height. Capped rather than fixed:
the top edge is measured from the bottom so it can't be cropped on small
screens, while short lists size to their content instead of padding out
a fixed half-screen.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

**Then stop and report to the user.** Static checks cannot catch either known failure mode here:

1. **`FlatList` inside a content-sized, `maxHeight`-capped container** can collapse to zero height or overflow its parent. If the list renders blank or spills past the rounded corners, the fix is to give `Styles.sheet` a `minHeight` or move the cap onto `sheetAnchor`.
2. **Android `Modal` with `transparent` does not reliably honour `adjustResize`,** so the keyboard may cover the search field at the top of the sheet. If so, try `behavior={Platform.OS === 'ios' ? 'padding' : 'height'}` on the `KeyboardAvoidingView`.

Do not attempt a native build (`yarn android` / `yarn ios`) — that is the user's call. Report both risks and hand off.

---

## Verification Checklist

Static (must pass before handoff):

- [ ] `npx jest src/screens/signupPrimer/primer-logic.test.ts` — 21/21 pass
- [ ] `yarn type-check` — clean
- [ ] `yarn lint src/screens/signupPrimer src/components/pickers` — no new errors
- [ ] `git log --oneline staging..HEAD` — 5 commits, Conventional Commits format

On-device (user's, before merge to `staging`):

- [ ] Woman Q2 and Man Q3: tap → highlight → ~200ms → next. No tick, no Continue.
- [ ] Man Q1 and Woman Q3: unchanged; polygamy/revert checkboxes still reachable.
- [ ] Double-tapping an option advances exactly one step.
- [ ] Nationality picker: title centred on the X; labels centred with chevrons.
- [ ] Sheet: rounded top, never taller than 80%, top never cropped — check a small device.
- [ ] Age Range and Contact Support: short sheet, no dead space.
- [ ] Backdrop tap closes; search filters; field clears on reopen.
- [ ] Search field stays visible with the keyboard open — **both platforms**.
- [ ] Urdu/RTL: labels still align right, nothing shifted vertically.
