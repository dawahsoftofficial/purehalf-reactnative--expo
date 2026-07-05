# Notification Center — Plan 2: Mobile App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Target repo:** `D:\GitHub\Pure Half\app-old` (React Native 0.82). All paths are relative to that repo. Run commands from there.
>
> **Depends on Plan 1** (`2026-07-06-notification-center-1-admin-backend.md`): the endpoints `GET/POST/DELETE /v1/app/auth/notifications*` and the `unread_notifications` field on `/v1/app/auth/counter` must exist on the API this build points at.

**Goal:** Add a bell entry point + a dedicated Notifications screen that lists the member's DB-backed notification history with pull-to-refresh, pagination, tap-to-open (reusing existing push routing), swipe-to-delete, mark-all-read, and clear-all — plus an unread badge fed by the API and live foreground pushes.

**Architecture:** A Zustand `useNotificationStore` holds the unread count (seeded from `/auth/counter`, incremented on foreground push, adjusted on read/clear). `notification-services` wraps the five endpoints. The per-`notification_type` routing currently inlined in `DisplayForegroundNotificaton.tsx` is extracted into a shared `routeNotification()` helper so push-tap and list-tap behave identically. A new stack screen renders the list; a bell in the Welcome header opens it.

**Tech Stack:** React Native 0.82, Zustand, axios (`Api`), `react-native-gesture-handler` Swipeable, `@react-navigation/native-stack`, i18next, `react-native-vector-icons/AntDesign`, moment.

**Testing note:** The project's jest is broken (see `app-old/CLAUDE.md` → Known Issues), and the spec scopes mobile verification to `yarn type-check` + `yarn lint` + a manual QA checklist. Each task therefore verifies with `yarn type-check` (must stay CLEAN) instead of unit tests. Follow the repo's import-sort / `import type` lint rules — run `yarn lint:fix` before committing.

**Spec:** `docs/superpowers/specs/2026-07-06-in-app-notification-center-design.md`.

---

## File Structure

**Create:**

- `src/stores/notification-store.ts` — unread-count store
- `src/services/api/types/notification-types.ts` — API types
- `src/services/api/notification-services.tsx` — endpoint wrappers
- `src/notifications/routeNotification.ts` — shared notification_type → navigation helper
- `src/screens/notifications/Notifications.tsx` — the screen
- `src/screens/notifications/index.tsx` — barrel export

**Modify:**

- `src/stores/index.ts` — export the new store
- `src/services/api/EndPoints.tsx` — add notification endpoints
- `src/notifications/DisplayForegroundNotificaton.tsx` — use `routeNotification`, increment store on foreground push
- `src/screens/index.tsx` — export the notifications screen
- `src/navigation/RootNavigation.tsx` — register the `Notifications` stack screen
- `src/screens/welcome/Header.tsx` — bell icon + unread badge

---

## Task 1: Unread-count store

**Files:**

- Create: `src/stores/notification-store.ts`
- Modify: `src/stores/index.ts`

- [ ] **Step 1: Write the store**

Create `src/stores/notification-store.ts`:

```ts
import { create } from 'zustand';

type NotificationState = {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
};

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,

  setUnreadCount: (count) => set({ unreadCount: Math.max(0, count) }),
  increment: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
  decrement: () =>
    set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),
  reset: () => set({ unreadCount: 0 }),
}));
```

- [ ] **Step 2: Export it from the barrel**

In `src/stores/index.ts`, add the line (keep alphabetical-ish with the others):

```ts
export * from './conversation-store';
export * from './notification-store';
export * from './premium-store';
export * from './settings-store';
export * from './user-stats-store';
```

- [ ] **Step 3: Type-check**

Run: `yarn type-check`
Expected: CLEAN (no new errors).

- [ ] **Step 4: Commit**

```bash
git add src/stores/notification-store.ts src/stores/index.ts
git commit -m "feat(notifications): add unread-count store"
```

---

## Task 2: API types, endpoints, and service

**Files:**

- Create: `src/services/api/types/notification-types.ts`
- Modify: `src/services/api/EndPoints.tsx`
- Create: `src/services/api/notification-services.tsx`

- [ ] **Step 1: Write the types**

Create `src/services/api/types/notification-types.ts`:

```ts
export type AppNotification = {
  id: number;
  type: string | null;
  trigger: string | null;
  title: string;
  body: string | null;
  image: string | null;
  data: Record<string, any> | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string | null;
};

export type NotificationsListResponse = {
  message: string;
  error: boolean;
  code: number;
  results: AppNotification[];
  total?: number;
};

export type StandardNotificationResponse = {
  message: string;
  error: boolean;
  code: number;
  results?: unknown;
};
```

- [ ] **Step 2: Add the endpoints**

In `src/services/api/EndPoints.tsx`, add these keys to the `EndPoints` object (anywhere inside it; group them together):

```ts
  notifications: '/auth/notifications',
  notificationMarkRead: (id: number) => `/auth/notifications/${id}/read`,
  notificationsMarkAllRead: '/auth/notifications/mark-all-read',
  notificationDelete: (id: number) => `/auth/notifications/${id}`,
  notificationsClearAll: '/auth/notifications/clear-all',
```

- [ ] **Step 3: Write the service**

Create `src/services/api/notification-services.tsx` (mirrors the `MessageServices` pattern in `message-services.tsx`):

```tsx
import EndPoints from './EndPoints';
import { Api } from './Middleware';
import type {
  AppNotification,
  NotificationsListResponse,
  StandardNotificationResponse,
} from './types/notification-types';

/**
 * Notification Services
 * API client for the in-app notification center.
 */
class NotificationServices {
  /** Paginated list of the current user's visible notifications (newest first). */
  getNotifications = (page = 1, perPage = 20) => {
    return new Promise<{ results: AppNotification[]; total: number }>(
      (resolve, reject) => {
        Api.get(EndPoints.notifications, {
          params: { page, per_page: perPage },
        })
          .then((response) => {
            const data = response.data as NotificationsListResponse;
            if (data?.error === true) {
              reject(data?.message || 'Failed to fetch notifications');
              return;
            }
            resolve({
              results: Array.isArray(data?.results) ? data.results : [],
              total: data?.total ?? 0,
            });
          })
          .catch((error) => {
            reject(
              error?.response?.data?.message ||
                error?.message ||
                'Failed to fetch notifications'
            );
          });
      }
    );
  };

  markAsRead = (id: number) => {
    return new Promise<void>((resolve, reject) => {
      Api.post(EndPoints.notificationMarkRead(id))
        .then((response) => {
          const data = response.data as StandardNotificationResponse;
          if (data?.error === true) {
            reject(data?.message || 'Failed to mark as read');
            return;
          }
          resolve();
        })
        .catch((error) => {
          reject(error?.response?.data?.message || 'Failed to mark as read');
        });
    });
  };

  markAllAsRead = () => {
    return new Promise<void>((resolve, reject) => {
      Api.post(EndPoints.notificationsMarkAllRead)
        .then((response) => {
          const data = response.data as StandardNotificationResponse;
          if (data?.error === true) {
            reject(data?.message || 'Failed to mark all as read');
            return;
          }
          resolve();
        })
        .catch((error) => {
          reject(
            error?.response?.data?.message || 'Failed to mark all as read'
          );
        });
    });
  };

  deleteNotification = (id: number) => {
    return new Promise<void>((resolve, reject) => {
      Api.delete(EndPoints.notificationDelete(id))
        .then((response) => {
          const data = response.data as StandardNotificationResponse;
          if (data?.error === true) {
            reject(data?.message || 'Failed to delete notification');
            return;
          }
          resolve();
        })
        .catch((error) => {
          reject(
            error?.response?.data?.message || 'Failed to delete notification'
          );
        });
    });
  };

  clearAll = () => {
    return new Promise<void>((resolve, reject) => {
      Api.delete(EndPoints.notificationsClearAll)
        .then((response) => {
          const data = response.data as StandardNotificationResponse;
          if (data?.error === true) {
            reject(data?.message || 'Failed to clear notifications');
            return;
          }
          resolve();
        })
        .catch((error) => {
          reject(
            error?.response?.data?.message || 'Failed to clear notifications'
          );
        });
    });
  };
}

const notificationServices = new NotificationServices();
export default notificationServices;
```

- [ ] **Step 4: Type-check + lint-fix**

Run: `yarn type-check && yarn lint:fix`
Expected: type-check CLEAN; lint auto-fixes import order.

- [ ] **Step 5: Commit**

```bash
git add src/services/api/types/notification-types.ts \
        src/services/api/EndPoints.tsx \
        src/services/api/notification-services.tsx
git commit -m "feat(notifications): add notification API types, endpoints, service"
```

---

## Task 3: Shared routing helper + refactor foreground handler

**Files:**

- Create: `src/notifications/routeNotification.ts`
- Modify: `src/notifications/DisplayForegroundNotificaton.tsx`

- [ ] **Step 1: Write the shared routing helper**

Create `src/notifications/routeNotification.ts`. This consolidates the **active** cases from `DisplayForegroundNotificaton.onNotificationPress` (the commented-out cases stay dropped — they are already inactive). Banner-dismissal stays in the foreground component; this helper only performs navigation + the three side-effecting callbacks:

```ts
export type NotificationRouteData = {
  notification_type?: string | null;
  id?: number | string;
  [key: string]: any;
};

export type NotificationRouteDeps = {
  onLogout?: () => void | Promise<void>;
  openAppStore?: () => void | Promise<void>;
  onProfilePictureUpdateRequired?: () => void | Promise<void>;
};

/**
 * Perform the correct navigation / side effect for a notification_type.
 * Shared by the foreground push banner and the notification-center list so
 * both behave identically. Missing deps are simply skipped.
 */
export const routeNotification = async (
  navigation: any,
  type: string | null | undefined,
  data: NotificationRouteData | null | undefined,
  deps: NotificationRouteDeps = {}
): Promise<void> => {
  switch (type) {
    case 'profile_liked':
    case 'profile_visited':
    case 'photo_request_approved':
      navigation.navigate('UserProfile', { userData: { id: data?.id } });
      break;
    case 'photo_access_request':
    case 'photo_request_declined':
      navigation.navigate('PrivatePhotoRequest');
      break;
    case 'account_deletion':
      await deps.onLogout?.();
      break;
    case 'daily_matches':
      navigation.navigate('Welcome', { openRecommendationModal: true });
      break;
    case 'new_female_signups':
    case 'new_male_signups':
      navigation.navigate('Welcome');
      break;
    case 'new_message':
      navigation.navigate('Messages');
      break;
    case 'app_update':
      try {
        await deps.openAppStore?.();
      } catch (error) {
        console.error('[routeNotification] app_update:', error);
      }
      break;
    case 'profile_picture_update_required':
      await deps.onProfilePictureUpdateRequired?.();
      navigation.navigate('ProfilePicture');
      break;
    // account_suspended, profile_approved and any unknown type: no navigation.
    default:
      break;
  }
};
```

- [ ] **Step 2: Refactor `onNotificationPress` to use the helper**

In `src/notifications/DisplayForegroundNotificaton.tsx`:

(a) Add the import near the other imports (line ~19, next to `openAppStore`):

```ts
import { routeNotification } from './routeNotification';
```

(b) Replace the entire `onNotificationPress` function (currently lines 199-420) with:

```ts
const onNotificationPress = async () => {
  const type = remoteMessageData?.notification_type;
  const data = remoteMessageData;

  hideNotification(() => {
    setRemoteMessage(null);
    setRemoteMessageData(null);
  });

  await routeNotification(navigation, type, data, {
    onLogout: onLogoutPress,
    openAppStore,
    onProfilePictureUpdateRequired: async () => {
      const updatedUser = {
        ...currentUser,
        primary_image_to_show: null,
      };
      updateCurrentUser(updatedUser);
      await setData(storageKeys.USER, updatedUser);
    },
  });
};
```

> This preserves the behavior of every active case. `app_update` and `account_suspended` now also dismiss the banner first, which is harmless/desirable.

- [ ] **Step 3: Increment the unread badge on a foreground push**

Still in `src/notifications/DisplayForegroundNotificaton.tsx`:

(a) Add the store import next to the other store/service imports:

```ts
import { useNotificationStore } from '../stores';
```

(b) In `handleOnMessage` (currently lines 90-94), increment the count when the message carries a `notification_type` (skip pure chat pings, which the Messages tab already counts):

```ts
const handleOnMessage = (data: any, remoteMessage: any) => {
  setRemoteMessageData(data);
  setRemoteMessage(remoteMessage);
  showNotification();
  if (data?.notification_type && data?.notification_type !== 'new_message') {
    useNotificationStore.getState().increment();
  }
};
```

- [ ] **Step 4: Type-check + lint-fix**

Run: `yarn type-check && yarn lint:fix`
Expected: CLEAN.

- [ ] **Step 5: Manual smoke check**

Build and run (`yarn android` — build one ABI per the repo note: `npx react-native run-android --active-arch-only`). With the app in the foreground, trigger a `profile_liked` (or any) push from the admin test-send. Confirm: the banner appears, the bell badge increments, and tapping the banner still navigates to the correct screen (behavior unchanged from before the refactor).

- [ ] **Step 6: Commit**

```bash
git add src/notifications/routeNotification.ts src/notifications/DisplayForegroundNotificaton.tsx
git commit -m "refactor(notifications): extract shared routeNotification, bump unread on push"
```

---

## Task 4: Notifications screen + navigation registration

**Files:**

- Create: `src/screens/notifications/Notifications.tsx`
- Create: `src/screens/notifications/index.tsx`
- Modify: `src/screens/index.tsx`
- Modify: `src/navigation/RootNavigation.tsx`

- [ ] **Step 1: Verify gesture-handler root wrapping**

`react-native-gesture-handler` `Swipeable` requires the app tree to be under a `GestureHandlerRootView`. To be safe regardless of the global setup, this screen wraps its own content in one (below). No repo change needed for this step — just be aware.

- [ ] **Step 2: Write the screen**

Create `src/screens/notifications/Notifications.tsx`:

```tsx
import moment from 'moment';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import AntDesign from 'react-native-vector-icons/AntDesign';

import { Container, Header, Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import { openAppStore } from '../../lib/utils/rate-app';
import { routeNotification } from '../../notifications/routeNotification';
import { Colors, Fonts } from '../../res';
import notificationServices from '../../services/api/notification-services';
import type { AppNotification } from '../../services/api/types/notification-types';
import { useNotificationStore } from '../../stores';

const PER_PAGE = 20;

const Notifications = ({ navigation }: any) => {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  const decrement = useNotificationStore((s) => s.decrement);
  const resetUnread = useNotificationStore((s) => s.reset);

  const load = useCallback(async (targetPage: number) => {
    const { results, total: totalCount } =
      await notificationServices.getNotifications(targetPage, PER_PAGE);
    setTotal(totalCount);
    setItems((prev) => (targetPage === 1 ? results : [...prev, ...results]));
    setPage(targetPage);
  }, []);

  useEffect(() => {
    load(1)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load(1)
      .catch(() => null)
      .finally(() => setRefreshing(false));
  }, [load]);

  const onEndReached = useCallback(() => {
    if (loadingMore || items.length >= total) {
      return;
    }
    setLoadingMore(true);
    load(page + 1)
      .catch(() => null)
      .finally(() => setLoadingMore(false));
  }, [loadingMore, items.length, total, page, load]);

  const onItemPress = useCallback(
    async (item: AppNotification) => {
      if (!item.is_read) {
        setItems((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
        );
        decrement();
        notificationServices.markAsRead(item.id).catch(() => null);
      }
      await routeNotification(navigation, item.type, item.data, {
        openAppStore,
      });
    },
    [navigation, decrement]
  );

  const onDelete = useCallback(
    (item: AppNotification) => {
      setItems((prev) => prev.filter((n) => n.id !== item.id));
      if (!item.is_read) {
        decrement();
      }
      notificationServices.deleteNotification(item.id).catch(() => null);
    },
    [decrement]
  );

  const onMarkAllRead = useCallback(() => {
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    resetUnread();
    notificationServices.markAllAsRead().catch(() => null);
  }, [resetUnread]);

  const onClearAll = useCallback(() => {
    setItems([]);
    setTotal(0);
    resetUnread();
    notificationServices.clearAll().catch(() => null);
  }, [resetUnread]);

  const renderRightActions = (item: AppNotification) => (
    <TouchableOpacity
      style={Styles.deleteAction}
      activeOpacity={0.8}
      onPress={() => onDelete(item)}
    >
      <AntDesign name="delete" color={Colors.color2} size={wp(5)} />
    </TouchableOpacity>
  );

  const renderItem = ({ item }: { item: AppNotification }) => (
    <Swipeable renderRightActions={() => renderRightActions(item)}>
      <TouchableOpacity
        activeOpacity={0.7}
        style={[Styles.row, !item.is_read && Styles.rowUnread]}
        onPress={() => onItemPress(item)}
      >
        {item.image ? (
          <Image source={{ uri: item.image }} style={Styles.avatar} />
        ) : (
          <View style={[Styles.avatar, Styles.avatarFallback]}>
            <AntDesign name="bells" color={Colors.primary} size={wp(5)} />
          </View>
        )}
        <View style={Styles.rowBody}>
          <Text
            numberOfLines={1}
            style={[Styles.title, !item.is_read && Styles.titleUnread]}
          >
            {item.title}
          </Text>
          {!!item.body && (
            <Text numberOfLines={2} style={Styles.body}>
              {item.body}
            </Text>
          )}
          {!!item.created_at && (
            <Text style={Styles.time}>{moment(item.created_at).fromNow()}</Text>
          )}
        </View>
        {!item.is_read && <View style={Styles.unreadDot} />}
      </TouchableOpacity>
    </Swipeable>
  );

  const headerActions = () => (
    <View style={Styles.headerActions}>
      <TouchableOpacity onPress={onMarkAllRead} hitSlop={Styles.hitSlop}>
        <Text style={Styles.headerAction}>Read all</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onClearAll} hitSlop={Styles.hitSlop}>
        <Text style={[Styles.headerAction, Styles.headerActionDanger]}>
          Clear
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Container>
      <Header
        navigation={navigation}
        title="Notifications"
        customConponent={items.length > 0 ? headerActions : () => null}
      />
      {loading ? (
        <View style={Styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={items.length === 0 && Styles.emptyContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReachedThreshold={0.4}
          onEndReached={onEndReached}
          ListEmptyComponent={
            <View style={Styles.center}>
              <AntDesign name="bells" color={Colors.muted} size={wp(12)} />
              <Text style={Styles.emptyText}>No notifications yet</Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                style={{ marginVertical: hp(2) }}
                color={Colors.primary}
              />
            ) : null
          }
        />
      )}
    </Container>
  );
};

export default Notifications;

const Styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(6),
  },
  emptyContainer: {
    flexGrow: 1,
  },
  emptyText: {
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small3,
    marginTop: hp(1),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1.6),
    paddingHorizontal: wp(4),
    backgroundColor: Colors.color2,
    borderBottomWidth: 0.7,
    borderBottomColor: Colors.hairline,
  },
  rowUnread: {
    backgroundColor: Colors.lavender,
  },
  avatar: {
    width: wp(11),
    height: wp(11),
    borderRadius: wp(11) / 2,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.lavender,
  },
  rowBody: {
    flex: 1,
    marginHorizontal: wp(3),
  },
  title: {
    color: Colors.ink,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small3,
  },
  titleUnread: {
    fontFamily: Fonts.APPFONT_B,
  },
  body: {
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    marginTop: hp(0.3),
  },
  time: {
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small1,
    marginTop: hp(0.4),
  },
  unreadDot: {
    width: wp(2.2),
    height: wp(2.2),
    borderRadius: wp(2.2) / 2,
    backgroundColor: Colors.theme,
    marginLeft: wp(2),
  },
  deleteAction: {
    backgroundColor: Colors.theme,
    justifyContent: 'center',
    alignItems: 'center',
    width: wp(18),
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  headerAction: {
    color: Colors.primary,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.small2,
    marginLeft: wp(4),
  },
  headerActionDanger: {
    color: Colors.theme,
  },
  hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
});
```

> Tokens used here are all verified to exist in this repo: `Colors.lavender` (#ECE9F6, the brand soft-fill/avatar background), `Colors.theme`, `Colors.primary`, `Colors.ink`, `Colors.muted`, `Colors.hairline`, `Colors.color2`; `Typography.small1/small2/small3`; `Fonts.APPFONT_R/APPFONT_B`. The named import `import { Swipeable } from 'react-native-gesture-handler'` is correct for the installed version (2.29.1) — do not switch to a `ReanimatedSwipeable` subpath (it does not exist here).

- [ ] **Step 3: Barrel-export the screen**

Create `src/screens/notifications/index.tsx`:

```tsx
export { default as Notifications } from './Notifications';
```

Add to `src/screens/index.tsx` (keep the alphabetical grouping):

```ts
export * from './notifications';
```

- [ ] **Step 4: Register the stack screen**

In `src/navigation/RootNavigation.tsx`:

(a) Add `Notifications` to the screens import block (the big `from '../screens'` import, e.g. next to `MyVideo,`):

```ts
  Notifications,
```

(b) Add a `Stack.Screen` inside the `Stack.Navigator` (next to the other content screens, e.g. after the `BottomTab` screen on line 142):

```tsx
<Stack.Screen name="Notifications" component={Notifications} />
```

- [ ] **Step 5: Type-check + lint-fix**

Run: `yarn type-check && yarn lint:fix`
Expected: CLEAN. Resolve any token/import notes from Step 2 now.

- [ ] **Step 6: Commit**

```bash
git add src/screens/notifications/ src/screens/index.tsx src/navigation/RootNavigation.tsx
git commit -m "feat(notifications): notification center screen + route registration"
```

---

## Task 5: Bell entry point + unread badge in the home header

**Files:**

- Modify: `src/screens/welcome/Header.tsx`

- [ ] **Step 1: Add the bell + badge and seed the count**

In `src/screens/welcome/Header.tsx`, make these changes:

(a) Extend the imports:

```ts
import moment from 'moment';
import React, { useEffect } from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  Text as ReactText,
  TouchableOpacity,
  View,
} from 'react-native';
import { hasDynamicIsland, hasNotch } from 'react-native-device-info';
import Ripple from 'react-native-material-ripple';
import AntDesign from 'react-native-vector-icons/AntDesign';

import { Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import { CheckRtl, LanguageKeys } from '../../languages';
import { Colors, Fonts, Images } from '../../res';
import { ApiServices, isIOS, useGlobalContext } from '../../services';
import { useNotificationStore } from '../../stores';
import ProfileComplete from './ProfileComplete';
```

(b) Inside the component, read the count and seed it once on mount:

```ts
const Header = (props: any) => {
  const { currentUser } = useGlobalContext();
  const { navigation = {} } = props;

  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);

  useEffect(() => {
    ApiServices.getUserStats()
      .then((res: any) => setUnreadCount(res?.unread_notifications ?? 0))
      .catch(() => null);
  }, [setUnreadCount]);

  const Rtl = CheckRtl();
  const onMembershipPress = () =>
    navigation.navigate('MembershipInfo', { from: 'Welcome' });
  const onBellPress = () => navigation.navigate('Notifications');
```

(c) Add the bell button inside the returned JSX. Place it as the last child of the outer `headerContainer` `View` (right after `<ProfileComplete />`, before the closing `</View>` on line 60):

```tsx
      <ProfileComplete />
      <TouchableOpacity
        style={Styles.bellBtn}
        activeOpacity={0.7}
        onPress={onBellPress}
      >
        <AntDesign name="bells" color={Colors.ink} size={wp(6)} />
        {unreadCount > 0 && (
          <View style={Styles.bellBadge}>
            <ReactText style={Styles.bellBadgeTxt} numberOfLines={1}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </ReactText>
          </View>
        )}
      </TouchableOpacity>
```

(d) Add the styles to the `StyleSheet.create({...})` block:

```ts
  bellBtn: {
    position: 'absolute',
    right: 0,
    top: isIOS && (hasDynamicIsland() || hasNotch()) ? 13 : 0,
    padding: wp(1),
  },
  bellBadge: {
    position: 'absolute',
    right: wp(0.2),
    top: -hp(0.4),
    minWidth: wp(4.2),
    height: wp(4.2),
    borderRadius: wp(4.2) / 2,
    backgroundColor: Colors.theme,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(1),
  },
  bellBadgeTxt: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_R,
    fontSize: wp(2.6),
  },
```

> The bell is absolutely positioned at the header's top-right so it does not disturb the existing "Hi, name" row layout. If the header is very cramped on small devices, nudge `right`/`top` — verify visually in Step 3.

- [ ] **Step 2: Type-check + lint-fix**

Run: `yarn type-check && yarn lint:fix`
Expected: CLEAN.

- [ ] **Step 3: Manual verification**

Run the app on the home (Welcome) screen. Confirm: the bell shows top-right; if the account has unread notifications the red badge shows the count; tapping the bell opens the Notifications screen; the count matches `unread_notifications` from `/auth/counter`.

- [ ] **Step 4: Commit**

```bash
git add src/screens/welcome/Header.tsx
git commit -m "feat(notifications): bell entry point + unread badge in home header"
```

---

## Task 6: End-to-end verification

- [ ] **Step 1: Type-check + lint (whole project)**

Run: `yarn type-check`
Expected: CLEAN (the repo baseline is clean — no new errors).

Run: `yarn lint`
Expected: no **new** errors beyond the known baseline (see `app-old/CLAUDE.md`). Fix anything introduced by this work.

- [ ] **Step 2: Manual QA checklist (run against a build pointed at the Plan-1 API)**

- [ ] Foreground push with app open → banner shows, bell badge increments, tapping banner routes correctly.
- [ ] Background push, then open app → the notification appears in the list after opening the Notifications screen.
- [ ] Open Notifications from the bell → list loads newest-first, pull-to-refresh works, scrolling loads more (pagination).
- [ ] Tap a notification of 2-3 types (e.g. `profile_liked`, `photo_access_request`, `new_message`) → marks read (dot clears, badge decrements) and navigates to the right screen.
- [ ] Swipe a row → delete removes it; if it was unread the badge decrements.
- [ ] "Read all" → all dots clear, bell badge → 0.
- [ ] "Clear all" → list empties, empty state renders, bell badge → 0.
- [ ] Admin unticks a template's "Show in app" → its already-stored notifications disappear from the list on next refresh (Plan-1 read gate).
- [ ] Empty account → empty state renders, no crash.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore(notifications): mobile notification center complete" --allow-empty
```

---

## Done criteria

- A bell in the home header opens a Notifications screen showing the member's DB-backed history (newest-first, paginated, pull-to-refresh, empty state).
- Tap marks read + routes via the shared `routeNotification` helper (identical to push-tap); swipe deletes; "Read all" and "Clear all" work.
- The unread badge seeds from `/auth/counter`, increments on foreground pushes, and decrements/zeroes on read/clear.
- `yarn type-check` is CLEAN and no new lint errors are introduced.
