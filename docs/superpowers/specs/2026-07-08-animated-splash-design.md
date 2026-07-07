# Animated splash redesign — design

**Date:** 2026-07-08
**Branch:** staging
**Status:** approved-direction, spec for review

## Goal

Replace the current static splash experience with a premium **animated** splash that
tells the Pure Half brand story — _two halves become one_ — while the app initializes.
Must feel seamless (no flash/jump) from the OS cold-start splash and be on-brand with
the cool-violet refresh palette.

## Current state

- Cold start shows the **native BootSplash** (`react-native-bootsplash`): background
  `#F1EEF8`, logo = raster `logo_colored.png` (the **old magenta** heart **+ wordmark**).
- `src/initialization/Initialization.tsx` calls `RNBootSplash.hide({ fade: true })` once
  `isLoading` flips false (after language config + force-update check). There is **no**
  animated JS splash today — the native static image simply fades out to reveal the app.

## Approved direction (from brainstorming)

- **Background:** soft lavender `#F1EEF8` throughout (identical to the native splash → seamless).
- **Mark:** vector heart, two halves — left `primaryMid #6E51A8`, right `primary #4B2E83`
  (cool-violet refresh palette, _not_ the raster PNG's magenta).
- **Wordmark only, no tagline** (no new copy → no i18n changes).
- **Motion = "breathe & reunite" (Option A):** seamless handoff, heart stays on screen through
  cold start; then the two halves ease apart and glide back together with a soft pulse ring,
  and the `Pure Half` wordmark rises in beneath. Keeps logo branding during the pre-JS moment.
- Wordmark in Playfair serif (`Fonts.DISPLAY`), color `primary`.
- Respect `prefers-reduced-motion` (fade-only fallback).

## Architecture

Three units, each independently understandable/testable:

### 1. `HeartMark` — `src/components/brand/HeartMark.tsx`

Pure presentational SVG of the two-petal heart. Two rounded-capsule `Rect`s rotated ±30°
about a bottom-center pivot (geometry proven in the approved mockup):
`rect x=62 y=15 w=76 h=150 rx=38`, left `rotate(-30 100 165)`, right `rotate(30 100 165)`,
viewBox `-12 -18 224 216`.

- Props: `{ size?: number; leftColor?: string; rightColor?: string; style? }`
  (defaults: `primaryMid` / `primary`).
- No animation, no app deps → also the single source of truth for the exported PNG (below).
- Depends on: `react-native-svg` (already used elsewhere, e.g. profile ProgressRing).

### 2. `AnimatedSplash` — `src/initialization/AnimatedSplash.tsx`

Full-screen animated overlay that owns the handoff and the motion. Built with
`react-native-reanimated`.

- **Handoff:** uses `RNBootSplash.useHideAnimation({ manifest, animate })` for pixel-perfect
  continuity. `manifest = { background: '#F1EEF8', logo: { width: 100, height: 100 } }`
  (matches the regenerated native logo). We render the library `container` view but draw our
  **own** animated mark (not the raster `logo` Image) centered at the manifest logo position,
  so the first JS frame equals the native frame.
  - _Fallback if `useHideAnimation` geometry proves fiddly:_ mount the overlay, call
    `RNBootSplash.hide({ fade: true })`, and rely on the identical lavender+centered-mark
    first frame for seamlessness. Same visual, simpler wiring.
- **Composition:** the two heart halves are rendered as **two absolutely-positioned Views**,
  each wrapping a one-capsule SVG (rotation baked in), overlapped to form the heart. This lets
  each half animate via a plain reanimated `Animated.View` transform (no in-SVG animation).
  Plus: a pulse-ring `Animated.View` (bordered circle) and the `Pure Half` wordmark `Text`.
- **Props:** `{ ready: boolean; onFinish: () => void }`.
  - `ready` = app init complete (Initialization's `!isLoading`).
  - `onFinish` fires after the intro has played (≥ ~1.6 s) **and** `ready` is true, then the
    overlay fades out (≈350 ms) and `onFinish` unmounts it → app revealed.

### 3. Wiring — `src/initialization/Initialization.tsx`

- Remove the `useEffect` that calls `RNBootSplash.hide` on `!isLoading`.
- Add `const [splashDone, setSplashDone] = useState(false)`.
- Render `<AnimatedSplash ready={!isLoading} onFinish={() => setSplashDone(true)} />`
  on top while `!splashDone`. The force-update `Modal`, `RootNavigation`, and
  `RatingPromptModal` logic are untouched (RootNavigation already gated behind `!isLoading`).

### 4. Native splash asset — regenerate BootSplash

- Export a **1024×1024 transparent PNG** of the cool-violet **mark-only** heart from the
  `HeartMark` geometry (rasterize the SVG; use a Node rasterizer such as `sharp` or
  `@resvg/resvg-js`, added as a `devDependency` only if not already resolvable).
- Run `npx react-native-bootsplash generate <mark>.png --platforms android,ios
--background "#F1EEF8" --logo-width 100` (width 100 keeps clear of the Android-12
  ~134dp icon safe-area, per prior splash work). This rewrites the iOS storyboard + Android
  drawables; `colors.xml` bg is already `#f1eef8`.
- Keep the source PNG under `src/assets/images/` (e.g. `splash_mark.png`) for reference.

## Motion timeline (breathe & reunite)

| t (s)     | Event                                                                      |
| --------- | -------------------------------------------------------------------------- |
| 0.00      | JS overlay revealed (seamless); heart assembled, static                    |
| 0.00–0.25 | hold (let handoff settle)                                                  |
| 0.25–0.55 | halves ease **apart** ~9px each along their outward axis ("inhale")        |
| 0.55–0.92 | halves glide **back together**, slight overshoot → spring settle           |
| ~0.90     | pulse ring emanates + subtle mark scale-bump (1→1.03→1)                    |
| 0.90–1.05 | pulse ring expands and fades                                               |
| 1.00–1.60 | `Pure Half` wordmark fades up (translateY 14→0)                            |
| 1.60+     | gentle heartbeat loop (scale 1↔1.02); loading dots pulse if still `!ready` |
| exit      | when `ready` && intro ≥1.6 s → overlay fades out 350 ms → `onFinish()`     |

**Reduced motion:** skip inhale/reunite/pulse/heartbeat; render assembled heart, fade the
wordmark in, hold until `ready`, fade out. Gate via `AccessibilityInfo.isReduceMotionEnabled()`
(+ listener) — no current usage in repo, new helper is fine.

## Wordmark details

- Rendered directly with `fontFamily: Fonts.DISPLAY` (Playfair SemiBold), **not** via the
  shared `Text variant="display"` — that variant falls back to Poppins in RTL, but "Pure Half"
  is a latin brand wordmark that should always be serif regardless of app direction.
- Color `Colors.primary`. Sized with `wp()` per project scaling convention.

## Edge cases / behavior

- **Init faster than intro:** `ready` may be true before 1.6 s → overlay still plays the full
  intro, then exits. (Splash is not artificially delayed beyond the ~1.6 s intro.)
- **Init slower than intro:** intro finishes, heartbeat + dots keep looping until `ready`, then exit.
- **Force-update modal:** unaffected — it renders in the same tree and appears after the splash
  exits (RootNavigation path unchanged).
- **RTL (Urdu):** background/mark are direction-agnostic; wordmark stays serif + LTR (brand name).

## Out of scope

- No copy/i18n changes (no tagline; "Pure Half" is a brand name).
- No changes to init logic, force-update, navigation, or the RevenueCat/Pusher bootstrap in `App.tsx`.
- The `giftMembershipCongrats` and other unrelated screens.

## Testing / verification

- `yarn type-check` clean; `yarn lint` no new errors.
- Unit-render `HeartMark` (renders 2 capsules) — optional, mind the repo's Jest gotchas
  (use `@testing-library/react-native`; mock `react-native-purchases` if the `@/global`
  barrel is pulled).
- Manual: **native rebuild required** to see Playfair + the regenerated native splash. Verify on
  a cold start (Android + iOS): no flash at native→JS handoff, motion plays, wordmark rises,
  splash exits to app; toggle OS "reduce motion" → fade-only path.

## Risks

- **SVG→PNG rasterization tooling** on Windows — mitigated by `sharp`/`resvg` devDependency;
  if neither resolves, generate the PNG via a one-off headless render and commit the asset.
- **`useHideAnimation` geometry** matching our custom-drawn mark — mitigated by the documented
  simple-overlay fallback (identical first frame on flat bg).
- Motion feels too subtle on-device — the timeline constants live in one place so the
  "breathe & reunite" amplitude/timing can be dialed up (or a bolder intro added) without
  touching structure.
