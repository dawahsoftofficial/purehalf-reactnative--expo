# Pure Half — Me Section Redesign (Design Spec)

**Date:** 2026-07-05
**Scope:** Redesign the self/"Me" profile experience into a scannable hub, and move each editable group from a cram-everything modal into its own focused edit screen. Reuse all existing fields, options, and save logic. Viewing other users' profiles is unchanged.
**Approved via:** mockup (me-redesign-v1).

---

## 1. Problem

`src/screens/profile/Profile.tsx` renders the self profile as one long scroll: photo header + tagline + 7 stacked cards (Interests + Appearance/Family/Lifestyle/Personality/Islamic/Future). Editing any group opens `EditInfoCardModal` — a single modal stuffed with all of that group's fields. Users find it tedious and complex.

## 2. Goal

- **Me = hub.** Photo header → completion ring → **About** (Tagline, Interests preview) → **Profile details** as one grouped list. Each detail row shows icon + title + a one-line preview + filled count + chevron, and navigates to that group's edit screen.
- **Each group = its own edit screen.** Focused screen: back header (serif title) + fields in a card + one Save.
- **No new inputs / no data changes.** Same `Data.tsx` schema, same `getAttribute()` options, same gender rules (hijab ♀ / beard ♂, "Widowed" hidden for men), same `updateDetails()` → `/auth/update/detail` save.

## 3. Architecture

### 3.1 New screens (`src/screens/profile/`)

- **`EditProfileGroup.tsx`** — one reusable screen for all six field-groups. Adapts `EditInfoCardModal`'s renderer (`IconInput` for input, `HeightWeightPicker` for scalling, `PickerButton`+`Picker` for dropDown/binary) into a full screen. Receives via route params: `{ title, from, data }` where `data` is the group's merged array (schema + options + current values) — exactly what the modal received as `details.data`. Save → `updateDetails(formData)` → update `currentUser`/storage → `navigation.goBack()`.
- **`EditInterests.tsx`** — full-screen version of `EditInterestCardModal` (chips multi-select). Same save path.

Both are registered in `src/navigation/RootNavigation.tsx` and exported from `src/screens/index.tsx`.

### 3.2 Me hub (self view)

Split `Profile.tsx` render by `isOwnProfile`:

- **Own profile →** new hub built from small components in a new `profile-hub.tsx`:
  - `CompletionRing` — % from filled fields across all groups.
  - `AboutSection` — Tagline (existing `TaglineSection`, restyled) + `InterestsPreview` (chips from `interestAndHobbies`, "Edit" → `navigation.navigate('EditInterests', {...})`).
  - `DetailSectionList` — grouped card; one `DetailRow` per group with icon, title, preview string, filled count, chevron → `navigation.navigate('EditProfileGroup', { groupKey, title, data })`.
- **Other profile →** unchanged: existing `InterestAndHobbyCardStatic` + `InterestAndHobbyCard` + `InfoCard`×6 (read-only). No behavior change.

### 3.3 Helpers (in `profile-hub.tsx` or `Funtions.tsx`)

- `countFilled(groupArray)` → `{ filled, total }` (an item counts as filled when `selected.value`/`selected.id` is set; respects gender-hidden items).
- `previewOf(groupArray)` → first 1–3 selected display values joined by " · ", else a "Add …" prompt.
- `overallCompletion(categoriesData, interests, tagline)` → percent for the ring.

### 3.4 Retire

- `EditInfoCardModal` and `EditInterestCardModal` are no longer mounted in `Profile.tsx`. Keep the files until the screens are verified, then delete in a follow-up (avoid dangling imports).

## 4. Data flow (unchanged core)

`Profile.fetchData` still loads `PROFILE_DETAIL_LOCAL` + `ATTRIBUTE`, runs `getAttribute` → `categoriesData` (per-group arrays) + `interestAndHobbies`. The hub reads `categoriesData` for previews/counts and passes the relevant group array to the edit screen via params. On returning from an edit screen, `Profile` refetches (it already runs `fetchData` on `isFocused`).

## 5. Groups & icons (Ionicons)

| Group key               | Title                      | Icon                   |
| ----------------------- | -------------------------- | ---------------------- |
| interests               | Interests & Hobbies        | `heart-outline`        |
| appearanceAndHealth     | Appearance & Health        | `body-outline`         |
| familyBackground        | Family Background          | `earth-outline`        |
| lifeStyle               | Lifestyle                  | `briefcase-outline`    |
| islamicValues           | Islamic Values             | `moon-outline`         |
| personalityRequirements | Personality & Requirements | `sparkles-outline`     |
| futurePlan              | Future Plans               | `heart-circle-outline` |

## 6. Visual system

Brand tokens throughout: `appBg` screen, white `surface` cards, `hairline` borders, radius 16, `lavender` icon chips, `ink`/`muted` text, `primary` accents, serif (`variant="display"`) for the profile name, section/screen titles, and the tagline quote. Save button = shared `Button` (primary). Fields use the already-cool boxed `IconInput`/`PickerButton`/`HeightWeightPicker`.

## 7. Rollout order

1. `EditProfileGroup` screen (adapt modal) + register route + wire one group from the current cards to prove the round-trip.
2. `EditInterests` screen + route.
3. Build `profile-hub.tsx` (CompletionRing, AboutSection, InterestsPreview, DetailSectionList, DetailRow) + helpers.
4. Switch `Profile.tsx` self view to the hub; keep other-user view on existing cards; remove modal mounts.
5. Verify (`type-check`, lint, i18n), then delete retired modals.

## 8. i18n

Reuse existing group-title keys (`appearanceHealth`, `familyBackground`, `lifeStyle`, `personalityRequirements`, `islamicValues`, `futurePlans`, `myInterestAndHobbies`, `tagline`). New small strings needed: a "profile X% complete" label and an "Add …" prompt → add keys to all three locales (`profileComplete`, `addDetails`). `Save` reuses `update`/`save` key.

## 9. Risks

- **Param size:** group arrays include option lists; passing via nav params is fine (plain JSON) but keep an eye on very large attribute lists — if problematic, have the screen re-derive from `ATTRIBUTE` by `groupKey` instead.
- **Gender rules** must be preserved in both preview counts and the edit screen (reuse the modal's `renderList` hide logic).
- **Refetch on back:** rely on `Profile`'s existing `isFocused` fetch; confirm the hub reflects saved values on return.
