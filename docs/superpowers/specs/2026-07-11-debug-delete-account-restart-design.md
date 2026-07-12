# Debug Delete-Account-and-Restart — Design

**Date:** 2026-07-11
**Status:** Approved (design), pending implementation plan
**Scope:** Spans two repos — `app-old/` (React Native mobile) and the sibling `admin/` (Laravel 12). This document lives in the mobile repo but describes both sides.

## Problem

Manually testing the signup flow repeatedly requires deleting the test account through the real (soft-delete, OTP-gated, multi-screen) account-deletion flow, then waiting for the phone/email uniqueness constraint to clear. This is slow enough to discourage frequent re-testing of signup. A one-tap, debug-only "wipe this account and restart the app" tool removes that friction during manual QA.

## Goals

- A single debug-only row in the existing Settings screen, gated on a mobile `APP_DEBUG` flag.
- Tapping it, after a confirm dialog, permanently (hard) deletes the current user's account server-side, clears all local app state, and restarts the app so it lands back on a fresh signup flow.

## Revision history

- 2026-07-11 (original): floating, draggable icon visible everywhere (including pre-login), gated on `APP_DEBUG`.
- 2026-07-11 (revised): replaced with a row in the Settings screen, gated the same way. Settings is a logged-in-only screen, so "everywhere including pre-login" no longer applies — this tool is only reachable once a test account is logged in, which matches its actual use (wiping the _current_ account, which requires being logged into it). Dropped `react-native-gesture-handler`/`react-native-reanimated` drag logic and the `App.tsx` mount entirely — the existing `SettingsMenuItem.showCondition` mechanism already gates rows conditionally, so this is a plain list item, not a new interaction paradigm.

## Non-goals (YAGNI)

- No audit/reconciliation of accounts already deleted the old (soft-delete) way — unrelated.
- No submenu or multiple debug actions — one row, one action, per the original ask.
- No i18n coverage for this feature's UI text (confirm dialog copy). This is an internal debug tool never shown to a real user; translating it would add translation-file upkeep with no product value. Documented here as a deliberate, scoped exception to the "every user-visible string goes through `t()`" convention in `app-old/CLAUDE.md`.
- No automated mobile test — consistent with this repo's current state (`yarn test` is broken; see `app-old/CLAUDE.md` Known Issues). Verified by manual QA instead.

## Decisions (confirmed with user)

1. **Delete scope:** full backend hard-delete of the user row and related data (not the existing soft-delete OTP flow).
2. **Location/visibility:** a row in the existing Settings screen (`src/screens/settings/Settings.tsx`), not a floating icon — visible only when logged in (Settings is a post-login screen), which is the only time the action is meaningful anyway.
3. **Confirmation:** a native confirm `Alert` before the destructive action (one extra tap, not a full re-auth step).
4. **Gating mechanism:** a new mobile-only `APP_DEBUG` env flag (`app-old/.env`, already set to `true` by the user), read via `react-native-dotenv` / `@env` — independent of `__DEV__` and independent of the backend's own `APP_DEBUG`.
5. **Backend safety net (revised — see Revision history):** the new hard-delete endpoint gates on a dedicated config flag, `config('app.allow_debug_account_delete')` (env `ALLOW_DEBUG_ACCOUNT_DELETE`, default `false` everywhere), independent of `config('app.debug')`.

## Revision history (backend gate)

- 2026-07-11 (original): gated on `config('app.debug')`, reasoning that it would be `false` in any real/shared environment.
- 2026-07-11 (revised, post final-review): a whole-branch review found this assumption false for this project — the actual staging environment (which mobile builds' `API_BASE_URL` points at) runs with `APP_DEBUG=true`. Gating an irreversible, cascading self-account-deletion endpoint on a flag that's routinely `true` on a shared environment was assessed Critical. Switched to a dedicated, off-by-default flag whose only purpose is this endpoint, so it can never be accidentally live via an unrelated reason to leave general debug output on. **Operational note:** since mobile's `API_BASE_URL` points at staging, using this tool from a real device requires deliberately setting `ALLOW_DEBUG_ACCOUNT_DELETE=true` on staging's backend for the duration of testing, then setting it back to `false` — it is not local-only by design (the user chose the dedicated-flag option over restricting to `app()->environment('local')` specifically so the tool still works against staging).
- Also added per the same review: an audit log line (`Log::warning`, user id + IP) before the delete, and a `DB::transaction`/try-catch wrapper matching the existing `deleteAccount` method's convention (defense-in-depth; the underlying `forceDelete` cascades are FK-safe either way).

---

## Admin side (`admin/`, Laravel 12, Passport-style `auth:api_user`)

### New endpoint

`DELETE /v1/app/auth/debug/force-delete-account`, registered in `routes/api.php` inside the existing authenticated `auth` group (`middleware: ['auth:api_user', 'scope.abilities:user']`) — same auth requirement as the existing (soft) delete-account endpoint, so only a logged-in user can hard-delete their own account.

### Controller

`AuthController::forceDeleteAccountDebug()` (revised — see Revision history above):

- First line: `if (! config('app.allow_debug_account_delete')) { abort(404); }` — the endpoint does not exist (404, not 403) unless the dedicated, off-by-default flag is explicitly on.
- Logs an audit line before deleting: `Log::warning('Debug force-delete-account triggered', ['user_id' => $currentUser->id, 'ip' => request()->ip()]);` — this is an irreversible action with no other record of who/when.
- Wrapped in `DB::beginTransaction()` / `commit()` / `catch (Exception $ex) { DB::rollBack(); return $this->error(...); }`, matching the existing `deleteAccount()` method's convention.
- Resolves the authenticated user's id the same way `deleteAccount()` does.
- Calls the **already-existing** `BaseRepository::forceDelete($id)`, which already force-deletes `detail`, `media`, and `all_interaction` relations plus the user row itself. No new deletion logic — this method exists today but is currently unused by any route.
- No OTP, no `purpose_of_leaving` — single call, immediate.

New config key in `config/app.php`, immediately after the existing `'debug'` key: `'allow_debug_account_delete' => (bool) env('ALLOW_DEBUG_ACCOUNT_DELETE', false),`.

### Backend tests (PHPUnit feature)

- Authenticated user hits the endpoint with the flag on → user row and its `detail`/`media`/`all_interaction` relations are gone (force-deleted, not soft-deleted).
- With `config(['app.allow_debug_account_delete' => false])`, the same request returns 404.

---

## Mobile side (`app-old/`, React Native)

### Env plumbing

- `app-old/.env` already has `APP_DEBUG=true` (user-added). Add the missing type declaration to `src/types/env.d.ts`: `export const APP_DEBUG: string;`.

### Settings entry

`src/screens/settings/Settings.tsx` already renders `SettingsSection[]` (each `{title, data: SettingsMenuItem[]}`) through a `SettingsButton` per item, and `SettingsMenuItem` already has an optional `showCondition?: () => boolean` gate (currently used, commented out, for a gender-based guardian entry) — so no new conditional-rendering mechanism is needed.

Add one new section to the `settingsSections` array:

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

The existing `visibleSections` filter (`.filter((section) => section.data.length > 0)`) already drops a section whose only item's `showCondition` returns false, so the whole "Debug" section disappears automatically outside debug builds — no extra logic needed. The row's label is a plain hardcoded string, not `t()`/`LanguageKeys` (see Non-goals — deliberate i18n exception for this debug-only text).

### Debug delete/restart logic module

New `src/services/debug/debugDeleteAccountAndRestart.ts`, exporting one function, `confirmDebugDeleteAccountAndRestart(): void`, containing the confirm `Alert` + orchestration described in Action Flow below. `Settings.tsx`'s `onDebugDeleteAccountPress` callback just calls it — kept out of `Settings.tsx` itself so that already-sizable file gains one import and one callback, not ~30 lines of orchestration logic.

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

No automated test (see Non-goals). Manual QA: with `APP_DEBUG=true`, open Settings and confirm the "Debug" section/row appears; tap it, confirm the dialog; confirm on the backend that the user row and its relations are gone; confirm the app restarts straight into the signup/auth flow with no stale session.

---

## Rollout order

1. **Admin backend** (additive: new route + controller method, no schema change, reuses an existing repository method). Safe to ship ahead of the app.
2. **Mobile** (env plumbing, debug logic module, Settings.tsx entry, new dependency, service call, local-state wipe + restart).

## Open implementation notes

None — both sides were fully scoped and confirmed with the user before writing this spec.
