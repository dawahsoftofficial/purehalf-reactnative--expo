import { GoogleSignin } from '@react-native-google-signin/google-signin';
import React, { type JSX, useCallback, useEffect, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import RNBootSplash from 'react-native-bootsplash';

import RatingPromptModal from '@/components/rating/RatingPromptModal';
import { openAppStore } from '@/lib/utils/rate-app';
import { recordFirstOpenIfNeeded } from '@/services/rating/ratingEngagement';

import { Button, Text } from '../components';
import { hp, wp } from '../global';
import { RootNavigation } from '../navigation';
import { Colors, Fonts } from '../res';
import { ApiServices, StorageManager, useGlobalContext } from '../services';
import type { SettingsResponse } from '../stores/settings-store';
import { useSettingsStore } from '../stores/settings-store';

const GOOGLE_WEB_CLIENT_ID =
  '760499091535-7b8jggl5lmapn9oi1ovnh4o84a11iv9f.apps.googleusercontent.com';

const Initialization = (): JSX.Element => {
  const {
    getData,
    setData,
    storageKeys: { LANGUAGE, OPENED_CONVERSATION_ID },
  } = StorageManager;
  const { updateDirection } = useGlobalContext();
  const { setSettings } = useSettingsStore();

  const [isLoading, setIsLoading] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  // The initial route depends on the /settings flags (e.g. the pre-signup
  // primer), which load asynchronously. Track when they've arrived so we don't
  // reveal the app — and let the router pick a route — before the flags exist.
  const settingsLoaded = useSettingsStore((state) => state.loaded);
  const [settingsWaitTimedOut, setSettingsWaitTimedOut] = useState(false);

  const checkForMandatoryUpdate = useCallback(async () => {
    try {
      const response: any = await ApiServices.getAppSettings();
      const settingsResponse = response as SettingsResponse;

      // Set settings in store for app-wide access
      if (settingsResponse) {
        setSettings(settingsResponse);
      }

      const results = settingsResponse?.results || [];
      const forceUpdateSetting = results.find(
        (item: any) => item?.key === 'forceUpdate'
      );
      const shouldForceUpdate = Boolean(forceUpdateSetting?.value);

      setShowUpdateModal(shouldForceUpdate);
    } catch (_error) {
      console.error('Failed to fetch the app update information.', _error);
    }
  }, [setSettings]);

  const configureLanguage = useCallback(async () => {
    try {
      const savedLanguage = await getData(LANGUAGE);
      const isUrdu = savedLanguage === 'ur';

      updateDirection(isUrdu ? 'rtl' : 'ltr', isUrdu ? 'ur' : 'en');
    } catch {
      updateDirection('ltr', 'en');
    } finally {
      setIsLoading(false);
    }
  }, [LANGUAGE, getData, updateDirection]);

  const clearOpenedConversationId = useCallback(async () => {
    try {
      await setData(OPENED_CONVERSATION_ID, null);
    } catch (error) {
      console.error(
        'Failed to clear the opened conversation id from storage.',
        error
      );
    }
  }, [OPENED_CONVERSATION_ID, setData]);

  useEffect(() => {
    recordFirstOpenIfNeeded();
  }, []);

  useEffect(() => {
    checkForMandatoryUpdate();
  }, [checkForMandatoryUpdate]);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
    });

    const initializeApp = async () => {
      try {
        await Promise.all([configureLanguage(), clearOpenedConversationId()]);
      } catch (error) {
        console.error('Failed to run the initialization tasks.', error);
      }
    };

    initializeApp();
  }, [clearOpenedConversationId, configureLanguage]);

  // Fail-safe: never trap the user on the splash if the settings fetch is slow
  // or fails — after this window we proceed with whatever settings we have.
  useEffect(() => {
    const timer = setTimeout(() => setSettingsWaitTimedOut(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  // Reveal the app only once local init is done AND settings have loaded (or we
  // timed out). This closes the race where RootNavigation picked the initial
  // route before the /settings flags arrived and always fell through to the
  // default route.
  const appReady = !isLoading && (settingsLoaded || settingsWaitTimedOut);

  useEffect(() => {
    if (appReady) {
      RNBootSplash.hide({ fade: true });
    }
  }, [appReady]);

  const handleUpdatePress = useCallback(async () => {
    try {
      await openAppStore();
    } catch (error) {
      console.error(
        'Unable to open the app store for the update prompt.',
        error
      );
    }
  }, []);

  return (
    <View style={styles.container}>
      <Modal
        visible={showUpdateModal}
        transparent
        onRequestClose={() => {}}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalBody}>
              <Text style={styles.title}>Update Required</Text>
              <Text style={styles.description}>
                A new update is now available. Please update your app to
                continue using it.
              </Text>
            </View>
            <Button
              buttonStyle={styles.ctaButton}
              onPress={handleUpdatePress}
              text="Update Now"
            />
          </View>
        </View>
      </Modal>
      {appReady ? <RootNavigation /> : <View />}
      <RatingPromptModal />
    </View>
  );
};

export default Initialization;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0 , 0 ,0 ,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: wp(50),
    backgroundColor: '#fff',
    borderTopRightRadius: 25,
    borderTopLeftRadius: 25,
    padding: wp(4),
  },
  modalBody: {
    flex: 1,
  },
  title: {
    color: Colors.theme,
    fontFamily: Fonts.APPFONT_B,
    includeFontPadding: false,
    fontSize: wp(6),
    paddingTop: wp(1),
  },
  description: {
    fontFamily: Fonts.APPFONT_R,
    includeFontPadding: false,
    color: Colors.color1,
    fontSize: wp(4),
    marginTop: wp(3),
  },
  ctaButton: {
    paddingHorizontal: wp(2.2),
    paddingVertical: hp(0.3),
    marginTop: wp(5),
    borderRadius: 30,
  },
});
