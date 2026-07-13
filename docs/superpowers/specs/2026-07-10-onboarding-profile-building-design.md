# Onboarding Profile-Building — Design Spec

- **Date:** 2026-07-10
- **Status:** Approved design, ready for implementation planning
- **Scope:** Part 1 of a two-part signup revamp. Part 2 (first-install personalization primer) is a **separate** spec/cycle and is out of scope here.
- **Repos touched:** `app-old/` (React Native, primary) and `admin/` (Laravel, one backend change for the reward).

## 1. Goal

After the core "Tell us about yourself" step (name, DOB, gender), guide the new member through a **grouped, one-question-per-screen** flow that collects the optional profile information which today only lives in the ME section. Maximize how much we capture at signup without turning it into a wall that makes users quit before reaching the app.

Two principles from the product owner:

1. **"No optional should show there."** No "optional" / "skip" labels anywhere in the flow. Unanswered questions are simply not saved; the graceful exit is a per-group checkpoint, not a per-field skip.
2. **Reward completion with chat credits** so users are pulled through each checkpoint — but paced so the reward economics protect revenue (per-gender amounts, paired with free outcome-based motivators, and re-engagement to recapture bailers). See §3.5, §3.5a–c, §7.

This is a monetization-sensitive change (free credits + a config-gated skip of the signup subscription paywall), so the reward and paywall economics are treated as first-class design inputs (§7), not afterthoughts.

## 2. Current state we build on

- **Fresh signup chain** (`AuthWelcome.navigateAfterVerification`, `RootNavigation.getUserData`): `AuthWelcome → PhoneNumber/Otp (or social) → Location → UserInput → ProfilePicture → paywall → BottomTab`. `UserInput.onContinuePress` currently does `navigation.reset({ routes: [{ name: 'ProfilePicture' }] })`.
- **Field definitions:** `src/screens/profile/Data.tsx` — a `Data` object of named groups; each field has `title`, `type` (`input` | `dropDown` | `dropDownBinary` | `scalling`), `id`, `category`, `apiKey`, `data` (options), optional `viewTitle`.
- **Option lists:** fetched from `GET /auth/list/attribute` (`ApiServices.getAttribute`), cached in MMKV under `ATTRIBUTE`, keyed `category → fieldId → [{id,value}]`. Language/nationality load lazily from their own endpoints.
- **Existing wizard:** `src/screens/profile/EditProfileGroup.tsx` is already a one-question-per-screen wizard driven by `route.params.data` (one group) + `title`. It owns `formData`/`activeIndex`, gender-filters via `getVisibleProfileFields`, renders per-type controls (`IconInput`, `ScaleRuler`, `OptionTags`, `PickerButton`), and on finish saves via `updateDetails(formData)` → `POST /auth/update/detail`, then `navigation.goBack()` + success flash. Has tests in `EditProfileGroup.test.tsx`.
- **Save mapping:** `src/screens/profile/Funtions.tsx` (`updateDetails`) maps each field's `selected` to backend `apiKey`s and posts to `/auth/update/detail`.
- **Profile strength:** `computeCompletion` in `src/screens/profile/profile-hub.tsx`; group metadata/icons in `GROUP_META`.
- **Credits backend:** `users.chat_credits` balance + `chat_credit_histories` log + a grant/spend service method in `admin/app/Http/Services/Users/UserService.php` (increments `chat_credits`, applies `CHAT_CREDIT_MULTIPLIER`, writes a history row). `POST /auth/collect/chat-credit` is a **separate** daily-collect mechanism (not reused here).

## 3. Design

### 3.1 Navigation & insertion

- New screen route **`OnboardingProfile`** inserted between `UserInput` and `ProfilePicture` in the fresh signup chain only.
- Change `UserInput.onContinuePress` (the `!fromSettings` branch): after a successful `updateUserInfo`, navigate to `OnboardingProfile` instead of resetting to `ProfilePicture`.
- `OnboardingProfile` exits (both "finish later" and "all done") by continuing the signup chain: `navigation.reset({ index: 0, routes: [{ name: 'ProfilePicture' }] })` (mirrors today's behavior so the paywall/photo logic downstream is unchanged).
- **Not a login gate.** `RootNavigation.getUserData` and `AuthWelcome.navigateAfterVerification` are **not** changed to route into `OnboardingProfile`. If a user force-quits mid-onboarding and relaunches, core-completeness routing sends them onward (ProfilePicture / app); they resume profile-building later from the existing ME profile-strength nudge. Onboarding is offered exactly once, inline in the fresh signup chain.
- **Exit resumes the existing chain:** `OnboardingProfile` still exits to `ProfilePicture`. Whether the signup membership paywall then appears is governed by §3.1a.

### 3.1a Signup membership paywall — config-gated skip

Because onboarding now grants free chat credits, showing a hard subscription paywall immediately after the reward celebration undercuts the goodwill. We make the **signup-time** membership paywall skippable via remote config.

- **Distinction:** the signup interstitial is `ProFeaturesPromotion` (recurring **subscription** pitch), which is different from the contextual `ChatCreditsPaywall` (consumable credits, surfaced in the Messages header via `ChatCreditsBadge` + `presentChatCreditsPaywall`). Skipping the former does **not** remove the latter — users who run out of credits are still offered a purchase in-context. The subscription pitch remains reachable via the existing in-app "Go Premium" entry points (e.g. `PremiumButton`, `MembershipInfo`).
- **The insertion points are duplicated.** The signup paywall is inserted (with `params.from === 'SignUp'`, `navigateTo: 'BottomTab'`) by the near-identical "resolve next signup step" logic in `Otp.tsx`, `AuthWelcome.tsx` (`navigateAfterVerification`), `WelcomeUser.tsx`, and the `Location.tsx` next-step resolver. **Consolidate this into one shared helper** (e.g. `src/navigation/resolve-post-signup-route.ts`) and route all four call sites through it — a targeted cleanup that this change needs anyway.
- **The gate:** a new remote setting read via the settings store (`getSettingByKey`), key `skip_signup_membership_paywall` (boolean). Semantics — **absent or `true` ⇒ skip** (the new default): a non-member is routed straight to `BottomTab`, bypassing `ProFeaturesPromotion`. Explicit **`false` ⇒ show** today's signup paywall — this is how the control cohort / rollback is run. So the friendlier flow ships by default, and re-enabling the paywall (globally or for an A/B cohort) is a settings change, not an app release. (Member users never see it, unchanged.)
- The setting is managed on the `admin/` side (settings are already served by `GET /settings` / `getAppSettings`); adding the key is a settings-data entry, not new API surface.

### 3.2 Architecture — extract a shared wizard (no duplication)

Extract the reusable question-runner from `EditProfileGroup` into a new component **`ProfileQuestionWizard`** (`src/screens/profile/components/profile-question-wizard.tsx`):

- **Owns:** `formData` for one group, `activeIndex`, per-type control rendering (input / scalling / tags / picker), gender filtering (`getVisibleProfileFields`), the within-group progress bar, Back/Next.
- **Does NOT own** saving or navigation. On completing the last question it calls a prop `onComplete(formData)`. Optional props: `primaryLabel` (e.g. "Next"/"Save"/"Continue"), `showBack`.
- **`EditProfileGroup` becomes a thin wrapper** around `ProfileQuestionWizard`: passes its `route.params.data`/`title`, and `onComplete = (formData) => updateDetails(...).then(goBack + flash)`. Its existing behavior and `EditProfileGroup.test.tsx` expectations are preserved.
- **`OnboardingProfile`** uses the same `ProfileQuestionWizard` per group, but its `onComplete` saves and then shows a checkpoint (below).

This keeps all input-type and gender-conditional logic in exactly one place.

**Attribute hydration helper (important):** the logic that merges cached `ATTRIBUTE` option lists into a group's fields and injects the user's currently-saved `selected` values currently lives inline in `Profile.tsx` (`getAttribute`, ~lines 261–339). Extract it into a shared helper (e.g. `src/screens/profile/hydrate-group-fields.ts`) so `OnboardingProfile` builds hydrated group data exactly the way ME does. Timing matters: the `ATTRIBUTE` cache is populated on the home screen (`Welcome.tsx`), which runs **after** onboarding in the fresh signup chain — so `OnboardingProfile` must **fetch `getAttribute` on mount** (it is normally not cached yet at this point) and hydrate from the result. Fields that need no remote options (`input`, `scalling`, `dropDownBinary`) work regardless.

### 3.3 Group sequencing

`OnboardingProfile` walks these six groups from `Data.tsx`, in this default order (order is a single config array, trivially reorderable):

1. `appearance-0` — Appearance & health (ruler warm-up: height/weight, then body type, complexion, eye color, disabilities)
2. `islamicval-0` — Islamic values (prayer, sect, commitment, hijab **(F)** / beard **(M)**, revert)
3. `life-0` — Lifestyle (education, profession, earnings, marital status, children, smoking, drinking, car, business, pets, house)
4. `futureplan-0` — Future plans (family plans, marriage timeline, relocation)
5. `familybg-0` — Family background (ethnicity, language, nationality, caste)
6. `personality-0` — Personality (about you, about partner, likes, dislikes, polygamy) — long free-text last

Gender conditionals already handled by `getVisibleProfileFields` (beard male-only, hijab female-only, "Widowed" filtered from marital status for males). The `wali-0` group is **excluded** (separate AddWali flow). Interests/hobbies (`EditInterests`), tagline, and photos are **out of scope** for this flow (photos are the next screen already).

### 3.4 Per-question & checkpoint UX

- Within a group: `Next` is **always enabled** (answering is never required). No "optional"/"skip" wording. Unanswered questions are omitted from the save. The wizard's within-group progress bar (already built) shows "question i of n".
- `OnboardingProfile` frames the wizard with an **overall header**: "Group i of 6" label + a **profile-strength meter** (`computeCompletion` over the merged detail) that visibly climbs.
- After each group's last question, `OnboardingProfile` saves that group (`updateDetails`) and shows a **checkpoint screen**:
  - Updated strength %.
  - If the save response awarded credits: a celebratory "You earned +N chat credits" moment.
  - Two actions: **Continue** (→ next group) and **Finish later** (→ exit to `ProfilePicture`). Both are equal-weight; neither is labeled "skip".
- After the final group: a **completion summary** (total earned + finish bonus) → Continue → `ProfilePicture`.
- Saving happens at group boundaries (checkpoints). Answers entered in a group that is abandoned mid-way (app kill / back-gesture out of the flow) before its checkpoint are not persisted — acceptable; recoverable from ME.

### 3.5 Reward system (server-decided, abuse-safe)

No new endpoint. The existing `POST /auth/update/detail` **response is extended** to report any reward the save triggered. The server — not the client — decides rewards, so they can't be farmed.

**Backend (`admin/`) changes:**

- Track already-rewarded groups per user: add `users.rewarded_profile_groups` (JSON array of group keys) and a boolean `users.profile_finish_bonus_awarded` (or a single JSON blob). Migration + model `$fillable`/`$casts`.
- In `AuthController@updateDetail`, after persisting the detail:
  1. Compute which groups are now **complete**. A group is complete when **every gender-applicable field** in it (per the same visibility rules as the app) has a non-null saved value. Binary `0`/`false` counts as answered; free-text must be a non-empty string.
  2. For each newly-complete group not in `rewarded_profile_groups`: grant the **gender-specific** per-group credit amount via the existing credit-grant service (type `earned`, description `"Profile completion reward: <group>"`), and add the group to `rewarded_profile_groups`.
  3. If all six in-scope groups are complete and `profile_finish_bonus_awarded` is false: grant the **gender-specific** finish bonus, set the flag.
  4. Return, alongside the existing payload, a `reward` object: `{ awarded: <int credits this call>, reason: 'group' | 'finish' | 'group+finish' | null, new_balance: <int>, rewarded_groups: [<keys>] }`.
- Reward math must go through the existing credit service so the displayed number matches how credits are shown elsewhere (verify `CHAT_CREDIT_MULTIPLIER` interaction so "+N" shown to the user is the real granted amount).

**Frontend:** `OnboardingProfile` reads `reward` from the `updateDetails` response and celebrates on the checkpoint / completion screen. No client-side reward computation.

Reward pacing (approved): **per-group reward + a larger finish bonus.**

#### 3.5a Gender-differentiated economics

Reward generosity should be **inverse to how much a gender drives revenue**. Free credits given to the non-paying side are cheap and _increase marketplace liquidity_ (more active members on that side → more reason for the paying side to convert); free credits given to the paying side are a direct discount on revenue.

- Amounts are **per-gender config**, not a single value: `PROFILE_GROUP_REWARD_CREDITS_{MALE,FEMALE}` and `PROFILE_FINISH_BONUS_CREDITS_{MALE,FEMALE}`. The backend picks by `user.gender`.
- **Direction to confirm from real data (§7):** which gender actually purchases (credits/subscriptions). The recommended default once confirmed: **more generous to the non-payer**, leaner (credits) + outcome-led (below) for the payer. Do **not** hardcode an assumption in code — the per-gender config expresses whatever the data supports.
- The paywall-skip flag (§3.1a) may likewise be tuned per gender later; for v1 it stays a single flag, but the resolver is written so a per-gender variant is a small extension.

#### 3.5b Outcome-based motivators (not only credits)

Credits are the most revenue-expensive reward and are least legible to a brand-new user who has never chatted. So credits are **paired with**, not the sole driver of, completion motivation:

- **Match-quality framing** (frontend, ships now): honest persuasion in the intro/checkpoints — "Complete profiles get more interest," "Members who finish are shown to more compatible matches." Copy only, no backend.
- **Profile-strength meter + a "complete profile" badge** (frontend, ships now): the badge renders on the user's own profile and, where profiles are shown to others, signals completeness. Uses existing `computeCompletion`.
- **Visibility boost for completers** (backend, **Phase 2 / optional**): higher placement in search & recommendations for a completed profile. Flagged as a dependency that may not exist yet; the flow does not depend on it. If/when added, it becomes the primary _payer-side_ motivator so we can keep their credit reward lean.

The credit amounts in §3.5a should be sized **assuming these non-credit motivators carry part of the load**, so we are not over-paying in the expensive currency.

### 3.5c Re-engagement for incomplete profiles

"Finish later" only serves the "grab maximum info" goal if people actually come back. A passive ME nudge alone won't do it, so we add **active** recapture:

- **Home-screen banner** (frontend, ships now): while `computeCompletion` is below a threshold, show a dismissible card on the home surface — "Your profile is {n}% complete. Finish it to get seen by more matches" + a "Continue" CTA that deep-links back into `OnboardingProfile` at the first unfinished group. More prominent than the existing ME nudge.
- **Local reminder notification** (frontend, ships now): using the app's existing notifee/FCM setup, schedule a one-shot local notification some hours after a bail ("You're {n}% there — finish your profile to unlock more matches"), cancelled once the profile is complete. No backend campaign needed.
- **Server-driven re-engagement campaign** (backend, **Phase 2 / optional**): push/email sequences to incomplete profiles. Out of scope for v1; the local mechanisms above cover the immediate need.
- Resuming from any of these re-enters `OnboardingProfile`; because rewards are server-side (§3.5), completing later still earns the per-group/finish credits once each.

### 3.6 Styling, i18n, RTL

- Reuse the redesigned card/token language from the `UserInput` work (surface cards, hairline borders, `primary`/`lavender`/`ink`/`muted` tokens, serif display for headers), `wp`/`hp` scaling, `Button`/`Text` primitives.
- All new copy goes through `t()` with keys added to `Keys.tsx` + all three locale JSONs (English, Urdu, RomanUrdu) to keep `i18n-json/identical-keys` parity. New keys: onboarding intro, group-of-N label, checkpoint title/body, reward line ("You earned +{n} chat credits"), Continue, Finish later, completion summary, finish-bonus line.
- RTL: follow existing patterns (`CheckRtl`), consistent with the profile wizard which is already RTL-aware.

### 3.7 Files

**Create (app-old):**

- `src/screens/profile/components/profile-question-wizard.tsx` — extracted shared wizard.
- `src/screens/profile/hydrate-group-fields.ts` — extracted attribute-options + saved-selection hydration helper (from `Profile.tsx`).
- `src/screens/onboardingProfile/OnboardingProfile.tsx` + `index.tsx` — the container.
- `src/screens/onboardingProfile/components/*` — checkpoint card, strength header, completion summary, reward celebration.
- A **profile-completion prompt** component for the home surface (banner CTA deep-linking back into `OnboardingProfile`) and a small **"complete profile" badge** (§3.5b, §3.5c).
- A local-notification scheduler for the incomplete-profile reminder (§3.5c), using the existing notifee/FCM helpers in `src/notifications/`.

**Modify (app-old):**

- `src/screens/profile/EditProfileGroup.tsx` — refactor to wrap `ProfileQuestionWizard` (behavior preserved).
- `src/screens/userInput/UserInput.tsx` — signup-path continue → `OnboardingProfile`.
- `src/navigation/RootNavigation.tsx` — register `OnboardingProfile`; `src/screens/index.tsx` export.
- `src/services/api/*` — extend `updateDetails` response typing to include optional `reward`.
- `src/languages/Keys.tsx`, `English.json`, `Urdu.json`, `RomanUrdu.json` — new keys.
- **New** `src/navigation/resolve-post-signup-route.ts` — shared next-step resolver with the config-gated paywall skip (§3.1a).
- `src/screens/otp/Otp.tsx`, `src/screens/phoneNumber/AuthWelcome.tsx`, `src/screens/welcomeUser/WelcomeUser.tsx`, `src/screens/location/Location.tsx` — route their duplicated signup next-step logic through the shared resolver.

**Modify (admin):**

- Migration for `rewarded_profile_groups` + finish-bonus flag; `User` model casts/fillable.
- `AuthController@updateDetail` — completeness check + **gender-aware** reward grant + `reward` in response.
- Config/env entries for the **per-gender** reward amounts (§7.5).
- Settings entry for `skip_signup_membership_paywall` (§3.1a).

## 4. Data flow

1. `UserInput` saves core info → navigates to `OnboardingProfile`.
2. `OnboardingProfile` fetches `getAttribute` on mount (the cache is usually empty this early in the fresh signup chain), then builds the ordered, gender-filtered group list from `Data.tsx` hydrated via the shared attribute-hydration helper (§3.2).
3. Per group: `ProfileQuestionWizard` collects answers → `onComplete(formData)` → `updateDetails` → `/auth/update/detail`.
4. Server saves, computes completeness, grants any due reward, returns detail + `reward`.
5. `OnboardingProfile` updates local user/detail + strength meter, shows checkpoint with any reward, offers Continue / Finish later.
6. After last group → completion summary → `ProfilePicture` (signup chain resumes).

## 5. Error handling & edge cases

- **Save failure at a checkpoint:** keep the user on the group, show an error flash, allow retry; don't advance or lose entered answers.
- **`ATTRIBUTE` fetch fails on mount:** the cache is expected to be empty this early, so fetch is the normal path (§3.2). If the fetch itself fails, still render `input`/`scalling`/`dropDownBinary` questions (which need no remote options) and skip option-less dropdowns gracefully rather than blocking; allow a retry.
- **Reward absent/legacy backend:** if the response has no `reward` field (e.g., app hits an un-upgraded API), the flow works unchanged and simply shows no credit celebration. The frontend must treat `reward` as optional.
- **Gender edge:** `currentUser.gender` is `male`/`female`; visibility helpers already handle the conditional fields. No "Other" gender in the live core flow.
- **Resume from ME earns rewards too:** because rewards are server-side on `update/detail`, completing groups later via ME also grants the per-group/finish rewards (once each). Intended.
- **Back gesture / hardware back inside a group:** returns to the previous question; backing out before a checkpoint discards that group's unsaved answers (documented, acceptable).
- **Settings unavailable for the paywall flag:** if app settings fail to load, `getSettingByKey('skip_signup_membership_paywall')` is undefined, which per §3.1a means **skip** — consistent with the default; the user still reaches the app.

## 6. Testing

- **`ProfileQuestionWizard`:** renders each control type; Next/Back move `activeIndex`; `onComplete` receives the full `formData`; gender filtering hides the right fields.
- **`OnboardingProfile`:** sequences groups in order; checkpoint shows updated strength; "Finish later" resets to `ProfilePicture`; celebrates when the (mocked) response includes `reward`; tolerates a response without `reward`.
- **`EditProfileGroup`:** existing `EditProfileGroup.test.tsx` still passes after the refactor.
- **Backend:** group-completeness respects gender rules; each group rewards once (idempotent on repeat saves); finish bonus once; **per-gender amounts applied correctly** (a male and a female completing the same group receive their respective configured amounts); `reward` shape correct.
- **Re-engagement:** the home banner appears below the strength threshold and deep-links to the first unfinished group; the local reminder schedules on bail and cancels on completion (§3.5c).
- **Resolver:** `resolve-post-signup-route` skips the paywall when the flag is absent/true and shows it when explicitly false, for non-members only (§3.1a).
- **Caveat:** `app-old` jest setup is currently flagged BROKEN in project docs. Where the runner can't execute, tests are still authored and a manual verification checklist is provided; fixing jest is not in scope for this feature.

## 7. Business model inputs, metrics & guardrails

The reward and paywall economics are **required planning inputs, not `TBD` config to be picked arbitrarily** — they are the load-bearing business decision of this feature. Before amounts are finalized:

### 7.1 Credit economics to model

- Establish **what a chat costs in credits** (from the credit service / `CHAT_CREDIT_MULTIPLIER` semantics) and translate rewards into **"how many chats does a fully-completed profile buy for free."**
- Size per-gender amounts (`PROFILE_GROUP_REWARD_CREDITS_{MALE,FEMALE}`, `PROFILE_FINISH_BONUS_CREDITS_{MALE,FEMALE}`) so that free credits **do not cover more than a small number of first-session chats for the paying gender** — the first-session paying trigger must still fire. The non-paying gender can be more generous (liquidity, §3.5a).
- Account for the daily free-collect mechanism (`collect/chat-credit`) already in the app so total giveaways don't stack into "never needs to pay."

### 7.2 Data to confirm

- **Who pays** (credits and subscriptions) by gender — sets the §3.5a direction.
- `CHAT_CREDIT_MULTIPLIER` semantics so the displayed "+N" equals what's granted.
- Default group order (§3.3) and the strength threshold that triggers the re-engagement banner/notification (§3.5c).

### 7.3 Success metrics (instrument these)

- Profile-completion rate and **per-group drop-off** (where people bail).
- First-session **activation** (did they view/like/message anyone) and time-to-first-value.
- **Week-1 revenue per new user** and **subscription conversion**, compared across the paywall-skip cohorts (§3.1a `skip_signup_membership_paywall` true vs false).
- Re-engagement recapture rate (how many "finish later" users return and complete).

### 7.4 Guardrails

- Shipping paywall-skip by default is only sound **with a committed measurement of skip-vs-show**. If week-1 revenue per new user drops beyond an agreed threshold, flip the flag (or a cohort of it) back — no app release required.
- If a gender's free credits are observed to suppress that gender's purchases, reduce that gender's amounts via config.

### 7.5 Config keys (final values set from the above)

- `PROFILE_GROUP_REWARD_CREDITS_MALE`, `PROFILE_GROUP_REWARD_CREDITS_FEMALE`
- `PROFILE_FINISH_BONUS_CREDITS_MALE`, `PROFILE_FINISH_BONUS_CREDITS_FEMALE`
- `skip_signup_membership_paywall` (settings key; absent/true ⇒ skip, false ⇒ show — §3.1a)
- Re-engagement strength threshold + reminder delay (§3.5c)

## 8. Out of scope (this spec) / Phase 2

- Part 2 (first-install personalization primer + public match-count endpoint) — separate spec.
- Interests/hobbies, tagline, and photo collection inside this flow.
- Any redesign of the ME section beyond the `EditProfileGroup` refactor.
- Adding new profile attributes/fields.
- **Phase 2 (dependent on backend, not required for v1):** visibility/search boost for completed profiles (§3.5b), and server-driven re-engagement push/email campaigns (§3.5c). v1 ships the frontend motivators (framing, badge, strength meter, home banner, local reminder) and gender-differentiated credits.

## 9. Dependencies & rollout

- The `admin/` reward change should ship **with or before** the app change; the app degrades gracefully without it (no celebration), so ordering is not hard-blocking.
- Follow the staging-first workflow: branch from `staging`, merge to `staging` first, in both repos.
- Respect checked-in framework versions; no dependency bumps.
