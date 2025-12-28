import { useFocusEffect } from '@react-navigation/native';
import React from 'react';
import { AppState } from 'react-native';
import Purchases, { type CustomerInfo } from 'react-native-purchases';

const ENTITLEMENT_ID = '2026-packages'; // <-- your RevenueCat entitlement identifier

function isPremium(ci: CustomerInfo) {
  return ci.entitlements.active[ENTITLEMENT_ID]?.isActive === true;
}

export function usePremiumGate() {
  const [premium, setPremium] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  const refresh = React.useCallback(async () => {
    // Optional "hard" refresh if you suspect stale cache:
    // await Purchases.invalidateCustomerInfoCache(); // use sparingly :contentReference[oaicite:3]{index=3}
    const ci = await Purchases.getCustomerInfo(); // safe to call often :contentReference[oaicite:4]{index=4}
    setPremium(isPremium(ci));
    setLoaded(true);
  }, []);

  React.useEffect(() => {
    const listener = (ci: CustomerInfo) => {
      setPremium(isPremium(ci));
      setLoaded(true);
    };
    Purchases.addCustomerInfoUpdateListener(listener); // :contentReference[oaicite:5]{index=5}

    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') refresh();
    });

    refresh();

    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener); // :contentReference[oaicite:6]{index=6}
      sub.remove();
    };
  }, [refresh]);

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { premium, loaded, refresh };
}
