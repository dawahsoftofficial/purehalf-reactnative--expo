import Purchases, { type CustomerInfo } from 'react-native-purchases';
import { create } from 'zustand';

const ENTITLEMENT_ID = '2026-packages';

type PremiumState = {
  premium: boolean;
  loaded: boolean;
  customerInfo?: CustomerInfo;
  refresh: () => Promise<void>;
};

function isPremium(ci: CustomerInfo) {
  return ci.entitlements.active[ENTITLEMENT_ID]?.isActive === true;
}

export const usePremiumStore = create<PremiumState>((set) => ({
  premium: false,
  loaded: false,
  customerInfo: undefined,

  refresh: async () => {
    const ci = await Purchases.getCustomerInfo();
    set({
      premium: isPremium(ci),
      loaded: true,
      customerInfo: ci,
    });
  },
}));
