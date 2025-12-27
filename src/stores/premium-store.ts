import moment from 'moment';
import Purchases, { type CustomerInfo } from 'react-native-purchases';
import { create } from 'zustand';

const ENTITLEMENT_ID = '2026-packages';

type PremiumState = {
  premium: boolean; // RevenueCat premium status
  loaded: boolean;
  customerInfo?: CustomerInfo;
  membershipExpiry: string | null; // Backend membership expiry (direct payment)
  revenueCatConfigured: boolean; // Track if RevenueCat is configured
  setMembershipExpiry: (expiry: string | null) => void;
  setRevenueCatConfigured: (configured: boolean) => void;
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
  return moment(membershipExpiry).isAfter(now);
}

export const usePremiumStore = create<PremiumState>((set, get) => ({
  premium: false,
  loaded: false,
  customerInfo: undefined,
  membershipExpiry: null,
  revenueCatConfigured: false,

  setMembershipExpiry: (expiry: string | null) => {
    set({ membershipExpiry: expiry });
  },

  setRevenueCatConfigured: (configured: boolean) => {
    set({ revenueCatConfigured: configured });
  },

  refresh: async () => {
    const state = get();
    // Only refresh if RevenueCat is configured
    if (!state.revenueCatConfigured) {
      return;
    }
    try {
      const ci = await Purchases.getCustomerInfo();
      set({
        premium: isPremiumFromRevenueCat(ci),
        loaded: true,
        customerInfo: ci,
      });
    } catch (error) {
      // RevenueCat not configured or error occurred
      console.warn('RevenueCat refresh failed:', error);
    }
  },

  // Unified premium check: premium if EITHER RevenueCat OR backend shows premium
  isPremium: () => {
    const state = get();

    return state.premium || isPremiumFromBackend(state.membershipExpiry);
  },
}));
