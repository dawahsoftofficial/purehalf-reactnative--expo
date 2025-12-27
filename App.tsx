/// <reference path="./src/types/env.d.ts" />
import React, { useEffect, type JSX } from 'react';
import FlashMessage from 'react-native-flash-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MenuProvider } from 'react-native-popup-menu';

import { Initialization } from './src/initialization';
import { usePremiumStore } from './src/stores';
import Purchases, { CustomerInfo } from 'react-native-purchases';
import { AppState } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { usePusher } from './src/services/pusher';
import { PUSHER_API_KEY, PUSHER_CLUSTER, PUSHER_AUTH_ENDPOINT } from '@env';
import pusherService from './src/services/pusher';

const AppContent = (): JSX.Element => {
  const { top } = useSafeAreaInsets();
  const refresh = usePremiumStore((s) => s.refresh);
  const revenueCatConfigured = usePremiumStore((s) => s.revenueCatConfigured);

  // Initialize Pusher for testing
  // Note: AuthEndpoint is required for private channels
  const pusherConfig =
    PUSHER_API_KEY && PUSHER_CLUSTER
      ? {
          apiKey: PUSHER_API_KEY,
          cluster: PUSHER_CLUSTER,
          authEndpoint: PUSHER_AUTH_ENDPOINT || undefined, // Required for private channels
        }
      : null;

  const { isConnected: pusherConnected } = usePusher(pusherConfig);

  // Test subscription to conversation.123 channel
  useEffect(() => {
    if (!pusherConnected) {
      console.log('[PusherTest] ⏳ Waiting for Pusher connection...', {
        connected: pusherConnected,
        ready: pusherService.isReady(),
      });
      return;
    }

    // Double check that Pusher is actually ready
    if (!pusherService.isReady()) {
      console.log('[PusherTest] ⏳ Pusher not ready yet...');
      return;
    }

    console.log(
      '[PusherTest] 🚀 Pusher connected! Subscribing to private-conversation.123...'
    );

    let unsubscribe: (() => Promise<void>) | (() => void) = () => {};
    let mounted = true;

    const setupTestSubscription = async () => {
      try {
        // Wait a bit more to ensure connection is stable
        await new Promise((resolve) => setTimeout(resolve, 500));

        if (!mounted || !pusherService.isReady()) {
          console.log(
            '[PusherTest] ⚠️ Pusher not ready, aborting subscription'
          );
          return;
        }

        unsubscribe = await pusherService.subscribeToChannel(
          'private-conversation.123',
          (event) => {
            console.log('[PusherTest] ✅ Test event received:', {
              channel: 'private-conversation.123',
              eventName: event.eventName,
              data: event.data,
            });
          }
        );
        console.log(
          '[PusherTest] ✅ Successfully subscribed to conversation.123'
        );
      } catch (error) {
        console.error(
          '[PusherTest] ❌ Failed to subscribe to conversation.123:',
          error
        );
      }
    };

    setupTestSubscription();

    return () => {
      mounted = false;
      if (unsubscribe) {
        unsubscribe();
        console.log('[PusherTest] 🔌 Unsubscribed from conversation.123');
      }
    };
  }, [pusherConnected]);

  useEffect(() => {
    // Only set up RevenueCat listeners after it's configured
    if (!revenueCatConfigured) {
      return;
    }

    // Real-time listener
    const listener = (ci: CustomerInfo) => {
      const isPremiumFromRevenueCat =
        ci.entitlements.active['2026-packages']?.isActive === true;
      usePremiumStore.setState({
        premium: isPremiumFromRevenueCat,
        loaded: true,
        customerInfo: ci,
      });
    };

    try {
      Purchases.addCustomerInfoUpdateListener(listener);
    } catch (error) {
      console.warn('Failed to add RevenueCat listener:', error);
    }

    // Initial fetch after configuration
    refresh();

    // App foreground handling
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && revenueCatConfigured) {
        refresh();
      }
    });

    return () => {
      try {
        Purchases.removeCustomerInfoUpdateListener(listener);
      } catch {
        // Listener might not have been added
      }
      sub.remove();
    };
  }, [refresh, revenueCatConfigured]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <MenuProvider>
        <Initialization />
        <FlashMessage position="top" statusBarHeight={top} />
      </MenuProvider>
    </GestureHandlerRootView>
  );
};

const App = (): JSX.Element => {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
};
export default App;
