# Onboarding skip removal + gift rework — design

**Date:** 2026-07-16
**Repos:** `app-old/` (mobile, primary) and `admin/` (Laravel backend, one endpoint)
**Branch:** off `staging` (staging-first rule)

## Goal

Four related changes to the signup / profile-completion experience:

1. Remove skip buttons from the pre-signup primer questions.
2. Remove the skip affordance from the post-signup "additional details" flow.
3. Stop giving credits _during_ the additional-details flow; instead present the
   completion gift only at the **end**, gated on the completion threshold.
4. Surface a pending (unclaimed) completion gift with a red dot on the home
   profile icon and its menu.

## Context (as-is)

Signup path: app open → `SignupPrimer` (gender + primer questions) → Google
sign-in → `UserInput` (basic info) → `OnboardingProfile` (6 profile-question
groups = "additional details/info") → `ProfilePicture` → app.

Two independent gift systems exist:

- **Per-group credits** — backend `ProfileRewardService::grantForCompletedGroups`
  awards `PROFILE_GROUP_REWARD_CREDITS_{male,female}` (default 1 chat = 50
  credits) each time a group is fully filled. Invoked from the `updateDetail`
  endpoint (`AuthController` ~L679) and returned as `payload.reward`. The app
  surfaces it as a "You earned +N credits" toast in `OnboardingProfile` and the
  ME editor.
- **Completion gift** — `ProfileRewardService::claimFinishGift`, a one-time bonus
  (`profile_completion_gift_credits`, default 150) claimable once completion ≥
  `profile_completion_threshold_percent` (default 90). Claimed via
  `claimProfileGift` → `GiftClaimModal`. A `GiftBadge` in the OnboardingProfile
  header currently lets users claim this mid-flow.

Home (`Welcome.tsx`): the profile icon is an avatar "account trigger" opening a
popup menu whose first item is **Profile**. `computeGiftStatus(currentUser,
threshold)` already yields `{ strengthPct, claimed, eligible }`.

## Decisions (confirmed with user)

- **Red dot** shows whenever the completion gift is **unclaimed** (not only when
  claimable). Auto-clears once claimed.
- **Per-group credit removal extends to the backend** — the award is removed, not
  just hidden in the app.
- **Onboarding exit is forward-only** — "Finish Later" is removed; Continue is
  always tappable so users can pass through blank questions and always land on
  the end screen.
- **The ≥threshold end screen shows a Claim button** (opens the existing
  `GiftClaimModal`), not an auto-claim.

## Design by task

### Task 1 — `SignupPrimer.tsx`

- Remove the gender-slide footer "Skip for now" (`laterBtn` → `exitFlow`).
- Remove the question-slide header "Skip" ripple.
- Keep `exitFlow` (still used by the reveal CTA and the `!enableMatchCountReveal`
  advance path) and all other logic.

### Task 2 + 3 — `OnboardingProfile.tsx` and the wizard

**`profile-question-wizard.tsx`**

- Add prop `requireAnswer?: boolean` (default `true`). When `false`, the primary
  Next/Continue button's `disabled` condition drops the `!isAnswered` term, so a
  user may advance leaving a question blank. `showSkip` stays `false`; no skip
  button is added. All existing callers keep current behavior (default `true`).

**`OnboardingProfile.tsx`**

- Pass `requireAnswer={false}` to the wizard.
- Remove the **"Finish Later"** ripple and `bailFlow`. Remove the header
  **`GiftBadge`** and its mid-flow tap/claim path (`onGiftBadgePress` and the
  header gift state used only for mid-flow).
- In `onGroupComplete`, remove the per-group reward toast and the
  `reward.new_balance` balance apply. Keep saving `res.detail` and advancing.
- **Rework the `done` phase** into three states, using `strengthPct`
  (already computed) vs `giftThreshold`, and `giftClaimed`:
  - **Eligible & unclaimed** (`strengthPct >= giftThreshold && !giftClaimed`):
    show the gift (reuse `giftReadyTitle` / `giftReadyBody`) with a **Claim**
    button (`claimGift`) that opens `GiftClaimModal`. On claim, persist via the
    existing `onGiftClaimed`, then show the "all set" state with Continue.
  - **Below threshold** (`strengthPct < giftThreshold`): show a new
    "you skipped some details — finish your profile to unlock your gift"
    message with a single Continue. Schedule the profile reminder on exit.
  - **Already claimed**: existing "all set" (`onboardingDoneTitle/Body`) +
    Continue.
- Keep `GiftClaimModal` mounted but reachable only from the done screen.
- `exitFlow` unchanged (cancels reminder, resets to `ProfilePicture`/`BottomTab`).

**`admin/` — remove per-group award**

- In `AuthController::updateDetail`, stop calling
  `profileRewardService->grantForCompletedGroups(...)`; set `payload['reward'] =
null`. The completion gift (`claimFinishGift` / `claimProfileGift`) is
  untouched. `ProfileRewardService::grantForCompletedGroups` may remain for now
  (unused by the endpoint) to keep the diff small, or be removed if no other
  caller uses it — verify during implementation.
- Update the affected tests (`UpdateDetailRewardTest`, `ProfileRewardGrantTest`)
  to assert no per-group award / `reward: null` from `updateDetail`.
  `ClaimProfileGiftEndpointTest` and completion-percent tests stay green.

### Task 4 — `Welcome.tsx` red dot

- Compute `giftPending = !giftStatus.claimed` (reuse existing `giftStatus`).
- Add a small red dot on the avatar/account trigger when `giftPending`
  (distinct from the existing `accountAlertBadge` photo counter and premium
  badge — position so they don't overlap; solid red with a `surface`-colored
  ring).
- Add a matching red dot on the **Profile** menu item row (`accountMenuItems`
  entry with `screen === 'Profile'`). Tapping Profile navigates to the
  self-profile, where the `GiftBadge` on the strength bar lives.
- Dot clears automatically once `giftStatus.claimed` becomes true.

## i18n

Reuse existing: `giftReadyTitle`, `giftReadyBody`, `claimGift`,
`onboardingDoneTitle`, `onboardingDoneBody`, `continue`.

Add (English / Urdu / RomanUrdu / `Keys.tsx`):

- `onboardingSkippedTitle` — e.g. "A few details are still empty"
- `onboardingSkippedBody` — e.g. "Finish your profile to unlock your free-chats
  gift. You can complete it anytime from your profile."

## Out of scope / notes

- The intro-screen copy ("Finish every section and we'll thank you with free
  chats") still describes the completion gift accurately and is left as-is.
- `AddWali` "Skip for now" is a separate (guardian) flow and is not touched.
- No framework/dependency bumps; follow existing patterns, `wp()/hp()` scaling,
  and import-sort.

## Verification

- `yarn type-check` clean in `app-old`.
- Backend: `php artisan test` for the touched reward tests in `admin`.
- Manual: primer has no skip; onboarding has no Finish Later and no mid-flow
  gift; end screen shows gift+Claim at ≥threshold and the skipped message below;
  home shows the red dot until the gift is claimed.
