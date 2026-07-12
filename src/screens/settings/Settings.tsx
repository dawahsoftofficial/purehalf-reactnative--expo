import React, { memo, useCallback, useMemo, useState } from 'react';
import { PermissionsAndroid } from 'react-native';
import { Linking, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { requestRateApp } from '@/lib/utils/rate-app';
import { usePremiumStore } from '@/stores';

import {
  Container,
  SettingsButton,
  SettingsHeader,
  Text,
} from '../../components';
import LocationConsentModal from '../../components/alerts/LocationConsentModal';
import { hp, Typography, wp } from '../../global';
import { LanguageKeys } from '../../languages';
import { Colors, Fonts } from '../../res';
import { useGlobalContext } from '../../services';

type SettingsProps = {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: object) => void;
  };
};

type SettingsMenuItem = {
  iconName: string;
  name: string;
  onPress: () => void;
  showCondition?: () => boolean;
};

type SettingsSection = {
  title: string;
  data: SettingsMenuItem[];
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

  const settingsSections = useMemo<SettingsSection[]>(
    () => [
      {
        title: LanguageKeys.accountSection,
        data: [
          {
            iconName: 'person-outline',
            name: LanguageKeys.basicSettings,
            onPress: onBasicInfoPress,
          },
          {
            iconName: 'location-outline',
            name: LanguageKeys.updateLocation,
            onPress: onLocationPress,
          },
          {
            iconName: 'diamond-outline',
            name: LanguageKeys.membershipInformation,
            onPress: onMembershipPress,
          },
        ],
      },
      {
        title: LanguageKeys.privacySafetySection,
        data: [
          {
            iconName: 'lock-closed-outline',
            name: LanguageKeys.privacySettings,
            onPress: onPrivacyPress,
          },
          {
            iconName: 'images-outline',
            name: LanguageKeys.privatePhotoBtnDes,
            onPress: onPrivatePhotoAccessPress,
          },
          {
            iconName: 'ban-outline',
            name: LanguageKeys.blockedListControl,
            onPress: onBlockListPress,
          },
          // Wali/guardian settings entry hidden for now (comment out only,
          // per explicit direction -- guardian is core functionality, not
          // being removed).
          // {
          //   iconName: 'person-add-outline',
          //   name: LanguageKeys.addWali,
          //   onPress: onAddWaliPress,
          //   showCondition: () => currentUser?.gender !== 'male',
          // },
        ],
      },
      {
        title: LanguageKeys.supportSection,
        data: [
          {
            iconName: 'star-outline',
            name: LanguageKeys.rateApp,
            onPress: onRateAppPress,
          },
          {
            iconName: 'help-circle-outline',
            name: LanguageKeys.helpAndSupport,
            onPress: onHelpAndSupportPress,
          },
          {
            iconName: 'chatbubble-ellipses-outline',
            name: LanguageKeys.needHelp,
            onPress: onNeedHelpPress,
          },
        ],
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

  const visibleSections = useMemo(
    () =>
      settingsSections
        .map((section) => ({
          ...section,
          data: section.data.filter(
            (item) => !item.showCondition || item.showCondition()
          ),
        }))
        .filter((section) => section.data.length > 0),
    [settingsSections]
  );

  return (
    <Container style={Styles.container}>
      <SettingsHeader navigation={props.navigation} />
      <ScrollView
        contentContainerStyle={Styles.innerCon}
        showsVerticalScrollIndicator={false}
      >
        {visibleSections.map((section) => (
          <View key={section.title} style={Styles.section}>
            <Text style={Styles.sectionLabel}>{section.title}</Text>
            <View style={Styles.groupCard}>
              {section.data.map((item, index) => (
                <SettingsButton
                  key={item.name}
                  iconName={item.iconName}
                  name={item.name}
                  onPress={item.onPress}
                  accessibilityLabel={item.name}
                  showDivider={index < section.data.length - 1}
                />
              ))}
            </View>
          </View>
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
    backgroundColor: Colors.appBg,
  },
  innerCon: {
    paddingBottom: hp(3),
    flexGrow: 1,
  },
  section: {
    marginTop: hp(2.4),
  },
  sectionLabel: {
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.tiny1,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.muted,
    marginBottom: hp(1),
    marginLeft: wp(1),
  },
  groupCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.hairline,
    overflow: 'hidden',
  },
});
