import moment from 'moment';
import Purchases, { type CustomerInfo } from 'react-native-purchases';
import { create } from 'zustand';

const ENTITLEMENT_ID = '2026-packages';

type PremiumState = {
  premium: boolean; // RevenueCat premium status
  loaded: boolean;
  customerInfo?: CustomerInfo;
  membershipExpiry: string | null; // Backend membership expiry (direct payment)
  setMembershipExpiry: (expiry: string | null) => void;
  refresh: () => Promise<void>;
  // Unified premium check: premium if EITHER RevenueCat OR backend shows premium
  // This handles cases where RevenueCat fails but direct payment succeeds
  isPremium: () => boolean;
};

function isPremiumFromRevenueCat(ci: CustomerInfo) {
  return ci.entitlements.active[ENTITLEMENT_ID]?.isActive === true;
}

function isPremiumFromBackend(membershipExpiry: string | null): boolean {
  if (!membershipExpiry) return false;
  const now = moment();
  console.log('membershipExpiry', membershipExpiry);
  console.log('now', now);
  console.log('isAfter', moment(membershipExpiry).isAfter(now));
  return moment(membershipExpiry).isAfter(now);
}

export const usePremiumStore = create<PremiumState>((set, get) => ({
  premium: false,
  loaded: false,
  customerInfo: undefined,
  membershipExpiry: null,

  setMembershipExpiry: (expiry: string | null) => {
    set({ membershipExpiry: expiry });
  },

  refresh: async () => {
    const ci = await Purchases.getCustomerInfo();
    set({
      premium: isPremiumFromRevenueCat(ci),
      loaded: true,
      customerInfo: ci,
    });
  },

  // Unified premium check: premium if EITHER RevenueCat OR backend shows premium
  isPremium: () => {
    const state = get();
    console.log('state.premium', state.premium);
    console.log(
      'isPremiumFromBackend',
      isPremiumFromBackend(state.membershipExpiry)
    );
    return state.premium || isPremiumFromBackend(state.membershipExpiry);
  },
}));
