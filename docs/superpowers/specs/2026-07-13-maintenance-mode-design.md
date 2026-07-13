# Maintenance Mode — Design

**Date:** 2026-07-13
**Status:** Approved (design), pending implementation plan
**Scope:** Spans two repos — `app-old/` (React Native mobile) and the sibling `admin/` (Laravel 12). This document lives in the mobile repo but describes both sides.

## Problem

Staff sometimes need to take the platform down for maintenance (DB migrations, infra work, etc.) without members hitting confusing errors or a broken UI. Today there is no way to gate the mobile app: if the backend is degraded mid-maintenance, members just see whatever errors individual screens happen to produce.

We want an admin-controlled "maintenance mode" toggle. When on, any member opening (or resuming) the app is shown a full-screen maintenance notice — message plus an informational time range — and cannot use the rest of the app until it's turned off.

## Goals

- Staff can turn maintenance mode on/off from admin, with a custom message and an informational start/end time range.
- Members who open the app (cold start or foreground resume) while maintenance is on see a blocking, non-dismissable screen instead of the normal app.
- While the screen is shown, the app silently re-checks in the background and dismisses automatically the moment maintenance is turned off — no manual button needed.
- Reuses the existing `/settings` payload and startup-gate mechanism already used for the force-update flow — no new endpoints.

## Non-goals (YAGNI)

- No Laravel-level API middleware / 503 responses. This is a client-side gate only; other API endpoints keep working normally during maintenance (admin/staff tooling, in-flight requests, etc. are unaffected).
- No auto-expiry at `end_at`. The time range shown on screen is purely informational ("expected back by..."); staff always flip the toggle off manually, even if the end time has passed. No scheduled job.
- No real-time push (Pusher) channel for instant propagation. Detection is via launch/foreground-resume re-fetch plus a background poll while the screen is already showing (see Data Flow). Acceptable latency: up to the poll interval.
- No user actions on the screen beyond viewing the message (no manual retry button, no logout, no support link). If maintenance ends, the screen disappears on its own.
- No new admin-generic-Settings-CRUD usage — a small dedicated form is built instead (see Backend section), since hand-edited JSON is error-prone for staff.
- Laravel's own built-in `php artisan down`/`up` framework maintenance mode (`PreventRequestsDuringMaintenance` middleware) is a separate, pre-existing mechanism and out of scope here — this feature does not touch it.

## Decisions (confirmed with user)

1. **Control source:** Admin toggle in Laravel via a new `Setting` row (not env/config).
2. **Check timing:** App launch + foreground resume. (Plus a lightweight background poll, but only while the maintenance screen is already showing — see Data Flow.)
3. **Screen behavior:** Message + informational time range, auto-retry in the background, no manual button, no other actions.
4. **Backend enforcement:** Client-side gate only — no API middleware/503 blocking.
5. **End behavior:** Manual toggle off only — no auto-expiry at `end_at`.
6. **Admin UI:** A small dedicated form (toggle + message textarea + start/end datetime pickers), not the generic Setting CRUD.
7. **Screen mechanism:** Non-dismissable overlay `Modal` rendered from `Initialization.tsx`, matching the existing force-update pattern — not a separate registered stack screen.

## Architecture

### Backend (`admin/`)

- **New `Setting` row**, key `maintenance_mode`, `type: json`, `is_active: true` (always active — the on/off state lives inside the JSON, not the row flag, matching the existing `daily_recommendations` setting's internal `status` field). Value shape:
  ```json
  { "enabled": false, "message": "", "start_at": null, "end_at": null }
  ```
- **Migration**: idempotent create, following `2026_07_06_000002_add_rating_prompt_setting.php` — `if (!Setting::where('key', 'maintenance_mode')->exists()) { Setting::create([...]) }`, with a `down()` that deletes the row.
- **No controller/route changes for the read side** — this rides the existing public `GET /settings` → `listingController::settingIndex()`, which already returns all `is_active` rows' `{title, key, value, type}`. Zero changes needed there.
- **New dedicated admin form** for the write side: a small controller (e.g. `MaintenanceSettingController`) with `edit`/`update` actions routed at `admin/settings/maintenance`, plus a Blade view with an enabled checkbox, a message textarea, and start/end `datetime-local` inputs — writing directly into the one `maintenance_mode` Setting row's JSON value. This is separate from the generic `SettingController` CRUD.

### Mobile (`app-old/`)

- **`app-old/src/stores/settings-store.ts`**: add a `MaintenanceMode` type (`{ enabled: boolean; message: string; startAt: string | null; endAt: string | null }`) and a `getMaintenanceMode()` getter, following the existing `getSettingByKey<T>('maintenance_mode', default)` pattern already used for `getDailyRecommendations`/`getForceUpdate`. Default value has `enabled: false` (fail-open if the key is missing).
- **`app-old/src/initialization/Initialization.tsx`**: in the same effect that currently checks `forceUpdate` after fetching `/settings`, also read `getMaintenanceMode()`. **Precedence: maintenance mode wins over force-update** — if `enabled`, show the maintenance overlay regardless of app version staleness.
- **New `MaintenanceScreen` component** (e.g. `app-old/src/screens/maintenance/MaintenanceScreen.tsx`): rendered as a non-dismissable full-screen `Modal` (`onRequestClose={() => {}}`, no close affordance), same mechanical pattern as the existing force-update modal in `Initialization.tsx`. Displays the `message`, and if `startAt`/`endAt` are present, a formatted "Back between X–Y" line. No buttons.
- **Background auto-retry**: while `MaintenanceScreen` is mounted, an internal timer (poll interval: 30s) re-fetches `/settings`, updates `useSettingsStore`, and re-evaluates `getMaintenanceMode().enabled`. The moment it flips to `false`, the modal unmounts and normal app flow (`RootNavigation`) proceeds — no user action needed.
- **Foreground-resume re-check**: an `AppState` "active" listener (mirroring the existing RevenueCat refresh-on-foreground pattern in `App.tsx:82-86`) re-fetches `/settings` when the app returns from background, so a user who backgrounded the app before maintenance started sees the gate promptly on return, without waiting for a fresh cold start.
- **Fail-open on fetch failure**: if `/settings` fails to load (network error, timeout), maintenance is treated as `enabled: false` — consistent with the existing 4s `settingsWaitTimedOut` fail-safe in `Initialization.tsx`, so a broken settings fetch never traps users behind a false-positive maintenance screen.

## Data Flow

1. Staff enable maintenance mode via the new admin form → `maintenance_mode` Setting's JSON value updated (`enabled: true`, message, start/end times).
2. Mobile app, on cold start or foreground resume, fetches `GET /settings` (as it already does) → `useSettingsStore` updated → `Initialization.tsx` sees `getMaintenanceMode().enabled === true` → renders `MaintenanceScreen` instead of proceeding to `RootNavigation`.
3. While `MaintenanceScreen` is shown, it polls `/settings` every 30s in the background.
4. Staff disable maintenance mode in admin (`enabled: false`).
5. On the next poll (≤30s) or next foreground resume, the mobile app sees `enabled: false`, the modal unmounts, and the app proceeds to `RootNavigation` normally — no restart required.

## Error Handling

- `/settings` fetch failure at any point (startup, poll, resume) → treated as maintenance-off (fail-open), matching the existing `settingsWaitTimedOut` philosophy for this codebase.
- Malformed/missing `maintenance_mode` JSON → `getMaintenanceMode()` returns the safe default (`enabled: false`).
- No new error states introduced beyond what `/settings` fetching already handles.

## Testing

This is a React Native app with no browser-based preview. Verification will be:

- A unit test for the new `getMaintenanceMode()` getter (parsing, defaulting, malformed-JSON fallback).
- Manual QA: toggle the setting on staging admin, confirm the overlay appears on a running Android/iOS build at cold start and at foreground resume, confirm it clears automatically within the poll interval after staff disable it, and confirm force-update is correctly suppressed while maintenance is active.
- Backend: a feature test asserting `GET /settings` includes the `maintenance_mode` key with the expected shape, and that the new admin form correctly persists the JSON value.
