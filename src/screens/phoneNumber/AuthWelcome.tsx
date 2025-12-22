import CheckBox from '@react-native-community/checkbox';
import i18next from 'i18next';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Image,
  Linking,
  StatusBar,
  StyleSheet,
  Text as DefaultText,
  View,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import Ripple from 'react-native-material-ripple';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { Animation } from '../../animations';
import { LinearGradient, SlideShowContainer, Text } from '../../components';
import { Button } from '../../components';
import { hp, Typography, wp } from '../../global';
import { CheckRtl, LanguageKeys } from '../../languages';
import { Colors, Fonts, Images } from '../../res';
import { Firebase, isIOS, setRevenueCat } from '../../services';
import { StorageManager, useGlobalContext } from '../../services';
import { ApiServices } from '../../services/api';
import Data from '../profile/Data';

type AuthWelcomeProps = {
  navigation: any;
};

function AuthWelcome(props: AuthWelcomeProps) {
  const { bottom } = useSafeAreaInsets();
  const { t } = useTranslation();
  const [checkBox, setCheckbox] = useState(false);
  const Rtl = CheckRtl();
  const { getData, setData, storageKeys } = StorageManager;
  const { updateCurrentUser, updateDirection } = useGlobalContext();
  const [loading, setLoading] = useState(false);
  const [buttonStatus, setButtonStatus] = useState<any>(null);

  const getButtonStatus = useCallback(() => {
    ApiServices.getButtonsActiveStatus()
      .then((data: any) => {
        const results = data?.results || [];
        const authenticationMethod = results.find(
          (item: any) => item?.key === 'authentication_method'
        );
        if (authenticationMethod?.value) {
          setButtonStatus(authenticationMethod.value);
        } else {
          setButtonStatus({});
        }
      })
      .catch(() => {});
  }, []);

  const saveDataLocal = useCallback(async () => {
    await setData(storageKeys.PROFILE_DETAIL_LOCAL, Data);
  }, [setData, storageKeys.PROFILE_DETAIL_LOCAL]);

  const getToken = useCallback(async () => {
    getData(storageKeys.FCM_TOKEN).then(async (res) => {
      if (!res) {
        const isEmulator = await DeviceInfo.isEmulator();
        if (isEmulator && isIOS) {
          await setData(storageKeys.FCM_TOKEN, 'FcmToken');
        } else {
          Firebase.getFcmToken().then(async (token) => {
            await setData(storageKeys.FCM_TOKEN, token || 'FcmToken');
          });
        }
      }
    });
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

  const onVerified = useCallback(
    async (user: any) => {
      try {
        await setRevenueCat(user?.id);

        ApiServices.getMembershipStatus()
          .then(async (res: any) => {
            if (res || user?.membership_status) {
              user.membership_expiry =
                res?.membership_expiry || user.membership_expiry;
              user.membership_status = 1;
            } else {
              user.membership_expiry = null;
              user.membership_status = 0;
            }

            const userData: any = await ApiServices.getCurrentUserDetail();
            updateCurrentUser({ ...userData, ...user });
            await setData(storageKeys.USER, { ...userData, ...user });
          })
          .catch(() => {});

        setLoading(false);

        if (!user?.latitude || !user?.longitude) {
          props.navigation.navigate('Location');
        } else if (
          user?.first_name &&
          user?.last_name &&
          user?.gender &&
          user?.date_of_birth
        ) {
          if (
            !user?.media ||
            !user?.media?.primary_image ||
            user?.media?.primary_image?.length === 0
          ) {
            props.navigation.navigate('ProfilePicture');
          } else if (
            user?.membership_status === null ||
            user?.membership_status === 0
          ) {
            props.navigation.reset({
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
          } else {
            props.navigation.navigate('BottomTab');
          }
        } else {
          props.navigation.navigate('UserInput');
        }
      } catch {
        setLoading(false);
      }
    },
    [props.navigation, setData, storageKeys.USER, updateCurrentUser]
  );

  const handleSocialAuth = useCallback(
    async (type: 'google' | 'apple') => {
      try {
        setLoading(true);
        const authMethod =
          type === 'google'
            ? ApiServices.socialAuthenticate('google')
            : ApiServices.socialAppleAuthenticate('apple');

        authMethod
          .then(async () => {
            try {
              const user: any = await ApiServices.getCurrentUserDetail();
              updateCurrentUser(user);
              onVerified(user);
              setLoading(false);
            } catch {
              setLoading(false);
            }
          })
          .catch((error: any) => {
            if (
              error?.name === 'AppleSignInCanceled' ||
              error?.name === 'AppleSignInNotSupported' ||
              error?.name === 'AppleSignInConfigurationError'
            ) {
              // Silently handle cancellation and configuration errors
            }
            hideLoading();
          });
      } catch {
        setLoading(false);
      }
    },
    [hideLoading, onVerified, updateCurrentUser]
  );

  const onContinuePress = useCallback(
    (type: string) => {
      if (type === 'phone') {
        props.navigation.navigate('PhoneNumber');
      } else if (type === 'google' || type === 'apple') {
        handleSocialAuth(type as 'google' | 'apple');
      }
    },
    [handleSocialAuth, props.navigation]
  );

  return (
    <SlideShowContainer disabled>
      <StatusBar
        translucent
        backgroundColor={'transparent'}
        barStyle="light-content"
      />
      <View>
        <Image source={Images.slide1} resizeMode="cover" style={Styles.image} />
        <LinearGradient
          style={Styles.imageOuterView}
          colors={[Colors.blackRGBA70, Colors.blackRGBA38]}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
        />
      </View>
      <View style={Styles.container}>
        <View style={Styles.purehalfLogoCon}>
          <Image
            source={Images.logoWhite}
            resizeMode="contain"
            style={Styles.logo}
          />
          <Text style={Styles.logoDescription}>logoDescription</Text>
        </View>

        <Animation
          style={[Styles.phoneNumberSectionCon, { paddingBottom: bottom }]}
        >
          <Text style={Styles.getStarted}>getStarted</Text>

          {isIOS && buttonStatus?.is_apple === 1 && (
            <Button
              text={LanguageKeys.startWithWithApple}
              onPress={() => onContinuePress('apple')}
              loading={loading}
              disabled={!checkBox}
              buttonStyle={[Styles.appleBtn, !checkBox && { opacity: 0.7 }]}
              icon={
                <MaterialCommunityIcons
                  name={'apple'}
                  size={wp(5)}
                  color={Colors.color2}
                />
              }
            />
          )}
          {buttonStatus?.is_phone === 1 && (
            <Button
              text={LanguageKeys.startWithWithPhone}
              onPress={() => onContinuePress('phone')}
              loading={loading}
              disabled={!checkBox}
              buttonStyle={{ marginTop: hp(2) }}
              icon={
                <MaterialCommunityIcons
                  name={'cellphone'}
                  size={wp(5)}
                  color={Colors.color2}
                />
              }
            />
          )}
          {buttonStatus?.is_google === 1 && (
            <Button
              text={LanguageKeys.startWithWithGoogle}
              onPress={() => onContinuePress('google')}
              loading={loading}
              disabled={!checkBox}
              buttonStyle={[Styles.googleBtn, !checkBox && { opacity: 0.7 }]}
              icon={
                <MaterialCommunityIcons
                  name={'google'}
                  size={wp(5)}
                  color={Colors.color2}
                />
              }
            />
          )}

          <View style={Styles.radioBtnCon}>
            <CheckBox
              disabled={false}
              value={checkBox}
              onValueChange={(newValue) => setCheckbox(newValue)}
              tintColors={{ true: Colors.color57, false: Colors.color2 }}
            />
            <View>
              <View style={{ flexDirection: 'row', marginLeft: 3 }}>
                <DefaultText style={Styles.termsAndConditionText}>
                  {t('acceptTermsAndConditions')}{' '}
                </DefaultText>
                <Ripple
                  onPress={() =>
                    Linking.openURL('https://purehalf.com/terms-conditions/')
                  }
                  style={{ paddingTop: isIOS ? 0 : 5 }}
                >
                  <DefaultText style={Styles.underline}>
                    {t('termsAndConditions')}
                  </DefaultText>
                </Ripple>
                <DefaultText style={Styles.termsAndConditionText}>
                  {t('and')}
                </DefaultText>
              </View>
              <Ripple
                onPress={() =>
                  Linking.openURL('https://purehalf.com/privacy-policy/')
                }
              >
                <DefaultText style={[Styles.underline, { marginLeft: 7 }]}>
                  {t('privacyPolicy')}
                </DefaultText>
              </Ripple>
            </View>
          </View>
        </Animation>
      </View>
    </SlideShowContainer>
  );
}

export default AuthWelcome;

const Styles = StyleSheet.create({
  imageOuterView: {
    height: '100%',
    width: wp(100),
    position: 'absolute',
    zIndex: 1,
  },
  image: {
    width: wp(100),
    height: '100%',
  },
  container: {
    zIndex: 1,
    width: wp(100),
    height: hp(100),
    position: 'absolute',
    justifyContent: 'center',
  },

  languageBtnCon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageText: {
    color: Colors.color2,
    alignSelf: 'center',
    marginHorizontal: wp(2),
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small3,
    includeFontPadding: false,
  },
  purehalfLogoCon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: wp(40),
    height: hp(16),
  },
  logoDescription: {
    color: Colors.color2,
    fontSize: Typography.small2,
    fontFamily: Fonts.APPFONT_R,
    alignSelf: 'center',
    textAlign: 'center',
    includeFontPadding: false,
    marginTop: hp(1),
  },
  phoneNumberSectionCon: {
    bottom: 0,
    zIndex: 1,
    width: wp(100),
    position: 'absolute',
    paddingHorizontal: wp(4),
  },
  getStarted: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_SB,
    includeFontPadding: false,
    fontSize: Typography.medium2,
  },
  googleBtn: {
    backgroundColor: Colors.color60,
    marginTop: hp(2),
  },
  radioBtnCon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(2),
    alignSelf: 'flex-start',
  },
  termsAndConditionText: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_R,
    includeFontPadding: false,
    fontSize: Typography.small1,
    alignSelf: 'center',
    marginLeft: wp(1),
  },
  underline: {
    textDecorationLine: 'underline',
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small1,
  },
  appleBtn: {
    backgroundColor: Colors.color1,
    marginTop: hp(2),
  },
});
