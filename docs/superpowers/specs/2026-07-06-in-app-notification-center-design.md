# In-App Notification Center — Design

**Date:** 2026-07-06
**Status:** Approved (design), pending implementation plan
**Scope:** Spans two repos — `app-old/` (React Native mobile) and the sibling `admin/` (Laravel 9). This document lives in the mobile repo but describes both sides.

## Problem

Users receive many push notifications (via Firebase FCM), but they are **never persisted**. Once a push is dismissed there is no way to review it. We want a dedicated in-app Notification Center: a scrollable, DB-backed history of a member's notifications, with "mark all as read" and "clear all", capped at 7 days. Admins must be able to hide specific notification _types_ from this customer-facing screen.

## Goals

- Persist notifications per member so they can be reviewed in-app.
- A dedicated mobile screen: scroll history, unread indicators, mark-all-read, clear-all, tap-to-open, swipe-to-delete.
- Admin control: per-notification-type visibility toggle in the existing admin notifications list.
- History automatically capped at 7 days.

## Non-goals (YAGNI)

- No real-time Pusher notifications channel. Badge updates from foreground pushes + refetch on focus/pull-to-refresh. (Possible later add.)
- No notification center for **Guardians/Walis** in this pass — members only. (The storage keys on `user_id`, not a polymorph, so adding guardians later is a schema change, accepted.)
- No per-individual-message admin curation — visibility is per template/type.
- No new mobile unit tests (project jest is currently broken — see mobile CLAUDE.md known issues); backend gets feature tests, mobile gets type-check/lint + manual QA.

## Decisions (confirmed with user)

1. **Entry point:** bell icon + unread badge in the Welcome/home header → opens the Notification Center. (Bottom tab already has 5 slots; not touching it.)
2. **Recipients:** members (`User`) only.
3. **Item actions:** tap-to-open (mark read + navigate) and swipe-to-delete a single row, plus bulk mark-all-read / clear-all.
4. **Admin control:** per template/type. A `show_in_app` flag on each notification template row.

### Baked-in behaviors (confirmed)

- **"Clear all" = soft delete for that user only.** Never affects other users or the 7-day prune.
- **Tap reuses existing `notification_type` routing** (extracted into a shared helper), not new navigation.
- **`show_in_app` defaults to `true`;** admins curate by unticking system/functional types (`app_update`, `account_suspended`, `profile_picture_update_required`) and, if they don't want the center to duplicate the Messages screen, chat types (`new_message` / `openChat`).

---

## Admin side (`admin/`, Laravel 9, Passport)

### Data model

**New table `user_notifications`** (one row per notification per recipient):

| column                      | type                           | notes                                                                                                                       |
| --------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `id`                        | bigint PK                      |                                                                                                                             |
| `user_id`                   | bigint FK → `users.id`         | indexed; `onDelete('cascade')`                                                                                              |
| `notification_id`           | bigint FK → `notifications.id` | the template it came from; **required** — only template-backed notifications are stored (visibility is a template property) |
| `trigger`                   | string, nullable               | template trigger name, denormalized for reference/analytics and to survive template deletion                                |
| `type`                      | string                         | the `notification_type` the app routes on, copied from the sent payload's `data` (may coincide with `trigger`)              |
| `title`                     | string                         | rendered as sent                                                                                                            |
| `body`                      | text                           | rendered as sent                                                                                                            |
| `image`                     | string, nullable               | avatar / thumbnail URL                                                                                                      |
| `data`                      | json, nullable                 | same payload the push carries (conversationId, profile id, …)                                                               |
| `read_at`                   | timestamp, nullable            | `null` = unread                                                                                                             |
| `created_at` / `updated_at` | timestamps                     |                                                                                                                             |
| `deleted_at`                | timestamp, nullable            | SoftDeletes                                                                                                                 |

Composite index `(user_id, deleted_at, created_at)` for the list query.

**Alter existing `notifications` (templates) table:** add `show_in_app` boolean, default `true`, after the other status flags.

**New model `App\Models\UserNotification`** — `SoftDeletes`, `belongsTo(User)`, `belongsTo(Notification)`, `data` cast to array/json, `$fillable` for the above.

### Visibility rule (single source of truth)

Visibility is a property of the **template** (`notifications.show_in_app`), enforced in **two** places so that unticking a type hides it immediately, not just for future sends:

- **Write:** store a `user_notifications` row only when the originating **template exists and `show_in_app = true`** and the recipient is a `User`. Sends with no resolvable template are **not** stored (the center is for admin-managed notification types).
- **Read:** the list + unread-count queries **join the template and exclude rows whose current `show_in_app = false`**. So if an admin unticks a type after rows were created, those existing rows disappear from the customer screen right away (and are pruned within 7 days anyway).

### Persistence hook

Notifications currently funnel through the Laravel notifiable pipeline: `SetNotificationAction` event → `NotificationAction` listener → `GeneralNotice` notification → `FirebaseMessagingDriver::send()` (Kreait multicast). The persistence point is **inside the notification, per notifiable**, where we have the recipient `User`, the rendered content, and the originating template. Apply the **write** half of the visibility rule here, **before** the existing FCM send proceeds unchanged.

**Implementation audit (must-do):** enumerate every dispatch path and confirm they all pass through this hook exactly once — no double-store, no missed sends. Known senders to check:

- `App\Listeners\NotificationAction` (the `SetNotificationAction` chokepoint)
- `App\Console\Commands\MembershipExpirySoon`, `MembershipExpire`, `RecommendationNotice` (cron)
- any direct `->notify()` / `Notification::send()` calls elsewhere

If a path bypasses `GeneralNotice`, either route it through the same hook or add the insert there. Prefer a single private helper (e.g. `UserNotification::record($user, $template, $rendered)`) reused by all paths.

> Note: we deliberately do **not** use Laravel's built-in `database` notification channel, because the `notifications` table name is already taken by the template model in this app. Hence a custom `user_notifications` table + manual insert.

### Admin UI

`/admin/notifications` (`Admin\NotificationController@index`, blade DataTable) already toggles `email_status` / `status_whatsapp` / `status_sms` via an inline AJAX checkbox posting to `notifications/{id}/update-status` (`updateStatus`).

- Add a **"Show in app"** checkbox column to `resources/views/admin/pages/notifications/index.blade.php`, same markup/JS as the existing toggles.
- Extend `NotificationController@updateStatus` to accept and persist `show_in_app`.

### API (mobile-facing, `v1/app`, guard `auth:api_user`, `scope.abilities:user`)

New `App\Http\Controllers\Api\NotificationController` under the existing `auth` group, responses via the `ResponseAPI` trait (`{message, error, code, results, total}`). A `UserNotificationResource` shapes each row (`id, type, title, body, image, data, read_at, created_at`).

| method + path                            | purpose                                                                         | returns                |
| ---------------------------------------- | ------------------------------------------------------------------------------- | ---------------------- |
| `GET /auth/notifications`                | list — own + visible + ≤7 days, newest first, paginated (`per_page` default 20) | `results: []`, `total` |
| `POST /auth/notifications/{id}/read`     | mark one read (tap)                                                             | updated row            |
| `POST /auth/notifications/mark-all-read` | mark all unread → read                                                          | `{updated: n}`         |
| `DELETE /auth/notifications/{id}`        | soft-delete one (swipe)                                                         | ok                     |
| `DELETE /auth/notifications/clear-all`   | soft-delete all of the user's                                                   | `{cleared: n}`         |

All queries scoped to `$request->user()->id`, `whereNull('deleted_at')`, `created_at >= now()->subDays(7)`, and the **read** half of the visibility rule (join template, exclude `show_in_app = false`). Newest first.

**Unread count** is added to the existing `/auth/counter` response as `unread_notifications` (own, unread, non-deleted, ≤7d, and passing the same visibility filter). This populates the bell badge on app load with no extra request. No dedicated count endpoint.

### Retention

New command `App\Console\Commands\PruneUserNotifications` (`notifications:prune-user {--days=7}`), mirroring `PruneApiErrorLogs`. **Force-deletes** (hard delete, bypassing soft-delete) any `user_notifications` row with `created_at < now()->subDays($days)` — read or not, cleared or not. Registered in `Console\Kernel` `$commands` and scheduled daily (e.g. `dailyAt('02:00')`).

### Backend tests (PHPUnit feature)

- List returns only own + non-deleted + ≤7d, newest first.
- A recipient with `show_in_app=false` template gets **no** `user_notifications` row created (write gate).
- Rows created while a template was visible **disappear from the list and unread count** once the template is unticked (read gate).
- Guardian recipients get no row (members only).
- `mark-all-read` sets `read_at`; single `read` marks one.
- `clear-all` and single delete soft-delete; pruned rows (>7d) are gone after the command runs.
- `/auth/counter` reflects the correct `unread_notifications`.

---

## Mobile side (`app-old/`, React Native)

### Screen

**New stack screen `Notifications`** (registered in `RootNavigation`, not a bottom tab). Header + `FlatList`:

- Pull-to-refresh, pagination (per_page 20), empty state, loading state — following the existing Messages/list screen pattern.
- Brand tokens (cooler-violet palette / semantic tokens per the brand-refresh work) and `wp()`/`hp()` scaling.
- **Row:** avatar/icon, title, body, relative timestamp, unread dot (unread rows visually distinct). Read rows muted.
- **Tap:** call `POST /{id}/read`, decrement store `unreadCount`, then navigate via the shared routing helper (below).
- **Swipe:** react-native-gesture-handler swipeable → `DELETE /{id}`, remove from list.
- **Header actions:** "Mark all read" and "Clear all" (Clear all shows a confirm dialog).

### Shared routing helper

The per-`notification_type` navigation logic currently lives inline in `src/notifications/DisplayForegroundNotificaton.tsx` (openChat, profile_liked, membership_extended, app_update, …). Extract it into a reusable helper (e.g. `src/notifications/routeNotification.ts`) that takes `(type, data, navigation)` and performs the navigation/side-effect. Both the foreground push-tap and the Notification Center list-tap call it, so behavior stays identical and there's one place to maintain.

### State

**New `useNotificationStore` (Zustand)** in `src/stores/`, mirroring `useConversationStore`:

- `unreadCount: number` (+ optional cached `notifications` list).
- `setUnreadCount`, `decrement`, `reset`.
- Populated from `/auth/counter` (`unread_notifications`) on app load / stats refresh.
- Incremented when a foreground push arrives (existing `onMessage` in `Firebase.tsx` / `DisplayForegroundNotificaton.tsx`).
- Decremented on single read; zeroed on mark-all-read; refetched on screen focus / pull-to-refresh.

### Entry point

Bell icon + unread badge in the Welcome/home header. Badge styled like the existing Messages-tab unread badge (`CustomBottomTab` red count bubble), reading `unreadCount` from the store. Tapping navigates to `Notifications`.

### API service + endpoints

- Add endpoint constants to `src/services/api/EndPoints.tsx` (`notifications` list, `notificationRead(id)`, `notificationsMarkAllRead`, `notificationDelete(id)`, `notificationsClearAll`).
- Add promise-wrapped methods to the notification service (new `notification-services.tsx` following the `message-services.tsx` pattern; typed request/response), returning typed `Notification[]` and handling the `{error, results}` envelope.
- Extend the user-stats load to read `unread_notifications` into the store.

### Mobile verification

- `yarn type-check` clean, `yarn lint` no new errors.
- Manual QA checklist: receive push while app open (badge increments, row appears), background push then open app (row present after focus), tap routes correctly for 2-3 types, swipe deletes, mark-all-read clears badge, clear-all empties list, empty state renders, pagination + pull-to-refresh work.

---

## Rollout order

1. **Admin backend** (backward-compatible: new table + `show_in_app` column + persistence hook + endpoints + prune command + admin checkbox). Can ship ahead of the app.
2. **Mobile** (store, service, screen, shared routing helper, bell entry point).

Because the backend only adds a table/column/endpoints, deploying it before the app release is safe.

## Open implementation notes

- Confirm the exact insertion point once the dispatch-path audit is done (single helper reused by all senders).
- Confirm admin has a working test harness before committing to PHPUnit feature tests; if not, note it and cover with a manual admin checklist instead.
- Decide default `show_in_app` values for the seeded/system triggers during the migration (default true, but consider seeding the functional types to false).
