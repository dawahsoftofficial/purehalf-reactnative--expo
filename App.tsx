import React, { useEffect, type JSX } from 'react';
import FlashMessage from 'react-native-flash-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MenuProvider } from 'react-native-popup-menu';

import { Initialization } from './src/initialization';
import { usePremiumStore } from './src/stores';
import Purchases, { CustomerInfo } from 'react-native-purchases';
import { AppState } from 'react-native';
const App = (): JSX.Element => {
  const refresh = usePremiumStore((s) => s.refresh);

  useEffect(() => {
    // Initial fetch
    refresh();

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
      Purchases.removeCustomerInfoUpdateListener(listener);
      sub.remove();
    };
  }, [refresh]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <MenuProvider>
        <Initialization />
        <FlashMessage position="top" />
      </MenuProvider>
    </GestureHandlerRootView>
  );
};

export default App;
