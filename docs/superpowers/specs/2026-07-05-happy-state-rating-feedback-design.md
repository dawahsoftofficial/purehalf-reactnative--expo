# Happy-State Rating & Feedback — Design Spec

**Date:** 2026-07-05
**Status:** Approved (direction) — pending final spec review
**Scope:** Mobile app (`app-old/`) + Admin panel (`admin/`)

## 1. Goal

Ask a member to rate the app while they are in a positive ("happy") state, capture
that rating internally, and hand happy raters off to the public App Store / Play Store
review — while keeping unhappy feedback private for staff. Staff control the cadence
from the admin panel and can disable the whole feature instantly.

Requirements (from the requester):

1. Detect a "happy state".
2. Show an internal rating popup at the right time — not too frequent, after a "safe time".
3. If the user rates well internally, send them to the native store review; otherwise keep
   the feedback internal. A rating is simply **stars + one comment**.
4. The admin panel shows the internal ratings.
5. The admin panel has settings controls (including a safety kill-switch) for the cadence.

## 2. Decisions (locked)

| Decision                | Choice                                                                                              |
| ----------------------- | --------------------------------------------------------------------------------------------------- |
| Happy-state trigger     | **Sustained chat activity** (messages sent), surfaced when the user leaves a conversation           |
| Store handoff threshold | **≥ 4 stars** → native store review; ≤ 3 stars stays internal                                       |
| Popup shape             | **One step**: 1–5 stars + one optional comment                                                      |
| Admin view              | **Read-only list** with a filter by star count                                                      |
| Cadence controls        | **Admin-tunable** via existing `Setting` key-value CRUD, with a master enable/disable safety switch |
| After any submission    | Stop prompting that user (v1)                                                                       |

## 3. Architecture Overview

```
Chat send ──▶ engagement counter (MMKV)
                      │
   leave conversation ▼
             shouldShowRatingPrompt(config, state, user)  ── pure, testable
                      │ eligible
                      ▼
             rating-store.show()  ──▶  <RatingPromptModal/> (root-mounted)
                      │ submit(stars, comment)
        ┌─────────────┼───────────────────────────┐
        ▼                                          ▼
  POST /auth/rating/store               stars ≥ threshold?
  (always — admin sees all)             └─ yes ▶ InAppReview.RequestInAppReview()
                                        └─ no  ▶ thank-you toast (stays internal)

Config (cadence) delivered by GET /settings → settings-store.ratingPrompt,
sourced from admin `Setting` rows editable in the existing Setting CRUD.
```

The "what counts as happy / when to ask" logic is deliberately decoupled from "what the
popup looks like" and from "where config comes from", so each unit is independently
understandable and the eligibility rule can be unit-tested without any UI or network.

## 4. Mobile (`app-old/`)

### 4.1 Config delivery (existing `/settings` payload)

`GET /settings` already hydrates `src/stores/settings-store.ts` with typed blocks (chat
credits, badges, payment walls, …). Add a `ratingPrompt` block:

```ts
type RatingPromptConfig = {
  enabled: boolean;
  minAccountAgeDays: number;
  minSentMessages: number;
  cooldownDays: number;
  maxPrompts: number;
  storeMinStars: number;
};
```

Consumed via a selector, e.g. `useSettingsStore(s => s.ratingPrompt)`. If the block is
missing from the payload (older server), fall back to safe built-in defaults (§2 table)
with `enabled: true`.

### 4.2 Engagement tracking + device state (MMKV)

New module `src/services/rating/ratingEngagement.ts` owns all device-local state via the
existing `StorageManager` (MMKV) wrapper:

| MMKV key                   | Meaning                                                           |
| -------------------------- | ----------------------------------------------------------------- |
| `rating.firstOpenAt`       | timestamp, set once; account-age fallback when signup date absent |
| `rating.sentMessagesCount` | cumulative messages the user has sent                             |
| `rating.promptsShownCount` | how many times we've shown the prompt                             |
| `rating.lastPromptAt`      | timestamp of the last time we showed it                           |
| `rating.completed`         | true once the user submits any rating                             |

Public functions:

- `recordFirstOpenIfNeeded()` — called once at app bootstrap.
- `recordSentMessage()` — increments the counter; called from the chat send hook.
- `shouldShowRatingPrompt(config, state, user): boolean` — **pure**:

```
enabled
  && !completed
  && promptsShownCount < maxPrompts
  && accountAgeDays(user, state) >= minAccountAgeDays
  && sentMessagesCount >= minSentMessages
  && (lastPromptAt == null || daysSince(lastPromptAt) >= cooldownDays)
```

- `markPromptShown()` — bumps `promptsShownCount` + `lastPromptAt` (used for both submit and dismiss).
- `markCompleted()` — sets `completed = true` (only after a successful POST).

`accountAgeDays` uses the member's signup/`created_at` from `currentUser` when available,
falling back to `rating.firstOpenAt`.

### 4.3 Trigger point (calm boundary, never mid-chat)

- **Increment:** in `src/screens/messages/hooks/useSendMessage.firebase.ts` → `onSendPress`,
  after a successful send, call `recordSentMessage()`.
- **Evaluate:** in `src/screens/messages/SingleChat.tsx`, on screen blur / conversation
  exit (navigation `blur` or unmount), call `evaluateAndMaybeShow('chat_activity')`, which
  reads config + state and, if `shouldShowRatingPrompt` is true, calls `ratingStore.show('chat_activity')`.

This surfaces the prompt right after a good chat session, without interrupting typing.

### 4.4 Modal + store

- New `src/stores/rating-store.ts` (Zustand): `{ visible, trigger, show(trigger), hide() }`.
- New `src/components/rating/RatingPromptModal.tsx`, mounted **once** near the root
  (in `App.tsx` or the root navigator) so it can appear over any screen. Built on the
  existing modal primitive (`AlertContainer` / RN `Modal`) for visual consistency.

Contents (one step): heading, subtext, a 1–5 star selector, one optional multiline comment
input, **Submit** (enabled once ≥ 1 star), **Not now**.

Behaviour:

- **Submit:**
  1. `POST /auth/rating/store` with `{ stars, comment, trigger_event, platform, app_version }`.
  2. On success: `markCompleted()` + `markPromptShown()`; if `stars >= storeMinStars` **and**
     `InAppReview.isAvailable()` → `InAppReview.RequestInAppReview()`; show thank-you toast; `hide()`.
  3. On network failure: the shared API wrapper already toasts the error; still `markPromptShown()`
     (respect cooldown) but **do not** `markCompleted()`, so a genuine submit can be retried later.
- **Not now / backdrop dismiss:** `markPromptShown()` only (no API call); `hide()`.

`react-native-in-app-review@4.4.2` is already a dependency (currently unused) — this is its
first use. It gives no success callback by design; we simply request the review.

### 4.5 API wrapper

- `src/services/api/EndPoints.tsx`: `storeRating: '/auth/rating/store'`.
- `src/services/api/Services.tsx`: `storeRating = (params) => Api.post(EndPoints.storeRating, params)…`
  following the existing Promise + auto-error-toast pattern. Token is auto-attached by the
  request interceptor.

### 4.6 i18n

New keys in `src/languages/Keys.tsx` and `English.json`, `Urdu.json`, `RomanUrdu.json`:
`ratingPromptTitle`, `ratingPromptSubtitle`, `ratingCommentPlaceholder`, `ratingSubmit`,
`ratingNotNow`, `ratingThankYou`. All user-visible strings go through `t()`.

### 4.7 Mobile files touched

- New: `src/stores/rating-store.ts`, `src/services/rating/ratingEngagement.ts`,
  `src/components/rating/RatingPromptModal.tsx`.
- Edit: `src/stores/settings-store.ts`, `src/screens/messages/hooks/useSendMessage.firebase.ts`,
  `src/screens/messages/SingleChat.tsx`, `src/services/api/EndPoints.tsx`,
  `src/services/api/Services.tsx`, root mount (`App.tsx`/root navigator), `src/languages/*`,
  bootstrap call site for `recordFirstOpenIfNeeded()`.

## 5. Admin (`admin/`)

### 5.1 `ratings` table + model

Migration `create_ratings_table`:

| column                   | type                                    |
| ------------------------ | --------------------------------------- |
| `id`                     | id                                      |
| `user_id`                | FK → `users`, cascade on update/delete  |
| `stars`                  | unsignedTinyInteger (1–5)               |
| `comment`                | text, nullable                          |
| `trigger_event`          | string, nullable (e.g. `chat_activity`) |
| `platform`               | string, nullable (`ios` / `android`)    |
| `app_version`            | string, nullable                        |
| `sent_to_store`          | boolean, default false                  |
| timestamps + softDeletes |                                         |

`app/Models/Rating.php`: `$fillable` for the above; `$casts` (`stars` int, `sent_to_store`
bool); `user()` belongsTo `User`; optional `stars_label` accessor for coloured admin badges.

### 5.2 Submit endpoint

- `routes/api.php`, under the authenticated `auth:api_user` group (mirroring `query/store`):
  `Route::post('rating/store', [RatingController::class, 'store']);`
- `app/Http/Requests/Api/StoreRatingRequest.php`: `stars` required|integer|min:1|max:5;
  `comment` nullable|string|max:1000; `trigger_event`/`platform`/`app_version` nullable|string.
- `app/Http/Controllers/Api/RatingController.php@store`: resolve `$request->user()`, create a
  `Rating` with `user_id`, set `sent_to_store = stars >= store_min_stars` (from settings),
  return via the `ResponseAPI` `success()` helper.

### 5.3 Cadence settings (admin safety controls)

Seed six `Setting` rows (via a migration or seeder), each with a clear `title` + `description`
so the existing Setting CRUD (`Route::resource('setting', SettingController::class)`, with
create/edit/index Blade views) is self-documenting:

| key                                  | type    | default | title / purpose                        |
| ------------------------------------ | ------- | ------- | -------------------------------------- |
| `rating_prompt_enabled`              | boolean | `true`  | **Master switch — safety kill-switch** |
| `rating_prompt_min_account_age_days` | integer | `7`     | Min days since joining                 |
| `rating_prompt_min_sent_messages`    | integer | `15`    | Sustained-chat threshold               |
| `rating_prompt_cooldown_days`        | integer | `60`    | Wait between prompts                   |
| `rating_prompt_max_prompts`          | integer | `3`     | Lifetime cap on asks                   |
| `rating_prompt_store_min_stars`      | integer | `4`     | Stars needed for store handoff         |

`listingController@settingIndex` gains a `ratingPrompt` block that reads these keys via
`SettingService` and returns them camel-cased, alongside the existing blocks.

No new settings screen is required — staff edit these rows in the existing Setting admin CRUD.
(A grouped single-form settings page is a possible later enhancement, not part of v1.)

### 5.4 Ratings list (read-only + star filter)

Mirrors the existing Query list:

- `routes/web.php`: `Route::get('rating', [GeneralController::class, 'ratingIndex'])->name('general.rating.index');`
- `GeneralController@ratingIndex`: loads ratings with `user`, applies optional `?stars=` filter,
  passes `main_ac => 'general.rating'`, `action => 'rating-index'` to the view.
- Views `resources/views/admin/pages/general/rating/index.blade.php` + `table.blade.php`:
  DataTables table — `#`, member (link to `admin.user.show`), stars (★ badges), comment,
  trigger, platform, app version, sent-to-store, created-at — plus a star-count filter control.
- `resources/views/partials/sidebar.blade.php`: a "Rating" menu entry (or under General),
  active when `$main_ac == 'general.rating'`.

### 5.5 Admin files touched

- New: migration `*_create_ratings_table.php`, seeder/migration for the 6 settings,
  `app/Models/Rating.php`, `app/Http/Requests/Api/StoreRatingRequest.php`,
  `app/Http/Controllers/Api/RatingController.php`,
  `resources/views/admin/pages/general/rating/index.blade.php` + `table.blade.php`.
- Edit: `routes/api.php`, `routes/web.php`,
  `app/Http/Controllers/Api/listingController.php` (settingIndex),
  `app/Http/Controllers/Admin/GeneralController.php` (ratingIndex),
  `resources/views/partials/sidebar.blade.php`.

## 6. API Contract

`POST /v1/app/auth/rating/store` (auth: `api_user`)

Request:

```json
{
  "stars": 5,
  "comment": "Love it",
  "trigger_event": "chat_activity",
  "platform": "ios",
  "app_version": "1.4.2"
}
```

Response (200), standard `ResponseAPI` envelope:

```json
{
  "message": "Thank you for your feedback",
  "error": false,
  "code": 200,
  "results": null
}
```

`GET /v1/app/settings` gains within its `results`:

```json
"ratingPrompt": {
  "enabled": true, "minAccountAgeDays": 7, "minSentMessages": 15,
  "cooldownDays": 60, "maxPrompts": 3, "storeMinStars": 4
}
```

## 7. Error Handling & Edge Cases

- **Offline / API error on submit:** shared wrapper toasts; cooldown recorded; not marked
  completed → retryable.
- **Native review unavailable / throttled:** silently skipped; internal rating already saved.
- **Feature disabled mid-flight:** `enabled=false` from settings short-circuits eligibility.
- **Missing `ratingPrompt` block:** app falls back to safe defaults.
- **Clock issues:** cooldown uses stored timestamps; a wildly-off device clock at worst delays
  or slightly advances a prompt — non-critical.

## 8. Testing

- **Backend (phpunit):** feature test for `RatingController@store` — validation (stars bounds,
  comment length), persistence, user-scoping (record attaches to the authenticated user);
  test that `settingIndex` includes the `ratingPrompt` block.
- **Mobile (jest):** unit test for the pure `shouldShowRatingPrompt()` across the eligibility
  matrix (disabled, already-completed, under-age, under-messages, within-cooldown, over-cap,
  happy path). ⚠️ Jest is currently broken (known `jest-setup.ts` import of a removed
  `@testing-library/react-native/extend-expect` subpath). Enabling this one test requires
  fixing that setup line; if we'd rather not touch jest in this change, the eligibility
  function is still written pure so it can be tested once jest is repaired.

## 9. Out of Scope (v1 / YAGNI)

- Match-triggered prompts (app doesn't surface matches; would need a backend match flag).
- Membership-purchase, guardian-approval, or other triggers (chat-activity only for v1).
- Admin reply/notes, CSV export, status workflow on ratings.
- A dedicated grouped settings form (raw Setting CRUD rows suffice for v1).
- Re-prompting users who already submitted a rating.
