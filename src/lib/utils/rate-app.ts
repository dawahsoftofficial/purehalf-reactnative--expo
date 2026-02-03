import { Linking, Platform } from 'react-native';
import InAppReview from 'react-native-in-app-review';

const APP_STORE_ID = '6450672518';
const PLAY_STORE_PACKAGE = 'com.zojayn';

const STORE_URLS = {
  ios: `https://apps.apple.com/app/id${APP_STORE_ID}`,
  android: `https://play.google.com/store/apps/details?id=${PLAY_STORE_PACKAGE}`,
} as const;

/**
 * Opens the app store page as fallback when in-app review is not available.
 */
async function openStoreFallback(): Promise<void> {
  const url = Platform.OS === 'ios' ? STORE_URLS.ios : STORE_URLS.android;
  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
  }
}

/**
 * Requests in-app review (native prompt). If unavailable or it fails,
 * opens the app store page. Use for "Rate App" in settings and similar flows.
 */
export async function requestRateApp(): Promise<void> {
  const isAvailable = InAppReview.isAvailable();

  if (!isAvailable) {
    await openStoreFallback();
    return;
  }
  try {
    const finished = await InAppReview.RequestInAppReview();
    if (finished === false) {
      await openStoreFallback();
    }
  } catch (error) {
    console.error('[rate-app] In-app review failed:', error);
    await openStoreFallback();
  }
}

/**
 * Opens the app store page directly. Use for "Update required" flows
 * where you want to send the user to the store to update.
 */
export async function openAppStore(): Promise<void> {
  await openStoreFallback();
}
