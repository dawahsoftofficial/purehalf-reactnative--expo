# Pure Half — Brand Refresh (Design Spec)

**Date:** 2026-07-05
**Scope:** Visual identity refresh of the existing Pure Half mobile app. No new screens, no functional changes, no copy changes (copy flagged as optional follow-up).
**Approved direction:** Brand board — cooler/deeper violet, serif display + Poppins body, softened premium components.

---

## 1. Goal & constraints

Refresh the look of every screen to a **deeper · cooler · neutral** violet identity, driven by **shared tokens and component primitives** so most screens shift automatically. Keep all functionality, navigation, and layout structure intact.

**Hard constraints**

- No new pages/routes. Upgrade existing screens one by one.
- Guardian/Wali screens are core — restyle, never remove.
- Urdu / RTL keeps its sans font (serif is Latin/English display only).
- i18n: every visible string still goes through `t()`. Copy unchanged in this pass.
- `tsc --noEmit` stays clean; don't introduce ESLint errors.

**Out of scope (this pass)**

- Microcopy / button-label changes ("Send Salaam", "Family-supervised" wording) — optional later pass.
- Logo redraw (existing `logo_colored.png` already matches the mark).
- Welcome flow deep-revise and Guardian login review — **done last, on user's explicit cue.**

---

## 2. Color system

The app centralizes color in `src/res/Colors.tsx` (referenced 978× across 146 files, mostly via `Colors.theme` and opaque `Colors.colorN` keys). Strategy: **retune the brand-carrying keys in place** (auto-propagates) and **add semantic aliases** for new/refactored code. Non-brand keys (greys, reds, greens, yellows) are left alone except a light cooling of the main background greys.

### 2.1 Retuned keys (existing → new)

| Key           | Role                     | Old                  | New                  |
| ------------- | ------------------------ | -------------------- | -------------------- |
| `theme`       | Primary brand            | `#66298E`            | `#4B2E83`            |
| `themeLight`  | Light app surface        | `#F5F5F5`            | `#F6F5FA`            |
| `themeRGBA50` | Disabled/overlay primary | `rgba(142,7,152,.5)` | `rgba(75,46,131,.5)` |
| `themeRGBA20` | Faint primary wash       | `rgba(142,7,152,.2)` | `rgba(75,46,131,.2)` |
| `color5`      | Secondary purple         | `#620A8E`            | `#5A3B93`            |
| `color58`     | Light pink surface       | `#FEEBFF`            | `#ECE9F6`            |
| `color59`     | Light purple             | `#CF9FFF`            | `#9B84C9`            |

Background greys (`color3`, `color7`, `color13`, `color17`, `color26`) nudged toward the cool ground `#F6F5FA`/`#F1EFF6` only where they read as page/section backgrounds — verified per-file, not blanket.

### 2.2 New semantic tokens (added, nothing removed)

```
primary:      '#4B2E83'   // deep cool violet — CTAs, active states
primaryPress: '#3A2266'   // pressed/darker
primaryMid:   '#6E51A8'   // accents, links, icons
primaryLite:  '#9B84C9'   // borders, inactive icons
lavender:     '#ECE9F6'   // pills, soft fills, avatar bg
ink:          '#241A38'   // headings / primary text (cool near-black)
muted:        '#6B6478'   // secondary text
hairline:     '#E4E0EE'   // dividers, input borders
surface:      '#FFFFFF'   // cards
appBg:        '#F6F5FA'   // app background
verified:     '#2E9E5B'   // success / verified
```

New code reads these; legacy keys keep working with harmonized values.

---

## 3. Typography

- **Body / UI:** Poppins (unchanged) via existing `Fonts` module.
- **Display / Serif:** bundle **Playfair Display** (SIL OFL) → add `Playfair-Regular/Medium/SemiBold/Bold.ttf` to `src/assets/fonts/` and `android/app/src/main/assets/fonts/`, wire via `react-native.config.js` assets + `npx react-native-asset` (iOS Info.plist `UIAppFonts`).
- Expose `Fonts.DISPLAY` (+ weight variants). Apply to: screen hero titles, profile names/age, section headlines, big empty-state text. **Not** body, labels, inputs, or any RTL/Urdu text.
- Add a `variant="display"` path (or `DisplayText`) to the shared `Text` component so serif usage is one-line and RTL-guarded (falls back to Poppins when `CheckRtl()` is true).

---

## 4. Component primitives (shared, restyle once)

| Component        | File                                                       | Change                                                                                                                                     |
| ---------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Button           | `src/components/buttons/Button.tsx`                        | Primary = `primary` bg / white text, radius 16 (from 30 pill → softer), press = `primaryPress`; add `variant` (primary / outline / ghost). |
| Card / Container | `src/components/Container.tsx`, section cards              | `surface` bg, radius 20, `hairline` border, soft shadow token.                                                                             |
| Badge / Pill     | `src/components/profile-badges.tsx`, `components/badges/*` | `lavender` fill, `ink` text, 999 radius; shield variant for supervised badge.                                                              |
| Header           | `src/components/Header.tsx`                                | `primary`/`surface` per context, serif title where it's a screen title.                                                                    |
| Inputs           | `src/components/inputs/IconInput.tsx`, pickers             | `bg` fill, `hairline` border, `primary` focus ring.                                                                                        |
| Avatar           | profile/header avatars                                     | `lavender` bg, serif initial in `primary`.                                                                                                 |
| Bottom tab       | `src/navigation/CustomBottomTab.tsx`                       | active `primary`, inactive `primaryLite`/`muted`.                                                                                          |

Shadow token: `{ shadowColor:'#241A38', shadowOpacity:0.12, shadowRadius:16, shadowOffset:{width:0,height:8}, elevation:4 }`.

---

## 5. Rollout order

Each screen is its own reviewable step. Foundation first; Welcome + Guardian last on user's cue.

1. **Foundation** — Colors retune + semantic tokens; Fonts + Playfair; shared component primitives (Button, Card, Badge, Header, Input, Avatar, BottomTab).
2. **Profile** (proof-of-concept — mirrors reference card): `screens/profile/*`.
3. Settings / account cluster: `privacySettings`, `blockedList`, `contactSupport`, `languages`, `accountDeletion`, account modal.
4. Messages / chat: `screens/messages/*`.
5. Search: `searchProfiles/*`, `RefineSearch`, pickers.
6. Payments / membership / paywall: `proFeaturesPromotion/*`, `paymentOptions`, `membershipInfo`, `bankTransfer`, congrats screens.
7. Media & misc: `photosAndVideos`, `MyVideo`, `profilePicture`, alerts/modals, loaders.
8. **Welcome flow** — full revise (user-directed, held).
9. **Guardian login** — review (user-directed, held).

---

## 6. Verification per step

- `yarn type-check` clean after each step.
- No new ESLint errors (`yarn lint` delta check).
- Visual spot-check of the touched screen (describe intended before/after).
- Guardian/Wali screens present and functional after their step.

---

## 7. Risks

- **Opaque color keys** (`colorN`) carry mixed meanings — retune only verified brand keys; never blanket sed.
- **Font linking** — Playfair must be registered on both platforms or serif silently falls back to system; verify with a rendered title.
- **RTL** — serif must be suppressed for Urdu; guard at the `Text`/variant level.
- **Radius change on Button** (30→16) is global — confirm it reads well on the POC screen before propagating further.
