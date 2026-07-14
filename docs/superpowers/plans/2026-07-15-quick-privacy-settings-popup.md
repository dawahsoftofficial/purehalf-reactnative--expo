# Quick Privacy Settings Popup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the tagline-only eye/switch on the self "My Profile" card with a new "Privacy Settings" icon (left of the existing gear icon) that opens a quick-settings popup controlling Invisible mode (`search_visibility`) and a 3-way "who can see my profile" choice (`profile_visibility`, gaining a new "Hide completely for everyone" state).

**Architecture:** One small backend addition (a 4th `profile_visibility` enum value + a comment, no query logic changes) plus three frontend layers: shared type/i18n plumbing, a new self-contained bottom-sheet component that owns its own API calls (mirroring the existing full `PrivacySettings` screen's patterns exactly), and a small wiring change in `Header.tsx`/`Profile.tsx` to remove the old control and mount the new one.

**Tech Stack:** React Native 0.82 + TypeScript, `react-native-switch`, `react-native-material-ripple`, `react-i18next`, Laravel 12 / PHP 8.2+, PHPUnit.

## Global Constraints

- Design doc: `docs/superpowers/specs/2026-07-15-quick-privacy-settings-popup-design.md` — read it first for the full rationale; this plan implements it (with two corrections found while writing this plan, called out in Task 2 and Task 3 below).
- No new backend endpoint. `profile_visibility` continues through `PATCH auth/profile/privacy`; `search_visibility` continues through `POST update/info` — these are two _different_ endpoints (the design doc's first draft incorrectly said they shared one; corrected in both documents now).
- No DB migration — `profile_visibility` is `string(24)`, not a DB enum.
- `active_chat` visibility and per-field (`profile_field_visibility`) toggles are NOT exposed in the new popup — full-screen-only, unchanged.
- No change to Visitor/Like recording, and no change to browse/search/recommendation feed queries beyond the existing `search_visibility` scope — confirmed explicitly out of scope.
- i18n: every new user-facing string needs a key in `Keys.tsx` + all three of `English.json`/`Urdu.json`/`RomanUrdu.json`. There is currently **no automated check** that enforces this for `src/languages/*` (the `i18n-json/identical-keys` ESLint rule only watches `src/translations/*.json`, a directory that does not exist yet — see Task 2 verification for the manual check used instead).
- Follow existing scaling/typography conventions: `wp()`/`hp()` from `src/global/Scalling.tsx`, `Typography`/`Fonts`/`Colors` from `src/global` / `src/res`, never raw pixel values.

---

### Task 1: Backend — add the `nobody` profile-visibility level

**Files:**

- Modify: `admin/app/Support/ProfileFieldVisibility.php:15-25` (constants), `:250-271` (`canViewProfileDetails`, comment only)
- Test: `admin/tests/Unit/ProfileFieldVisibilityTest.php`
- Test: `admin/tests/Feature/ProfileFieldPrivacyTest.php`

**Interfaces:**

- Produces: `ProfileFieldVisibility::PROFILE_NOBODY` (string constant `'nobody'`), added to `ProfileFieldVisibility::PROFILE_VISIBILITY_LEVELS`. Consumed by Task 2 (frontend types) and Task 3 (new component).

- [ ] **Step 1: Write the failing unit tests**

Append to `admin/tests/Unit/ProfileFieldVisibilityTest.php` (inside the existing `ProfileFieldVisibilityTest` class, after `test_missing_or_unknown_settings_remain_public`):

```php
    public function test_owner_can_view_their_own_profile_regardless_of_visibility(): void
    {
        $this->assertTrue(
            ProfileFieldVisibility::canViewProfileDetails(10, 10, ProfileFieldVisibility::PROFILE_NOBODY)
        );
    }

    public function test_nobody_visibility_denies_every_non_owner(): void
    {
        $this->assertFalse(
            ProfileFieldVisibility::canViewProfileDetails(10, 11, ProfileFieldVisibility::PROFILE_NOBODY)
        );
        $this->assertFalse(
            ProfileFieldVisibility::canViewProfileDetails(10, null, ProfileFieldVisibility::PROFILE_NOBODY)
        );
    }
```

- [ ] **Step 2: Write the failing feature tests**

Append to `admin/tests/Feature/ProfileFieldPrivacyTest.php` (inside the existing `ProfileFieldPrivacyTest` class, after `test_member_can_update_overall_profile_visibility_without_overwriting_fields`):

```php
    public function test_member_can_set_profile_visibility_to_nobody(): void
    {
        $user = User::factory()->create();
        $this->actingAsUser($user);

        $response = $this->patchJson('/api/v1/app/auth/profile/privacy', [
            'profile_visibility' => 'nobody',
        ]);

        $response->assertOk()->assertJsonPath('results.profile_visibility', 'nobody');
        $this->assertSame('nobody', $user->detail()->first()->profile_visibility);
    }

    public function test_nobody_visibility_hides_the_profile_from_someone_the_owner_liked(): void
    {
        $owner = User::factory()->create();
        $likedViewer = User::factory()->create();
        UserDetail::create(['user_id' => $owner->id, 'height' => 178]);
        UserInteraction::create([
            'user_id' => $owner->id,
            'type' => 2,
            'other_users' => [$likedViewer->id],
        ]);

        $this->actingAsUser($owner);
        $this->patchJson('/api/v1/app/auth/profile/privacy', [
            'profile_visibility' => 'nobody',
        ])->assertOk();

        $this->actingAsUser($likedViewer);
        $this->getJson("/api/v1/app/auth/user/{$owner->id}/detail")
            ->assertOk()
            ->assertJsonPath('results.profile_restricted', true)
            ->assertJsonPath('results.detail', []);
    }
```

Note this test deliberately sets `profile_visibility` through the validated PATCH endpoint (not a direct `UserDetail::create(['profile_visibility' => 'nobody'])`) — a raw literal would bypass `PROFILE_VISIBILITY_LEVELS` validation entirely and the test would pass even before Step 4, since `canViewProfileDetails()`'s default-deny fallthrough already blocks any unrecognized string. Routing through the endpoint makes the first half of the test genuinely depend on Task 1's change. Mid-test user-switching (`actingAsUser($owner)` then `actingAsUser($likedViewer)`) is an established pattern already used a few tests up in this same file (`test_profile_can_be_limited_to_people_the_owner_liked` switches between `$likedViewer`/`$otherViewer`).

- [ ] **Step 3: Run the new tests to verify they fail**

Run: `cd admin && php artisan test --filter=ProfileFieldVisibilityTest`
Expected: FAIL — `Error: Undefined constant App\Support\ProfileFieldVisibility::PROFILE_NOBODY`

Run: `cd admin && php artisan test --filter=ProfileFieldPrivacyTest`
Expected: both `test_member_can_set_profile_visibility_to_nobody` and `test_nobody_visibility_hides_the_profile_from_someone_the_owner_liked` FAIL at their first `assertOk()` with a 422 Unprocessable — validation rejects `'nobody'` since it isn't in `PROFILE_VISIBILITY_LEVELS` yet.

- [ ] **Step 4: Add the constant and level**

In `admin/app/Support/ProfileFieldVisibility.php`, replace:

```php
    public const PROFILE_EVERYONE = 'everyone';

    public const PROFILE_ACTIVE_CHAT = 'active_chat';

    public const PROFILE_LIKED = 'liked';

    public const PROFILE_VISIBILITY_LEVELS = [
        self::PROFILE_EVERYONE,
        self::PROFILE_ACTIVE_CHAT,
        self::PROFILE_LIKED,
    ];
```

with:

```php
    public const PROFILE_EVERYONE = 'everyone';

    public const PROFILE_ACTIVE_CHAT = 'active_chat';

    public const PROFILE_LIKED = 'liked';

    public const PROFILE_NOBODY = 'nobody';

    public const PROFILE_VISIBILITY_LEVELS = [
        self::PROFILE_EVERYONE,
        self::PROFILE_ACTIVE_CHAT,
        self::PROFILE_LIKED,
        self::PROFILE_NOBODY,
    ];
```

- [ ] **Step 5: Document the deny-by-default path in `canViewProfileDetails()`**

In the same file, inside `canViewProfileDetails()`, replace the trailing:

```php
        return false;
    }

    public static function canViewProfileDetails(
```

Wait — that pattern spans two methods; be precise. Find this exact tail of `canViewProfileDetails()` (it's the last statement in the method, right after the `PROFILE_ACTIVE_CHAT` block's closing brace):

```php
                ->exists();
        }

        return false;
    }
```

Replace with:

```php
                ->exists();
        }

        // PROFILE_NOBODY (and any other/unknown visibility value) denies
        // every non-owner viewer by falling through to here — no branch
        // needed, this is the deny-by-default path.
        return false;
    }
```

No other logic changes: the method's first line (`if ($viewerId === $ownerId || $visibility === self::PROFILE_EVERYONE) return true;`) already lets the owner see their own profile regardless of `$visibility`, and every non-owner falls through to the line just edited unless `$visibility` is `PROFILE_EVERYONE` or they match a `PROFILE_LIKED`/`PROFILE_ACTIVE_CHAT` condition.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `cd admin && php artisan test --filter=ProfileFieldVisibilityTest`
Expected: PASS (4 tests)

Run: `cd admin && php artisan test --filter=ProfileFieldPrivacyTest`
Expected: PASS (9 tests)

- [ ] **Step 7: Commit**

```bash
git add admin/app/Support/ProfileFieldVisibility.php admin/tests/Unit/ProfileFieldVisibilityTest.php admin/tests/Feature/ProfileFieldPrivacyTest.php
git commit -m "feat(privacy): add nobody profile-visibility level"
```

---

### Task 2: Frontend shared plumbing — types, i18n keys, full-screen consistency

**Files:**

- Modify: `app-old/src/screens/profile/profile-privacy.ts:3`
- Modify: `app-old/src/services/api/Services.tsx:690-697`
- Modify: `app-old/src/languages/Keys.tsx`
- Modify: `app-old/src/languages/English.json`
- Modify: `app-old/src/languages/Urdu.json`
- Modify: `app-old/src/languages/RomanUrdu.json`
- Modify: `app-old/src/screens/privacySettings/PrivacySettings.tsx:106-126`

**Interfaces:**

- Consumes: `ProfileFieldVisibility::PROFILE_NOBODY` from Task 1 (conceptually — the string literal `'nobody'` is what actually crosses the wire).
- Produces: `ProfileVisibility` type now includes `'nobody'`; `LanguageKeys.privacyQuickSettingsIntro`, `.invisibleMode`, `.invisibleModeDesc`, `.chooseAnOption`, `.profileVisibilityNobody`, `.profileVisibilityNobodyDesc` — all consumed by Task 3's new component. `PrivacySettings.tsx` shows the new option as a 4th radio row.

This task is TDD-inapplicable (pure types + static copy + one array literal — nothing to red/green here); verified instead by `yarn type-check` and a manual key-parity check (see Step 6). This is a **correction from the design doc**: it under-specified this task as just "new keys" — writing this plan surfaced that `Services.tsx` independently re-declares the `profile_visibility` union type (doesn't import `ProfileVisibility` from `profile-privacy.ts`), so both need updating or `ApiServices.updateProfilePrivacy({ profile_visibility: 'nobody' })` won't type-check in Task 3.

- [ ] **Step 1: Widen the shared `ProfileVisibility` type**

In `app-old/src/screens/profile/profile-privacy.ts`, replace:

```ts
export type ProfileVisibility = 'everyone' | 'active_chat' | 'liked';
```

with:

```ts
export type ProfileVisibility = 'everyone' | 'active_chat' | 'liked' | 'nobody';
```

- [ ] **Step 2: Widen the duplicated inline type in `Services.tsx`**

In `app-old/src/services/api/Services.tsx`, replace:

```ts
  updateProfilePrivacy = (privacy: {
    visibility?: Record<string, 'public' | 'private'>;
    profile_visibility?: 'everyone' | 'active_chat' | 'liked';
  }) => {
    return new Promise<{
      profile_field_visibility?: Record<string, 'public' | 'private'>;
      profile_visibility?: 'everyone' | 'active_chat' | 'liked';
    }>((resolve, reject) => {
```

with:

```ts
  updateProfilePrivacy = (privacy: {
    visibility?: Record<string, 'public' | 'private'>;
    profile_visibility?: 'everyone' | 'active_chat' | 'liked' | 'nobody';
  }) => {
    return new Promise<{
      profile_field_visibility?: Record<string, 'public' | 'private'>;
      profile_visibility?: 'everyone' | 'active_chat' | 'liked' | 'nobody';
    }>((resolve, reject) => {
```

- [ ] **Step 3: Add the new keys to `Keys.tsx`**

In `app-old/src/languages/Keys.tsx`, replace:

```ts
  profileVisibilityLiked: 'profileVisibilityLiked',
  profileVisibilityLikedDesc: 'profileVisibilityLikedDesc',
  visibleOnProfile: 'visibleOnProfile',
```

with:

```ts
  profileVisibilityLiked: 'profileVisibilityLiked',
  profileVisibilityLikedDesc: 'profileVisibilityLikedDesc',
  profileVisibilityNobody: 'profileVisibilityNobody',
  profileVisibilityNobodyDesc: 'profileVisibilityNobodyDesc',
  visibleOnProfile: 'visibleOnProfile',
```

Then replace:

```ts
  searchVisibility: 'searchVisibility',
  searchVisibilityDesc: 'searchVisibilityDesc',
  inAppNotifications: 'inAppNotifications',
```

with:

```ts
  searchVisibility: 'searchVisibility',
  searchVisibilityDesc: 'searchVisibilityDesc',
  privacyQuickSettingsIntro: 'privacyQuickSettingsIntro',
  invisibleMode: 'invisibleMode',
  invisibleModeDesc: 'invisibleModeDesc',
  chooseAnOption: 'chooseAnOption',
  inAppNotifications: 'inAppNotifications',
```

- [ ] **Step 4: Add the English copy**

In `app-old/src/languages/English.json`, replace:

```json
    "profileVisibilityLiked": "People I've liked",
    "profileVisibilityLikedDesc": "Only members whose profile I have liked.",
    "visibleOnProfile": "Shown on your profile",
```

with:

```json
    "profileVisibilityLiked": "People I've liked",
    "profileVisibilityLikedDesc": "Only members whose profile I have liked.",
    "profileVisibilityNobody": "Hide completely for everyone",
    "profileVisibilityNobodyDesc": "No one can see your profile details at all.",
    "visibleOnProfile": "Shown on your profile",
```

Then replace:

```json
    "searchVisibility": "Hide me from search",
    "searchVisibilityDesc": "When on, you won't appear in search or recommendations. You can still browse, visit and like profiles; those members can still see you in Visitors and Likes.",
    "inAppNotifications": "In app notifications",
```

with:

```json
    "searchVisibility": "Hide me from search",
    "searchVisibilityDesc": "When on, you won't appear in search or recommendations. You can still browse, visit and like profiles; those members can still see you in Visitors and Likes.",
    "privacyQuickSettingsIntro": "Control who can find you and who can see your profile details. These apply everywhere, including the full Privacy settings screen.",
    "invisibleMode": "Invisible mode",
    "invisibleModeDesc": "Hides you from search results and recommendations.",
    "chooseAnOption": "Choose an option",
    "inAppNotifications": "In app notifications",
```

- [ ] **Step 5: Add the Urdu and Roman Urdu copy**

In `app-old/src/languages/Urdu.json`, replace:

```json
    "profileVisibilityLiked": "جنہیں میں نے پسند کیا",
    "profileVisibilityLikedDesc": "صرف وہ اراکین جن کی پروفائل میں نے پسند کی ہے۔",
```

with:

```json
    "profileVisibilityLiked": "جنہیں میں نے پسند کیا",
    "profileVisibilityLikedDesc": "صرف وہ اراکین جن کی پروفائل میں نے پسند کی ہے۔",
    "profileVisibilityNobody": "سب کے لیے مکمل طور پر چھپائیں",
    "profileVisibilityNobodyDesc": "کوئی بھی آپ کی پروفائل کی تفصیلات بالکل نہیں دیکھ سکتا۔",
```

Then replace:

```json
    "searchVisibility": "مجھے تلاش سے چھپائیں",
    "searchVisibilityDesc": "آن ہونے پر آپ تلاش یا سفارشات میں نظر نہیں آئیں گے۔ آپ پروفائلز دیکھ، وزٹ اور پسند کر سکتے ہیں؛ وہ اراکین آپ کو وزیٹرز اور لائکس میں دیکھ سکیں گے۔",
```

with:

```json
    "searchVisibility": "مجھے تلاش سے چھپائیں",
    "searchVisibilityDesc": "آن ہونے پر آپ تلاش یا سفارشات میں نظر نہیں آئیں گے۔ آپ پروفائلز دیکھ، وزٹ اور پسند کر سکتے ہیں؛ وہ اراکین آپ کو وزیٹرز اور لائکس میں دیکھ سکیں گے۔",
    "privacyQuickSettingsIntro": "کنٹرول کریں کہ کون آپ کو تلاش کر سکتا ہے اور کون آپ کی پروفائل کی تفصیلات دیکھ سکتا ہے۔ یہ ترتیبات ہر جگہ لاگو ہوتی ہیں، بشمول مکمل پرائیویسی سیٹنگز اسکرین۔",
    "invisibleMode": "غیر مرئی موڈ",
    "invisibleModeDesc": "آپ کو تلاش کے نتائج اور سفارشات سے چھپاتا ہے۔",
    "chooseAnOption": "ایک آپشن منتخب کریں",
```

In `app-old/src/languages/RomanUrdu.json`, replace:

```json
    "profileVisibilityLiked": "Jin ko main ne like kiya",
    "profileVisibilityLikedDesc": "Sirf woh members jin ki profile main ne like ki hai.",
```

with:

```json
    "profileVisibilityLiked": "Jin ko main ne like kiya",
    "profileVisibilityLikedDesc": "Sirf woh members jin ki profile main ne like ki hai.",
    "profileVisibilityNobody": "Sab ke liye mukammal taur par chupayein",
    "profileVisibilityNobodyDesc": "Koi bhi aap ki profile ki tafseelat bilkul nahi dekh sakta.",
```

Then replace:

```json
    "searchVisibility": "Mujhay search se chupayein",
    "searchVisibilityDesc": "On honay par aap search ya recommendations mein nazar nahi aayenge. Aap profiles browse, visit aur like kar saktay hain; woh members aap ko Visitors aur Likes mein dekh saktay hain.",
```

with:

```json
    "searchVisibility": "Mujhay search se chupayein",
    "searchVisibilityDesc": "On honay par aap search ya recommendations mein nazar nahi aayenge. Aap profiles browse, visit aur like kar saktay hain; woh members aap ko Visitors aur Likes mein dekh saktay hain.",
    "privacyQuickSettingsIntro": "Control karein ke kaun aap ko talash kar sakta hai aur kaun aap ki profile ki tafseelat dekh sakta hai. Yeh settings har jaga lagu hoti hain, including mukammal Privacy settings screen.",
    "invisibleMode": "Invisible mode",
    "invisibleModeDesc": "Aap ko search results aur recommendations se chupata hai.",
    "chooseAnOption": "Aik option chunain",
```

**Caveat to flag to the user:** the Urdu/Roman Urdu strings above are a good-faith draft translation, not reviewed by a native speaker — call this out explicitly when reporting this task done.

- [ ] **Step 6: Verify key parity across all four files**

Run (from `app-old/`):

```bash
for key in privacyQuickSettingsIntro invisibleMode invisibleModeDesc chooseAnOption profileVisibilityNobody profileVisibilityNobodyDesc; do
  echo "=== $key ==="
  grep -c "\"$key\":" src/languages/English.json src/languages/Urdu.json src/languages/RomanUrdu.json
  grep -c "$key:" src/languages/Keys.tsx
done
```

Expected: every line prints `...:1` (each key appears exactly once in each of the four files). If any file shows `0`, that file is missing the key; if any shows `2+`, it was pasted twice — fix before moving on. (This replaces the ESLint `i18n-json/identical-keys` check, which does not currently cover `src/languages/*` — see Global Constraints.)

- [ ] **Step 7: Add the 4th option to the full Privacy Settings screen**

The design doc's own Testing section expects the full `PrivacySettings` screen to "reflect the same state" after picking "Hide completely" in the new popup — that requires this screen to recognize `'nobody'` as a selectable/selected option too, otherwise its radio list would show nothing selected. In `app-old/src/screens/privacySettings/PrivacySettings.tsx`, replace:

```tsx
    {
      value: 'liked',
      title: LanguageKeys.profileVisibilityLiked,
      description: LanguageKeys.profileVisibilityLikedDesc,
    },
  ];
```

with:

```tsx
    {
      value: 'liked',
      title: LanguageKeys.profileVisibilityLiked,
      description: LanguageKeys.profileVisibilityLikedDesc,
    },
    {
      value: 'nobody',
      title: LanguageKeys.profileVisibilityNobody,
      description: LanguageKeys.profileVisibilityNobodyDesc,
    },
  ];
```

- [ ] **Step 8: Type-check**

Run: `cd app-old && yarn type-check`
Expected: PASS, no new errors.

- [ ] **Step 9: Commit**

```bash
git add app-old/src/screens/profile/profile-privacy.ts app-old/src/services/api/Services.tsx app-old/src/languages/Keys.tsx app-old/src/languages/English.json app-old/src/languages/Urdu.json app-old/src/languages/RomanUrdu.json app-old/src/screens/privacySettings/PrivacySettings.tsx
git commit -m "feat(privacy): add nobody visibility type, copy, and full-screen option"
```

---

### Task 3: New `PrivacyQuickSettingsModal` component

**Files:**

- Create: `app-old/src/screens/profile/components/privacy-quick-settings-modal.tsx`
- Create: `app-old/src/screens/profile/components/privacy-quick-settings-modal.test.tsx`

**Interfaces:**

- Consumes: `ProfileVisibility` type and all 6 new `LanguageKeys.*` entries from Task 2; `ApiServices.updateProfilePrivacy`, `ApiServices.updateUserInfo`, `useGlobalContext`, `StorageManager` from `../../../services` (all pre-existing).
- Produces: `PrivacyQuickSettingsModal` (default export), props `{ visible: boolean; onClose: () => void }`. Consumed by Task 4.

**Correction from the design doc:** it said the popup "calls `ApiServices.updateProfilePrivacy` directly" for both controls. Re-reading `PrivacySettings.tsx` while writing this plan showed that's only true for the radio group — `search_visibility` goes through a _different_ call, `ApiServices.updateUserInfo` (endpoint `update/info`), and the existing `hideFromSearchToggle`/`updateToggle` pair always resends a full snapshot of the user's core fields (name, gender, dob, language, country, city, lat/long) alongside `search_visibility`, because that's the only call shape proven to work against that endpoint in production. Step 3 below replicates that exactly for the outgoing request. For the _local_ cache merge-back after a successful call, this component intentionally does **not** copy `updateToggle`'s `{...currentUser, search_visibility: newParams.search_visibility, in_app_notifications: newParams.in_app_notifications, email_notification: newParams.email_notification, sms_notification: newParams.sms_notification}` pattern — that reads three fields (`in_app_notifications` aside) off `newParams` that this component's call never sets, which would locally overwrite them with `undefined` in the cached user object. (That's a pre-existing latent bug in `PrivacySettings.tsx` itself, out of scope to fix here — flag it separately after this plan lands.) Instead, Step 3 merges only the one field this component actually changes: `{ ...currentUser, search_visibility: next }`.

Because the popup is a permanently-mounted child of `Header` (Task 4 controls it via a `visible` prop, not by mounting/unmounting), its local state must resync from `currentUser` every time it _opens_ — otherwise editing something on the full `PrivacySettings` screen and reopening this popup would show stale values. Step 2 handles this with a `useEffect` keyed on `visible`.

- [ ] **Step 1: Write the failing test file**

Create `app-old/src/screens/profile/components/privacy-quick-settings-modal.test.tsx`:

```tsx
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import React, { type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { ApiServices } from '../../../services';
import PrivacyQuickSettingsModal from './privacy-quick-settings-modal';

type ChildrenProps = { children?: ReactNode };
type TextProps = { text?: ReactNode };
type ButtonProps = TextProps & { onPress?: () => void };
type RippleProps = ChildrenProps & {
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityState?: { selected?: boolean; disabled?: boolean };
};
type SwitchProps = {
  value?: boolean;
  onValueChange?: (next: boolean) => void;
  disabled?: boolean;
  testID?: string;
};

let currentUserMock: any;
const updateCurrentUserMock = jest.fn();

jest.mock('react-native-material-ripple', () => {
  const ReactActual = jest.requireActual('react') as typeof React;
  const { View: MockView } = jest.requireActual('react-native') as {
    View: React.ComponentType<any>;
  };

  return ({
    children,
    style,
    testID,
    onPress,
    disabled,
    accessibilityState,
  }: RippleProps) =>
    ReactActual.createElement(
      MockView,
      {
        style,
        testID,
        accessibilityState,
        onPress: disabled ? undefined : onPress,
      },
      children
    );
});

jest.mock('react-native-switch', () => {
  const ReactActual = jest.requireActual('react') as typeof React;
  const { Pressable: MockPressable } = jest.requireActual('react-native') as {
    Pressable: React.ComponentType<any>;
  };

  return {
    Switch: ({ value, onValueChange, disabled, testID }: SwitchProps) =>
      ReactActual.createElement(MockPressable, {
        testID,
        accessibilityState: { checked: value, disabled },
        onPress: disabled ? undefined : () => onValueChange?.(!value),
      }),
  };
});

jest.mock('../../../components', () => {
  const ReactActual = jest.requireActual('react') as typeof React;
  const { Text: MockText, View: MockView } = jest.requireActual(
    'react-native'
  ) as { Text: React.ComponentType<any>; View: React.ComponentType<any> };

  const mockButton = ({ onPress, text }: ButtonProps) =>
    ReactActual.createElement(MockText, { onPress }, text);
  const mockTextComponent = ({
    children,
    style,
  }: ChildrenProps & { style?: unknown }) =>
    ReactActual.createElement(MockText, { style }, children);

  return { Button: mockButton, Text: mockTextComponent };
});

jest.mock('../../../languages', () => ({
  CheckRtl: () => false,
  LanguageKeys: {
    privacySettings: 'Privacy settings',
    privacyQuickSettingsIntro: 'privacyQuickSettingsIntro',
    invisibleMode: 'invisibleMode',
    invisibleModeDesc: 'invisibleModeDesc',
    chooseAnOption: 'chooseAnOption',
    profileVisibilityEveryone: 'profileVisibilityEveryone',
    profileVisibilityEveryoneDesc: 'profileVisibilityEveryoneDesc',
    profileVisibilityLiked: 'profileVisibilityLiked',
    profileVisibilityLikedDesc: 'profileVisibilityLikedDesc',
    profileVisibilityNobody: 'profileVisibilityNobody',
    profileVisibilityNobodyDesc: 'profileVisibilityNobodyDesc',
    understood: 'Understood',
  },
}));

jest.mock('../../../services', () => ({
  ApiServices: {
    updateProfilePrivacy: jest.fn(),
    updateUserInfo: jest.fn(),
  },
  StorageManager: {
    setData: jest.fn(),
    storageKeys: { USER: 'USER' },
  },
  useGlobalContext: () => ({
    currentUser: currentUserMock,
    updateCurrentUser: updateCurrentUserMock,
  }),
}));

describe('PrivacyQuickSettingsModal', () => {
  beforeEach(() => {
    currentUserMock = {
      search_visibility: 1,
      first_name: 'Amina',
      last_name: 'Yusuf',
      gender: 'female',
      date_of_birth: '01 Jan,1998',
      interface_language_id: 1,
      country: 'Pakistan',
      city: 'Islamabad',
      latitude: 33.6,
      longitude: 73.0,
      detail: { profile_visibility: 'everyone' },
    };
    updateCurrentUserMock.mockReset();
    (ApiServices.updateUserInfo as jest.Mock).mockReset().mockResolvedValue({});
    (ApiServices.updateProfilePrivacy as jest.Mock)
      .mockReset()
      .mockResolvedValue({ profile_visibility: 'nobody' });
  });

  it('turns Invisible mode on by sending search_visibility 0 with the current profile snapshot', async () => {
    render(<PrivacyQuickSettingsModal visible onClose={jest.fn()} />);

    fireEvent.press(screen.getByTestId('quick-privacy-invisible-mode-switch'));

    await waitFor(() =>
      expect(ApiServices.updateUserInfo).toHaveBeenCalledWith(
        expect.objectContaining({
          search_visibility: 0,
          first_name: 'Amina',
          last_name: 'Yusuf',
          gender: 'female',
          country: 'Pakistan',
          city: 'Islamabad',
        })
      )
    );
    await waitFor(() =>
      expect(updateCurrentUserMock).toHaveBeenCalledWith(
        expect.objectContaining({ search_visibility: 0 })
      )
    );
  });

  it('selects "hide completely" by sending profile_visibility nobody', async () => {
    render(<PrivacyQuickSettingsModal visible onClose={jest.fn()} />);

    fireEvent.press(screen.getByTestId('quick-privacy-visibility-nobody'));

    await waitFor(() =>
      expect(ApiServices.updateProfilePrivacy).toHaveBeenCalledWith({
        profile_visibility: 'nobody',
      })
    );
    expect(
      screen.getByTestId('quick-privacy-visibility-nobody').props
        .accessibilityState.selected
    ).toBe(true);
  });

  it('reverts the selection if the API call fails', async () => {
    (ApiServices.updateProfilePrivacy as jest.Mock).mockRejectedValue(
      new Error('network')
    );

    render(<PrivacyQuickSettingsModal visible onClose={jest.fn()} />);

    fireEvent.press(screen.getByTestId('quick-privacy-visibility-nobody'));

    await waitFor(() =>
      expect(ApiServices.updateProfilePrivacy).toHaveBeenCalled()
    );
    await waitFor(() =>
      expect(
        screen.getByTestId('quick-privacy-visibility-nobody').props
          .accessibilityState.selected
      ).toBe(false)
    );
    expect(
      screen.getByTestId('quick-privacy-visibility-everyone').props
        .accessibilityState.selected
    ).toBe(true);
    expect(updateCurrentUserMock).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd app-old && yarn jest src/screens/profile/components/privacy-quick-settings-modal.test.tsx`
Expected: FAIL — `Cannot find module './privacy-quick-settings-modal'`

- [ ] **Step 3: Write the component**

Create `app-old/src/screens/profile/components/privacy-quick-settings-modal.tsx`:

```tsx
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import { Switch } from 'react-native-switch';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Button, Text } from '../../../components';
import { hp, Typography, wp } from '../../../global';
import { CheckRtl, LanguageKeys } from '../../../languages';
import { Colors, Fonts } from '../../../res';
import {
  ApiServices,
  StorageManager,
  useGlobalContext,
} from '../../../services';
import type { ProfileVisibility } from '../profile-privacy';

type PrivacyQuickSettingsModalProps = {
  visible: boolean;
  onClose: () => void;
};

const PROFILE_VISIBILITY_OPTIONS: Array<{
  value: ProfileVisibility;
  title: string;
  description: string;
}> = [
  {
    value: 'everyone',
    title: LanguageKeys.profileVisibilityEveryone,
    description: LanguageKeys.profileVisibilityEveryoneDesc,
  },
  {
    value: 'liked',
    title: LanguageKeys.profileVisibilityLiked,
    description: LanguageKeys.profileVisibilityLikedDesc,
  },
  {
    value: 'nobody',
    title: LanguageKeys.profileVisibilityNobody,
    description: LanguageKeys.profileVisibilityNobodyDesc,
  },
];

const PrivacyQuickSettingsModal = ({
  visible,
  onClose,
}: PrivacyQuickSettingsModalProps) => {
  const { currentUser, updateCurrentUser } = useGlobalContext();
  const { setData, storageKeys } = StorageManager;
  const Rtl = CheckRtl();

  const [searchVisible, setSearchVisible] = useState(
    currentUser?.search_visibility === 1
  );
  const [profileVisibility, setProfileVisibility] = useState<ProfileVisibility>(
    currentUser?.detail?.profile_visibility ?? 'everyone'
  );
  // Shared, not per-control: the invisible-mode switch and the visibility
  // radio group both merge into currentUser via `{ ...currentUser, <field> }`
  // using a closure-captured snapshot. If both were saving at once, whichever
  // resolves second would clobber the first's local update with a stale
  // snapshot. One flag disables both controls during any in-flight save,
  // which also matches the full PrivacySettings screen's effective behavior
  // (its full-screen ModalLoader blocks all interaction during any save).
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setSearchVisible(currentUser?.search_visibility === 1);
    setProfileVisibility(currentUser?.detail?.profile_visibility ?? 'everyone');
  }, [visible, currentUser]);

  const onInvisibleModeChange = (nextInvisible: boolean) => {
    if (saving) return;
    const previous = searchVisible;
    const nextSearchVisible = !nextInvisible;
    setSearchVisible(nextSearchVisible);
    setSaving(true);

    const {
      first_name,
      last_name,
      gender,
      date_of_birth,
      interface_language_id,
      country,
      city,
      latitude,
      longitude,
    } = currentUser ?? {};
    const dob = moment(date_of_birth, 'DD MMM,YYYY').toDate();

    ApiServices.updateUserInfo({
      search_visibility: nextSearchVisible ? 1 : 0,
      first_name,
      last_name,
      gender,
      date_of_birth: moment(dob).format('YYYY-MM-DD'),
      interface_language_id,
      country,
      city,
      longitude,
      latitude,
    })
      .then(async () => {
        const updatedUser = {
          ...currentUser,
          search_visibility: nextSearchVisible ? 1 : 0,
        };
        updateCurrentUser(updatedUser);
        await setData(storageKeys.USER, updatedUser);
      })
      .catch(() => setSearchVisible(previous))
      .finally(() => setSaving(false));
  };

  const onProfileVisibilityChange = (next: ProfileVisibility) => {
    if (saving || next === profileVisibility) return;
    const previous = profileVisibility;
    setProfileVisibility(next);
    setSaving(true);

    ApiServices.updateProfilePrivacy({ profile_visibility: next })
      .then(async (result) => {
        const saved = result?.profile_visibility ?? next;
        const updatedUser = {
          ...currentUser,
          detail: { ...(currentUser?.detail ?? {}), profile_visibility: saved },
        };
        setProfileVisibility(saved);
        updateCurrentUser(updatedUser);
        await setData(storageKeys.USER, updatedUser);
      })
      .catch(() => setProfileVisibility(previous))
      .finally(() => setSaving(false));
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={Styles.sheetBackdrop}>
        <Pressable style={Styles.sheetDismissArea} onPress={onClose} />
        <View style={Styles.sheet}>
          <View style={Styles.sheetHandle} />
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            <Text variant="display" style={Styles.sheetTitle}>
              {LanguageKeys.privacySettings}
            </Text>
            <Text style={Styles.sheetLead}>
              {LanguageKeys.privacyQuickSettingsIntro}
            </Text>

            <View
              style={[
                Styles.fieldCon,
                { flexDirection: Rtl ? 'row-reverse' : 'row' },
              ]}
            >
              <View
                style={[
                  Styles.fieldTxtCon,
                  { alignItems: Rtl ? 'flex-end' : 'flex-start' },
                ]}
              >
                <Text style={Styles.fieldTxt}>
                  {LanguageKeys.invisibleMode}
                </Text>
                <Text style={Styles.fieldDesc}>
                  {LanguageKeys.invisibleModeDesc}
                </Text>
              </View>
              <Switch
                testID="quick-privacy-invisible-mode-switch"
                value={!searchVisible}
                onValueChange={onInvisibleModeChange}
                disabled={saving}
                renderActiveText={false}
                renderInActiveText={false}
                circleSize={25}
                backgroundActive={Colors.primary}
                backgroundInactive={Colors.color18}
                innerCircleStyle={Styles.switchInner}
              />
            </View>

            <Text style={[Styles.sectionLabel, Styles.sectionLabelSpaced]}>
              {LanguageKeys.chooseAnOption}
            </Text>
            <View style={Styles.groupCard}>
              {PROFILE_VISIBILITY_OPTIONS.map((option, index) => {
                const selected = profileVisibility === option.value;
                return (
                  <Ripple
                    key={option.value}
                    testID={`quick-privacy-visibility-${option.value}`}
                    accessibilityState={{ selected }}
                    disabled={saving}
                    onPress={() => onProfileVisibilityChange(option.value)}
                    style={[
                      Styles.visibilityOption,
                      index < PROFILE_VISIBILITY_OPTIONS.length - 1 &&
                        Styles.divider,
                      { flexDirection: Rtl ? 'row-reverse' : 'row' },
                    ]}
                  >
                    <View
                      style={[
                        Styles.fieldTxtCon,
                        { alignItems: Rtl ? 'flex-end' : 'flex-start' },
                      ]}
                    >
                      <Text style={Styles.fieldTxt}>{option.title}</Text>
                      <Text style={Styles.fieldDesc}>{option.description}</Text>
                    </View>
                    <Ionicons
                      name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={wp(6)}
                      color={selected ? Colors.primary : Colors.color18}
                    />
                  </Ripple>
                );
              })}
            </View>
            <Button
              onPress={onClose}
              buttonStyle={Styles.understoodBtn}
              text={LanguageKeys.understood}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default PrivacyQuickSettingsModal;

const Styles = StyleSheet.create({
  sheetBackdrop: {
    flex: 1,
    backgroundColor: Colors.blackRGBA50,
  },
  sheetDismissArea: {
    flex: 1,
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: wp(5),
    paddingTop: hp(1),
    paddingBottom: hp(3),
    maxHeight: hp(85),
  },
  sheetHandle: {
    width: wp(10),
    height: 4,
    borderRadius: 999,
    backgroundColor: Colors.hairline,
    alignSelf: 'center',
    marginBottom: hp(1.5),
  },
  sheetTitle: {
    color: Colors.primary,
    fontSize: Typography.large,
    lineHeight: wp(7.5),
    marginBottom: hp(1),
  },
  sheetLead: {
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    lineHeight: wp(5.5),
    marginBottom: hp(1.8),
  },
  fieldCon: {
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 16,
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(4),
    marginBottom: hp(0.5),
  },
  fieldTxtCon: {
    flex: 1,
    paddingRight: wp(3),
  },
  fieldTxt: {
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small2,
    color: Colors.ink,
  },
  fieldDesc: {
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.tiny2,
    color: Colors.muted,
    marginTop: hp(0.3),
  },
  switchInner: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  sectionLabel: {
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.tiny1,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.muted,
    marginBottom: hp(1),
    marginLeft: wp(1),
  },
  sectionLabelSpaced: {
    marginTop: hp(2),
  },
  groupCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.hairline,
    overflow: 'hidden',
  },
  visibilityOption: {
    alignItems: 'center',
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(4),
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline,
  },
  understoodBtn: {
    marginTop: hp(1.5),
  },
});
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd app-old && yarn jest src/screens/profile/components/privacy-quick-settings-modal.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Type-check**

Run: `cd app-old && yarn type-check`
Expected: PASS, no new errors.

- [ ] **Step 6: Commit**

```bash
git add app-old/src/screens/profile/components/privacy-quick-settings-modal.tsx app-old/src/screens/profile/components/privacy-quick-settings-modal.test.tsx
git commit -m "feat(privacy): add quick privacy settings popup component"
```

---

### Task 4: Wire the popup into the profile card

**Files:**

- Modify: `app-old/src/screens/profile/Header.tsx:25` (import), `:103-121` (props type), `:320-338` (destructuring), `:351` (state), `:784-807` (settings icon row), `:912-958` (tagline row), `:1196-1202` (modal render)
- Modify: `app-old/src/screens/profile/Profile.tsx:636-638`

**Interfaces:**

- Consumes: `PrivacyQuickSettingsModal` from Task 3 (`./components/privacy-quick-settings-modal`).
- Produces: nothing new consumed elsewhere — this is the final integration task.

No new test file: `Header.tsx` has no existing test suite (it's a ~1600-line component wired to Firebase, Pusher, RevenueCat, `useFocusEffect`, etc. — building a test harness for it from scratch is disproportionate to a wiring-only change, and would duplicate coverage Task 3's test file already provides for the actual new logic). This task changes no business logic, only JSX wiring, verified by type-check + running the app.

- [ ] **Step 1: Drop the now-unused `Switch` import**

In `app-old/src/screens/profile/Header.tsx`, remove line 25:

```ts
import { Switch } from 'react-native-switch';
```

(Leave the `Entypo` import on the line below it — still used for the pencil icon and, after Step 5, the new eye icon.)

- [ ] **Step 2: Import the new component**

In the same file, after the existing:

```ts
import GiftBadge from './components/gift-badge';
import GiftClaimModal from './components/gift-claim-modal';
import { buildUpdatedUserAfterGiftClaim } from './gift-claim-outcome';
```

add:

```ts
import GiftBadge from './components/gift-badge';
import GiftClaimModal from './components/gift-claim-modal';
import PrivacyQuickSettingsModal from './components/privacy-quick-settings-modal';
import { buildUpdatedUserAfterGiftClaim } from './gift-claim-outcome';
```

(alphabetical order, matching the existing `simple-import-sort` convention in this block.)

- [ ] **Step 3: Remove the tagline-privacy props from `HeaderProps` and the destructure**

Replace:

```ts
  taglinePrivacyVisible?: boolean;
  taglinePrivacyUpdating?: boolean;
  onTaglinePrivacyChange?: () => void;
};
```

with:

```ts
};
```

Replace:

```ts
  taglinePrivacyVisible = true,
  taglinePrivacyUpdating = false,
  onTaglinePrivacyChange = () => null,
}: HeaderProps) => {
```

with:

```ts
}: HeaderProps) => {
```

- [ ] **Step 4: Add local state for the popup**

Replace:

```ts
const [giftModalVisible, setGiftModalVisible] = useState(false);
const [reviewModalVisible, setReviewModalVisible] = useState(false);
```

with:

```ts
const [giftModalVisible, setGiftModalVisible] = useState(false);
const [reviewModalVisible, setReviewModalVisible] = useState(false);
const [privacySettingsVisible, setPrivacySettingsVisible] = useState(false);
```

- [ ] **Step 5: Add the eye icon to the left of the gear icon**

Replace:

```tsx
{
  showSettings && (
    <View
      style={[
        Styles.heroMenuContainer,
        {
          left: Rtl ? wp(4) : undefined,
          right: Rtl ? undefined : wp(4),
        },
      ]}
    >
      <Ripple
        style={Styles.overflowBtn}
        onPress={() => navigation.navigate('Settings')}
        hitSlop={12}
        rippleColor={Colors.color2}
      >
        <Ionicons name="settings-outline" color={Colors.color2} size={wp(5)} />
      </Ripple>
    </View>
  );
}
```

with:

```tsx
{
  showSettings && (
    <View
      style={[
        Styles.heroMenuContainer,
        {
          left: Rtl ? wp(4) : undefined,
          right: Rtl ? undefined : wp(4),
        },
      ]}
    >
      <Ripple
        style={Styles.overflowBtn}
        onPress={() => setPrivacySettingsVisible(true)}
        hitSlop={12}
        rippleColor={Colors.color2}
        accessibilityRole="button"
        accessibilityLabel={t(LanguageKeys.privacySettings)}
      >
        <Entypo name="eye" color={Colors.color2} size={wp(5)} />
      </Ripple>
      <Ripple
        style={Styles.overflowBtn}
        onPress={() => navigation.navigate('Settings')}
        hitSlop={12}
        rippleColor={Colors.color2}
      >
        <Ionicons name="settings-outline" color={Colors.color2} size={wp(5)} />
      </Ripple>
    </View>
  );
}
```

- [ ] **Step 6: Remove the tagline row's eye+switch, keep the edit row**

Replace:

```tsx
<View style={Styles.taglinePrivacyRow}>
  <Ripple
    style={Styles.taglineEditRow}
    onPress={onTaglineEditPress}
    rippleColor={Colors.lavender}
  >
    <Entypo name="pencil" size={wp(3.8)} color={Colors.primaryMid} />
    {tagline && tagline.trim().length ? (
      <ReactText
        style={[
          Styles.cardTagline,
          { textAlign: Rtl ? 'right' : 'left', flex: 1 },
        ]}
        numberOfLines={2}
      >
        {`"${tagline}"`}
      </ReactText>
    ) : (
      <Text
        style={[Styles.cardTagline, Styles.cardTaglineMuted, { flex: 1 }]}
        numberOfLines={2}
      >
        {LanguageKeys.enterTagline}
      </Text>
    )}
  </Ripple>
  <Entypo
    name={taglinePrivacyVisible ? 'eye' : 'eye-with-line'}
    size={wp(3.8)}
    color={Colors.muted}
  />
  <Switch
    value={taglinePrivacyVisible}
    onValueChange={onTaglinePrivacyChange}
    disabled={taglinePrivacyUpdating}
    renderActiveText={false}
    renderInActiveText={false}
    circleSize={23}
    backgroundActive={Colors.primary}
    backgroundInactive={Colors.color18}
    innerCircleStyle={Styles.privacySwitchInner}
  />
</View>
```

with:

```tsx
<Ripple
  style={Styles.taglineEditRow}
  onPress={onTaglineEditPress}
  rippleColor={Colors.lavender}
>
  <Entypo name="pencil" size={wp(3.8)} color={Colors.primaryMid} />
  {tagline && tagline.trim().length ? (
    <ReactText
      style={[
        Styles.cardTagline,
        { textAlign: Rtl ? 'right' : 'left', flex: 1 },
      ]}
      numberOfLines={2}
    >
      {`"${tagline}"`}
    </ReactText>
  ) : (
    <Text
      style={[Styles.cardTagline, Styles.cardTaglineMuted, { flex: 1 }]}
      numberOfLines={2}
    >
      {LanguageKeys.enterTagline}
    </Text>
  )}
</Ripple>
```

- [ ] **Step 7: Drop the now-unused `taglinePrivacyRow`/`privacySwitchInner` styles**

Replace:

```ts
  taglinePrivacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
  },
  privacySwitchInner: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  reviewStatusIcon: {
```

with:

```ts
  reviewStatusIcon: {
```

- [ ] **Step 8: Render the modal**

Replace:

```tsx
      <GiftClaimModal
        visible={giftModalVisible}
        giftCredits={giftCredits}
        onClose={closeGiftModal}
        onClaimed={onGiftClaimed}
        claim={claimGift}
      />
    </View>
  );
```

with:

```tsx
      <GiftClaimModal
        visible={giftModalVisible}
        giftCredits={giftCredits}
        onClose={closeGiftModal}
        onClaimed={onGiftClaimed}
        claim={claimGift}
      />
      <PrivacyQuickSettingsModal
        visible={privacySettingsVisible}
        onClose={() => setPrivacySettingsVisible(false)}
      />
    </View>
  );
```

- [ ] **Step 9: Stop passing the removed props from `Profile.tsx`**

In `app-old/src/screens/profile/Profile.tsx`, replace:

```tsx
            onTaglineEditPress={showTagLineInput}
            onTaglineCancel={hideTagLineInput}
            taglinePrivacyVisible={profileFieldVisibility.tagline !== 'private'}
            taglinePrivacyUpdating={privacyUpdatingField === 'tagline'}
            onTaglinePrivacyChange={() =>
              updateInlinePrivacy(
                'tagline',
                profileFieldVisibility.tagline === 'private'
                  ? 'public'
                  : 'private'
              )
            }
          />
```

with:

```tsx
            onTaglineEditPress={showTagLineInput}
            onTaglineCancel={hideTagLineInput}
          />
```

Do **not** touch `profileFieldVisibility`, `privacyUpdatingField`, or `updateInlinePrivacy` themselves — they're still used a few lines down by `InterestsPickerModal` (`privacyVisible`/`privacyUpdating`/`onPrivacyChange` props, around line 745) for the `personality_id` field. Only the three prop-lines being passed into `<Header>` are removed.

- [ ] **Step 10: Type-check**

Run: `cd app-old && yarn type-check`
Expected: PASS, no new errors (this specifically proves no other caller still passes the removed `HeaderProps` fields).

- [ ] **Step 11: Scoped lint**

Run: `cd app-old && yarn eslint src/screens/profile/Header.tsx src/screens/profile/Profile.tsx src/screens/profile/components/privacy-quick-settings-modal.tsx`
Expected: no new errors (pre-existing warnings elsewhere in the repo are fine; don't chase those down as part of this task).

- [ ] **Step 12: Run the existing EditProfileGroup and new component tests together as a regression check**

Run: `cd app-old && yarn jest src/screens/profile`
Expected: PASS, all suites green.

- [ ] **Step 13: Commit**

```bash
git add app-old/src/screens/profile/Header.tsx app-old/src/screens/profile/Profile.tsx
git commit -m "feat(privacy): replace tagline eye toggle with quick privacy settings entry point"
```

- [ ] **Step 14: Manual verification (hand off to the user)**

This is a React Native app — there's no browser preview for it. Per established preference, native builds are the user's to run. Ask the user to run `yarn start` + `yarn android`/`yarn ios` and check on the "My Profile" screen:

1. The tagline row no longer shows an eye/switch next to it.
2. A new eye icon appears to the left of the gear icon (top-right of the hero photo).
3. Tapping it opens the bottom sheet with the Invisible mode switch and the 3-option radio list, visually consistent with the "My Photos" info sheet.
4. Toggling Invisible mode and picking each radio option updates immediately (no separate save step) and persists after closing/reopening the popup.
5. Opening Settings → Privacy settings afterward shows the same state, including a 4th "Hide completely for everyone" option when selected from the popup.

---

## Post-plan follow-up (not part of this plan)

While tracing `search_visibility`'s update path for Task 3, `PrivacySettings.tsx`'s existing `updateToggle` (lines 175-220) was found to locally overwrite `email_notification`/`sms_notification` in the cached user object with `undefined` whenever only `search_visibility` is toggled (it reads `newParams.email_notification`/`newParams.sms_notification`, which are absent from `hideFromSearchToggle`'s `params`). This doesn't affect the server (Eloquent `update()` only touches keys actually sent), but could make the notification toggles visually reset until the next full user refetch. Pre-existing, unrelated to this feature — worth its own fix.
