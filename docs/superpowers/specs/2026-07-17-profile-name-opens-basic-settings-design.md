# Profile name opens the Profile details screen — design

**Date:** 2026-07-17
**Repos:** `app-old/` (mobile only — no backend change)
**Branch:** `feat/profile-name-opens-basic-settings`, off `staging` (staging-first rule)

## Goal

On the ME profile screen, tapping your own name opens the existing details screen
(`UserInput` with `fromSettings: true`), where first and last name are editable.

**Naming note:** that screen is titled with `LanguageKeys.basicSettings`, whose
English value is **"Profile"** — the key name is legacy and does not match what
users read. This spec calls it the *Profile details screen*. Beware when
searching: the code says `basicSettings`, the UI says "Profile".

Tapping a name on **another member's** profile must do nothing — it stays plain,
non-interactive text.

## Context (as-is)

The screen in question is `Profile.tsx`, which renders `Header.tsx`; the visible
layout comes from `Header.renderSelfHeader`. The name is drawn by the local
`NameRow` component (`Header.tsx:135`), which is used twice:

| Line | Context | Interactive? |
|------|---------|--------------|
| 859  | `renderSelfHeader` — your own profile | no (this spec makes it so) |
| 1034 | other member's profile header | no, and stays that way |

The self usage is already wrapped in a layout-only `<View style={Styles.nameShrink}>`
at line 858. `Ripple` (`react-native-material-ripple`) is already imported and used
in this file — the review-status button at line 881 sits in the same row.

`Settings.tsx:50` already navigates to this destination:

```ts
navigate('UserInput', { fromSettings: true });
```

`UserInput` with `fromSettings: true` renders the Profile details screen: first
and last name are editable text inputs; date of birth and gender render but are
`disabled`; an **Update** button calls `ApiServices.updateUserInfo`. The name is
the editable part, which is what makes it the right destination.

## Design

**One file: `src/screens/profile/Header.tsx`.**

1. Turn the existing `nameShrink` wrapper (line 858) from a `View` into a `Ripple`
   carrying `onPress`. It already has the correct flex styling (`flexShrink: 1`,
   `minWidth: 0`), so layout is unaffected.
2. Add a `useCallback` handler next to the existing header handlers:

   ```ts
   const onNamePress = useCallback(
     () => navigation.navigate('UserInput', { fromSettings: true }),
     [navigation]
   );
   ```

   Same route and params as `Settings.tsx:50`, so both entry points behave
   identically.

**Self-only, structurally.** `NameRow` itself is not modified, and the
other-member call site at line 1034 is not touched. Other profiles cannot become
tappable, because the press handling lives at the self call site rather than
behind a prop a caller could pass.

**Visual: unchanged.** Same text, weight and colour — no chevron, no pencil, no
colour shift. The only feedback is the ripple, using `Colors.primaryRGBA12`, the
same `rippleColor` the adjacent review-status button uses.

**Accessibility.** `accessibilityRole="button"` and
`accessibilityLabel={t(LanguageKeys.basicSettings)}` — reusing the key that
already titles the destination screen, so the label announces the destination and
tracks it if the title is ever reworded. No new i18n keys, so no new parity gaps
across English/Urdu/RomanUrdu.

Pre-existing and out of scope: the three locales disagree on this key — English
"Profile", Urdu "بنیادی سیٹنگز" (basic settings), RomanUrdu "bunyadi malumaat"
(basic information). Reusing the key inherits that drift rather than adding to it.

## Edge cases

- **No name set** — the block is already guarded by
  `userData?.first_name || userData?.last_name`, so nothing renders and there is
  no invisible dead tap target.
- **RTL** — inherited from the existing `nameBadgeRow` direction flip; the
  wrapper's position in the row does not change.
- **Adjacent tap targets** — the chat-credits badge and review-status button sit
  in the same row and keep their own handlers. Only the name text is wrapped, not
  the whole row, so the targets stay disjoint.

## Testing

No automated test. `Header.tsx` is a large RN component and the existing
component-test setup is where the known pre-existing failures live
(`profile-badges.test.tsx`), so a rendering test here would cost more than it is
worth for a one-line press handler.

Verification is `yarn type-check` plus tapping the name in the running app and
confirming it lands on the Profile details screen, and confirming another
member's name does not respond.

## Out of scope

- Editing the name from anywhere other than the Profile details screen.
- Any change to `UserInput` / the Profile details screen itself.
- Renaming the misleading `basicSettings` key, or reconciling its locale drift.
- Any affordance hinting the name is tappable (explicitly declined — it stays
  visually identical).

## Known interaction

`feat/gift-badge-right-and-popup` is editing `renderSelfHeader` concurrently, but
in a different region — `Styles.strengthTrackWrap` and the gift badge on the
profile-strength track. It does not touch `nameBadgeRow`, `nameShrink` or
`NameRow`, so a merge conflict is unlikely.
