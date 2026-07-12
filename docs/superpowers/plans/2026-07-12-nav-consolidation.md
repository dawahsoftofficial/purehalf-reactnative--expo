# Navigation Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the 5-tab bottom navigation bar in `app-old/`, replacing it with a lightweight top header (search + avatar) on Home plus a persistent floating "Messages" button, and consolidate Settings access, the VIP badge, the chat-credits balance, and profile-approval status into the My Profile screen so they exist in exactly one place.

**Architecture:** Build the new access points first (profile consolidation, persistent FAB), then remove the old ones (Home's avatar modal, the bottom tab bar) once nothing depends on them. `Settings`, `Profile`, `SearchProfiles`, and `Messages` are already independently registered top-level routes in `RootNavigation.tsx` — only their _entry points_ change, not their route registration, so `navigation.navigate('Settings')` etc. keeps working unchanged from anywhere in the app.

**Tech Stack:** React Native 0.82, React Navigation (native-stack; the bottom-tabs package is being dropped from the active navigation graph but not uninstalled), Zustand (`useConversationStore`, `usePremiumStore`), TypeScript.

## Global Constraints

- Do not rename the `"BottomTab"` route. 15+ call sites across onboarding, paywall, and account-closure flows do `navigation.navigate('BottomTab')` or `navigation.reset({ routes: [{ name: 'BottomTab' }] })`. Renaming it means hunting down every caller — out of scope and needlessly risky. Instead, `BottomTab.tsx` becomes a passthrough to `Welcome` so the route still resolves correctly.
- `Settings`, `Profile`, `SearchProfiles`, `Messages`, `Welcome` stay registered exactly as-is in `RootNavigation.tsx` (`app-old/src/navigation/RootNavigation.tsx:160-245`) — do not touch that screen registry.
- `yarn type-check` (`tsc --noEmit`) must stay clean — it is the current baseline gate (per `app-old/CLAUDE.md`).
- `yarn test` is documented as broken in `app-old/CLAUDE.md` — do not add new Jest specs for this UI work; verify via type-check plus the manual QA checklist in each task instead. Do not touch `app-old/src/navigation/resolve-post-signup-route.test.ts` — it asserts on the literal `'BottomTab'` route name, which is not changing.
- Every user-visible string goes through `t()`/`LanguageKeys` — reuse existing keys (`LanguageKeys.profileInReview`, `profileInReviewDesc`, `profileApprovedTitle`, `profileApprovedDesc`) rather than inventing new hardcoded strings.
- Use `wp()`/`hp()` from `app-old/src/global` for sizing, not raw pixel values.
- Guardian/Wali flows are core — do not touch `app-old/src/screens/addWali/`, `app-old/src/screens/guardian/`.

---

### Task 1: Persistent Messages FAB

**Files:**

- Create: `app-old/src/components/PersistentMessagesFab.tsx`
- Modify: `app-old/src/components/index.ts` (add the export)
- Modify: `app-old/src/navigation/RootNavigation.tsx:148-149`

**Interfaces:**

- Consumes: `useConversationStore((s) => s.unreadConversationsCount)` from `app-old/src/stores` (already exists, `app-old/src/stores/conversation-store.ts`); `navigationRef` exported from `app-old/src/navigation/RootNavigation.tsx:75` (`export const navigationRef = createNavigationContainerRef();`).
- Produces: default export `PersistentMessagesFab` — a self-contained component with no props, rendered once as a sibling of `<Stack.Navigator>`.

- [ ] **Step 1: Create the FAB component**

```tsx
// app-old/src/components/PersistentMessagesFab.tsx
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { hp, wp } from '../global';
import { navigationRef } from '../navigation/RootNavigation';
import { Colors } from '../res';
import { useConversationStore } from '../stores';

// Screens where the FAB would either be redundant (already on Messages) or
// visually collide with a full-screen auth/onboarding/paywall flow.
const HIDDEN_ON_ROUTES = new Set([
  'Messages',
  'SingleChat',
  'AuthWelcome',
  'PhoneNumber',
  'Otp',
  'UserInput',
  'OnboardingProfile',
  'Location',
  'ProfilePicture',
  'SignupPrimer',
  'WelcomeUser',
  'ProFeaturesPromotion',
  'ChatCreditsPaywall',
  'DiscountProFeaturesPromotion',
  'MembershipCongrats',
  'GiftMembershipCongrats',
  'PaymentOptions',
  'BankTransfer',
  'AccountDeletion',
  'PurposeOfLeaving',
  'AccountDeleted',
  'AccountSuspended',
]);

function PersistentMessagesFab() {
  const unreadConversationsCount = useConversationStore(
    (state) => state.unreadConversationsCount
  );
  const { bottom } = useSafeAreaInsets();
  const [currentRoute, setCurrentRoute] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    const unsubscribe = navigationRef.addListener('state', () => {
      setCurrentRoute(navigationRef.getCurrentRoute()?.name);
    });
    return unsubscribe;
  }, []);

  if (!currentRoute || HIDDEN_ON_ROUTES.has(currentRoute)) {
    return null;
  }

  const onPress = () => {
    if (!navigationRef.isReady()) return;
    // navigationRef has no app-specific ParamList (none exists in this
    // codebase — see app-old/src/services/paywall-service.tsx:133 for the
    // same cast used to call it imperatively outside a screen component).
    const navigate = navigationRef.navigate as (name: string) => void;
    navigate('Messages');
  };

  return (
    <View
      pointerEvents="box-none"
      style={[Styles.container, { bottom: hp(2.5) + bottom }]}
    >
      <Ripple style={Styles.fab} onPress={onPress} rippleColor={Colors.color2}>
        <Ionicons name="mail" size={wp(6)} color={Colors.color2} />
        {unreadConversationsCount > 0 && (
          <View
            style={[
              Styles.badge,
              {
                minWidth:
                  unreadConversationsCount.toString().length >= 3
                    ? wp(7)
                    : wp(5.5),
              },
            ]}
          >
            <Text style={Styles.badgeText} numberOfLines={1}>
              {unreadConversationsCount}
            </Text>
          </View>
        )}
      </Ripple>
    </View>
  );
}

export default PersistentMessagesFab;

const Styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: wp(5),
    zIndex: 20,
    elevation: 20,
  },
  fab: {
    width: wp(14),
    height: wp(14),
    borderRadius: wp(7),
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.color1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    height: wp(5),
    borderRadius: wp(2.5),
    backgroundColor: Colors.theme,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(1.2),
    borderWidth: 1.5,
    borderColor: Colors.color2,
  },
  badgeText: {
    color: Colors.color2,
    fontSize: wp(2.8),
    fontWeight: '600',
  },
});
```

- [ ] **Step 2: Export it from the components barrel**

Read `app-old/src/components/index.ts` first to find the existing export style (it re-exports each component, e.g. `export { default as CustomModal } from './CustomModal';`), then add a line following the same pattern:

```ts
export { default as PersistentMessagesFab } from './PersistentMessagesFab';
```

- [ ] **Step 3: Mount it in `RootNavigation.tsx`**

In `app-old/src/navigation/RootNavigation.tsx`, change:

```tsx
    <NavigationContainer ref={navigationRef}>
      <DisplayForegroundNotificaton />
      <CustomModal />
      {!loader && (
```

to:

```tsx
    <NavigationContainer ref={navigationRef}>
      <DisplayForegroundNotificaton />
      <CustomModal />
      {!loader && <PersistentMessagesFab />}
      {!loader && (
```

And add the import near the other component imports:

```tsx
import { CustomModal, ImageViewer, PersistentMessagesFab } from '../components';
```

(this replaces the existing `import { CustomModal, ImageViewer } from '../components';` line at `RootNavigation.tsx:11`).

- [ ] **Step 4: Type-check**

Run: `cd "app-old" && yarn type-check`
Expected: clean (no new errors).

- [ ] **Step 5: Manual QA**

Run the app (`yarn android` or `yarn ios`), log in, and confirm: the mail FAB appears bottom-right on Home/Profile/Search screens, shows the correct unread badge count (compare against the count previously shown on the Messages tab), tapping it navigates to `Messages`, and it disappears while you're already on `Messages` or inside a `SingleChat` thread.

- [ ] **Step 6: Commit**

```bash
git add app-old/src/components/PersistentMessagesFab.tsx app-old/src/components/index.ts app-old/src/navigation/RootNavigation.tsx
git commit -m "feat(nav): add persistent messages FAB"
```

---

### Task 2: Consolidate Settings, VIP, coins, and approval status into My Profile

**Files:**

- Modify: `app-old/src/screens/profile/Header.tsx`

**Interfaces:**

- Consumes: `ChatCreditsBadge` default export from `app-old/src/components/badges/chat-credits-badge.tsx` (props: `credits: number | null | undefined`, `onPress?: () => void`, `disabled?: boolean`); `presentChatCreditsPaywall`, already imported in this file; `currentUser`, `updateCurrentUser` from `useGlobalContext()`, already destructured at `Header.tsx:317`.
- Produces: nothing new consumed by other tasks — this is a leaf UI change.

- [ ] **Step 1: Import `ChatCreditsBadge`**

In `app-old/src/screens/profile/Header.tsx`, add to the imports (after the existing `import messageServices from '../../services/api/message-services';` line):

```tsx
import ChatCreditsBadge from '../../components/badges/chat-credits-badge';
```

- [ ] **Step 2: Add chat-credits-purchase state and handler**

Find this block (`Header.tsx:327-330`):

```tsx
const [isPremiumMember, setIsPremiumMember] = useState<boolean>(false);
const [messageButtonLoader, setMessageButtonLoader] = useState(true);
const [blurModalVisible, setBlurModalVisible] = useState<boolean>(false);
const [isUpdatingBlur, setIsUpdatingBlur] = useState(false);
```

Replace with:

```tsx
const [isPremiumMember, setIsPremiumMember] = useState<boolean>(false);
const [messageButtonLoader, setMessageButtonLoader] = useState(true);
const [blurModalVisible, setBlurModalVisible] = useState<boolean>(false);
const [isUpdatingBlur, setIsUpdatingBlur] = useState(false);
const [isChatCreditsLoading, setIsChatCreditsLoading] = useState(false);
```

Then find the `onBlurButtonPress` callback (`Header.tsx:603-605`):

```tsx
const onBlurButtonPress = useCallback(() => {
  setBlurModalVisible(true);
}, []);
```

Add a new handler right after it:

```tsx
const onBlurButtonPress = useCallback(() => {
  setBlurModalVisible(true);
}, []);

const onChatCreditsPress = useCallback(async () => {
  setIsChatCreditsLoading(true);
  try {
    const result = await presentChatCreditsPaywall();
    if (result.success) {
      const refreshedUser =
        (await ApiServices.getCurrentUserDetail()) as unknown as User;
      updateCurrentUser(refreshedUser);
      flashSuccessMessage('Chat credits added successfully!');
    } else if (result.error && result.error !== 'Purchase cancelled by user') {
      flashErrorMessage(result.error || 'Failed to purchase chat credits');
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Failed to purchase chat credits';
    flashErrorMessage(errorMessage);
  } finally {
    setIsChatCreditsLoading(false);
  }
}, [updateCurrentUser]);
```

- [ ] **Step 3: Add the coins pill next to the VIP badge**

Find (`Header.tsx:812-827`):

```tsx
              <View style={Styles.nameShrink}>
                <NameRow
                  firstName={userData?.first_name}
                  lastName={userData?.last_name}
                  showStatus={false}
                  statusColor={onlineStatusColor}
                  rtl={Rtl}
                />
              </View>
              <ProfileBadges
                isSelf={isSelf}
                variant="pill"
                userData={userData}
                containerStyle={Styles.inlineBadges}
              />
            </View>
```

Replace with:

```tsx
              <View style={Styles.nameShrink}>
                <NameRow
                  firstName={userData?.first_name}
                  lastName={userData?.last_name}
                  showStatus={false}
                  statusColor={onlineStatusColor}
                  rtl={Rtl}
                />
              </View>
              <View
                style={{
                  flexDirection: Rtl ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: wp(2),
                }}
              >
                <ProfileBadges
                  isSelf={isSelf}
                  variant="pill"
                  userData={userData}
                  containerStyle={Styles.inlineBadges}
                />
                <ChatCreditsBadge
                  credits={currentUser?.chat_credits ?? 0}
                  onPress={onChatCreditsPress}
                  disabled={isChatCreditsLoading}
                />
              </View>
            </View>
```

- [ ] **Step 4: Add the approval-status card**

Find the end of `renderSelfHeader` (`Header.tsx:920-944`):

```tsx
          <Ripple
            style={[
              Styles.cardBtn,
              Styles.cardBtnGhost,
              { flex: 1, flexDirection: Rtl ? 'row-reverse' : 'row' },
            ]}
            onPress={onBlurButtonPress}
            rippleColor={Colors.lavender}
          >
            <Entypo
              name={userData?.is_blur ? 'eye-with-line' : 'eye'}
              size={wp(4.6)}
              color={Colors.primary}
            />
            <Text
              style={[Styles.cardBtnTxt, Styles.cardBtnTxtGhost]}
              numberOfLines={1}
            >
              {userData?.is_blur ? 'Blur is ON' : 'Blur My Photos'}
            </Text>
          </Ripple>
        </View>
      </View>
    </>
  );
```

Replace with:

```tsx
          <Ripple
            style={[
              Styles.cardBtn,
              Styles.cardBtnGhost,
              { flex: 1, flexDirection: Rtl ? 'row-reverse' : 'row' },
            ]}
            onPress={onBlurButtonPress}
            rippleColor={Colors.lavender}
          >
            <Entypo
              name={userData?.is_blur ? 'eye-with-line' : 'eye'}
              size={wp(4.6)}
              color={Colors.primary}
            />
            <Text
              style={[Styles.cardBtnTxt, Styles.cardBtnTxtGhost]}
              numberOfLines={1}
            >
              {userData?.is_blur ? 'Blur is ON' : 'Blur My Photos'}
            </Text>
          </Ripple>
        </View>
        <View
          style={{
            flexDirection: Rtl ? 'row-reverse' : 'row',
            alignItems: 'flex-start',
            backgroundColor: Colors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: Colors.hairline,
            padding: wp(4),
            marginTop: hp(1.2),
          }}
        >
          <Ionicons
            name={currentUser?.is_approved ? 'checkmark-circle' : 'time-outline'}
            size={wp(5.5)}
            color={currentUser?.is_approved ? Colors.verified : Colors.primaryMid}
          />
          <View style={{ flex: 1, marginHorizontal: wp(3) }}>
            <Text
              style={{
                fontFamily: Fonts.APPFONT_SB,
                fontSize: Typography.small2,
                color: currentUser?.is_approved
                  ? Colors.verified
                  : Colors.primaryMid,
                includeFontPadding: false,
                marginBottom: hp(0.4),
              }}
            >
              {t(
                currentUser?.is_approved
                  ? LanguageKeys.profileApprovedTitle
                  : LanguageKeys.profileInReview
              )}
            </Text>
            <Text
              style={{
                fontFamily: Fonts.APPFONT_R,
                fontSize: Typography.small,
                color: Colors.muted,
                lineHeight: wp(5),
                includeFontPadding: false,
                textAlign: Rtl ? 'right' : 'left',
              }}
            >
              {t(
                currentUser?.is_approved
                  ? LanguageKeys.profileApprovedDesc
                  : LanguageKeys.profileInReviewDesc
              )}
            </Text>
          </View>
        </View>
      </View>
    </>
  );
```

- [ ] **Step 5: Add a settings entry point on the self hero photo**

Find `renderHeroPhoto`'s signature and its `showMenu` block (`Header.tsx:725` through `Header.tsx:798`):

```tsx
  const renderHeroPhoto = (showBack: boolean, showMenu: boolean) => (
```

Replace with:

```tsx
  const renderHeroPhoto = (
    showBack: boolean,
    showMenu: boolean,
    showSettings: boolean
  ) => (
```

Then find the closing of the `showMenu` block, right before the wrapping `</View>`:

```tsx
      {showMenu && (
        <View
          style={[
            Styles.heroMenuContainer,
            {
              left: Rtl ? wp(2) : undefined,
              right: Rtl ? undefined : wp(2),
            },
          ]}
        >
          <Ripple
            style={Styles.overflowBtn}
            onPress={openMenu}
            hitSlop={12}
            rippleColor={Colors.color2}
          >
            <Ionicons
              name="ellipsis-vertical"
              color={Colors.color2}
              size={wp(5)}
            />
          </Ripple>
        </View>
      )}
    </View>
  );
```

Replace with:

```tsx
      {showMenu && (
        <View
          style={[
            Styles.heroMenuContainer,
            {
              left: Rtl ? wp(2) : undefined,
              right: Rtl ? undefined : wp(2),
            },
          ]}
        >
          <Ripple
            style={Styles.overflowBtn}
            onPress={openMenu}
            hitSlop={12}
            rippleColor={Colors.color2}
          >
            <Ionicons
              name="ellipsis-vertical"
              color={Colors.color2}
              size={wp(5)}
            />
          </Ripple>
        </View>
      )}
      {showSettings && (
        <View
          style={[
            Styles.heroMenuContainer,
            {
              left: Rtl ? wp(2) : undefined,
              right: Rtl ? undefined : wp(2),
            },
          ]}
        >
          <Ripple
            style={Styles.overflowBtn}
            onPress={() => navigation.navigate('Settings')}
            hitSlop={12}
            rippleColor={Colors.color2}
          >
            <Ionicons
              name="settings-outline"
              color={Colors.color2}
              size={wp(5)}
            />
          </Ripple>
        </View>
      )}
    </View>
  );
```

- [ ] **Step 6: Update the two call sites**

Find (`Header.tsx:802`):

```tsx
{
  renderHeroPhoto(false, false);
}
```

Replace with:

```tsx
{
  renderHeroPhoto(false, false, true);
}
```

Find (`Header.tsx:955`):

```tsx
{
  renderHeroPhoto(true, !isSelf && !isBlockedYou);
}
```

Replace with:

```tsx
{
  renderHeroPhoto(true, !isSelf && !isBlockedYou, false);
}
```

- [ ] **Step 7: Type-check**

Run: `cd "app-old" && yarn type-check`
Expected: clean.

- [ ] **Step 8: Manual QA**

Open your own profile (bottom tab "Me" still works at this point — Task 4 hasn't removed it yet). Confirm: a settings gear icon appears top-right of your hero photo and navigates to `Settings`; a coins pill showing your `chat_credits` count sits next to the VIP badge and opens the chat-credits paywall on tap; an approval-status card appears below the photo buttons showing the correct pending/approved copy. Open someone else's profile (via `UserProfile`) and confirm the settings icon does _not_ appear there (only the existing block/unblock ⋮ menu does).

- [ ] **Step 9: Commit**

```bash
git add app-old/src/screens/profile/Header.tsx
git commit -m "feat(profile): consolidate settings, coins, and approval status into My Profile"
```

---

### Task 3: Rework the Home header — search icon, direct-to-profile avatar, remove the duplicate completion modal

**Files:**

- Modify: `app-old/src/screens/welcome/Welcome.tsx`
- Delete: `app-old/src/screens/welcome/components/account-modal.tsx`
- Modify: `app-old/src/screens/welcome/components/index.ts` (remove the `AccountModal` export)

**Interfaces:**

- Consumes: nothing new — reuses `navigation.navigate` already available as a prop in `Welcome.tsx` (`WelcomeProps.navigation: any`).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Remove the `AccountModal` import**

In `app-old/src/screens/welcome/Welcome.tsx`, find (`Welcome.tsx:41`):

```tsx
import { AccountModal, RecommendationHeart } from './components';
```

Replace with:

```tsx
import { RecommendationHeart } from './components';
```

- [ ] **Step 2: Remove `headerModal` state and replace its one other reader**

Find (`Welcome.tsx:196`):

```tsx
const [headerModal, setHeaderModal] = useState<boolean>(false);
```

Delete this line entirely.

Find (`Welcome.tsx:602-608`):

```tsx
const onInfoItemPress = useCallback(
  (item: ProfileProgressItem) => {
    setHeaderModal(false);
    navigation.navigate(item.navigation, { scrollTo: item.scrollTo });
  },
  [navigation]
);
```

Delete this function entirely — it was only used by `AccountModal`'s step list, which no longer exists.

- [ ] **Step 3: Replace the avatar button and header layout**

Find (`Welcome.tsx:628-676`):

```tsx
<View
  style={[Styles.headerWrapper, { flexDirection: Rtl ? 'row-reverse' : 'row' }]}
>
  <View style={Styles.greetingBlock}>
    <AppText style={Styles.greetingEyebrow}>
      {LanguageKeys.assalamuAlaikum}
    </AppText>
    {currentUser?.first_name ? (
      <AppText variant="display" style={Styles.greetingName}>
        {currentUser.first_name}
      </AppText>
    ) : null}
  </View>
  <View style={Styles.headerRightWrapper}>
    {showRecommendationModal && (
      <RecommendationHeart onPress={() => onRecommendationPress(true)} />
    )}
    <Ripple
      rippleColor={Colors.primary}
      style={Styles.avatarBtn}
      onPress={() => setHeaderModal(!headerModal)}
    >
      {currentUser?.media?.un_blur_primary_image ? (
        <Image
          source={{ uri: currentUser?.media?.un_blur_primary_image }}
          style={Styles.avatarImg}
        />
      ) : (
        <Text style={Styles.headerText}>
          {currentUser?.first_name?.slice(0, 1)}
        </Text>
      )}
      {isPremiumUser ? (
        <View style={Styles.premiumBadge}>
          <Ionicons name="diamond" size={wp(2.6)} color={Colors.surface} />
        </View>
      ) : null}
    </Ripple>
  </View>
</View>
```

Replace with:

```tsx
<View
  style={[Styles.headerWrapper, { flexDirection: Rtl ? 'row-reverse' : 'row' }]}
>
  <View style={Styles.greetingBlock}>
    <AppText style={Styles.greetingEyebrow}>
      {LanguageKeys.assalamuAlaikum}
    </AppText>
    {currentUser?.first_name ? (
      <AppText variant="display" style={Styles.greetingName}>
        {currentUser.first_name}
      </AppText>
    ) : null}
  </View>
  <View
    style={[
      Styles.headerRightWrapper,
      {
        flexDirection: Rtl ? 'row-reverse' : 'row',
        alignItems: 'center',
        gap: wp(3),
      },
    ]}
  >
    {showRecommendationModal && (
      <RecommendationHeart onPress={() => onRecommendationPress(true)} />
    )}
    <Ripple
      rippleColor={Colors.primary}
      style={Styles.searchIconBtn}
      onPress={() => navigation.navigate('SearchProfiles')}
    >
      <Ionicons name="search" size={wp(5.4)} color={Colors.ink} />
    </Ripple>
    <Ripple
      rippleColor={Colors.primary}
      style={Styles.avatarBtn}
      onPress={() => navigation.navigate('Profile')}
    >
      {currentUser?.media?.un_blur_primary_image ? (
        <Image
          source={{ uri: currentUser?.media?.un_blur_primary_image }}
          style={Styles.avatarImg}
        />
      ) : (
        <Text style={Styles.headerText}>
          {currentUser?.first_name?.slice(0, 1)}
        </Text>
      )}
      {isPremiumUser ? (
        <View style={Styles.premiumBadge}>
          <Ionicons name="diamond" size={wp(2.6)} color={Colors.surface} />
        </View>
      ) : null}
    </Ripple>
  </View>
</View>
```

Add a `searchIconBtn` style next to the existing `avatarBtn` entry — find that style key in the `Styles` `StyleSheet.create({...})` block near the bottom of the file (search for `avatarBtn:` in `Welcome.tsx`), and add a sibling key right before it:

```tsx
  searchIconBtn: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.appBg,
  },
```

- [ ] **Step 4: Redirect the pending-approval banner to Profile instead of the (now-removed) modal**

Find (`Welcome.tsx:677-701`):

```tsx
        {!currentUser?.is_approved && (
          <Ripple
            style={[
              Styles.pendingApprovalBanner,
              { flexDirection: Rtl ? 'row-reverse' : 'row' },
            ]}
            onPress={() => setHeaderModal(true)}
          >
```

Replace the `onPress` line with:

```tsx
        {!currentUser?.is_approved && (
          <Ripple
            style={[
              Styles.pendingApprovalBanner,
              { flexDirection: Rtl ? 'row-reverse' : 'row' },
            ]}
            onPress={() => navigation.navigate('Profile')}
          >
```

(This banner's icon/text/chevron JSX below it, lines 685-700, is unchanged — only the `onPress` target changes, since the approval-status detail now lives on the Profile screen per Task 2 Step 4.)

- [ ] **Step 5: Remove the `AccountModal` render**

Find (`Welcome.tsx:737-743`):

```tsx
<AccountModal
  visible={headerModal}
  onClose={() => setHeaderModal(false)}
  profileCompleteProgress={profileCompleteProgress}
  onInfoItemPress={onInfoItemPress}
  currentUser={currentUser}
/>
```

Delete this block entirely.

- [ ] **Step 6: Confirm `profileCompleteProgress` is still used elsewhere in the file**

Run: `cd "app-old" && grep -n "profileCompleteProgress" src/screens/welcome/Welcome.tsx`
Expected: at least one remaining reference at the `profileIncomplete` computation (`Welcome.tsx:207-210`) and its `useState` initializer (`Welcome.tsx:200-202`) — this state still drives the separate "complete your profile" banner (`Welcome.tsx:702-734`), which is untouched by this task. If `profileCompleteProgress` has zero remaining references after your edits, something above was cut too aggressively — stop and re-check Steps 1-5.

- [ ] **Step 7: Delete `account-modal.tsx` and its barrel export**

`app-old/src/screens/welcome/components/index.ts` is currently:

```ts
export * from './account-modal';
export * from './recommendation-heart';
```

Replace with:

```ts
export * from './recommendation-heart';
```

Then delete the file:

```bash
rm "app-old/src/screens/welcome/components/account-modal.tsx"
```

- [ ] **Step 8: Confirm no remaining references**

Run: `cd "app-old" && grep -rn "AccountModal" src`
Expected: no output (zero matches). If anything remains, resolve it before continuing.

- [ ] **Step 9: Type-check**

Run: `cd "app-old" && yarn type-check`
Expected: clean.

- [ ] **Step 10: Manual QA**

Open Home. Confirm: a search icon and your avatar appear top-right (no more tap-to-open account modal); tapping the search icon navigates to `SearchProfiles`; tapping the avatar navigates straight to your Profile screen; if your profile is pending approval, the pending-approval banner still shows and tapping it also lands on Profile, where the approval-status card (Task 2) is visible.

- [ ] **Step 11: Commit**

```bash
git add app-old/src/screens/welcome/Welcome.tsx app-old/src/screens/welcome/components/index.ts
git rm app-old/src/screens/welcome/components/account-modal.tsx
git commit -m "feat(home): replace avatar modal with search icon and direct profile navigation"
```

---

### Task 4: Retire the 5-tab bottom bar

**Files:**

- Modify: `app-old/src/navigation/BottomTab.tsx`
- Delete: `app-old/src/navigation/CustomBottomTab.tsx`

**Interfaces:**

- Consumes: `Welcome` from `app-old/src/screens` (already exported there).
- Produces: nothing — this is the final task, nothing depends on it.

- [ ] **Step 1: Turn `BottomTab.tsx` into a passthrough to `Welcome`**

Replace the full contents of `app-old/src/navigation/BottomTab.tsx`:

```tsx
import React from 'react';

import { Welcome } from '../screens';

// The "BottomTab" route name is load-bearing across onboarding, paywall,
// and account-closure flows (navigation.navigate('BottomTab') /
// navigation.reset({ routes: [{ name: 'BottomTab' }] })). Renaming the route
// would mean updating every one of those call sites for no behavioral gain,
// so this stays registered as "BottomTab" and simply forwards to Welcome —
// there is no more tab bar to render.
const BottomTab = (props: Record<string, unknown>) => <Welcome {...props} />;

export default BottomTab;
```

- [ ] **Step 2: Confirm `CustomBottomTab` has no other importers**

Run: `cd "app-old" && grep -rn "CustomBottomTab" src`
Expected: only `app-old/src/navigation/BottomTab.tsx` (about to be removed in Step 1, already done) and `app-old/src/navigation/CustomBottomTab.tsx` itself (its own definition). If any other file imports it, stop and investigate before deleting.

- [ ] **Step 3: Delete `CustomBottomTab.tsx`**

```bash
rm "app-old/src/navigation/CustomBottomTab.tsx"
```

- [ ] **Step 4: Type-check**

Run: `cd "app-old" && yarn type-check`
Expected: clean.

- [ ] **Step 5: Manual QA — full navigation sweep**

This is the highest-risk manual check in the plan since it touches the route every onboarding/paywall/account flow lands on. Confirm all of the following:

- Fresh login lands on Home with no bottom tab bar and no crash.
- Completing signup (new account, through `Location` → `UserInput` → `ProfilePicture`) lands on Home correctly (exercises `resolve-post-signup-route.ts`'s `'BottomTab'` target).
- From Home: search icon → `SearchProfiles` works; avatar → `Profile` works; the persistent Messages FAB (Task 1) → `Messages` works; Settings gear on your Profile (Task 2) → `Settings` works.
- Completing a purchase on any paywall screen (`ProFeaturesPromotion`, `DiscountProFeaturesPromotion`, `PackagesList`, `DiscountPackagesList`) and its congrats screen (`MembershipCongrats`, `GiftMembershipCongrats`) still returns you to Home with no crash (these all `reset({ routes: [{ name: 'BottomTab' }] })`).
- Guardian login still lands directly on `Messages` (unaffected — guardians never route through `BottomTab`).
- No leftover UI artifact (empty bar, blank space) where the tab bar used to render at the bottom of Home/Profile/Search/Messages/Settings.

- [ ] **Step 6: Commit**

```bash
git add app-old/src/navigation/BottomTab.tsx
git rm app-old/src/navigation/CustomBottomTab.tsx
git commit -m "feat(nav): retire the bottom tab bar"
```

---

### Task 5: Final sweep

**Files:** none created; verification only.

- [ ] **Step 1: Confirm no dangling references to removed pieces**

Run: `cd "app-old" && grep -rn "AccountModal\|CustomBottomTab\|headerModal" src`
Expected: no output.

- [ ] **Step 2: Full type-check**

Run: `cd "app-old" && yarn type-check`
Expected: clean.

- [ ] **Step 3: Lint the changed files**

Run: `cd "app-old" && yarn lint`
Expected: no _new_ errors introduced by this plan (the existing 20-error/853-warning baseline per `app-old/CLAUDE.md` is unrelated pre-existing debt — do not attempt to fix it here).

- [ ] **Step 4: End-to-end manual pass**

Re-run the full checklist from Task 4 Step 5 once more after all tasks are merged together, since Task 4 alone doesn't exercise Task 1-3's new UI in combination with the retired tab bar in the same pass.
