import React, { useCallback, useMemo } from 'react';
import { Linking, ScrollView, StyleSheet } from 'react-native';
import Rate from 'react-native-rate';

import {
  Container,
  SettingsButton,
  SettingsHeader,
  SocialLinks,
} from '../../components';
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

  const onBasicInfoPress = useCallback(() => {
    props.navigation.navigate('UserInput', { fromSettings: true });
  }, [props.navigation]);

  const onLocationPress = useCallback(() => {
    props.navigation.navigate('UserLocation');
  }, [props.navigation]);

  const onBlockListPress = useCallback(() => {
    props.navigation.navigate('BlockedList');
  }, [props.navigation]);

  const onPrivacyPress = useCallback(() => {
    props.navigation.navigate('PrivacySettings');
  }, [props.navigation]);

  const onPrivatePhotoAccessPress = useCallback(() => {
    props.navigation.navigate('PrivatePhotoRequest');
  }, [props.navigation]);

  const onMembershipPress = useCallback(() => {
    if (
      currentUser?.membership_status === 0 ||
      currentUser?.membership_status === null
    ) {
      props.navigation.navigate('ProFeaturesPromotion');
    } else {
      props.navigation.navigate('MembershipInfo');
    }
  }, [currentUser?.membership_status, props.navigation]);

  const onAddWaliPress = useCallback(() => {
    props.navigation.navigate('AddWali', { fromSettings: true });
  }, [props.navigation]);

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
    Linking.openURL('https://purehalf.com/support');
  }, []);

  const onNeedHelpPress = useCallback(() => {
    props.navigation.navigate('ContactSupport');
  }, [props.navigation]);

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

  return (
    <Container style={Styles.container} barStyle="light-content">
      <SettingsHeader />
      <ScrollView
        contentContainerStyle={Styles.innerCon}
        showsVerticalScrollIndicator={false}
      >
        {settingsMenuItems.map((item, index) => {
          if (item.showCondition && !item.showCondition()) {
            return null;
          }
          return (
            <SettingsButton
              key={index}
              icon={item.icon}
              name={item.name}
              onPress={item.onPress}
            />
          );
        })}
        <SocialLinks />
      </ScrollView>
    </Container>
  );
}

export default Settings;

const Styles = StyleSheet.create({
  container: {
    paddingHorizontal: wp(4),
  },
  innerCon: {
    paddingBottom: hp(1),
    flex: 1,
  },
});
