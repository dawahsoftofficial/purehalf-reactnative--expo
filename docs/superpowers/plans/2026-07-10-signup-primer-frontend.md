# Signup Primer / Welcome Questionnaire — Frontend Implementation Plan (v2)

> **For agentic workers:** REQUIRED SUB-SKILL: use superpowers:executing-plans (or
> subagent-driven-development). Steps use `- [ ]` checkboxes.

> **v2 supersedes the earlier frontend plan** — regenerated against the finalized two-journey
> design in `docs/superpowers/specs/2026-07-10-signup-primer-{design,questions}.md`. Depends
> on the backend plan but degrades gracefully (no flag/endpoint ⇒ no primer).

**Goal:** A pre-signup, two-journey welcome questionnaire (female/male) that captures answers
on-device, reveals a live match count, commits everything to the account after auth, and
pre-fills / trims the Part-1 flow.

**Architecture:** A data-driven step engine renders a per-gender question config. Radio
single-selects auto-advance; a global progress bar spans the journey; every step fires
drop-off analytics. Answers live in MMKV until auth, then flush to the backend.

**Tech stack:** RN 0.82, React 19.1, TS, Zustand settings store, MMKV, i18next, native-stack,
existing geolocation (Location.tsx), `addAnaylatics`.

## BUILD STATUS (2026-07-10, branch `feat/signup-welcome-primer`)

**Done + committed (type-check + jest green):** Tasks 1–8. Storage keys + settings getters;
pure resolvers + 11 jest tests; both journey configs (`journeys.ts`); the step engine
(`SignupPrimer.tsx`) + all controls (`components/step-control.tsx`); the reveal (live count +
founding-member <50 fallback + graceful network failure); commit-after-auth
(`commit-primer.ts`, wired into `Otp.onLoggedIn` + a startup net in `RootNavigation`); nav
gating (SignupPrimer as the not-logged-in initial route behind the flag); gender-skip in
`UserInput`. Copy is inline English (renders through `t()`); full i18n keys = the remaining
Task 10. Analytics fire `primer_started` / `primer_step` (per-screen drop-off events still to
add).

**Remaining follow-ups (deferred — they touch shared/core code and want on-device
verification):**

- Task 9 — Part-1 trim: remove the weight slider → optional body-type, and drop the caste
  question from the ME wizard (`src/screens/profile/Data.tsx`, shared with the ME section).
- Task 10 — i18n: move all inline strings into `Keys` + the three locale JSONs.
- Polygamy female-side filter wiring + profile badge (pairs with the backend filter).

## Global Constraints

- Every user-visible string via `t()`, keys in all three locales (identical keys).
- Reuse Part-1 design tokens (`appBg`, `ink`, `primary`, `lavender`, `verified`).
- No React-hooks-rule eslint disables (React Compiler treats them as errors).
- `yarn type-check` + eslint are the gate; add pure-logic jest tests for the engine's
  step-resolver, the number formatter, and the gating resolver (RN component tests are broken).
- Gate reads tolerate settings-not-loaded (`?? default`).

## Task 1: Storage + settings getters

**Files:** `src/services/storageManager/StorageManager.tsx`, `src/stores/settings-store.ts`.

- [ ] Add keys `PRIMER_SEEN`, `PRIMER_ANSWERS`.
- [ ] Add getters `getEnablePresignupQuestions()` (default false),
      `getEnablePostsignupQuestions()` (default true), `getEnableMatchCountReveal()` (default
      false) — copy `getSkipSignupMembershipPaywall` pattern. Commit.

## Task 2: Pure resolvers (+ jest)

**Files:** `src/screens/signupPrimer/primer-logic.ts` + test.
**Interfaces:** `shouldShowPrimer({loggedIn,enabled,seen})`; `formatMatchCount(n)`;
`nextStepIndex(steps, answers, i)` (skips steps whose `showIf` predicate is false — powers
conditional/skippable steps + the auto-advance flow); `computeProgress(steps, answers, i)`.

- [ ] TDD each; run under jest. Commit.

## Task 3: Journey config (data, not UI)

**Files:** `src/screens/signupPrimer/journeys.ts`.

- [ ] Encode both journeys as arrays of step descriptors: `{ id, type: 'single'|'multi'|
'text'|'slider'|'combo'|'checkbox', question, subtitle?, options?, max?, showIf?,
visibility: 'public'|'private', mapsTo, support?, autoAdvance }`. Include: S1, F1/M1,
      status(+advanced polygamy), caste combo (khandan+matters), F-DEEN(+revert checkbox)/M-DEEN,
      F-SECT/M-SECT, F3/M3 (private), F4/M4 (capped 4), F5(+"not second wife"), F-AGE/M-AGE,
      F6/M-WORK+M-HABITS, F7, F-ME/M-ME, reveal. Copy verbatim from the questions file. Commit.

## Task 4: Step engine

**Files:** `src/screens/signupPrimer/SignupPrimer.tsx` + `components/`.

- [ ] Phase machine (`intro→questions→loading→reveal`); renders the current step via the
      config; **single-select auto-advances on tap** (no Continue); multi/text/slider keep
      Continue; **global progress bar** in the header (`computeProgress`); Skip on every step.
- [ ] Persist to `PRIMER_ANSWERS` (JSON) after each step; set `PRIMER_SEEN` on reveal/skip.
- [ ] Fire analytics per step (`primer_screen_view`/`_completed`/`_skipped` with step id +
      gender, PII-free). Commit.

## Task 5: Control components

**Files:** `src/screens/signupPrimer/components/*`.

- [ ] `OptionTiles` (auto-advance single-select), `CappedMultiSelect` (max-4 counter),
      `FreeText`, `DualSlider`, `ComboCaste` (text + yes/no), `SectCombo`, `DeenWithRevert`
      (single-select + independent checkbox), `HabitsToggles`, `TraitChips` (self-praise),
      `AdvancedPolygamyToggle`. Reuse Part-1 tokens. Commit.

## Task 6: Reveal

**Files:** `src/screens/signupPrimer/components/Reveal.tsx`; `src/services/api` (add
`getMatchCount`).

- [ ] Call `getMatchCount({seeking, min_age, max_age, country})` (country from Location/device
      region). Show `formatMatchCount(count)` + chips; **if `founding` / count<50 → founding-member
      copy** ("Be among the first — early members get priority matching"). Network failure → the
      number-free fallback, still proceed. Gender-led lead line + conditional M-ME/self-praise
      already handled upstream. Commit.

## Task 7: Commit-after-auth

**Files:** `src/screens/phoneNumber/AuthWelcome.tsx` / `src/screens/otp/Otp.tsx` (the auth
success handlers) + `src/services/api`.

- [ ] On first successful auth, read `PRIMER_ANSWERS` and POST to the backend
      updateDetail/intro-commit endpoint (facts + `intro_answers` JSON). On success clear
      `PRIMER_ANSWERS`. Guarded/idempotent; never blocks login. Commit.

## Task 8: Navigation gating + gender-skip

**Files:** `src/navigation/RootNavigation.tsx`, `src/screens/userInput/UserInput.tsx`.

- [ ] Register `SignupPrimer`; not-logged-in initial route → `SignupPrimer` when
      `shouldShowPrimer`. Register post-signup gate on `getEnablePostsignupQuestions()`.
- [ ] UserInput: hide the gender field when gender is already set (from S1); show only as
      fallback. Commit.

## Task 9: Part-1 trim + OnboardingProfile body-type

**Files:** `src/screens/onboardingProfile/OnboardingProfile.tsx`, `src/screens/profile/Data.tsx`.

- [ ] Remove the caste question from the ME wizard (now in the welcome flow). **Replace the
      weight slider with an optional body-type descriptor + "Prefer not to say"** (→
      `body_type_id`); keep height. Gate the wizard on `getEnablePostsignupQuestions()`. Commit.

## Task 10: i18n + analytics + formatter tests

**Files:** `src/languages/{Keys,English,Urdu,RomanUrdu}`, analytics calls.

- [ ] Add every string (questions, options, supportive/affirming lines, reveal, founding-member
      copy) to all three locales (identical keys). `yarn type-check`. Commit.

## Verification

- `yarn type-check` clean; eslint clean; `yarn jest primer-logic` green.
- On device (flags on in a test build + backend reachable): fresh install → primer once;
  auto-advance on single-selects; global bar fills; caste is one screen; revert-checkbox
  independent; reveal shows live number, and founding-member copy when the pool is <50; killing
  the network still proceeds; answers appear on the profile after signup; gender not re-asked;
  Part-1 ME wizard trimmed, body-type instead of weight; flags off ⇒ no primer.

## Self-review

- [ ] Single-selects auto-advance; global progress bar present.
- [ ] Every filter has a captured fact (caste/sect/deen/habits/revert/polygamy).
- [ ] Private answers (journey_stage, concerns) never sent to public columns / shown.
- [ ] Commit-after-auth never blocks login; graceful degradation everywhere.
