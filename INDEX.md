# PureHalf Codebase Index

This document provides a comprehensive index of the entire codebase structure, including all directories, files, and their purposes.

## 📁 Project Structure

```
PureHalf/
├── src/                    # Main source code directory
├── assets/                 # Static assets (images, fonts, icons)
├── ios/                    # iOS native code and configuration
├── __mocks__/              # Jest mocks for testing
├── prompts/                # AI prompts for code generation
├── scripts/                # Utility scripts
├── .husky/                 # Git hooks configuration
└── [config files]          # Configuration files
```

---

## 📂 Source Code (`src/`)

### 🎯 App Routes (`src/app/`)

File-based routing using Expo Router.

#### Root Layout

- **`_layout.tsx`** - Root layout component with global providers (Theme, API, Keyboard, Gesture Handler, Bottom Sheet)
- **`+html.tsx`** - HTML document configuration for web
- **`[...messing].tsx`** - Catch-all route for unmatched paths

#### Authentication & Onboarding

- **`onboarding.tsx`** - First-time user onboarding screen
- **`login.tsx`** - User login screen

#### Main App Routes (`(app)/`)

- **`_layout.tsx`** - Tab navigation layout (Feed, Style, Settings)
- **`index.tsx`** - Feed/home screen (main tab)
- **`settings.tsx`** - Settings screen
- **`style.tsx`** - Style customization screen

#### Feed Routes (`feed/`)

- **`[id].tsx`** - Dynamic route for individual post details
- **`add-post.tsx`** - Create new post screen

---

### 🧩 Components (`src/components/`)

#### Shared Components

- **`buttons.tsx`** - Button components
- **`card.tsx`** - Card component
- **`colors.tsx`** - Color definitions/utilities
- **`cover.tsx`** - Cover/hero component
- **`inputs.tsx`** - Input components
- **`login-form.tsx`** - Login form component
- **`login-form.test.tsx`** - Login form unit tests
- **`title.tsx`** - Title component
- **`typography.tsx`** - Typography components

#### Settings Components (`settings/`)

- **`item.tsx`** - Generic settings item component
- **`items-container.tsx`** - Container for settings items
- **`language-item.tsx`** - Language selection item
- **`theme-item.tsx`** - Theme selection item

#### UI Components (`ui/`)

Core UI component library with Nativewind styling.

- **`index.tsx`** - Main UI components export (Button, Checkbox, Input, Select, Text, etc.)
- **`button.tsx`** - Button component
- **`button.test.tsx`** - Button unit tests
- **`checkbox.tsx`** - Checkbox component
- **`checkbox.test.tsx`** - Checkbox unit tests
- **`colors.js`** - Color constants
- **`focus-aware-status-bar.tsx`** - Status bar component that adapts to focus state
- **`image.tsx`** - Image component wrapper
- **`input.tsx`** - Input component
- **`input.test.tsx`** - Input unit tests
- **`list.tsx`** - List component
- **`modal.tsx`** - Modal component
- **`modal-keyboard-aware-scroll-view.tsx`** - Keyboard-aware scroll view for modals
- **`progress-bar.tsx`** - Progress bar component
- **`select.tsx`** - Select/dropdown component
- **`select.test.tsx`** - Select unit tests
- **`text.tsx`** - Text component
- **`utils.tsx`** - UI utility functions

#### Icons (`ui/icons/`)

- **`index.tsx`** - Icons export
- **`arrow-right.tsx`** - Arrow right icon
- **`caret-down.tsx`** - Caret down icon
- **`feed.tsx`** - Feed icon
- **`github.tsx`** - GitHub icon
- **`home.tsx`** - Home icon
- **`language.tsx`** - Language icon
- **`rate.tsx`** - Rate/star icon
- **`settings.tsx`** - Settings icon
- **`share.tsx`** - Share icon
- **`style.tsx`** - Style icon
- **`support.tsx`** - Support icon
- **`website.tsx`** - Website icon

---

### 🔌 API Layer (`src/api/`)

#### Common API (`common/`)

- **`index.tsx`** - Common API exports
- **`api-provider.tsx`** - React Query API provider wrapper
- **`client.tsx`** - Axios HTTP client configuration
- **`utils.tsx`** - API utility functions

#### Posts API (`posts/`)

- **`index.ts`** - Posts API exports
- **`types.ts`** - Post-related TypeScript types
- **`use-add-post.ts`** - React Query hook for creating posts
- **`use-post.ts`** - React Query hook for fetching single post
- **`use-posts.ts`** - React Query hook for fetching posts list

#### Root

- **`index.tsx`** - Main API exports
- **`types.ts`** - Shared API types

---

### 🛠️ Libraries (`src/lib/`)

#### Authentication (`auth/`)

- **`index.tsx`** - Auth exports
- **`utils.tsx`** - Authentication utility functions

#### Custom Hooks (`hooks/`)

- **`index.tsx`** - Hooks exports
- **`use-is-first-time.tsx`** - Hook to check if app is opened for first time
- **`use-selected-theme.tsx`** - Hook for theme selection state

#### Internationalization (`i18n/`)

- **`index.tsx`** - i18n exports
- **`react-i18next.d.ts`** - TypeScript declarations for react-i18next
- **`resources.ts`** - Translation resources
- **`types.ts`** - i18n TypeScript types
- **`utils.tsx`** - i18n utility functions

#### Root

- **`index.tsx`** - Main library exports (auth, hooks, i18n, utils)
- **`env.js`** - Environment variables configuration
- **`storage.tsx`** - MMKV storage utilities
- **`test-utils.tsx`** - Testing utilities
- **`use-theme-config.tsx`** - Theme configuration hook
- **`utils.ts`** - General utility functions

---

### 🌐 Translations (`src/translations/`)

- **`ar.json`** - Arabic translations
- **`en.json`** - English translations

---

### 📝 Types (`src/types/`)

- **`index.ts`** - Shared TypeScript type definitions

---

## 🎨 Assets (`assets/`)

- **`adaptive-icon.png`** - Android adaptive icon
- **`favicon.png`** - Web favicon
- **`icon.png`** - App icon
- **`splash-icon.png`** - Splash screen icon
- **`fonts/Inter.ttf`** - Inter font file

---

## ⚙️ Configuration Files

### Root Level

- **`app.config.ts`** - Expo app configuration (name, version, icons, plugins)
- **`package.json`** - Dependencies and scripts
- **`tsconfig.json`** - TypeScript configuration
- **`tailwind.config.js`** - Tailwind CSS/Nativewind configuration
- **`babel.config.js`** - Babel configuration
- **`metro.config.js`** - Metro bundler configuration
- **`jest.config.js`** - Jest testing configuration
- **`jest-setup.ts`** - Jest setup file
- **`eslint.config.mjs`** - ESLint configuration
- **`commitlint.config.js`** - Commit message linting configuration
- **`lint-staged.config.js`** - Lint-staged configuration
- **`eas.json`** - Expo Application Services configuration
- **`env.js`** - Environment variables loader
- **`global.css`** - Global CSS styles
- **`nativewind-env.d.ts`** - Nativewind TypeScript declarations

### Git Hooks (`.husky/`)

- **`pre-commit`** - Pre-commit hook (runs lint-staged)
- **`post-merge`** - Post-merge hook

### Scripts (`scripts/`)

- **`genrate-apk-and-install`** - Script to generate and install APK
- **`i18next-syntax-validation.js`** - i18next translation validation

### Prompts (`prompts/`)

- **`expo-doctor.md`** - Expo doctor prompt
- **`image-to-components.md`** - Image to components conversion prompt
- **`svg-icon.md`** - SVG icon generation prompt
- **`write-unit-tests.md`** - Unit test writing prompt

---

## 🧪 Testing

### Mocks (`__mocks__/`)

- **`@gorhom/bottom-sheet.ts`** - Bottom sheet mock
- **`expo-localization.ts`** - Expo localization mock
- **`moti.ts`** - Moti animation library mock
- **`react-native-gesture-handler.ts`** - Gesture handler mock
- **`react-native-keyboard-controller.ts`** - Keyboard controller mock

### Test Files

Test files follow the pattern: `*.test.tsx` alongside their components.

---

## 📱 Native Code (`ios/`)

- **`PureHalf/`** - iOS app source code
  - **`AppDelegate.swift`** - iOS app delegate
  - **`Info.plist`** - iOS app configuration
  - **`PureHalf-Bridging-Header.h`** - Objective-C bridging header
  - **`PureHalf.entitlements`** - iOS app entitlements
  - **`PrivacyInfo.xcprivacy`** - Privacy manifest
  - **`SplashScreen.storyboard`** - Splash screen storyboard
  - **`Images.xcassets/`** - iOS image assets
- **`PureHalf.xcodeproj/`** - Xcode project
- **`PureHalf.xcworkspace/`** - Xcode workspace
- **`Podfile`** - CocoaPods dependencies
- **`Podfile.lock`** - CocoaPods lock file
- **`Pods/`** - CocoaPods installed dependencies

---

## 🔑 Key Entry Points

1. **App Entry**: `src/app/_layout.tsx` - Root layout with providers
2. **Main Navigation**: `src/app/(app)/_layout.tsx` - Tab navigation
3. **API Setup**: `src/api/common/api-provider.tsx` - React Query provider
4. **Theme Setup**: `src/lib/use-theme-config.tsx` - Theme configuration
5. **Storage**: `src/lib/storage.tsx` - MMKV storage utilities
6. **i18n Setup**: `src/lib/i18n/index.tsx` - Internationalization setup

---

## 📦 Key Dependencies

### Core

- **expo** - Expo framework
- **react-native** - React Native
- **expo-router** - File-based routing
- **nativewind** - Tailwind CSS for React Native

### State & Data

- **@tanstack/react-query** - Data fetching and caching
- **react-query-kit** - React Query utilities
- **zustand** - State management
- **axios** - HTTP client

### UI & Animation

- **react-native-reanimated** - Animations
- **react-native-gesture-handler** - Gestures
- **@gorhom/bottom-sheet** - Bottom sheet component
- **moti** - Animation library
- **react-native-svg** - SVG support

### Forms & Validation

- **react-hook-form** - Form management
- **@hookform/resolvers** - Form validation resolvers
- **zod** - Schema validation

### Storage

- **react-native-mmkv** - Fast key-value storage

### Internationalization

- **i18next** - i18n framework
- **react-i18next** - React bindings for i18next
- **expo-localization** - Device locale detection

### Utilities

- **react-native-keyboard-controller** - Keyboard handling
- **react-native-safe-area-context** - Safe area handling
- **react-native-flash-message** - Flash messages
- **@shopify/flash-list** - High-performance list component

---

## 🎯 Architecture Patterns

1. **File-based Routing**: Expo Router for navigation
2. **Component Modularity**: Components kept under 80 lines, single responsibility
3. **API Layer**: React Query with custom hooks for data fetching
4. **State Management**: Zustand for global state, React Query for server state
5. **Styling**: Nativewind (Tailwind CSS) with className props
6. **Type Safety**: TypeScript with strict types
7. **Testing**: Jest + React Native Testing Library
8. **Code Quality**: ESLint, Prettier, Husky pre-commit hooks

---

## 📋 Naming Conventions

- **Files**: kebab-case (e.g., `login-form.tsx`)
- **Components**: PascalCase (e.g., `LoginForm`)
- **Functions**: camelCase (e.g., `useAuth`)
- **Types**: PascalCase (e.g., `UserType`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)

---

## 🔍 Quick Reference

### Find Components

- UI Components: `src/components/ui/`
- Shared Components: `src/components/`
- Screen Components: `src/app/`

### Find API Hooks

- Posts: `src/api/posts/`
- Common: `src/api/common/`

### Find Utilities

- General Utils: `src/lib/utils.ts`
- Storage: `src/lib/storage.tsx`
- Auth: `src/lib/auth/`
- Hooks: `src/lib/hooks/`

### Find Types

- Shared Types: `src/types/index.ts`
- API Types: `src/api/types.ts` and `src/api/posts/types.ts`

---

_Last updated: Generated automatically_
_This index provides a comprehensive overview of the PureHalf codebase structure._
