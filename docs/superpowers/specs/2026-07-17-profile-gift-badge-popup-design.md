# Profile gift badge — fixed right placement + explainer popup — design

**Date:** 2026-07-17
**Repos:** `app-old/` (mobile only — no backend change)
**Branch:** `feat/gift-badge-right-and-popup`, off `staging` (staging-first rule)

## Goal

Two changes to the gift badge on the ME profile card (`Header.tsx`, self header):

1. **Placement** — the badge stops sliding along with the progress fill and pins
   permanently to the right end of the profile-strength track.
2. **Popup** — tapping the badge opens a proper explanatory modal instead of a
   flash toast. The locked variant explains that completing the profile screens
   unlocks the gift and offers a **Start now** button into the existing
   `OnboardingProfile` flow.

## Context (as-is)

`Header.tsx` `renderSelfHeader` draws a profile-strength bar. The `GiftBadge`
lives inside `Styles.strengthTrackWrap` as an absolutely-positioned sibling of
the track:

```
Rtl ? { right: `${profileStrength}%` } : { left: `${profileStrength}%` }
```

so it rides the fill position, plus `transform: [{ translateX: -wp(4) }]` to
centre it over that point. At low strength (e.g. 3%) it lands at the far left and
visually collides with the "Profile strength 3%" label above.

`GiftBadge` (`components/gift-badge.tsx`) supports three tappable states —
locked / eligible / claimed. **The claimed state is currently unreachable**: the
badge is wrapped in `{!giftClaimed && ...}` in `Header.tsx`, so a claimed gift
renders nothing. The component's header comment claims it is "used identically in
the OnboardingProfile header and the ME profile header"; that is stale —
`gift-badge.tsx` has exactly one importer (`Header.tsx`).

`onGiftBadgePress` currently branches:

- claimed → `flashSuccessMessage(giftAlreadyClaimedHint)`
- not eligible → `flashErrorMessage(giftLockedHint, { percent })`
- eligible → opens `GiftClaimModal`

Relevant settings (`settings-store.ts`): `profile_completion_threshold_percent`
default **90**, `profile_completion_gift_credits` default **150** credits. At 50
credits per chat that is 3 chats.

Home already has the pattern the popup's CTA needs (`Welcome.tsx` profile
banner): `navigation.navigate('OnboardingProfile', { from: 'Home' })`.

## Decisions (confirmed with user)

- **Badge pins to the right end of the track** (not the label row, not the
  threshold mark), and no longer moves with progress.
- **Both locked and claimed taps open a popup** — no gift tap produces a toast
  any more.
- **The claimed badge becomes permanently visible** at that right-end spot. This
  goes beyond the literal request but is required for the claimed popup to be
  reachable at all; explicitly confirmed.
- Copy says **credits**, not "chats". The existing English `giftClaimBody`
  ("Claim {{amount}} free chats" for a 150-_credit_ gift, where RomanUrdu
  correctly says "free chat credits") is a pre-existing inconsistency and is
  **out of scope** — left untouched.

## Design by task

### Task 1 — `Header.tsx` placement

In `Styles.giftAboveBar`, drop `transform: [{ translateX: -wp(4) }]` (it only
existed to centre the badge over the moving fill point). At the call site replace
the percentage offset with a fixed edge:

```
Rtl ? { left: 0 } : { right: 0 }
```

The badge's outer edge then sits flush with the track end rather than overhanging
the card. `bottom: hp(1.4)` is unchanged, so it still floats above the bar; the
strength label is short and left-aligned, so the collision seen at 3% is gone.
RTL mirroring is preserved.

Remove the `{!giftClaimed && ...}` wrapper so all three states render.

### Task 2 — `components/profile-gift-info-modal.tsx` (new)

A sibling of `gift-claim-modal.tsx`, modelled on its `wrapper` / `card` /
`iconChip` / `title` / `body` / `buttonRow` styles so the two gift dialogs read as
one family. Purely presentational — no state, no navigation, no API:

```ts
type ProfileGiftInfoModalProps = {
  visible: boolean;
  variant: 'locked' | 'claimed';
  percent: number; // unlock threshold
  credits: number; // gift size
  onClose: () => void;
  onStart: () => void;
};
```

- **locked** — lavender chip + `gift` icon; title `giftInfoTitle`; body
  `giftInfoBody` interpolating `{{percent}}` and `{{credits}}`; buttons
  `maybeLater` (outline, → `onClose`) and `giftStartNow` (primary, → `onStart`).
- **claimed** — green chip + `gift-open-outline` icon; title `giftClaimedTitle`;
  body `giftClaimedBody` interpolating `{{credits}}`; single `gotIt` button
  (→ `onClose`).

`animationType="fade"`, `transparent`, `statusBarTranslucent`, and
`onRequestClose={onClose}` — matching `GiftClaimModal`.

### Task 3 — `Header.tsx` wiring

Add `giftInfoVariant: 'locked' | 'claimed' | null` state (a single nullable
variant rather than two booleans — the two popups are mutually exclusive).

`onGiftBadgePress` becomes:

- claimed → `setGiftInfoVariant('claimed')`
- not eligible → `setGiftInfoVariant('locked')`
- eligible → `setGiftModalVisible(true)` (unchanged)

`onStart` closes the popup and calls
`navigation.navigate('OnboardingProfile', { from: 'Home' })`. `from: 'Home'` is
deliberate — it is what makes `OnboardingProfile`'s `exitFlow`/`bailFlow` reset to
`BottomTab` instead of continuing into the signup chain (`ProfilePicture`).

Render `<ProfileGiftInfoModal>` alongside the existing `GiftClaimModal`.
`flashSuccessMessage` / `flashErrorMessage` imports stay — both are still used
elsewhere in the file (`onChatCreditsPress`, `onMessagePress`).

### Task 4 — i18n

Add to `Keys.tsx` + `English.json` + `Urdu.json` + `RomanUrdu.json`:

| Key                | English                                                                                                        |
| ------------------ | -------------------------------------------------------------------------------------------------------------- |
| `giftInfoTitle`    | Unlock your profile gift                                                                                       |
| `giftInfoBody`     | Complete your profile screens to reach {{percent}}% profile strength and unlock {{credits}} free chat credits. |
| `giftStartNow`     | Start now                                                                                                      |
| `giftClaimedTitle` | Gift claimed                                                                                                   |
| `giftClaimedBody`  | You've already claimed your {{credits}} free chat credits for completing your profile.                         |

Reuse existing `maybeLater` and `gotIt`. Delete `giftLockedHint` and
`giftAlreadyClaimedHint` from `Keys.tsx` and all three locales — `Header.tsx` was
their only consumer and both are dead after Task 3.

Urdu gets real translations; RomanUrdu follows its existing convention
(Roman-script Urdu, English technical nouns).

### Task 5 — stale comment

Fix `gift-badge.tsx`'s header comment: it is used only in the ME profile header,
and the caller no longer hides the claimed state.

## Testing

- `yarn type-check` clean.
- `yarn lint` on touched files (i18n JSON interpolation is linted by
  `eslint-plugin-i18n-json`).
- No unit tests: the change is presentational. `gift-status.ts` /
  `gift-claim-outcome.ts` (the tested units) are untouched.
- Manual: ME profile at low strength → badge sits at bar's right end, does not
  move as strength changes; locked tap → popup → **Start now** lands in
  `OnboardingProfile` and exits back to `BottomTab`; claimed tap → claimed popup;
  eligible tap → unchanged `GiftClaimModal`. Repeat with Urdu (RTL) — badge
  mirrors to the left end.

## Out of scope

- The `giftClaimBody` "chats" vs "credits" wording bug.
- Home's gift banner (`Welcome.tsx`) — it already carries explanatory text and
  navigates directly; no popup needed.
- Any backend / `admin/` change.
