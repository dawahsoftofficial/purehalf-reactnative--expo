import React, { memo, useCallback, useMemo, useState } from 'react';
import { PermissionsAndroid } from 'react-native';
import { Linking, Platform, ScrollView, StyleSheet } from 'react-native';

import { requestRateApp } from '@/lib/utils/rate-app';
import { usePremiumStore } from '@/stores';

import { Container, SettingsButton, SettingsHeader } from '../../components';
import LocationConsentModal from '../../components/alerts/LocationConsentModal';
import { hp, wp } from '../../global';
import { LanguageKeys } from '../../languages';
import { Images } from '../../res';
import { useGlobalContext } from '../../services';

type SettingsProps = {
  navigation: {
    navigate: (screen: string, params?: object) => void;
  };
};

type SettingsMenuItem = {
  icon: number;
  name: string;
  onPress: () => void;
  showCondition?: () => boolean;
};

function Settings(props: SettingsProps) {
  const { currentUser } = useGlobalContext();
  const { isPremium } = usePremiumStore();
  const premium = isPremium();
  const { navigate } = props.navigation;
  const [showLocationConsentModal, setShowLocationConsentModal] =
    useState<boolean>(false);

  const onBasicInfoPress = useCallback(() => {
    navigate('UserInput', { fromSettings: true });
  }, [navigate]);

  const checkLocationPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      // iOS permissions are handled automatically by the system
      return true;
    }
    try {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return granted;
    } catch {
      return false;
    }
  }, []);

  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      // iOS will show native permission dialog automatically
      return true;
    }
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      return false;
    }
  }, []);

  const onLocationPress = useCallback(async () => {
    // Check if permission is already granted
    const hasPermission = await checkLocationPermission();

    if (hasPermission) {
      // Permission already granted, navigate directly
      navigate('UserLocation');
    } else {
      // Show custom consent modal first
      setShowLocationConsentModal(true);
    }
  }, [checkLocationPermission, navigate]);

  const handleLocationConsentContinue = useCallback(async () => {
    setShowLocationConsentModal(false);

    // Request native location permission
    const granted = await requestLocationPermission();

    if (granted) {
      // Permission granted, navigate to map screen
      navigate('UserLocation');
    } else {
      // Permission denied, open native location settings
      if (Platform.OS === 'android') {
        Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
      } else {
        Linking.openSettings();
      }
    }
  }, [navigate, requestLocationPermission]);

  const handleLocationConsentClose = useCallback(() => {
    setShowLocationConsentModal(false);
  }, []);

  const onBlockListPress = useCallback(() => {
    navigate('BlockedList');
  }, [navigate]);

  const onPrivacyPress = useCallback(() => {
    navigate('PrivacySettings');
  }, [navigate]);

  const onPrivatePhotoAccessPress = useCallback(() => {
    navigate('PrivatePhotoRequest');
  }, [navigate]);

  const onMembershipPress = useCallback(() => {
    if (!premium) {
      navigate('ProFeaturesPromotion');
    } else {
      navigate('MembershipInfo');
    }
  }, [premium, navigate]);

  const onAddWaliPress = useCallback(() => {
    navigate('AddWali', { fromSettings: true });
  }, [navigate]);

  const onRateAppPress = useCallback(async () => {
    try {
      await requestRateApp();
    } catch (error) {
      console.error('[Settings] Rate app failed:', error);
    }
  }, []);

  const onHelpAndSupportPress = useCallback(() => {
    Linking.openURL('https://purehalf.com/support').catch(() => {
      // noop
    });
  }, []);

  const onNeedHelpPress = useCallback(() => {
    navigate('ContactSupport');
  }, [navigate]);

  const settingsMenuItems = useMemo<SettingsMenuItem[]>(
    () => [
      {
        icon: Images.user,
        name: LanguageKeys.basicSettings,
        onPress: onBasicInfoPress,
      },
      {
        icon: Images.mapIcon,
        name: LanguageKeys.updateLocation,
        onPress: onLocationPress,
      },
      {
        icon: Images.block,
        name: LanguageKeys.blockedListControl,
        onPress: onBlockListPress,
      },
      {
        icon: Images.privacy,
        name: LanguageKeys.privacySettings,
        onPress: onPrivacyPress,
      },
      {
        icon: Images.privatePhotoRequest,
        name: LanguageKeys.privatePhotoBtnDes,
        onPress: onPrivatePhotoAccessPress,
      },
      {
        icon: Images.guardian,
        name: LanguageKeys.addWali,
        onPress: onAddWaliPress,
        showCondition: () => currentUser?.gender !== 'male',
      },
      {
        icon: Images.membership,
        name: LanguageKeys.membershipInformation,
        onPress: onMembershipPress,
      },
      {
        icon: Images.starBlack,
        name: LanguageKeys.rateApp,
        onPress: onRateAppPress,
      },
      {
        icon: Images.questionIcon,
        name: LanguageKeys.helpAndSupport,
        onPress: onHelpAndSupportPress,
      },
      {
        icon: Images.needHelp,
        name: LanguageKeys.needHelp,
        onPress: onNeedHelpPress,
      },
    ],
    [
      onBasicInfoPress,
      onLocationPress,
      onBlockListPress,
      onPrivacyPress,
      onPrivatePhotoAccessPress,
      onAddWaliPress,
      onMembershipPress,
      onRateAppPress,
      onHelpAndSupportPress,
      onNeedHelpPress,
      currentUser?.gender,
    ]
  );

  const visibleMenuItems = useMemo(
    () =>
      settingsMenuItems.filter(
        (item) => !item.showCondition || item.showCondition()
      ),
    [settingsMenuItems]
  );

  return (
    <Container style={Styles.container}>
      <SettingsHeader />
      <ScrollView
        contentContainerStyle={Styles.innerCon}
        showsVerticalScrollIndicator={false}
      >
        {visibleMenuItems.map((item) => (
          <SettingsButton
            key={item.name}
            icon={item.icon}
            name={item.name}
            onPress={item.onPress}
            accessibilityLabel={item.name}
          />
        ))}
      </ScrollView>
      <LocationConsentModal
        visible={showLocationConsentModal}
        onClose={handleLocationConsentClose}
        onContinue={handleLocationConsentContinue}
      />
    </Container>
  );
}

export default memo(Settings);

const Styles = StyleSheet.create({
  container: {
    paddingHorizontal: wp(4),
  },
  innerCon: {
    paddingBottom: hp(1),
    flexGrow: 1,
  },
});
