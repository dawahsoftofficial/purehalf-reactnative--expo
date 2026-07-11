# Debug Delete-Account-and-Restart — Design

**Date:** 2026-07-11
**Status:** Approved (design), pending implementation plan
**Scope:** Spans two repos — `app-old/` (React Native mobile) and the sibling `admin/` (Laravel 12). This document lives in the mobile repo but describes both sides.

## Problem

Manually testing the signup flow repeatedly requires deleting the test account through the real (soft-delete, OTP-gated, multi-screen) account-deletion flow, then waiting for the phone/email uniqueness constraint to clear. This is slow enough to discourage frequent re-testing of signup. A one-tap, debug-only "wipe this account and restart the app" tool removes that friction during manual QA.

## Goals

- A single floating, draggable icon, visible everywhere in the app (including pre-login/signup screens), gated on a mobile `APP_DEBUG` flag.
- Tapping it, after a confirm dialog, permanently (hard) deletes the current user's account server-side, clears all local app state, and restarts the app so it lands back on a fresh signup flow.

## Non-goals (YAGNI)

- No audit/reconciliation of accounts already deleted the old (soft-delete) way — unrelated.
- No submenu or multiple debug actions — one icon, one action, per the original ask.
- No i18n coverage for this feature's UI text (confirm dialog copy). This is an internal debug tool never shown to a real user; translating it would add translation-file upkeep with no product value. Documented here as a deliberate, scoped exception to the "every user-visible string goes through `t()`" convention in `app-old/CLAUDE.md`.
- No automated mobile test — consistent with this repo's current state (`yarn test` is broken; see `app-old/CLAUDE.md` Known Issues). Verified by manual QA instead.

## Decisions (confirmed with user)

1. **Delete scope:** full backend hard-delete of the user row and related data (not the existing soft-delete OTP flow).
2. **Icon visibility:** everywhere, including pre-login/signup screens.
3. **Confirmation:** a native confirm `Alert` before the destructive action (one extra tap, not a full re-auth step).
4. **Gating mechanism:** a new mobile-only `APP_DEBUG` env flag (`app-old/.env`, already set to `true` by the user), read via `react-native-dotenv` / `@env` — independent of `__DEV__` and independent of the backend's own `APP_DEBUG`.
5. **Backend safety net:** the new hard-delete endpoint additionally gates on Laravel's own `config('app.debug')` (already `true` in `admin/.env` for this environment), so the endpoint 404s in any environment where the backend's `APP_DEBUG` is `false` — regardless of what a given mobile build has baked in for its own `APP_DEBUG`.

---

## Admin side (`admin/`, Laravel 12, Passport-style `auth:api_user`)

### New endpoint

`DELETE /v1/app/auth/debug/force-delete-account`, registered in `routes/api.php` inside the existing authenticated `auth` group (`middleware: ['auth:api_user', 'scope.abilities:user']`) — same auth requirement as the existing (soft) delete-account endpoint, so only a logged-in user can hard-delete their own account.

### Controller

New `AuthController::forceDeleteAccountDebug()`:

- First line: `if (! config('app.debug')) { abort(404); }` — the endpoint does not exist (404, not 403) in any environment where the backend's `APP_DEBUG` is off.
- Resolves the authenticated user's id the same way `deleteAccount()` does.
- Calls the **already-existing** `BaseRepository::forceDelete($id)`, which already force-deletes `detail`, `media`, and `all_interaction` relations plus the user row itself. No new deletion logic — this method exists today but is currently unused by any route.
- No OTP, no `purpose_of_leaving` — single call, immediate.

### Backend tests (PHPUnit feature)

- Authenticated user hits the endpoint → user row and its `detail`/`media`/`all_interaction` relations are gone (force-deleted, not soft-deleted).
- With `config(['app.debug' => false])`, the same request returns 404.

---

## Mobile side (`app-old/`, React Native)

### Env plumbing

- `app-old/.env` already has `APP_DEBUG=true` (user-added). Add the missing type declaration to `src/types/env.d.ts`: `export const APP_DEBUG: string;`.

### Component

New `src/components/DebugDeleteButton.tsx` (flat file, matching the existing convention in `src/components/` — e.g. `BlurView.tsx`, `Container.tsx`, `Header.tsx`):

- A small circular floating button, draggable anywhere on screen via `react-native-gesture-handler`'s `Gesture.Pan()` + `react-native-reanimated`'s `useSharedValue`/`useAnimatedStyle` (both already installed — no new dependency for the drag itself). Initial position: near the bottom-right corner.
- A single tap **is** the action — no submenu.
- The whole component renders `null` unless `APP_DEBUG === 'true'` (from `@env`).

### Mount point

`App.tsx`, inside `GestureHandlerRootView` → `MenuProvider`, as a sibling to the existing `<FlashMessage>` — gesture context is already available there.

### New dependency

`react-native-restart`, added to `app-old/package.json`. Needed because gating is on `APP_DEBUG` (baked into the JS bundle at build time), not `__DEV__` — so this could in principle be present in a non-dev build too if `APP_DEBUG` isn't flipped back to `false` before a real release build. `DevSettings.reload()` is dev-only and would silently no-op in a release bundle, so a true native restart module is used instead.

### Action flow

On tap → a plain (non-translated, per the Non-goals note) confirm `Alert`: "Delete account? This permanently deletes your account and restarts the app. This cannot be undone." On confirm:

1. Call the new debug delete endpoint with the stored bearer token, following the existing `axios` request pattern used by `deleteAccount` in `src/services/api/Services.tsx` (add the new endpoint constant to `src/services/api/EndPoints.tsx` and one new method to `Services.tsx`, per the "search by function name, don't tidy the rest" convention for that file) — no OTP/`purpose_of_leaving` body needed.
2. Regardless of that call's outcome (wrapped in try/catch — a network failure or already-invalid token must never block the reset):
   - `StorageManager.deleteAll()` — wipes all MMKV-persisted state (token, user, `IS_LOGGED_IN`, FCM token, etc.).
   - A new small `signOut` export added to `src/services/firebase/Firebase.tsx` (which currently only exports `signInWithPhoneNumber`-based helpers, no sign-out) — clears Firebase Auth state, since signup uses `signInWithPhoneNumber` and leftover Firebase auth session state could otherwise persist across the "new" signup.
   - `RNRestart.restart()` — reloads the JS bundle, landing back on the initial/auth flow as if freshly launched.

### Mobile verification

No automated test (see Non-goals). Manual QA: drag the icon around, confirm it doesn't block other UI, tap it, confirm the dialog, confirm on the backend that the user row and its relations are gone, confirm the app restarts straight into the signup/auth flow with no stale session.

---

## Rollout order

1. **Admin backend** (additive: new route + controller method, no schema change, reuses an existing repository method). Safe to ship ahead of the app.
2. **Mobile** (env plumbing, component, App.tsx mount, new dependency, service call, local-state wipe + restart).

## Open implementation notes

None — both sides were fully scoped and confirmed with the user before writing this spec.
