# Signup primer auto-advance + shared Picker layout fixes

**Date:** 2026-07-17
**Branch:** `fix/primer-autoadvance-and-picker-layout` (off `staging`)
**Status:** design approved, not implemented

Two unrelated UI defects reported together as quick fixes. They share no files
and can be implemented, reviewed, and reverted independently. They are kept in
one spec because they were requested as one batch.

- **Part A** — signup primer: single-select questions that need a redundant
  Continue tap, plus a tick that shouldn't be there and a highlight nobody sees.
- **Part B** — the shared modal list picker (Nationality et al.): text pinned to
  the top of its row, square top corners, and rows that are too tall.

---

## Part A — Signup primer single-select behaviour

### Problem

After the gender step, the primer asks a series of questions
(`src/screens/signupPrimer/`). Three defects:

1. **Redundant Continue.** Woman Q2 (`status`) and Man Q3 (`deen`) are
   single-choice questions, but they render a Continue button the user must tap
   after choosing. Every other single-choice question self-advances.
2. **The highlight is never seen.** Steps with `control: 'single'` already
   auto-advance, but they do it *synchronously inside the tap handler*
   (`components/step-control.tsx:105-108`), so the screen leaves before the
   selected row's highlight paints. The user gets no confirmation of what they
   picked.
3. **A tick on a single-choice row.** Auto-advancing rows render a radio tick
   (`Radio`, `step-control.tsx:27-33`). A tick implies "confirm this / pick more
   than one", which is wrong for a row that self-advances on tap.

### Which steps auto-advance

The rule is derived from the step definition rather than hand-flagged per step:

| `control` | Auto-advances when | Affects |
|---|---|---|
| `single` | always | existing behaviour, unchanged |
| `status` | step has no polygamy checkbox (`!hasPolygamy`) | **Woman Q2** → yes; Man Q1 → no |
| `deen` | step has no revert checkbox (`!hasRevert`) | **Man Q3** → yes; Woman Q3 → no |
| all others | never | — |

**Why derived, not a flag.** Those checkboxes are the *reason* a step can't
self-advance: you cannot tick "I'm a revert Muslim" if the screen leaves the
instant you pick a practice level. Deriving means that if someone later adds
`hasRevert` to the man's deen step, it stops auto-advancing automatically
instead of silently trapping the new checkbox behind a vanishing screen. An
explicit `autoAdvance: true` flag would have to be remembered and would rot.

Confirmed against `journeys.ts`: the woman's `status` step (line 42) sets no
`hasPolygamy`, and the man's `deen` step (line 191) sets no `hasRevert`. Both
are pure single-selects today.

### Where the helper lives

`isAutoAdvance` goes in `primer-logic.ts`, which is the file that exists
specifically for pure, unit-testable branching logic.

**Constraint:** `primer-logic.ts` must not import `PrimerStepDef` from
`primer-types.ts`, because `primer-types.ts` already imports `PrimerAnswers`
*from* `primer-logic.ts`. That would be a cycle, and `import/no-cycle` is an
ESLint **error** in this repo with an explicit "restructure, don't disable".

**Resolution:** mirror the pattern the file already uses. `primer-logic.ts`
declares its own minimal structural type rather than importing the real one —
exactly as it already does for `PrimerStep` (`{ id, showIf? }`). `PrimerStepDef`
satisfies it structurally, so call sites need no cast.

```ts
// Minimal structural shape; PrimerStepDef satisfies it. Declared locally rather
// than imported to avoid a primer-logic <-> primer-types cycle.
export type AutoAdvanceStep = {
  control: string;
  hasPolygamy?: boolean;
  hasRevert?: boolean;
};

// A step self-advances on tap when it is a single choice with nothing else on
// screen to interact with. The optional checkboxes on status/deen are exactly
// what disqualifies a step: you can't tick a box on a screen that's leaving.
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

`control` is typed `string`, not `PrimerControl`, for the same cycle reason. This
loses switch exhaustiveness — an accepted, contained trade-off, consistent with
the existing `PrimerStep` precedent in the same file. The `default: false` arm
means an unknown control is treated as "needs Continue", which is the safe
failure direction: a stuck screen is recoverable, a skipped question is not.

### The 200ms pause

`StepControl` keeps its existing dumb `onAdvance` prop. `SignupPrimer` supplies a
wrapper that waits before advancing:

- **Delay: 200ms.** Long enough for the highlight to paint and register, short
  enough not to feel like lag when tapping through eleven questions.
- **Only tap-to-advance is delayed.** The Continue button stays wired to the
  immediate `advance`, so `onAdvance` (StepControl) and `onPress` (footer
  Button) diverge — they are already separate props.
- **Cleared on unmount**, so a timer can't fire into a torn-down screen.
- **Re-entrancy:** a second tap while a pause is pending is ignored for
  advancing, so a double-tap can't skip a question. `onChange` still fires, so a
  correction within the 200ms lands on the last option tapped.
- **Reads fresh answers.** The timeout calls through a ref to the latest
  `advance` rather than the closure captured at tap time (see below).

### Latent bug fixed en route

`advance` (`SignupPrimer.tsx:144`) reads `answers` from its own closure, so when
invoked from within the same tap that called `onChange`, `nextStepIndex(steps,
answers, stepIndex)` sees **pre-update** answers. Harmless today — no
auto-advancing step is followed by a step whose `showIf` depends on the answer
just given — but the 200ms timer would bake the staleness in permanently.

Routing the delayed call through a ref to the current `advance` means that after
200ms React has re-rendered and the ref holds an `advance` closed over
post-tap answers. The fix falls out of the delay rather than costing anything.

### The tick

`Row` gains an opt-out so auto-advancing rows render label + highlight only.
Selection is carried by the existing `rowOn` style (primary border + lavender
fill, `step-control.tsx:386`) — the same signal `Chip` already relies on, which
has never had a tick.

**Scope: auto-advancing rows only.** Single-select rows that still require
Continue keep their tick — Man Q1 (`status`), Woman Q3 (`deen`), Man Q9
(`work`), and the sect match-preference rows. The polygamy and revert checkboxes
keep their `Square` ticks. On those screens the contrast is what makes the rule
legible: the rows have no tick, the checkbox under them does.

### Footer

`SignupPrimer.tsx:392` changes from `current.control !== 'single'` to
`!isAutoAdvance(current)`. Woman Q2 and Man Q3 lose their Continue button
entirely rather than keeping it as a redundant second way forward.

### Acceptance criteria

- Woman Q2 (`status`): tapping an option highlights it, pauses ~200ms, advances.
  No tick. No Continue button.
- Man Q3 (`deen`): same.
- Man Q1 (`status`, polygamy) and Woman Q3 (`deen`, revert): unchanged — ticks,
  Continue button, no auto-advance. The checkbox is still reachable.
- Existing `control: 'single'` steps (Woman Q1, Man Q2): still auto-advance, now
  with a visible highlight and no tick.
- Back-navigating to an auto-advancing step shows the prior answer highlighted.
- Double-tapping an option advances exactly one step.
- Backgrounding or closing the screen mid-pause fires no timer.
- `isAutoAdvance` unit-tested in `primer-logic.test.ts` (14 tests currently pass;
  the pure-TS jest path works for this file even though the RN component test
  setup is broken).
- `yarn type-check` clean.

---

## Part B — Shared Picker layout

### Scope warning

`src/components/pickers/Picker.tsx` is **shared by four consumers**:

| Consumer | Title |
|---|---|
| `screens/profile/components/profile-question-wizard.tsx:900` | Nationality, Language, … |
| `screens/searchProfiles/RefineSearch.tsx:899` | Nationality, … (filters) |
| `screens/contactSupport/ContactSupport.tsx:164` | Select a reason |
| `screens/searchProfiles/AgeRange.tsx:119` | Age range |

Every change below lands on all four. The alignment and row-height fixes are
strict improvements everywhere. The sheet conversion is a real visual change to
Contact Support and Age Range too — accepted deliberately, since a picker that
sizes to its content suits their short lists *better* than today's full-screen
modal.

### B1 — Vertical alignment (root cause)

**Symptom:** the "Nationality" title floats above the X button, and each row's
label sits above its chevron instead of beside it.

**Cause:** the shared `Text` component (`src/components/Text.tsx:34-36`) injects
`alignSelf: Rtl ? 'flex-end' : 'flex-start'` into *every* text it renders, to
handle Urdu RTL. But `alignSelf` controls the **cross axis**, and inside a
`flexDirection: 'row'` container the cross axis is **vertical**. So the injected
`flex-start` overrides the container's `alignItems: 'center'` and pins the text
to the top of the row. The close icon and chevron are bare `Ionicons`, not
`Text`, so they stay centred — producing the offset.

**Fix:** add `alignSelf: 'center'` to `headerTxt` and `itemLabel` in
`Picker.tsx`. `Text` composes as `[alignSelf, display, style]` and RN applies
later entries last, so the passed style wins. Two lines.

**Why not fix `Text`.** That injected `alignSelf` is load-bearing for RTL across
~35 screens; changing it is a separate, properly-tested job, not a quick fix.

**RTL is unaffected.** Horizontal alignment of the label within its `flex: 1`
box is governed by `textAlign` (default `auto`, which follows writing
direction), not by `alignSelf`. Overriding the cross-axis value to `center`
changes vertical placement only.

This bug is almost certainly present anywhere else `Text` is a direct child of a
row with `alignItems: 'center'`. Out of scope here; worth a follow-up sweep.

### B2 — Bottom sheet with rounded top

**Requested:** rounded top edges, and "should not go more than half screen" — the
stated worry being that on a small phone the top of the picker could be cropped
or hidden.

**Decision: cap the height, don't fix it.** The cropping risk is about whether
the height is *fixed* or *capped*, not about half vs full. A fixed 50% is safe on
a small phone but wastes half a large one and cramps a ~200-item nationality
list with the keyboard up. A sheet anchored to the bottom with a `maxHeight`
ceiling gives the same guarantee — the top edge is measured from the bottom and
simply refuses to grow past the cap, so it cannot be cropped on any screen —
while sizing to content when content is short.

- `Modal`: `presentationStyle="fullScreen"` → `transparent`, keeping
  `animationType="slide"`.
- Dimmed backdrop (`rgba(0,0,0,0.45)`), tap to close, behind the sheet.
- Sheet anchored bottom: `borderTopLeftRadius`/`borderTopRightRadius: 24`,
  `backgroundColor: Colors.appBg`, `maxHeight: '80%'`, `overflow: 'hidden'` so
  the white header clips to the rounded corners.
- `SafeAreaView` → `edges={['bottom']}` (the sheet no longer touches the top).
- The `StatusBar` override (`Picker.tsx:76`) is **removed** — the modal no longer
  owns the status bar, and forcing a white background there would paint over the
  dimmed screen behind.
- `FlatList` gets `flexShrink: 1` so it can shrink inside the capped,
  content-sized sheet.

### B3 — Row height

`itemCon` is `minHeight: hp(7)`. `hp()` is a straight percentage of screen height
(`src/global/Scalling.tsx:12-18`), so that renders ~63px on a tall phone and
~45px on a small one. The rows look oversized *because of* a tall screen — and
the same formula pushes them to the edge of the minimum tap target on exactly
the small screens this change is meant to protect.

**A touch target should not scale with screen height.** A finger is the same size
on every phone. So:

- `minHeight`: flat `48` (module constant with a comment), not `hp(...)`.
- `paddingVertical`: `hp(1.3)` → `hp(1)`.
- `marginBottom`: `hp(1)` → `hp(0.7)` (~6px).

This is a **deliberate deviation** from the repo's "use `wp()`/`hp()`, not raw
pixels" convention (`CLAUDE.md`). The convention serves layout rhythm; touch
targets are the case it gets wrong. 48px is the Android/iOS recommended minimum
and is now guaranteed on every device rather than only on tall ones.

Net effect: ~30% more rows visible, and a floor under the tap target.

### Verification risk

The sheet conversion is the one part that cannot be fully verified by reading:

- A `FlatList` inside a content-sized, `maxHeight`-capped container is where RN
  layout is finicky (can collapse to zero or overflow).
- Android `Modal` with `transparent` does not always resize for the keyboard the
  way a fullScreen modal does, which matters because the search field sits at the
  top of the sheet.

**This part requires an on-device check before merge.** Static checks
(`type-check`, `lint`) cannot catch either failure mode.

### Acceptance criteria

- Nationality picker: title vertically centred on the X button; each row's label
  vertically centred with its chevron.
- Sheet has rounded top corners, is anchored to the bottom, never exceeds 80% of
  screen height, and its top is never cropped — verified on a small screen.
- Short lists (Age Range, Contact Support) produce a short sheet, not a
  fixed-height one with dead space.
- Backdrop tap closes the picker; search still filters; the field still clears on
  reopen.
- Search field remains visible with the keyboard open, on both platforms.
- Rows are >= 48px tall on every device.
- Urdu/RTL: labels still align right; nothing regresses vertically.
- `yarn type-check` and `yarn lint` clean.

---

## Out of scope

- Refactoring `Text.tsx`'s injected `alignSelf` (the underlying bug).
- Auditing other rows app-wide for the same `alignSelf`-in-a-row defect.
- Any change to guardian code, per the standing removal decision.
