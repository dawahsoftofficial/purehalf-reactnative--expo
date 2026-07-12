import moment from 'moment';
import Purchases, { type CustomerInfo } from 'react-native-purchases';
import { create } from 'zustand';

import { REVENUECAT_ENTITLEMENT_ID } from '../global/Entitlements';

const ENTITLEMENT_ID = REVENUECAT_ENTITLEMENT_ID;

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
  reset: () => void;
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

  // Source-of-truth model (M11 fix):
  //   - RevenueCat is the canonical source for any user who has interacted with
  //     in-app purchases. It is updated in real time by the RC listener.
  //   - Backend `membership_expiry` is the source for users on a non-IAP path
  //     (e.g. bank transfer reviewed by an admin) — RC has nothing to report
  //     for them and `state.loaded` will be true with no entitlement.
  //
  // Previous behavior (`return premium || backend`) trusted whichever side
  // said "yes" — if RC and the backend disagreed, the more-permissive answer
  // won and the user got premium even after expiry from one source. We now
  // log divergence so it shows up in Crashlytics, then prefer RC when its
  // data is loaded.
  isPremium: () => {
    const state = get();
    const backendPremium = isPremiumFromBackend(state.membershipExpiry);

    // Once RC has loaded, defer to it — even when backend says otherwise.
    if (state.loaded) {
      if (state.premium !== backendPremium) {
        // Don't spam: only log when there's actual disagreement.
        console.warn(
          '[premium-store] entitlement divergence — RC says',
          state.premium,
          'backend membership_expiry says',
          backendPremium,
          '(expiry:',
          state.membershipExpiry,
          ') — preferring RevenueCat'
        );
      }
      return state.premium;
    }

    // RC not yet loaded — fall back to backend so we don't briefly demote a
    // paid user on app start.
    return backendPremium;
  },

  reset: () => {
    set({
      premium: false,
      loaded: false,
      customerInfo: undefined,
      membershipExpiry: null,
      // Intentionally NOT resetting `revenueCatConfigured` — RevenueCat itself
      // stays configured for the next user; we just clear cached entitlements.
    });
  },
}));
