# Onboarding Skip Removal + Gift Rework — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove signup/onboarding skip buttons, stop giving credits during profile completion, present the completion gift only at the end (gated on threshold), and add a home red dot for an unclaimed gift.

**Architecture:** Mostly surgical edits in the React Native app (`app-old/`) plus one Laravel endpoint change (`admin/`). No new components — reuse existing `GiftClaimModal`, `computeGiftStatus`, and i18n keys. The onboarding wizard gains one optional prop; the onboarding "done" screen becomes a 3-way conditional.

**Tech Stack:** React Native 0.82 + TS (app-old), Laravel 12 / PHP 8.2 (admin). Yarn, jest, tsc. PHPUnit.

## Global Constraints

- Branch already created off `staging`: `feat/onboarding-skip-gift-rework` (app-old). For `admin/`, create `feat/onboarding-skip-gift-rework` off its `staging` too. Never commit to `main`.
- Do NOT stage the unrelated pre-existing working-tree changes in app-old (`src/screens/photosAndVideos/PhotosAndVideos.tsx`, `src/screens/profileIntro/ProfileIntroVideo.tsx`, `src/screens/profileIntro/ProfileIntroVoice.tsx`). Stage only the files each task names.
- No framework/dependency bumps. Follow existing patterns: `wp()`/`hp()` scaling, `import type`, simple-import-sort (linter auto-fixes on commit via husky/lint-staged — don't hand-order imports).
- Every user-visible string goes through a `LanguageKeys` key present in `Keys.tsx` + `English.json` + `Urdu.json` + `RomanUrdu.json`.
- Verification per RN task: `cd "D:/GitHub/Pure Half/app-old" && yarn type-check` must stay clean. jest is unreliable in this repo — do not add new jest specs for UI; rely on type-check + the manual checks noted.
- Remove any import left unused by an edit (eslint may flag it and block the commit hook).

---

### Task 1: Add the "you skipped some details" i18n keys

**Files:**

- Modify: `src/languages/Keys.tsx` (after line 28, `onboardingDoneBody`)
- Modify: `src/languages/English.json` (after line 183, `onboardingDoneBody`)
- Modify: `src/languages/Urdu.json` (after line 177)
- Modify: `src/languages/RomanUrdu.json` (after line 180)

**Interfaces:**

- Produces: `LanguageKeys.onboardingSkippedTitle`, `LanguageKeys.onboardingSkippedBody` (used by Task 4).

- [ ] **Step 1: Add the keys to `Keys.tsx`**

In `src/languages/Keys.tsx`, immediately after the `onboardingDoneBody: 'onboardingDoneBody',` line (line 28), add:

```ts
  onboardingSkippedTitle: 'onboardingSkippedTitle',
  onboardingSkippedBody: 'onboardingSkippedBody',
```

- [ ] **Step 2: Add English strings**

In `src/languages/English.json`, after the `onboardingDoneBody` line, add:

```json
    "onboardingSkippedTitle": "A few details are still empty",
    "onboardingSkippedBody": "Finish your profile to unlock your free-chats gift. You can complete it anytime from your profile.",
```

- [ ] **Step 3: Add Urdu strings**

In `src/languages/Urdu.json`, after the `onboardingDoneBody` line (177), add:

```json
    "onboardingSkippedTitle": "کچھ تفصیلات ابھی باقی ہیں",
    "onboardingSkippedBody": "اپنا تحفہ (مفت چیٹس) حاصل کرنے کے لیے اپنا پروفائل مکمل کریں۔ آپ اسے کسی بھی وقت اپنے پروفائل سے مکمل کر سکتے ہیں۔",
```

- [ ] **Step 4: Add Roman Urdu strings**

In `src/languages/RomanUrdu.json`, after the `onboardingDoneBody` line (180), add:

```json
    "onboardingSkippedTitle": "Kuch tafseelat abhi baqi hain",
    "onboardingSkippedBody": "Apna tohfa (muft chats) hasil karne ke liye apna profile mukammal karein. Aap ise kisi bhi waqt apne profile se mukammal kar sakte hain.",
```

- [ ] **Step 5: Verify type-check**

Run: `cd "D:/GitHub/Pure Half/app-old" && yarn type-check`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
cd "D:/GitHub/Pure Half/app-old"
git add src/languages/Keys.tsx src/languages/English.json src/languages/Urdu.json src/languages/RomanUrdu.json
git commit -m "feat(i18n): add onboarding skipped-gift copy"
```

---

### Task 2: Remove skip buttons from `SignupPrimer`

**Files:**

- Modify: `src/screens/signupPrimer/SignupPrimer.tsx` (gender-phase footer ~265-269; question-phase header ~366-368)

**Interfaces:** none consumed/produced.

- [ ] **Step 1: Remove the gender-slide "Skip for now" footer**

In `SignupPrimer.tsx`, delete this block (the `<View style={Styles.footer}>` that ends the gender phase, currently lines 265-269):

```tsx
<View style={Styles.footer}>
  <Ripple style={Styles.laterBtn} onPress={exitFlow}>
    <RNText style={Styles.laterTxt}>Skip for now</RNText>
  </Ripple>
</View>
```

Leave the `</Container>` that follows it. `exitFlow` stays defined (used by the reveal CTA and the no-reveal advance path).

- [ ] **Step 2: Remove the question-slide "Skip" ripple**

In the questions-phase header row, replace this block (currently 366-368):

```tsx
<Ripple onPress={advance}>
  <RNText style={Styles.laterTxt}>Skip</RNText>
</Ripple>
```

with nothing — delete it. The header row keeps the back button + question counter on the left. (The row uses `justifyContent: 'space-between'`; with only the left group present the layout stays fine.)

- [ ] **Step 3: Verify type-check**

Run: `cd "D:/GitHub/Pure Half/app-old" && yarn type-check`
Expected: no errors. (`Styles.laterBtn` / `Styles.laterTxt` may now be unused style keys — leave them; RN does not error on unused StyleSheet entries and other flows may reference `laterTxt`. Confirm `laterTxt` is still referenced by the reveal/gender copy; if truly unused, removal is optional and not required to pass.)

- [ ] **Step 4: Commit**

```bash
cd "D:/GitHub/Pure Half/app-old"
git add src/screens/signupPrimer/SignupPrimer.tsx
git commit -m "feat(signup): remove skip buttons from primer"
```

**Manual check:** primer gender slide shows no "Skip for now"; each question slide shows no "Skip".

---

### Task 3: Add `requireAnswer` prop to the profile question wizard

**Files:**

- Modify: `src/screens/profile/components/profile-question-wizard.tsx` (props type ~449-465; destructure ~467-479; primary button disabled condition ~882-886)

**Interfaces:**

- Produces: `ProfileQuestionWizard` accepts `requireAnswer?: boolean` (default `true`). When `false`, the primary Next/Continue button is enabled even when the active question is unanswered.

- [ ] **Step 1: Add the prop to the type**

In `ProfileQuestionWizardProps` (starts ~line 449), add after the `showSkip?: boolean;` line:

```ts
  requireAnswer?: boolean;
```

- [ ] **Step 2: Destructure it with a default**

In the component signature (starts ~line 467), add after `showSkip = true,`:

```ts
  requireAnswer = true,
```

- [ ] **Step 3: Relax the primary button gate**

In the primary `<Button>` (currently ~872-887), the `onPress`/`disabled` use `saving || visibleFields.length === 0 || !isAnswered`. Change BOTH the `onPress` guard and the `disabled` prop from:

```tsx
              onPress={
                saving || visibleFields.length === 0 || !isAnswered
                  ? undefined
                  : advance
              }
              disabled={saving || visibleFields.length === 0 || !isAnswered}
```

to:

```tsx
              onPress={
                saving ||
                visibleFields.length === 0 ||
                (requireAnswer && !isAnswered)
                  ? undefined
                  : advance
              }
              disabled={
                saving ||
                visibleFields.length === 0 ||
                (requireAnswer && !isAnswered)
              }
```

- [ ] **Step 4: Verify type-check**

Run: `cd "D:/GitHub/Pure Half/app-old" && yarn type-check`
Expected: no errors. Existing callers (`EditProfileGroup`, onboarding) compile unchanged (default `true` preserves current behavior).

- [ ] **Step 5: Commit**

```bash
cd "D:/GitHub/Pure Half/app-old"
git add src/screens/profile/components/profile-question-wizard.tsx
git commit -m "feat(profile): add requireAnswer prop to question wizard"
```

---

### Task 4: Rework `OnboardingProfile` — no skip, no mid-flow gift, gift-at-end

**Files:**

- Modify: `src/screens/onboardingProfile/OnboardingProfile.tsx`

**Interfaces:**

- Consumes: `LanguageKeys.onboardingSkippedTitle/Body` (Task 1); `requireAnswer` prop (Task 3); existing `giftEligible`, `giftClaimed`, `strengthPct`, `exitFlow`, `bailFlow`, `GiftClaimModal`, `claimGift`, `onGiftClaimed`.

- [ ] **Step 1: Add an `openGiftModal` callback**

After `const closeGiftModal = useCallback(() => setGiftModalVisible(false), []);` (line 162), add:

```tsx
const openGiftModal = useCallback(() => setGiftModalVisible(true), []);
```

- [ ] **Step 2: Remove the mid-flow gift-badge handler**

Delete the entire `onGiftBadgePress` callback (currently lines 164-178, the comment block plus the `useCallback`). It is only used by the header GiftBadge, which is being removed.

- [ ] **Step 3: Remove the per-group reward toast + balance apply in `onGroupComplete`**

In `onGroupComplete`, replace the `.then(async (res: any) => {...})` body (currently ~219-249) so it no longer reads `reward`. New body:

```tsx
        .then(async (res: any) => {
          if (res?.detail) {
            const updatedUser: any = {
              ...(currentUser as any),
              detail: res.detail,
            };
            await setData(storageKeys.USER, updatedUser);
            updateCurrentUser(updatedUser);
          }
          setSaving(false);
          if (isLastGroup) {
            setPhase('done');
          } else {
            // Straight on to the next group — no interstitial.
            setStartAtEnd(false);
            setGroupIndex((i) => i + 1);
          }
        })
```

- [ ] **Step 4: Rework the `done` phase into 3 states**

Replace the whole `if (phase === 'done') { ... }` block (currently 309-326) with:

```tsx
if (phase === 'done') {
  // Eligible & unclaimed: present the gift with a Claim button.
  if (giftEligible) {
    return (
      <Container style={Styles.screen}>
        <View style={Styles.center}>
          <View style={[Styles.doneBadge, Styles.giftBadgeCircle]}>
            <Ionicons name="gift" size={wp(9)} color={Colors.color2} />
          </View>
          <Text variant="display" style={Styles.doneTitle}>
            {LanguageKeys.giftReadyTitle}
          </Text>
          <Text style={Styles.doneBody}>{LanguageKeys.giftReadyBody}</Text>
        </View>
        <View style={Styles.footer}>
          <Button text={LanguageKeys.claimGift} onPress={openGiftModal} />
        </View>
        <GiftClaimModal
          visible={giftModalVisible}
          giftCredits={giftCredits}
          onClose={closeGiftModal}
          onClaimed={onGiftClaimed}
          claim={claimGift}
        />
      </Container>
    );
  }

  // Below threshold & unclaimed: nudge to finish in-profile; schedule reminder.
  if (!giftClaimed) {
    return (
      <Container style={Styles.screen}>
        <View style={Styles.center}>
          <View style={[Styles.doneBadge, Styles.skippedBadge]}>
            <Ionicons name="gift-outline" size={wp(9)} color={Colors.primary} />
          </View>
          <Text variant="display" style={Styles.doneTitle}>
            {LanguageKeys.onboardingSkippedTitle}
          </Text>
          <Text style={Styles.doneBody}>
            {LanguageKeys.onboardingSkippedBody}
          </Text>
        </View>
        <View style={Styles.footer}>
          <Button text={LanguageKeys.continue} onPress={bailFlow} />
        </View>
      </Container>
    );
  }

  // Already claimed: all set.
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
        <Button text={LanguageKeys.continue} onPress={exitFlow} />
      </View>
    </Container>
  );
}
```

Note: after a successful claim, `onGiftClaimed` sets `profile_finish_bonus_awarded` on `currentUser`, so `giftClaimed` flips true and this block re-renders to the "all set" branch — no extra wiring needed.

- [ ] **Step 5: Remove the "Finish Later" ripple + mid-flow GiftBadge from the question header**

In the question-phase header (currently ~344-357), replace the `headerEndRow` block:

```tsx
<View style={Styles.headerEndRow}>
  <Ripple onPress={saving ? undefined : bailFlow} disabled={saving}>
    <Text style={Styles.finishLaterText}>{LanguageKeys.finishLater}</Text>
  </Ripple>
  {!giftClaimed && (
    <GiftBadge
      eligible={giftEligible}
      claimed={giftClaimed}
      onPress={onGiftBadgePress}
    />
  )}
</View>
```

with nothing — delete it entirely. The header row now holds only the group-name row.

- [ ] **Step 6: Remove the bottom (question-phase) GiftClaimModal**

The `<GiftClaimModal ... />` that sits after `<ProfileQuestionWizard ... />` in the main return (currently ~378-384) is no longer needed there — the modal now lives inside the `done`/eligible branch (Step 4). Delete that trailing `<GiftClaimModal ... />` from the main return.

- [ ] **Step 7: Pass `requireAnswer={false}` to the wizard**

In the `<ProfileQuestionWizard>` in the main return, add the prop (next to `showSkip={false}`):

```tsx
        showSkip={false}
        requireAnswer={false}
```

- [ ] **Step 8: Add the two new styles + remove now-dead ones**

In the `Styles` StyleSheet, add:

```tsx
  giftBadgeCircle: {
    backgroundColor: Colors.attention,
  },
  skippedBadge: {
    backgroundColor: Colors.lavender,
  },
```

Remove the now-unused `headerEndRow` and `finishLaterText` style entries.

- [ ] **Step 9: Clean up now-unused imports/vars**

- Remove `import GiftBadge from '../profile/components/gift-badge';`.
- Remove `import { t } from 'i18next';` **only if** no `t(` references remain (Steps 2 & 3 remove them; grep the file for `t(` to confirm).
- Remove `flashSuccessMessage` and `flashErrorMessage` from the `../../services` import **only if** grep confirms no remaining references.
- Keep `scheduleProfileReminder` (used by `bailFlow`) and `cancelProfileReminder` (used by `exitFlow`).

Run: `cd "D:/GitHub/Pure Half/app-old" && npx tsc --noEmit` to surface any unused/missing symbol.

- [ ] **Step 10: Verify type-check**

Run: `cd "D:/GitHub/Pure Half/app-old" && yarn type-check`
Expected: no errors.

- [ ] **Step 11: Commit**

```bash
cd "D:/GitHub/Pure Half/app-old"
git add src/screens/onboardingProfile/OnboardingProfile.tsx
git commit -m "feat(onboarding): drop skip + mid-flow gift, gate gift at end screen"
```

**Manual check:** no "Finish Later", no gift badge while answering; Continue advances even on blank questions; completing at ≥threshold shows the gift + Claim (modal claims, then "all set"); below threshold shows the "skipped" screen; Continue lands in the app.

---

### Task 5: Home red dot for an unclaimed gift (`Welcome.tsx`)

**Files:**

- Modify: `src/screens/welcome/Welcome.tsx` (avatar trigger ~814-843; account menu map ~863-892; styles ~1034+)

**Interfaces:**

- Consumes: existing `giftStatus` from `computeGiftStatus(currentUser, giftThreshold)` (already in scope, line ~272).

- [ ] **Step 1: Derive the pending flag**

After the `giftStatus` `useMemo` (line ~275), add:

```tsx
const giftPending = !giftStatus.claimed;
```

- [ ] **Step 2: Add a red dot to the avatar trigger**

Inside the `<View style={Styles.avatarBtn}>` (currently ~814-843), after the closing of the `photoAlertCount` badge block (the `) : null}` that ends the alert badge, ~842), add:

```tsx
{
  giftPending ? <View style={Styles.giftDot} /> : null;
}
```

- [ ] **Step 3: Add a red dot to the Profile menu row**

The account menu maps `accountMenuItems`. In the `<MenuOption>` content row (currently ~868-891), the row renders an icon, a label `<Text>`, and a trailing chevron. Replace the label `<Text>` line:

```tsx
<Text style={Styles.accountMenuOptionText}>{item.label}</Text>
```

with a label + inline dot for the Profile row:

```tsx
<View style={Styles.accountMenuLabelWrap}>
  <Text style={Styles.accountMenuOptionText}>{item.label}</Text>
  {giftPending && item.screen === 'Profile' ? (
    <View style={Styles.giftDotInline} />
  ) : null}
</View>
```

Note: `accountMenuOptionText` has `flex: 1`; wrapping it in a `flex: 1` row (`accountMenuLabelWrap`) preserves the chevron pushing to the end.

- [ ] **Step 4: Add the styles**

In the `Styles` StyleSheet, add:

```tsx
  giftDot: {
    position: 'absolute',
    top: -hp(0.2),
    left: -wp(1),
    width: wp(3),
    height: wp(3),
    borderRadius: wp(1.5),
    backgroundColor: Colors.color24,
    borderWidth: 1.5,
    borderColor: Colors.surface,
  },
  accountMenuLabelWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  giftDotInline: {
    width: wp(2.2),
    height: wp(2.2),
    borderRadius: wp(1.1),
    backgroundColor: Colors.color24,
  },
```

(`Colors.color24` is the same red used by the existing `accountAlertBadge`.)

- [ ] **Step 5: Verify type-check**

Run: `cd "D:/GitHub/Pure Half/app-old" && yarn type-check`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
cd "D:/GitHub/Pure Half/app-old"
git add src/screens/welcome/Welcome.tsx
git commit -m "feat(home): red dot on profile icon + Profile menu for unclaimed gift"
```

**Manual check:** with an unclaimed gift, a red dot shows on the home avatar and beside the Profile menu item; both clear after claiming.

---

### Task 6: Stop awarding per-group credits (backend)

**Files:**

- Modify: `admin/app/Http/Controllers/Api/AuthController.php` (`updateDetail`, ~677-687)
- Modify: `admin/tests/Feature/UpdateDetailRewardTest.php` (rewrite assertions)

**Interfaces:**

- Produces: `POST /api/v1/app/auth/update/detail` returns `results.reward === null` and grants no per-group credits. `claimFinishGift` / `claimProfileGift` (the end gift) is untouched. `ProfileRewardService::grantForCompletedGroups` stays defined (still unit-tested by `ProfileRewardGrantTest`) but is no longer called by the endpoint.

- [ ] **Step 1: Rewrite the endpoint reward test to expect no award**

Replace the three test methods in `admin/tests/Feature/UpdateDetailRewardTest.php` with:

```php
    public function test_completing_a_group_no_longer_awards_credits(): void
    {
        config(['chat_credit.profile_group_reward.male' => 2]);
        $user = $this->actingAsUser('male');

        $response = $this->postJson('/api/v1/app/auth/update/detail', $this->personalityPayload);

        $response->assertOk();
        $this->assertNull($response->json('results.reward'));
        $this->assertSame(0, (int) $user->refresh()->chat_credits);
    }

    public function test_partial_save_returns_null_reward(): void
    {
        $this->actingAsUser('male');

        $response = $this->postJson('/api/v1/app/auth/update/detail', ['about_you' => 'Just a bit']);

        $response->assertOk();
        $this->assertNull($response->json('results.reward'));
    }
```

(Remove the old `test_re_saving_a_completed_group_awards_nothing` — it asserted the reward shape that no longer exists.)

- [ ] **Step 2: Run the test to verify it FAILS**

Run: `cd "D:/GitHub/Pure Half/admin" && php artisan test --filter=UpdateDetailRewardTest`
Expected: FAIL — the endpoint still returns a non-null `reward` object.

- [ ] **Step 3: Remove the grant call from the endpoint**

In `AuthController::updateDetail`, replace this block (currently ~677-682):

```php
            $reward = null;
            try {
                $reward = $this->profileRewardService->grantForCompletedGroups($currentUser);
            } catch (Exception $rewardEx) {
                Log::error('Profile completion reward failed', ['user_id' => $id, 'error' => $rewardEx->getMessage()]);
            }
```

with:

```php
            // Per-group completion credits are no longer awarded here — the
            // profile-completion gift is the only profile reward, claimed
            // explicitly once the completion threshold is met.
            $reward = null;
```

Leave `$payload['reward'] = $reward;` (now always null) so the response shape is stable for the app.

- [ ] **Step 4: Run the test to verify it PASSES**

Run: `cd "D:/GitHub/Pure Half/admin" && php artisan test --filter=UpdateDetailRewardTest`
Expected: PASS.

- [ ] **Step 5: Confirm the service unit test and gift-claim test still pass**

Run: `cd "D:/GitHub/Pure Half/admin" && php artisan test --filter="ProfileRewardGrantTest|ClaimProfileGiftEndpointTest|ProfileRewardCompletenessTest"`
Expected: PASS (unchanged — `grantForCompletedGroups` and `claimFinishGift` are untouched).

- [ ] **Step 6: Commit**

```bash
cd "D:/GitHub/Pure Half/admin"
git add app/Http/Controllers/Api/AuthController.php tests/Feature/UpdateDetailRewardTest.php
git commit -m "feat(profile): stop awarding per-group completion credits"
```

---

## Self-Review

**Spec coverage:**

- Task 1 (SignupPrimer skips) → spec Task 1 ✓ (Task 2 here).
- OnboardingProfile Finish-Later removal → spec Task 2 ✓ (Task 4 Step 5).
- Credits-during removal (app + backend) → spec Task 3 ✓ (Task 4 Steps 2-3, Task 6).
- Gift-at-end conditional screen → spec Task 3 ✓ (Task 4 Step 4).
- Home red dot (icon + menu, whenever unclaimed) → spec Task 4 ✓ (Task 5).
- Forward-only via `requireAnswer={false}` → ✓ (Task 3 + Task 4 Step 7).
- i18n keys → ✓ (Task 1).

**Note vs. spec:** the spec text said "remove `bailFlow`"; this plan KEEPS `bailFlow` and uses it as the below-threshold done-screen "Continue" so the profile reminder is scheduled for users who left the profile incomplete. Only the "Finish Later" header ripple is removed. This is the correct reconciliation of the spec's two statements ("remove Finish Later" + "schedule the reminder on <threshold exit").

**Placeholder scan:** none — all steps carry exact code.

**Type consistency:** `requireAnswer` (Task 3) is consumed in Task 4 Step 7; `openGiftModal` (Task 4 Step 1) is used in Task 4 Step 4; `giftPending` (Task 5 Step 1) used in Steps 2-3; `onboardingSkippedTitle/Body` (Task 1) used in Task 4 Step 4; `results.reward` null contract (Task 6) matches the app's `onGroupComplete` which no longer reads `reward`.
