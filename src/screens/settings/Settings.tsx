import React, { memo, useCallback, useMemo, useState } from 'react';
import { Linking, ScrollView, StyleSheet } from 'react-native';
import Rate from 'react-native-rate';

import {
  Container,
  SettingsButton,
  SettingsHeader,
  SocialLinks,
} from '../../components';
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
  const { navigate } = props.navigation;
  const [showLocationConsentModal, setShowLocationConsentModal] =
    useState<boolean>(false);

  const onBasicInfoPress = useCallback(() => {
    navigate('UserInput', { fromSettings: true });
  }, [navigate]);

  const onLocationPress = useCallback(() => {
    setShowLocationConsentModal(true);
  }, []);

  const handleLocationConsentContinue = useCallback(() => {
    setShowLocationConsentModal(false);
    navigate('UserLocation');
  }, [navigate]);

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
    if (
      currentUser?.membership_status === 0 ||
      currentUser?.membership_status === null
    ) {
      navigate('ProFeaturesPromotion');
    } else {
      navigate('MembershipInfo');
    }
  }, [currentUser?.membership_status, navigate]);

  const onAddWaliPress = useCallback(() => {
    navigate('AddWali', { fromSettings: true });
  }, [navigate]);

  const onRateAppPress = useCallback(() => {
    const options = {
      AppleAppID: '6450672518',
      GooglePackageName: 'com.zojayn',
      preferInApp: false,
      openAppStoreIfInAppFails: true,
    };

    Rate.rate(options, (success, errorMessage) => {
      if (success) {
        // User successfully went to the Review Page
      }
      if (errorMessage) {
        console.log(errorMessage);
      }
    });
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
        <SocialLinks />
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
