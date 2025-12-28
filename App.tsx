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

const AppContent = (): JSX.Element => {
  const { top } = useSafeAreaInsets();
  const refresh = usePremiumStore((s) => s.refresh);

  useEffect(() => {
    // Wait a bit to ensure RevenueCat is configured before using it
    // RevenueCat is configured in RootNavigation after user data is loaded
    const timer = setTimeout(() => {
      try {
        // Initial fetch - only if Purchases is configured
        refresh();
      } catch {
        // Purchases not configured yet, will retry later
      }
    }, 1000);

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

    Purchases.addCustomerInfoUpdateListener(listener);

    // App foreground handling
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });

    return () => {
      clearTimeout(timer);
      try {
        Purchases.removeCustomerInfoUpdateListener(listener);
      } catch {
        // Listener might not have been added
      }
      sub.remove();
    };
  }, [refresh]);

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
