# Pure Half — Mobile App

React Native app for the Pure Half matchmaking platform.

## Stack

- **React Native 0.82** + **React 19.1** (new architecture, new app screen)
- **TypeScript** (strict-ish; `tsc --noEmit` is clean)
- **State**: Zustand stores in `src/stores/` + a legacy React Context (`src/services/context/`) for `currentUser` / app direction. Both coexist — prefer Zustand for new state.
- **Navigation**: `@react-navigation/native-stack` + bottom-tabs
- **Firebase** (`@react-native-firebase/*`): auth, firestore (chat threads), messaging (FCM push), crashlytics, analytics, functions
- **Pusher** (`@pusher/pusher-websocket-react-native`): presence + user counters
- **RevenueCat** (`react-native-purchases`): IAP / paywall
- **i18next + react-i18next**: English + Urdu (RTL handled in `Initialization.tsx`)
- **Other notables**: deck-swiper (matching UX), Apple/Google/FB sign-in, react-native-maps, MMKV storage, reanimated 4, vector-icons

## Layout

```
src/
├── App.tsx                  # at repo root (not in src/); RevenueCat + Pusher bootstrap
├── initialization/          # Bootsplash, language, forceUpdate gate
├── navigation/              # Root stack + bottom tab
├── screens/                 # ~35 screens (welcome, profile, messages, payments, guardian, …)
├── components/              # Shared UI primitives + composed widgets
├── services/
│   ├── api/                 # axios client + Services.tsx (large: ~1400 lines of endpoint wrappers)
│   ├── context/             # legacy React Context for currentUser
│   ├── firebase/            # Firestore conversations listener, analytics, FCM
│   ├── pusher/              # hooks + channel subscriptions
│   ├── storageManager/      # MMKV wrapper
│   └── paywall-service.tsx  # RevenueCat helpers
├── stores/                  # Zustand: premium, settings, conversation, user-stats
├── hooks/, global/, lib/    # shared helpers (scaling, typography, constants, utils)
├── notifications/           # notifee + FCM permission flow
└── translations/            # i18n JSON, validated by eslint-plugin-i18n-json
```

## Commands

```sh
yarn start              # Metro
yarn android            # build + run Android
yarn ios                # build + run iOS (run `bundle exec pod install` first on macOS)
yarn type-check         # tsc --noEmit  (currently CLEAN)
yarn lint               # eslint  (currently: 20 errors, 853 warnings — see Known Issues)
yarn lint:fix
yarn test               # jest  (currently BROKEN — see Known Issues)
yarn check-all          # lint + type-check + test
```

Node ≥20. Yarn (not npm) is canonical — `yarn.lock` is committed.

## Conventions

- **Path alias**: `@/*` resolves to `src/*` (babel module-resolver). Use it for non-relative imports.
- **Import sort**: enforced by `eslint-plugin-simple-import-sort`. Don't hand-order.
- **Type-only imports**: `import type` enforced by `@typescript-eslint/consistent-type-imports` with inline fix style. Linter will auto-fix.
- **No cyclic imports**: `import/no-cycle` is `error`. If you hit it, restructure — don't disable.
- **`max-params: 3`** — split into an options object if you need more.
- **i18n**: every user-visible string goes through `t()`. Keys in `src/translations/en.json` are authoritative; `i18n-json/identical-keys` will fail builds if other locales drift.
- **Scaling**: use `wp()` / `hp()` from `src/global/Scalling.tsx` for sizes, not raw pixel values.
- **Husky + lint-staged** are wired — commits run lint on staged files. Don't bypass with `--no-verify` unless explicitly told to.

## Known issues (as of 2026-05-27 audit)

- **Jest broken**: `jest-setup.ts` imports `@testing-library/react-native/extend-expect`, but `@testing-library/react-native` v13+ removed that subpath. Built-in matchers are now bundled — the import should be removed or replaced with `'@testing-library/react-native'`.
- **20 ESLint errors**, concentrated in:
  - `src/screens/messages/components/TypingIndicator.tsx` — 19× `react-hooks/refs` ("Cannot access refs during render"). Real React 19 violation — `Animated.Value` refs are being read during render via `.interpolate()`. Needs refactor to read refs only inside effects / event handlers.
  - `src/screens/Map/Location.tsx` — unused import `isIOS`.
- **853 ESLint warnings**, mostly `@typescript-eslint/no-explicit-any` across `services/api/Services.tsx` (1400+ lines, ~60 `any`s), `services/firebase/Firebase.tsx`, and the welcome flow. Not breaking, but reduces type safety.
- **`App.tsx` mixes concerns**: Pusher init, RevenueCat init, and notification-permission request all happen inline. Manageable but worth extracting if it grows.

## Things to be careful with

- **Guardian / Wali screens are core, not optional.** `src/screens/addWali/`, `src/screens/guardian/` — don't refactor away.
- **`Services.tsx` is huge.** When changing one endpoint, search by function name; do not "tidy up" the rest unless asked.
- **Firebase rules + indices live outside this repo** (Firebase console). Adding a new Firestore query that needs a composite index will silently fail in production until the index is created.
- **`firebase-delete-queries.md`** at the repo root is operator notes for cleaning Firestore data — not application code.
