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
yarn check:release-env  # fails if .env has APP_DEBUG=true (see Release safeguards below)
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

## Known issues

Point-in-time audit (jest setup, ESLint errors/warnings, `App.tsx` coupling) lives in [AUDIT-2026-05-27.md](AUDIT-2026-05-27.md). Re-run `yarn check-all` for the current state rather than trusting a snapshot.

## Release safeguards

`.env` has a mobile-only `APP_DEBUG` flag (read via `react-native-dotenv`/`@env`) that gates a debug-only "Delete Test Account & Restart" row in Settings — see `docs/superpowers/specs/2026-07-11-debug-delete-account-restart-design.md`. Since `.env` is baked into the JS bundle at build time regardless of build type, leaving `APP_DEBUG=true` in `.env` when cutting a release build would ship that row to real users (forced logout + local wipe on tap; the backend hard-delete stays blocked by its own separate `ALLOW_DEBUG_ACCOUNT_DELETE` gate, off by default).

`scripts/check-release-env.js` fails (non-zero exit) if `.env` resolves `APP_DEBUG` to `"true"`. It's wired in automatically, not just documentation:

- **Android**: `android/app/build.gradle` makes every `assembleRelease`/`bundleRelease` task depend on a `checkReleaseEnv` Gradle task, so it runs whether you invoke Gradle from the CLI or Android Studio.
- **iOS**: the "Bundle React Native code and images" Xcode build phase runs it first whenever `$CONFIGURATION = Release` (i.e. Archive builds), before the JS bundle step.
- **Manual**: `yarn check:release-env` runs the same check standalone for a fast pre-flight check without starting a full build.

If it fails, set `APP_DEBUG=false` (or remove the line) in `.env` and rebuild.

## Things to be careful with

- **Guardian / Wali role is being REMOVED from this app (decision 2026-07-12).** Guardian logins move to a separate web interface (its own project). All guardian-role code — guardian login, `src/screens/guardian/`, `role === 'guardian'` branches, the legacy Firebase RTDB `ConversationsListener` — is slated for deletion, not migration or extension. What stays (and is partly still to build): the candidate-side flow to add a guardian's email and approve guardian web logins. See the root `CLAUDE.md` Domain-language section for the full picture.
- **`Services.tsx` is huge.** When changing one endpoint, search by function name; do not "tidy up" the rest unless asked.
- **Firebase rules + indices live outside this repo** (Firebase console). Adding a new Firestore query that needs a composite index will silently fail in production until the index is created.
- **`firebase-delete-queries.md`** at the repo root is operator notes for cleaning Firestore data — not application code.
