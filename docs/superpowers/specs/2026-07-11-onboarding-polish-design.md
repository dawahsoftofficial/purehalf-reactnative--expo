# Onboarding Polish — Intro Screen, Completion Gift, Required Answers, Eye Color Swatches — Design Spec

- **Date:** 2026-07-11
- **Status:** Approved design, ready for implementation planning
- **Scope:** Four small, related enhancements to the `OnboardingProfile` wizard shipped by the 2026-07-10 onboarding-profile-building spec/plans. Item 4 explicitly **supersedes** one decision from that spec (§3.4 "Next is always enabled") — see §5.
- **Repos touched:** `app-old/` (all four items) and `admin/` (backend changes for item 2 only).

## 1. Goal

Four incremental improvements to the `OnboardingProfile` wizard (`src/screens/onboardingProfile/OnboardingProfile.tsx`) and the shared `ProfileQuestionWizard` it's built on:

1. **Intro screen** — a framing screen before the first question, previewing the completion reward.
2. **Completion gift** — turn the existing silent "finish bonus" into a visible, tap-to-claim free-credit gift (admin-tunable amount and completion threshold, defaults 150 credits / 90%), surfaced via a gift icon on both the onboarding header and the ME profile header.
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

**Reframes an existing mechanism instead of adding a parallel one.** `ProfileRewardService::grantForCompletedGroups` (admin) already auto-grants a silent "finish bonus" (`profile_finish_bonus_awarded` flag, currently a 3-credit placeholder, never tuned/shipped) the instant all 6 groups are complete. That becomes this gift: same flag, no new migration for it — but changes from auto-granted to claim-gated.

**Threshold, not "all fields, no exceptions."** The gift fires once overall completion crosses an admin-tunable **percentage threshold** (default 90%), not literally every field in every group. This matters mechanically: the app's own completion meter (`computeCompletion`) counts two points the onboarding wizard never touches — interests and tagline, both out of scope for the 6-group wizard per the original spec — so a 100%-only gate would make the gift unreachable from inside onboarding itself, only ever claimable later from the ME profile header. A percentage threshold below 100 (default 90%, comfortably below the ~94–97% ceiling the wizard alone can reach) makes finishing all 6 onboarding groups sufficient on its own, while still being genuinely tied to real completion — not just "tapped Next six times" (§5's required-answer gating is what makes that true: every field is guaranteed filled, not just visited).

**Both the threshold and the credit amount are admin-tunable Settings, not config/env values** — per an explicit ask: these numbers need to be adjustable without a redeploy. This repo already has a `settings` table (`Setting` model: `key`/`value`/`type`, with `value` auto-cast by an accessor based on `type` — `integer` casts to a real PHP `int`) surfaced publicly via `GET v1/app/settings` and consumed on the app side through `useSettingsStore().getSettingByKey<T>(key)`. The existing `skip_signup_membership_paywall` flag (from the prior onboarding spec) is the precedent: a dedicated migration seeds the row, and it's editable afterward through the existing generic admin Settings CRUD with zero extra code.

### Backend (`admin/`)

- New migration seeding two `type: 'integer'` Setting rows (mirrors the existing `add_signup_primer_settings.php` idiom of looping `Setting::create()` for multiple flags in one migration):
  - `profile_completion_gift_credits` — default **150**.
  - `profile_completion_threshold_percent` — default **90**.
    Both immediately editable via the existing generic `admin.setting.edit` UI once seeded — no controller/route work needed for either read or write.
- `config/chat_credit.php`: remove the `profile_finish_bonus` block entirely (dead now that the amount lives in Settings) — leave a short comment pointing at where it moved, so it doesn't get silently re-added out of habit. `profile_group_reward` (the existing per-group micro-rewards) is untouched.
- `ProfileRewardService.php`:
  - Extract the per-field fill-counting already inside `completedGroups()` into a shared `groupFieldCounts()` helper, so the existing per-group boolean check and the new percentage calculation can never silently diverge from each other.
  - Add `completionPercent(User $user): int` — sums filled/total across all 6 groups via `groupFieldCounts()`, plus one point each for `interest_id` non-empty and `tagline` non-empty, rounded — this is a straight PHP port of the app's `computeCompletion`, so the number the backend checks against the threshold is the same number the app already shows the user on their progress bar.
  - Add `isGiftEligible(User $user): bool` — `completionPercent($user) >= ` the `profile_completion_threshold_percent` setting (default 90 if the row is somehow missing).
  - Remove the finish-bonus block from `grantForCompletedGroups()` (per-group micro-rewards untouched).
  - Add `claimFinishGift(User $user): array` returning a status: `already_claimed` (flag already set — return current balance, no grant), `not_eligible` (fails `isGiftEligible`, no grant), or `claimed` (grants the `profile_completion_gift_credits` setting's amount via the existing `UserService::updateChatCredit`, sets `profile_finish_bonus_awarded = true`, returns `awarded`/`new_balance`/`multiplier`).
- `AuthController.php`: new `claimProfileGift()` (no request body needed — mirrors the existing parameterless `collectChatCredit()` action, not a `FormRequest`-typed one like most of this controller) calling the service and mapping status to the controller's existing `success()`/`error()` response helpers.
- `routes/api.php`: `Route::post('profile/claim-gift', [AuthController::class, 'claimProfileGift']);` next to `update/detail`, inside the existing authenticated `auth` group.
- `admin/tests/Feature/ProfileRewardGrantTest.php` currently asserts the old auto-grant behavior and needs rewriting: not-eligible below threshold, claimed once at/above threshold, already-claimed (idempotent) on a second call. Tests set the two Settings rows directly (`Setting::where('key', ...)->update(...)` or create them in a `setUp()`) rather than `config([...])`, since these are no longer config values.

### Frontend (`app-old/`)

- `settings-store.ts`: add `| number` to the `SettingValue` union (currently has no bare-number member), then two getters following the existing `getSkipSignupMembershipPaywall`/`getForceUpdate` one-liner pattern: `getProfileCompletionGiftCredits()` (default 150) and `getProfileCompletionThresholdPercent()` (default 90) — same fallback-default values as the backend migration, so a not-yet-fetched settings store still behaves sensibly.
- `EndPoints.tsx`: `claimProfileGift: '/auth/profile/claim-gift'`. `Services.tsx`: a `claimProfileGift()` method mirroring the existing `collectChatCredits` promise pattern.
- New presentational component `src/screens/profile/components/gift-badge.tsx` — a gift icon chip with three states: **not eligible** (below threshold, muted/grey, non-interactive), **eligible & unclaimed** (solid primary color, tappable), **claimed** (checkmark, non-interactive — reusing the checkmark/`Colors.verified` treatment already used on the wizard's `'done'` badge). Stays "dumb" like the existing `CompletionCard`; tapping it while eligible just opens the modal below. It does **not** need its own loading state — the in-flight claim spinner lives on the modal's Claim button instead (see next bullet).
- New shared `src/screens/profile/components/gift-claim-modal.tsx`, styled after the existing blur-info modal pattern in `Header.tsx` (icon chip, title, body, two buttons): _"You've completed your profile!"_ / _"Claim {{amount}} free chat credits — our gift for finishing your full profile."_ / **Claim Gift** / **Maybe Later**. The body copy interpolates the live `getProfileCompletionGiftCredits()` value (i18next `{{amount}}`, same interpolation syntax already used elsewhere in `English.json`) rather than hardcoding 150 — the whole point of making it a Setting is that an admin can change it without a release, so the copy has to track that. This is the first place the actual number appears (the intro screen's chip deliberately stays number-free — see §2). The Claim Gift button uses the shared `Button` component's existing `loading`/`loadingMessage` props while the API call is in flight — no separate state needed on `GiftBadge` itself.
- Two wire-up sites, both reading `eligible` as `strengthPct >= getProfileCompletionThresholdPercent()` and `claimed` from `currentUser.profile_finish_bonus_awarded` (already a plain, non-hidden field on the `User` model — no serialization change needed):
  1. `OnboardingProfile.tsx` — `GiftBadge` at the end of `Styles.headerRow`, after "Finish Later." Reachable in practice: the wizard's own `strengthPct` tops out around 94–97% (interests/tagline are the only pieces it can't fill), comfortably above the 90% default threshold once every field is actually answered — which §5's required-answer gating now guarantees.
  2. `Header.tsx`, own-profile branch (`renderSelfHeader`) — `GiftBadge` inside `Styles.strengthRow`, after the percentage text, under the same `typeof profileStrength === 'number'` guard that already wraps the meter.
  - On claim: call `ApiServices.claimProfileGift()`, then update `currentUser` (`chat_credits: result.new_balance`, `profile_finish_bonus_awarded: true`) via `setData` + `updateCurrentUser` — the same pattern `OnboardingProfile.onGroupComplete` already uses — and flash a success message reusing the existing `youEarned`/`chatCredits` keys (the same toast copy already used for per-group rewards).
  - The claim is always backend-authoritative regardless of what the local percentage shows: `claimFinishGift` recomputes `completionPercent` server-side from the database against the live threshold setting, so a stale local `currentUser` snapshot or a client/server rounding difference can never over- or under-grant.
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

`onboardingIntroTitle`, `onboardingIntroBody`, `onboardingIntroRewardChip`, `onboardingIntroCta`, `giftClaimTitle`, `giftClaimBody` (takes a `{{amount}}` interpolation — see §3), `claimGift`, `maybeLater`.

The claim success toast reuses the existing `youEarned` + `chatCredits` keys already used for per-group rewards — no new key needed there.

## 7. Testing / verification notes

- **Frontend:** `yarn type-check` must stay clean (including the `settings-store.ts` `SettingValue` union gaining `| number`). `isFieldFilled` and `getEyeColorSwatch` are pure functions — add jest coverage the same way the existing `hydrate-group-fields`/resolver pure-logic tests are covered. Gift badge states and the intro-screen flow need manual/device verification (RN component-level jest is broken in this repo — see the project's known local-dev gotchas).
- **Backend:** rewrite `ProfileRewardGrantTest.php` for the claim flow, and add coverage for the new `profile/claim-gift` HTTP route. Since the gift's amount/threshold are now Settings rows rather than config values, tests set them via `Setting::where('key', ...)->update(...)` (or create them directly) instead of `config([...])`. Local DB is down in this environment (per known local-dev gotchas), so these are authored, not run locally — run against a real DB (staging tinker or CI) before merge, same as the rest of this feature so far.
- **Manual walkthrough once a device/simulator is available:** fresh signup → intro screen appears once → each question blocks Next until answered → complete all 6 groups → gift icon lights up in the onboarding header → claim → balance updates and the icon shows claimed → open the ME profile header → gift icon already shows claimed there too (cross-surface consistency) → in the admin panel, edit the `profile_completion_gift_credits`/`profile_completion_threshold_percent` settings and confirm a fresh claim reflects the new values without an app release.
