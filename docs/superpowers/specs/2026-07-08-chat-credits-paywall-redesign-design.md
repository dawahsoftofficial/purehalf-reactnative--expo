# Chat Credits Paywall Redesign Design

## Goal

Replace the remote RevenueCat chat-credits paywall UI with a native React Native screen that matches the refreshed Pure Half app layout and removes the coin-heavy visual language.

## Scope

This applies only to chat-credit package purchases launched by `presentChatCreditsPaywall()`. Premium subscription screens, boost packages, backend credit accounting, and RevenueCat product configuration stay unchanged.

## User Experience

The screen uses the app's refreshed visual system: `Colors.appBg`, white surfaces, violet CTAs, lavender icon containers, compact package rows, and the standard close button treatment. The hero copy is direct: "Add chat credits" with supporting text explaining that credits start new conversations when daily chats run out. Package rows keep the existing product quantities and prices from RevenueCat, with the middle package marked as recommended.

Coin artwork is removed. Package icons use neutral vector icons from `react-native-vector-icons` so the purchase reads as a chat utility, not a game currency shop.

## Architecture

Create a local `ChatCreditsPaywallScreen` under `src/screens/chatCreditsPaywall/`. It fetches the `chat-credits` RevenueCat offering directly with `Purchases.getOfferings()`, renders available packages, purchases selected packages with `Purchases.purchasePackage()`, and restores purchases with `Purchases.restorePurchases()`.

`presentChatCreditsPaywall()` keeps its current promise-based API. Instead of calling `RevenueCatUI.presentPaywall()`, it navigates through `navigationRef` to `ChatCreditsPaywall` and resolves when the screen reports purchase, cancel, or error. Existing callers in messages and profile can remain unchanged.

## Error Handling

Loading failure shows an inline empty/error state and returns a failed result if the user closes. Purchase cancellation resolves as `{ success: false, error: 'Purchase cancelled by user' }`. Non-cancellation errors stay on the screen with the existing flash error helper and resolve as failed only if the screen is dismissed.

## Testing

Add focused Jest coverage for the chat-credit paywall service bridge so existing call sites keep receiving a promise result. Run TypeScript and the focused Jest test. Manual QA should open the insufficient-credits flow, verify the native screen appears, verify package rows render from the `chat-credits` offering, and verify close/purchase/restore paths.
