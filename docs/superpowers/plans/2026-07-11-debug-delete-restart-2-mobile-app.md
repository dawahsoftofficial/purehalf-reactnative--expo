# Debug Delete-Account-and-Restart — Plan 2: Mobile App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Target repo:** `D:\GitHub\Pure Half\app-old` (React Native 0.82). All paths below are relative to that repo. Run all commands from there.
>
> **Revision (2026-07-11):** replaces the original floating-draggable-icon design with a row in the existing Settings screen. See the spec's Revision History section for why. This supersedes any earlier version of this plan file — do not build a floating icon or touch `App.tsx`.

**Goal:** A debug-only row in the Settings screen (gated on `APP_DEBUG`) that, after a confirm dialog, hard-deletes the account via the new backend endpoint, wipes all local state, and restarts the app.

**Architecture:** Task 1 adds the small, mechanical plumbing (env type declaration, a new Firebase sign-out export, a new API service method) that has no user-visible behavior on its own. Task 2 adds a small debug-logic module and one new Settings-screen entry that calls it, plus the new restart dependency — this is the task with an end-to-end, manually-testable deliverable.

**Tech Stack:** React Native 0.82 (new architecture), TypeScript, `react-native-dotenv` (`@env`), MMKV (`StorageManager`), `@react-native-firebase/auth`. (No gesture/animation libraries needed — this is a plain list row, not a floating draggable element.)

**Spec:** `docs/superpowers/specs/2026-07-11-debug-delete-account-restart-design.md`.

## Global Constraints

- This is a debug-only tool. No i18n for its UI text (plain hardcoded strings) — a deliberate, documented exception to this repo's usual "every user-visible string goes through `t()`" rule, because this text is never shown to a real user.
- No automated test for this feature (`yarn test` is currently broken in this repo — see `CLAUDE.md` Known Issues). Verification is `yarn type-check` (must stay clean) + manual QA, matching how other mobile-only plans in this repo (e.g. the notification-center plan) verify.
- **Restart library risk, read before Task 2:** the obvious choice, `react-native-restart`, is a well-established, actively-maintained package (latest release 2026-05-28), but its README targets a newer React Native floor than this project's 0.82, and there is no definitive public confirmation it's fully compatible with RN's New-Architecture-only mode (which this project runs). Task 2 has an explicit runtime-verification step for this and a documented fallback (`react-native-restart-newarch`, same `RNRestart.restart()`-shaped API) if the primary choice doesn't actually trigger a restart on-device. Do not skip that verification step.
- Per this repo's `Services.tsx` convention: when adding one endpoint method, don't refactor unrelated parts of that file.

---

### Task 1: Env flag, Firebase sign-out export, API service method

**Files:**

- Modify: `src/types/env.d.ts`
- Modify: `src/services/firebase/Firebase.tsx`
- Modify: `src/services/api/EndPoints.tsx`
- Modify: `src/services/api/Services.tsx`

**Interfaces:**

- Consumes: existing module-level `auth` const in `Firebase.tsx` (`const auth = getAuth(firebaseApp);`, already present at line 35), existing `BaseUrl`, `EndPoints`, `StorageManager` imports already used by `Services.tsx`'s `deleteAccount` method.
- Produces (for Task 2): `APP_DEBUG: string` importable from `@env`; `Firebase.debugSignOut(): Promise<void>` (default-exported `FirebaseServices` instance, re-exported as `Firebase` from `src/services/firebase/index.tsx`); `ApiServices.debugForceDeleteAccount(): Promise<unknown>` (the `Services.tsx` default-exported instance).

- [ ] **Step 1: Add the `APP_DEBUG` type declaration**

In `src/types/env.d.ts`, the current full content is:

```typescript
declare module '@env' {
  export const API_BASE_URL: string;
  export const FIREBASE_CONVERSATIONS_PATH: string;
  export const ENV: string;
  export const PUSHER_API_KEY: string;
  export const PUSHER_CLUSTER: string;
  export const PUSHER_AUTH_ENDPOINT: string;
}
```

Replace it with:

```typescript
declare module '@env' {
  export const API_BASE_URL: string;
  export const FIREBASE_CONVERSATIONS_PATH: string;
  export const ENV: string;
  export const PUSHER_API_KEY: string;
  export const PUSHER_CLUSTER: string;
  export const PUSHER_AUTH_ENDPOINT: string;
  export const APP_DEBUG: string;
}
```

(`app-old/.env` already has `APP_DEBUG=true` — this only adds the missing TypeScript declaration so `import { APP_DEBUG } from '@env'` type-checks.)

- [ ] **Step 2: Add `debugSignOut` to `Firebase.tsx`**

In `src/services/firebase/Firebase.tsx`, change the import at line 2 from:

```typescript
import { getAuth, signInWithPhoneNumber } from '@react-native-firebase/auth';
```

to:

```typescript
import {
  getAuth,
  signInWithPhoneNumber,
  signOut,
} from '@react-native-firebase/auth';
```

Then, inside the `GFirebase` class, immediately before its closing brace (currently at line 465, right after the last method), add:

```typescript
debugSignOut = () => {
  return signOut(auth);
};
```

- [ ] **Step 3: Add the debug endpoint constant**

In `src/services/api/EndPoints.tsx`, immediately after the existing line:

```typescript
  deleteAccount: '/auth/delete/account',
```

add:

```typescript
  debugForceDeleteAccount: '/auth/debug/force-delete-account',
```

- [ ] **Step 4: Add the API service method**

In `src/services/api/Services.tsx`, immediately after the existing `deleteAccount` method (the one using `EndPoints.deleteAccount`), add:

```typescript
debugForceDeleteAccount = () => {
  return new Promise(async (resolve, reject) => {
    const config = {
      method: 'delete',
      maxBodyLength: Infinity,
      url: `${BaseUrl}${EndPoints.debugForceDeleteAccount}`,
      headers: {
        Authorization: `Bearer ${await StorageManager.getData(StorageManager.storageKeys.USER_TOKEN)}`,
        'Content-Type': 'application/json',
      },
    };
    axios
      .request(config)
      .then(() => {
        resolve('');
      })
      .catch((error) => {
        reject(error);
        console.log('error while debug force-deleting account =>', error);
      });
  });
};
```

No flash-message calls here (unlike `deleteAccount`) — the app is about to wipe storage and restart immediately after this call, so a flash message would never be seen.

- [ ] **Step 5: Type-check**

Run: `yarn type-check`

Expected: clean (no new errors), matching the repo's current clean baseline.

- [ ] **Step 6: Commit**

```bash
git add src/types/env.d.ts src/services/firebase/Firebase.tsx src/services/api/EndPoints.tsx src/services/api/Services.tsx
git commit -m "feat(debug): add APP_DEBUG typing, Firebase sign-out, debug delete API call

Plumbing for the debug delete-and-restart tool: declares the APP_DEBUG
env var, adds a signOut export to the Firebase service (none existed —
signup only ever signs in), and wires the new debug force-delete-account
endpoint into Services.tsx."
```

---

### Task 2: Debug logic module, Settings screen entry, restart dependency

**Files:**

- Create: `src/services/debug/debugDeleteAccountAndRestart.ts`
- Modify: `src/screens/settings/Settings.tsx`
- Modify: `package.json` (new dependency, via `yarn add`, not hand-edited)

**Interfaces:**

- Consumes: `APP_DEBUG` from `@env`, `ApiServices.debugForceDeleteAccount(): Promise<unknown>`, `Firebase.debugSignOut(): Promise<void>`, `StorageManager.deleteAll(): Promise<void>` (existing, unchanged) — all from Task 1 / pre-existing code. Also consumes the existing `SettingsMenuItem` type (`{iconName: string; name: string; onPress: () => void; showCondition?: () => boolean}`) and `settingsSections` array already defined in `Settings.tsx`.
- Produces: nothing consumed elsewhere — this is the top of the feature's call graph.

- [ ] **Step 1: Add the restart dependency**

Run: `yarn add react-native-restart`

Then, since this project targets iOS too:

Run (macOS only — skip if not on macOS): `cd ios && bundle exec pod install && cd ..`

- [ ] **Step 2: Create the debug logic module**

Create `src/services/debug/debugDeleteAccountAndRestart.ts`:

```typescript
import { Alert } from 'react-native';
import RNRestart from 'react-native-restart';

import ApiServices from '../api/Services';
import { Firebase } from '../firebase';
import { StorageManager } from '../storageManager';

const deleteAccountAndRestart = async (): Promise<void> => {
  try {
    await ApiServices.debugForceDeleteAccount();
  } catch (error) {
    console.log('debug: force-delete-account failed =>', error);
  }

  try {
    await StorageManager.deleteAll();
  } catch (error) {
    console.log('debug: clearing storage failed =>', error);
  }

  try {
    await Firebase.debugSignOut();
  } catch (error) {
    console.log('debug: firebase signOut failed =>', error);
  }

  RNRestart.restart();
};

export const confirmDebugDeleteAccountAndRestart = (): void => {
  Alert.alert(
    'Delete account?',
    'This permanently deletes your account and restarts the app. This cannot be undone.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteAccountAndRestart();
        },
      },
    ]
  );
};
```

- [ ] **Step 3: Wire it into the Settings screen**

In `src/screens/settings/Settings.tsx`, add the import alongside the other local imports (after the `useGlobalContext` import):

```typescript
import { APP_DEBUG } from '@env';

import { confirmDebugDeleteAccountAndRestart } from '../../services/debug/debugDeleteAccountAndRestart';
```

Add a new callback next to the other `on*Press` callbacks (e.g. after `onNeedHelpPress`):

```typescript
const onDebugDeleteAccountPress = useCallback(() => {
  confirmDebugDeleteAccountAndRestart();
}, []);
```

Add a new section to the `settingsSections` array — append it as the last entry, after the `supportSection` entry, immediately before the array's closing `],`:

```typescript
      {
        title: 'Debug',
        data: [
          {
            iconName: 'trash-outline',
            name: 'Delete Test Account & Restart',
            onPress: onDebugDeleteAccountPress,
            showCondition: () => APP_DEBUG === 'true',
          },
        ],
      },
```

Add `onDebugDeleteAccountPress` to the `useMemo` dependency array that already lists `onBasicInfoPress, onLocationPress, ...` (the one immediately below the `settingsSections` array definition).

- [ ] **Step 4: Type-check**

Run: `yarn type-check`

Expected: clean (no new errors).

- [ ] **Step 5: Build and manually verify on a real device/emulator — including the restart library**

This step cannot be skipped or replaced with a static check; it is the only way to confirm the native restart module actually works in this project's build.

1. Run the app (`yarn android` or `yarn ios`) with `APP_DEBUG=true` in `.env` (already set).
2. Log in, navigate to Settings, confirm a "Debug" section with a "Delete Test Account & Restart" row appears at the bottom.
3. Tap it — confirm the confirm dialog appears.
4. Tap "Delete" — confirm the app restarts (returns to the splash/initial screen) within a few seconds, with no stale logged-in state.
5. **If step 4 does not restart the app** (e.g. a "native module not found" error, or nothing happens): this confirms the compatibility risk noted in Global Constraints. Swap the dependency: `yarn remove react-native-restart && yarn add react-native-restart-newarch`, change the import in `src/services/debug/debugDeleteAccountAndRestart.ts` from `import RNRestart from 'react-native-restart';` to `import RNRestart from 'react-native-restart-newarch';` (the call site, `RNRestart.restart()`, is unchanged), rebuild, and repeat steps 1-4.
6. Confirm server-side: the account used in step 4 no longer exists (check the admin panel or query the `users` table for that phone/email — it should be gone, not just soft-deleted).
7. Confirm with `APP_DEBUG` unset or `false`: the "Debug" section does not appear in Settings at all.

- [ ] **Step 6: Commit**

```bash
git add src/services/debug/debugDeleteAccountAndRestart.ts src/screens/settings/Settings.tsx package.json yarn.lock
git commit -m "feat(debug): add Settings-screen delete-account-and-restart tool

Debug-only (APP_DEBUG-gated) row in Settings: tap to confirm, then
permanently delete the current account, wipe local storage, sign out
of Firebase, and restart the app for fast re-testing of the signup
flow."
```

If Step 5.5's fallback was needed, `git add` should include whichever restart package ended up in `package.json`/`yarn.lock`, and the commit message should note the swap and why.

---

## Self-Review Notes

- **Spec coverage:** env plumbing, Firebase sign-out, API call → Task 1. Debug logic module, Settings entry, restart dependency, manual QA → Task 2. The spec's i18n and automated-test exceptions are captured in Global Constraints, not a code task.
- **Placeholder scan:** no TODO/TBD; all steps show literal code and exact commands. The restart-library fallback is an explicit, concrete swap (exact commands and exact import-line change), not a vague "handle if it doesn't work."
- **Type consistency:** `Firebase.debugSignOut()`, `ApiServices.debugForceDeleteAccount()`, and `StorageManager.deleteAll()` are called in Task 2 exactly as defined/existing in Task 1 and pre-existing code. `confirmDebugDeleteAccountAndRestart(): void` matches its one call site in `Settings.tsx`'s new `onDebugDeleteAccountPress` callback. The new `SettingsMenuItem` object literal matches the existing type shape (`iconName`, `name`, `onPress`, `showCondition`) exactly, and `showCondition`'s presence is what the existing `visibleSections` filter already checks.
