import Purchases, { type CustomerInfo } from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';

import { navigationRef } from '../navigation/RootNavigation';

export type PaywallResult = {
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: string;
};

/**
 * Get offering by identifier
 * @param offeringIdentifier - The offering identifier from RevenueCat console
 * @returns Offering object or null
 */
async function getOffering(offeringIdentifier: string): Promise<any> {
  try {
    const offerings = await Purchases.getOfferings();

    if (!offerings) {
      return null;
    }

    // Find the specific offering
    const offering =
      offerings.all[offeringIdentifier] ||
      (offeringIdentifier === 'current' ? offerings.current : null);

    return offering || null;
  } catch {
    return null;
  }
}

/**
 * Present RevenueCat Paywall for a specific offering
 * Uses RevenueCat UI to show the paywall where users can select their desired package
 * @param offeringIdentifier - The offering identifier from RevenueCat console
 * @returns Promise with purchase result
 */
export async function presentPaywall(
  offeringIdentifier: string
): Promise<PaywallResult> {
  try {
    // Get the offering
    const offering = await getOffering(offeringIdentifier);

    if (!offering) {
      return {
        success: false,
        error: `Offering "${offeringIdentifier}" not found`,
      };
    }

    // Present the RevenueCat Paywall UI
    // This will show the paywall where users can select their desired package
    const paywallResult = await RevenueCatUI.presentPaywall({
      offering: offering,
    });

    // Check if purchase was completed
    if (paywallResult === PAYWALL_RESULT.PURCHASED) {
      return {
        success: true,
      };
    }

    // User cancelled or dismissed the paywall
    return {
      success: false,
      error: 'Purchase cancelled by user',
    };
  } catch (error: unknown) {
    // Handle user cancellation
    const err = error as {
      userCancelled?: boolean;
      code?: string;
      message?: string;
    };
    if (err.userCancelled || err.code === 'USER_CANCELLED') {
      return {
        success: false,
        error: 'Purchase cancelled by user',
      };
    }

    return {
      success: false,
      error: err.message || 'Failed to present paywall',
    };
  }
}

/**
 * Present Boost Profile Paywall
 */
export async function presentBoostProfilePaywall(): Promise<PaywallResult> {
  return presentPaywall('Boost Bundles');
}

/**
 * Present Chat Credits Paywall
 */
export async function presentChatCreditsPaywall(): Promise<PaywallResult> {
  if (!navigationRef.isReady()) {
    return {
      success: false,
      error: 'Navigation is not ready',
    };
  }

  return new Promise((resolve) => {
    let settled = false;

    const onComplete = (result: PaywallResult) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    const navigate = navigationRef.navigate as (
      name: string,
      params: { onComplete: (result: PaywallResult) => void }
    ) => void;

    navigate('ChatCreditsPaywall', {
      onComplete,
    });
  });
}
