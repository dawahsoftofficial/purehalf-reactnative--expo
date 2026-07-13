# Chat Credits Paywall Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the coin-heavy RevenueCat UI chat-credit paywall with a native screen that matches the refreshed app layout.

**Architecture:** Add a focused native screen for `chat-credits` packages and keep `presentChatCreditsPaywall()` as the compatibility bridge. Register the screen in the root navigator so existing message/profile callers do not need behavioral rewrites.

**Tech Stack:** React Native 0.82, React Navigation native stack, `react-native-purchases`, `react-native-vector-icons`, Jest.

---

## File Structure

- Create `src/screens/chatCreditsPaywall/ChatCreditsPaywallScreen.tsx`: fetches packages, renders the approved layout, purchases/restores, and reports a `PaywallResult`.
- Create `src/screens/chatCreditsPaywall/index.tsx`: exports the screen for `src/screens/index.tsx`.
- Modify `src/screens/index.tsx`: export the new screen folder.
- Modify `src/navigation/RootNavigation.tsx`: register `ChatCreditsPaywall`.
- Modify `src/services/paywall-service.tsx`: route chat-credit paywall calls to the native screen while preserving the existing promise return shape.
- Create `src/services/paywall-service.test.tsx`: covers promise resolution for success, cancel, and busy/error paths.

## Tasks

### Task 1: Add Promise Bridge Test

**Files:**

- Create: `src/services/paywall-service.test.tsx`
- Modify: `src/services/paywall-service.tsx`

- [ ] Add a Jest test that mocks `navigationRef.navigate`, calls `presentChatCreditsPaywall()`, captures the `onComplete` route param, invokes it with `{ success: true }`, and expects the promise to resolve successfully.
- [ ] Add a Jest test that invokes `onComplete` with `{ success: false, error: 'Purchase cancelled by user' }` and expects the same result.
- [ ] Add a Jest test that calls `presentChatCreditsPaywall()` before `navigationRef.isReady()` is true and expects `{ success: false, error: 'Navigation is not ready' }`.
- [ ] Run `npm test -- src/services/paywall-service.test.tsx --runInBand`; expected initial result is failure until the bridge is implemented.

### Task 2: Implement Chat-Credit Paywall Bridge

**Files:**

- Modify: `src/services/paywall-service.tsx`

- [ ] Import `navigationRef` from `../navigation/RootNavigation`.
- [ ] Keep `presentPaywall()` unchanged for boost and any other remote paywall path.
- [ ] Change `presentChatCreditsPaywall()` to navigate to `ChatCreditsPaywall` with an `onComplete` callback that resolves the promise exactly once.
- [ ] Return `{ success: false, error: 'Navigation is not ready' }` if the navigation ref cannot navigate.
- [ ] Run the focused service test; expected result is pass.

### Task 3: Build Native Screen

**Files:**

- Create: `src/screens/chatCreditsPaywall/ChatCreditsPaywallScreen.tsx`
- Create: `src/screens/chatCreditsPaywall/index.tsx`

- [ ] Implement `ChatCreditsPaywallScreen` props with `navigation` and `route.params.onComplete`.
- [ ] Fetch `Purchases.getOfferings().all['chat-credits']` on mount and store `availablePackages`.
- [ ] Render the approved mockup using `SafeAreaView`, `StatusBar`, `ScrollView`, `Pressable`, `ActivityIndicator`, and `MaterialCommunityIcons`.
- [ ] Derive package labels from product identifiers and titles, defaulting to the first, second, and third package quantities when identifiers are not descriptive.
- [ ] Use `Purchases.purchasePackage(pkg)` for package buttons and call `onComplete({ success: true, customerInfo })` before navigating back.
- [ ] Use `Purchases.restorePurchases()` for restore and call `onComplete({ success: true, customerInfo })` before navigating back.
- [ ] On close, call `onComplete({ success: false, error: 'Purchase cancelled by user' })` once and navigate back.

### Task 4: Register Navigation

**Files:**

- Modify: `src/screens/index.tsx`
- Modify: `src/navigation/RootNavigation.tsx`

- [ ] Export the new screen from `src/screens/index.tsx`.
- [ ] Import `ChatCreditsPaywall` through the existing screen barrel in `RootNavigation.tsx`.
- [ ] Add a stack screen named `ChatCreditsPaywall` with fade animation and no header.

### Task 5: Verify

**Files:**

- No new files.

- [ ] Run `npm test -- src/services/paywall-service.test.tsx --runInBand`; expected: pass.
- [ ] Run `npm run type-check`; expected: pass or report only unrelated pre-existing errors.
- [ ] Run `git -C app-old diff -- src/services/paywall-service.tsx src/screens/chatCreditsPaywall src/navigation/RootNavigation.tsx src/screens/index.tsx src/services/paywall-service.test.tsx` and confirm the diff is limited to the paywall redesign.
