# Quick Privacy Settings popup — design

Date: 2026-07-15
Status: Approved, not yet implemented

## Problem

The self "My Profile" card (`app-old/src/screens/profile/Header.tsx`, `renderSelfHeader`) currently
shows a per-field eye-icon + switch next to the tagline row (`taglinePrivacyRow`, lines ~912-958)
that only controls the tagline's individual public/private visibility. It reads as a general
"profile privacy" control but isn't one, and there's no quick way to reach the profile-wide privacy
controls from the card itself — only via Settings → Privacy settings (full screen).

## Current state (confirmed by code read, not assumption)

Two profile-wide visibility mechanisms already exist and are fully wired end-to-end (UI, API,
backend), surfaced today only on the full `PrivacySettings` screen
(`app-old/src/screens/privacySettings/PrivacySettings.tsx`):

- **`search_visibility`** (boolean, on `User`) — toggle labelled "Hide me from search". When hidden,
  the user is excluded from search/recommendation feeds via `User::scopeFilterSearchVisibilityUsers`
  (`admin/app/Models/User.php:385`). Browsing, visiting, and liking still work both ways; the user
  still appears in others' Visitors/Likes lists. This is exactly "Invisible mode" as requested — no
  backend change needed, reuse as-is.
- **`profile_visibility`** (string(24), on `UserDetail`) — one of `everyone` / `active_chat` /
  `liked` (`ProfileFieldVisibility::PROFILE_VISIBILITY_LEVELS`). Gates whether another member can
  view this user's full profile **details** via `ProfileFieldVisibility::canViewProfileDetails()`
  (`admin/app/Support/ProfileFieldVisibility.php:228`), used from `MemberProfileResource`. It does
  **not** remove the user's card from browse/search/recommendation feeds — confirmed intentional,
  out of scope to change.
- **Correction from an earlier draft of this doc:** these two fields do **not** share an endpoint.
  `profile_visibility` goes through `PATCH /auth/profile/privacy`
  (`ApiServices.updateProfilePrivacy`, `Services.tsx:690-699`) →
  `AuthController::updateProfilePrivacy` (`admin/app/Http/Controllers/Api/AuthController.php:621-658`).
  `search_visibility` goes through a _different_, older endpoint —
  `ApiServices.updateUserInfo` (`Services.tsx:577-587`) → `POST update/info` →
  `AuthController::updateInfo` (`admin/app/Http/Controllers/Api/AuthController.php:559-571`). Its
  request rules (`UpdateUserRequest.php`) mark every field `nullable`, so a partial payload wouldn't
  fail validation, but `PrivacySettings.tsx`'s existing `hideFromSearchToggle`/`updateToggle`
  (lines 128-136, 175-220) always resends the full snapshot (name, gender, dob, language, country,
  city, lat/long) alongside `search_visibility` — that's the only proven-in-production call shape for
  this field, so the new popup replicates it exactly rather than risking an untested partial payload.

Confirmed **out of scope**: Visitor/Like activity recording is unaffected by any of this — visiting
or liking someone always shows up for them; there is no mechanism to suppress it and none is being
added.

The "My Photos" screen's info icon (`app-old/src/screens/photosAndVideos/PhotosAndVideos.tsx:983-1077`)
opens a bespoke bottom-sheet `Modal` (dim backdrop + slide-up rounded sheet + drag handle +
scrollable body + footer button) with no shared component extracted — this is the visual pattern to
copy for the new popup, per explicit request.

## Design

### 1. Profile card changes (`Header.tsx`)

- **Remove** the tagline row's eye-icon + `Switch` (the `taglinePrivacyRow` block, ~lines 912-958,
  wired to `onTaglinePrivacyChange`/`taglinePrivacyVisible`/`taglinePrivacyUpdating`). Keep the
  tagline edit row itself (pencil icon + tagline text/placeholder) untouched — only the
  privacy-switch half is removed. Tagline-specific privacy stays reachable via the full Privacy
  Settings screen's per-field list (`PrivacySettings.tsx`, "Basic settings" group), which already
  includes it. Remove the now-unused `onTaglinePrivacyChange`/`taglinePrivacyVisible`/
  `taglinePrivacyUpdating` props from `Header` and its caller (`Profile.tsx`) if nothing else
  consumes them — verify during implementation.
- **Add** a new icon-only button into the existing `showSettings` block's `heroMenuContainer`
  (`Header.tsx:784-807`), placed _before_ the gear `Ripple` in JSX so it renders to its left (the
  container is `flexDirection: 'row'` with `gap`, anchored to the top-right corner — first child
  renders leftmost of the pair). Same visual treatment as the gear button: `Entypo name="eye"`,
  `Colors.color2`, `size={wp(5)}`, wrapped in the same `overflowBtn`-styled `Ripple`.
  `onPress` opens the new popup (local `useState` in `Header` or `Profile.tsx`, whichever already
  owns comparable modal state — follow existing convention in that file).
  `accessibilityLabel` via `LanguageKeys.privacySettings` (already exists: "Privacy settings").

### 2. Popup component

New file: `app-old/src/screens/profile/components/privacy-quick-settings-modal.tsx`.
Self-contained, like `PrivacySettings.tsx`: pulls `currentUser`/`updateCurrentUser` from
`useGlobalContext()` itself and calls `ApiServices.updateProfilePrivacy` (profile_visibility) /
`ApiServices.updateUserInfo` (search_visibility — see the corrected endpoint note above) directly, so
it doesn't need new props threaded through `Header`/`Profile`. This keeps state in sync across card,
popup, and full screen since all three read/write the same `currentUser.search_visibility` /
`currentUser.detail.profile_visibility` fields and persist through the same
`updateCurrentUser` + `StorageManager.setData(storageKeys.USER, ...)` pattern already used in
`PrivacySettings.tsx` and `EditProfileGroup.tsx`.

Structure (visually modeled on `PhotosAndVideos.tsx`'s info sheet: backdrop `Pressable` to dismiss,
rounded sheet, drag handle, `ScrollView` body, footer button — reuse that styling, not a new visual
language):

1. Title (e.g. `LanguageKeys.privacySettings`, "Privacy settings").
2. Short intro paragraph explaining the two controls below are separate: one about being found, one
   about who sees your details. New key `privacyQuickSettingsIntro`.
3. **Invisible mode** row — label + description + `Switch` (same `react-native-switch` component,
   same styling as `PrivacySettings.tsx`'s `RenderField`), bound to `search_visibility` (inverted,
   matching `hideFromSearchToggle`'s existing polarity handling). New keys `invisibleMode` /
   `invisibleModeDesc` ("Hides you from search results").
4. **"Choose an option"** section label + 3-row radio list, visually matching
   `PrivacySettings.tsx`'s `visibilityOption` rows (title + description + trailing
   checkmark-circle/ellipse-outline icon), bound to `profile_visibility`:
   - `everyone` — reuse existing `LanguageKeys.profileVisibilityEveryone` / `...EveryoneDesc`.
   - `liked` — reuse existing `LanguageKeys.profileVisibilityLiked` / `...LikedDesc` ("Only members
     whose profile I have liked" already matches the requested "except people I like" meaning).
   - **`nobody`** (new) — new keys `profileVisibilityNobody` ("Hide completely for everyone") /
     `profileVisibilityNobodyDesc` ("No one can see your profile details at all").
   - `active_chat` is intentionally omitted from this popup (stays full-screen-only per approved
     design) — the radio list here iterates a local 3-item array, not
     `profileVisibilityOptions` from `PrivacySettings.tsx`.
5. Footer: single dismiss button reusing the existing `LanguageKeys.understood` ("Understood") key —
   same copy `PhotosAndVideos.tsx` already uses for this exact button in the pattern being mirrored,
   no new key needed. Closes the sheet; no separate "Save" step since both controls save immediately
   (optimistic update + rollback on failure, matching `hideFromSearchToggle`/`updateProfileVisibility`
   exactly).

Loading/in-flight state: reuse the same per-control "updating" disabled state pattern already present
(`privacyUpdatingField` style booleans) so a second tap can't race the first while a request is
in-flight.

### 3. Backend addition

`admin/app/Support/ProfileFieldVisibility.php`:

- Add `public const PROFILE_NOBODY = 'nobody';`
- Add it to `PROFILE_VISIBILITY_LEVELS` (validation in `UpdateProfilePrivacyRequest` picks it up
  automatically — it references this array via `Rule::in(ProfileFieldVisibility::PROFILE_VISIBILITY_LEVELS)`,
  no separate change needed there).
- `canViewProfileDetails()` needs **no logic change**. Re-reading it: the owner check
  (`$viewerId === $ownerId`) is unconditional and independent of `$visibility`, so the owner can
  always see their own profile regardless. Every other branch only returns `true` for
  `PROFILE_EVERYONE`, a matched `PROFILE_LIKED`, or a matched `PROFILE_ACTIVE_CHAT`; anything else —
  including the new `PROFILE_NOBODY` — already falls through to the trailing `return false`. Add a
  one-line comment above that final `return false` noting it's also the deny-path for
  `PROFILE_NOBODY`, so the next reader doesn't mistake it for dead/default code.
- No migration needed — `profile_visibility` is `string(24)`, not a DB enum.

### 4. i18n

New keys needed in `Keys.tsx` + all three locale files (`English.json`, `Urdu.json`,
`RomanUrdu.json` — `i18n-json/identical-keys` will fail the build otherwise):
`privacyQuickSettingsIntro`, `invisibleMode`, `invisibleModeDesc`, `profileVisibilityNobody`,
`profileVisibilityNobodyDesc`. Footer button reuses the existing `understood` key (see above) —
no new key for it.

## Out of scope

- No change to browse/search/recommendation feed queries beyond the existing
  `search_visibility` mechanism.
- No change to Visitor/Like recording or visibility (confirmed: always shows for everyone,
  no control being added).
- `active_chat` visibility option and per-field (`profile_field_visibility`) toggles remain
  full-Privacy-Settings-screen-only; not duplicated into this popup.
- No new backend endpoint — reuses `PATCH /auth/profile/privacy` as-is.

## Testing

- `EditProfileGroup.test.tsx` exists as a precedent for testing privacy-toggle wiring in this area —
  follow its patterns for the new popup's tests.
- Manual: toggle Invisible mode and each radio option from the new popup, confirm the full
  `PrivacySettings` screen reflects the same state after navigating there (proves shared state, not
  divergent local state).
