# Onboarding Polish — Intro Screen, Completion Gift, Required Answers, Eye Color Swatches — Design Spec

- **Date:** 2026-07-11
- **Status:** Approved design, ready for implementation planning
- **Scope:** Four small, related enhancements to the `OnboardingProfile` wizard shipped by the 2026-07-10 onboarding-profile-building spec/plans. Item 4 explicitly **supersedes** one decision from that spec (§3.4 "Next is always enabled") — see §5.
- **Repos touched:** `app-old/` (all four items) and `admin/` (backend changes for item 2 only).

## 1. Goal

Four incremental improvements to the `OnboardingProfile` wizard (`src/screens/onboardingProfile/OnboardingProfile.tsx`) and the shared `ProfileQuestionWizard` it's built on:

1. **Intro screen** — a framing screen before the first question, previewing the completion reward.
2. **Completion gift** — turn the existing silent "finish bonus" into a visible, tap-to-claim 150-credit gift, surfaced via a gift icon on both the onboarding header and the ME profile header.
3. **Required answers** — block "Next" until the current question has a value; the button visually lights up once answered.
4. **Eye color swatches** — a color dot next to each option in the eye-color question.

Items 2 and 3 are linked: without required answers, a user could blast through all six groups unanswered and still read as "100% complete," fraudulently unlocking the gift. §3 and §5 should ship together.

## 2. Intro screen

A new phase shown once, ever, between the loading spinner and the first question.

- `OnboardingProfile`'s `Phase` type gains `'intro'`: `loading → intro → question → done`.
- New MMKV flag `storageKeys.ONBOARDING_INTRO_SEEN` (added to `src/services/storageManager/StorageManager.tsx` alongside the existing `PRIMER_SEEN`). After the existing hydration effect resolves, check the flag: unset → `setPhase('intro')`; set → `setPhase('question')` (today's behavior).
- The intro screen's CTA sets the flag (`setData(storageKeys.ONBOARDING_INTRO_SEEN, true)`) and transitions to `'question'`. Once seen, it never shows again — not on "Finish Later" resume, not on Home re-entry.
- Visually mirrors the existing `'done'` phase block (icon badge, title, body, footer button) for consistency: icon chip, title, body copy, a **reward preview chip** beneath the body, then the CTA.
- Copy:
  - Title: _"Let's Build Your Best Profile"_
  - Body: _"A few more details about your appearance, lifestyle, and values help us find matches who are truly right for you. Finish every section and we'll thank you with free chat credits — enough to start real conversations."_
  - Reward preview chip (small pill, same gift glyph used in §3): _"Free chat credits when you finish"_ — deliberately **no number**. A first-time user has no frame of reference for what "150 chat credits" is worth; the number is saved for the claim moment in §3, after they've already watched small per-group rewards land and have context for it.
  - CTA: _"Let's Go"_

## 3. Completion gift (free chat credits)

**Reframes an existing mechanism instead of adding a parallel one.** `ProfileRewardService::grantForCompletedGroups` (admin) already auto-grants a silent "finish bonus" (`profile_finish_bonus_awarded` flag + `chat_credit.profile_finish_bonus` config, currently a 3-credit placeholder, never tuned/shipped) the instant all 6 groups are complete. That becomes this gift: same flag, same config key, no new migration — but changes from auto-granted to claim-gated, and the amount becomes 150.

### Backend (`admin/`)

- `config/chat_credit.php`: bump `PROFILE_FINISH_BONUS_CREDITS_MALE`/`_FEMALE` defaults 3 → 150. This config is already documented as "expressed in CHATS (whole units)" (`updateChatCredit` applies the `multiplier` internally when granting), so `150` here directly means 150 chat credits reaching the user — no unit conversion for the implementer to reason about. Keep the existing key name (`profile_finish_bonus`) rather than renaming — these are still untuned placeholder values with no real users depending on them yet, so a rename isn't worth the extra surface area; a code comment notes it's now presented to users as "the gift," not auto-granted.
- `ProfileRewardService.php`:
  - Remove the finish-bonus block from `grantForCompletedGroups()`. Per-group micro-rewards are untouched.
  - Add `isGiftEligible(User $user): bool` — `completedGroups()` covers all 6 `GROUP_FIELDS` keys **and** `$detail->interest_id` is non-empty **and** `$detail->tagline` is non-empty. This mirrors the app's 100% definition exactly: the frontend's `computeCompletion` meter counts interests and tagline as two extra completion points that the backend's group check doesn't currently see — without adding them here, the gift icon could show 100%/lit-up in the app while the backend claim call rejects it as ineligible.
  - Add `claimFinishGift(User $user): array` returning a status: `already_claimed` (flag already set — return current balance, no grant), `not_eligible` (fails `isGiftEligible`, no grant), or `claimed` (grants `chat_credit.profile_finish_bonus.{gender}` via the existing `UserService::updateChatCredit`, sets `profile_finish_bonus_awarded = true`, returns `awarded`/`new_balance`/`multiplier`).
- `AuthController.php`: new `claimProfileGift(Request $request)` calling the service and mapping status to the controller's existing `success()`/`error()` response helpers.
- `routes/api.php`: `Route::post('profile/claim-gift', [AuthController::class, 'claimProfileGift']);` next to `update/detail`, inside the existing authenticated `auth` group.
- **No migration** — reuses the existing `profile_finish_bonus_awarded` column.
- `admin/tests/Feature/ProfileRewardGrantTest.php` currently asserts the old auto-grant behavior and needs rewriting: not-eligible before completion, claimed once complete + interests + tagline, already-claimed (idempotent) on a second call.

### Frontend (`app-old/`)

- `EndPoints.tsx`: `claimProfileGift: '/auth/profile/claim-gift'`. `Services.tsx`: a `claimProfileGift()` method mirroring the existing `collectChatCredits` promise pattern.
- New presentational component `src/screens/profile/components/gift-badge.tsx` — a gift icon chip with three states: **not eligible** (<100%, muted/grey, non-interactive), **eligible & unclaimed** (solid primary color, tappable), **claimed** (checkmark, non-interactive — reusing the checkmark/`Colors.verified` treatment already used on the wizard's `'done'` badge). Stays "dumb" like the existing `CompletionCard`; tapping it while eligible just opens the modal below. It does **not** need its own loading state — the in-flight claim spinner lives on the modal's Claim button instead (see next bullet).
- New shared `src/screens/profile/components/gift-claim-modal.tsx`, styled after the existing blur-info modal pattern in `Header.tsx` (icon chip, title, body, two buttons): _"You've completed your profile!"_ / _"Claim 150 free chat credits — our gift for finishing your full profile."_ / **Claim Gift** / **Maybe Later**. This is the first place the actual number appears. The Claim Gift button uses the shared `Button` component's existing `loading`/`loadingMessage` props (same pattern as `Header.tsx`'s blur-modal button) while the API call is in flight — no separate state needed on `GiftBadge` itself.
- Two wire-up sites, both reading `eligible` from the locally-computed strength (`=== 100`) and `claimed` from `currentUser.profile_finish_bonus_awarded` (already a plain, non-hidden field on the `User` model — no serialization change needed):
  1. `OnboardingProfile.tsx` — `GiftBadge` at the end of `Styles.headerRow`, after "Finish Later."
  2. `Header.tsx`, own-profile branch (`renderSelfHeader`) — `GiftBadge` inside `Styles.strengthRow`, after the percentage text, under the same `typeof profileStrength === 'number'` guard that already wraps the meter.
  - On claim: call `ApiServices.claimProfileGift()`, then update `currentUser` (`chat_credits: result.new_balance`, `profile_finish_bonus_awarded: true`) via `setData` + `updateCurrentUser` — the same pattern `OnboardingProfile.onGroupComplete` already uses — and flash a success message reusing the existing `youEarned`/`chatCredits` keys (the same toast copy already used for per-group rewards).
- **Known caveat, not remediated:** any staging user whose group-completion already silently tripped the _old_ 3-credit auto-grant will show the gift as pre-claimed. Placeholder economics with phase flags off and no real users depending on it yet, per the prior spec — not worth a data migration.

## 4. Eye color swatches

- New `src/screens/profile/eye-color-swatches.ts`: a `getEyeColorSwatch(label?: string): { color?: string; icon?: string }` helper. Six real colors (Brown `#6F4E37`, Amber `#C68E17`, Hazel `#8E7618`, Green `#4C9A5B`, Blue `#4A7FBF`, Grey `#9AA0A6`) return `{ color }`; `"Multicolor"` returns `{ icon: 'color-palette-outline' }` (a flat swatch can't represent it); `"Prefer not to say"` and anything unrecognized return `{}` (no swatch rendered, text-only row — unchanged from today).
- In `profile-question-wizard.tsx`'s `OptionTags`, when `item.id === 'eye-0'` only, wrap the row's contents in an inner `flexDirection: rtl ? 'row-reverse' : 'row'` container with the swatch (small circle, or the palette icon) before the label — the same technique `taglineEditRow` in `Header.tsx` uses to keep a leading icon glued to the label's leading edge in either direction. Every other `OptionTags` row (body type, complexion, etc.) is single-child text today and is untouched — this row layout is new, added only for `eye-0`.
- Swatch style: ~18px circle, 1px `Colors.hairline` border so pale colors (Grey) stay visible against the row's lavender background.

## 5. Require an answer before Next

**Supersedes the 2026-07-10 spec's §3.4 decision** ("Next is always enabled — answering is never required, unanswered questions are simply omitted from the save"). Reversed here because it (a) let a user reach a "100% complete" profile — and now the gift — without ever answering anything, and (b) is poor data quality for a questionnaire other members rely on for matching.

- Add `isFieldFilled(item): boolean` to `src/screens/profile/profile-editor-flow.ts`, lifted from the near-identical private `itemFilled` already sitting in `profile-hub.tsx` (same four-branch logic: `scalling` / `dropDown` / `dropDownBinary` / free-text default). `profile-hub.tsx` switches to importing it, deleting its own copy — one source of truth instead of two.
- In `profile-question-wizard.tsx`, compute `answered = isFieldFilled(activeItem)` and fold it into the primary button's existing `disabled` check (`saving || visibleFields.length === 0 || !answered`) and its `onPress` guard. No new styling needed: the shared `Button` component already renders `disabled` as a faded/translucent state and enabled as solid, so "greyed out until answered, highlighted once answered" falls out of the existing component.
- **Applies to the whole `ProfileQuestionWizard`**, not just onboarding — it's also reused by ME → Edit Profile (`showSkip: true` there). This is safe: fields already filled from a previous edit satisfy the check immediately (no added friction), and Skip remains the explicit "leave this blank" affordance where it's offered. Next now consistently means "this has a value"; Skip means "leaving it blank on purpose."

## 6. New i18n keys

Added to `English.json` (placeholder text, per this feature's existing pattern of shipping inline English pending product-owner translation) and mirrored into `Urdu.json`/`RomanUrdu.json` to satisfy `i18n-json/identical-keys`:

`onboardingIntroTitle`, `onboardingIntroBody`, `onboardingIntroRewardChip`, `onboardingIntroCta`, `giftClaimTitle`, `giftClaimBody`, `claimGift`, `maybeLater`.

The claim success toast reuses the existing `youEarned` + `chatCredits` keys already used for per-group rewards — no new key needed there.

## 7. Testing / verification notes

- **Frontend:** `yarn type-check` must stay clean. `isFieldFilled` and `getEyeColorSwatch` are pure functions — add jest coverage the same way the existing `hydrate-group-fields`/resolver pure-logic tests are covered. Gift badge states and the intro-screen flow need manual/device verification (RN component-level jest is broken in this repo — see the project's known local-dev gotchas).
- **Backend:** rewrite `ProfileRewardGrantTest.php` for the claim flow. Local DB is down in this environment (per known local-dev gotchas), so these are authored, not run locally — run against a real DB (staging tinker or CI) before merge, same as the rest of this feature so far.
- **Manual walkthrough once a device/simulator is available:** fresh signup → intro screen appears once → each question blocks Next until answered → complete all 6 groups → gift icon lights up in the onboarding header → claim → balance updates and the icon shows claimed → open the ME profile header → gift icon already shows claimed there too (cross-surface consistency).
