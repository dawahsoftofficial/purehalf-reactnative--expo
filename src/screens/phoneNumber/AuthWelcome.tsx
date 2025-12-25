import i18next from 'i18next';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Animation } from '../../animations';
import { SlideShowContainer, Text } from '../../components';
import { Typography } from '../../global';
import { CheckRtl } from '../../languages';
import { Colors, Fonts } from '../../res';
import { Firebase, setRevenueCat } from '../../services';
import { StorageManager, useGlobalContext } from '../../services';
import { ApiServices } from '../../services/api';
import { type SettingsResponse, useSettingsStore } from '../../stores';
import Data from '../profile/Data';
import AuthButtons from './components/auth-buttons';
import LogoSection from './components/logo-section';
import TermsAndConditions from './components/terms-and-conditions';

type User = {
  id?: string;
  latitude?: number;
  longitude?: number;
  first_name?: string;
  last_name?: string;
  gender?: string;
  date_of_birth?: string;
  media?: {
    primary_image?: string[];
  };
  membership_status?: number | null;
  membership_expiry?: string | null;
};

type AuthWelcomeProps = {
  navigation: {
    navigate: (screen: string, params?: Record<string, unknown>) => void;
    reset: (config: {
      index: number;
      routes: Array<{ name: string; params?: Record<string, unknown> }>;
    }) => void;
  };
};

function AuthWelcome({ navigation }: AuthWelcomeProps) {
  const { bottom } = useSafeAreaInsets();
  const [checkBox, setCheckbox] = useState(false);
  const Rtl = CheckRtl();
  const { getData, setData, storageKeys } = StorageManager;
  const { updateCurrentUser, updateDirection } = useGlobalContext();
  const [loading, setLoading] = useState(false);
  const { setSettings, getAuthenticationMethod } = useSettingsStore();
  const buttonStatus = getAuthenticationMethod();

  const getButtonStatus = useCallback(() => {
    ApiServices.getButtonsActiveStatus()
      .then((data: unknown) => {
        const response = data as SettingsResponse;
        if (response) {
          setSettings(response);
        }
      })
      .catch(() => {
        // Error handled silently, store will keep previous state
      });
  }, [setSettings]);

  const saveDataLocal = useCallback(async () => {
    try {
      await setData(storageKeys.PROFILE_DETAIL_LOCAL, Data);
    } catch (error) {
      console.error('Error saving profile data locally:', error);
    }
  }, [setData, storageKeys.PROFILE_DETAIL_LOCAL]);

  const getToken = useCallback(async () => {
    try {
      const res = await getData(storageKeys.FCM_TOKEN);
      if (!res) {
        const isEmulator = await DeviceInfo.isEmulator();
        const { isIOS } = await import('../../services');
        if (isEmulator && isIOS) {
          await setData(storageKeys.FCM_TOKEN, 'FcmToken');
        } else {
          const token = await Firebase.getFcmToken();
          await setData(storageKeys.FCM_TOKEN, token || 'FcmToken');
        }
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
    }
  }, [getData, setData, storageKeys.FCM_TOKEN]);

  useEffect(() => {
    getButtonStatus();
    saveDataLocal();
    getToken();
    if (Rtl) {
      i18next.changeLanguage('en').then(() => {
        updateDirection('ltr', 'en');
      });
    }
  }, [Rtl, getButtonStatus, saveDataLocal, getToken, updateDirection]);

  const hideLoading = useCallback(() => setLoading(false), []);

  const navigateAfterVerification = useCallback(
    (user: User) => {
      if (!user?.latitude || !user?.longitude) {
        navigation.navigate('Location');
        return;
      }

      const hasBasicInfo =
        user?.first_name &&
        user?.last_name &&
        user?.gender &&
        user?.date_of_birth;

      if (!hasBasicInfo) {
        navigation.navigate('UserInput');
        return;
      }

      const hasPrimaryImage =
        user?.media?.primary_image && user.media.primary_image.length > 0;

      if (!hasPrimaryImage) {
        navigation.navigate('ProfilePicture');
        return;
      }

      if (user?.membership_status === null || user?.membership_status === 0) {
        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'ProFeaturesPromotion',
              params: {
                navigateTo: 'BottomTab',
                from: 'SignUp',
              },
            },
          ],
        });
        return;
      }

      navigation.navigate('BottomTab');
    },
    [navigation]
  );

  const onVerified = useCallback(
    async (user: User) => {
      try {
        if (user?.id) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setRevenueCat(user.id as any);
        }

        try {
          const membershipRes = (await ApiServices.getMembershipStatus()) as {
            membership_expiry?: string | null;
            membership_status?: number;
          } | null;
          const updatedUser: User = {
            ...user,
            membership_expiry:
              membershipRes?.membership_expiry ||
              user.membership_expiry ||
              null,
            membership_status: membershipRes || user?.membership_status ? 1 : 0,
          };

          const userData = (await ApiServices.getCurrentUserDetail()) as User;
          const mergedUser = { ...userData, ...updatedUser };

          updateCurrentUser(mergedUser);
          await setData(storageKeys.USER, mergedUser);

          navigateAfterVerification(mergedUser);
        } catch (error) {
          console.error('Error processing user verification:', error);
          navigateAfterVerification(user);
        }
      } catch (error) {
        console.error('Error in onVerified:', error);
      } finally {
        setLoading(false);
      }
    },
    [setData, storageKeys.USER, updateCurrentUser, navigateAfterVerification]
  );

  const handleSocialAuth = useCallback(
    async (type: 'google' | 'apple') => {
      try {
        setLoading(true);
        const authMethod =
          type === 'google'
            ? ApiServices.socialAuthenticate('google')
            : ApiServices.socialAppleAuthenticate('apple');

        await authMethod;
        const user = (await ApiServices.getCurrentUserDetail()) as User;
        updateCurrentUser(user);
        await onVerified(user);
      } catch (error: unknown) {
        const authError = error as { name?: string };
        if (
          authError?.name === 'AppleSignInCanceled' ||
          authError?.name === 'AppleSignInNotSupported' ||
          authError?.name === 'AppleSignInConfigurationError'
        ) {
          // Silently handle cancellation and configuration errors
        } else {
          console.error(`Error in ${type} authentication:`, error);
        }
        hideLoading();
      }
    },
    [hideLoading, onVerified, updateCurrentUser]
  );

  const onContinuePress = useCallback(
    (type: 'phone' | 'google' | 'apple') => {
      if (type === 'phone') {
        navigation.navigate('PhoneNumber');
      } else {
        handleSocialAuth(type);
      }
    },
    [handleSocialAuth, navigation]
  );

  const handleCheckboxChange = useCallback((value: boolean) => {
    setCheckbox(value);
  }, []);

  const buttonSectionStyle = useMemo(
    () => [Styles.phoneNumberSectionCon, { bottom }],
    [bottom]
  );

  return (
    <SlideShowContainer disabled>
      <StatusBar backgroundColor={Colors.color2} barStyle="dark-content" />

      <View style={Styles.container}>
        <LogoSection />

        <Animation style={buttonSectionStyle}>
          <Text style={Styles.getStarted}>getStarted</Text>

          <TermsAndConditions
            checkBox={checkBox}
            onCheckboxChange={handleCheckboxChange}
          />

          <AuthButtons
            buttonStatus={buttonStatus}
            loading={loading}
            checkBox={checkBox}
            onContinuePress={onContinuePress}
          />
        </Animation>
      </View>
    </SlideShowContainer>
  );
}

export default AuthWelcome;

const Styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  phoneNumberSectionCon: {
    zIndex: 1,
    width: '100%',
    position: 'absolute',
    paddingHorizontal: 16,
  },
  getStarted: {
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_SB,
    includeFontPadding: false,
    fontSize: Typography.medium2,
  },
});
