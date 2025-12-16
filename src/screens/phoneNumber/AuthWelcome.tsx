import CheckBox from '@react-native-community/checkbox';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  StatusBar,
  StyleSheet,
  Text as DefaultText,
  View,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import Ripple from 'react-native-material-ripple';
import { SafeAreaView } from 'react-native-safe-area-context';
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

const AuthWelcome = (props: any) => {
  const { t } = useTranslation();
  const [checkBox, setCheckbox] = useState(false);
  const Rtl = CheckRtl();
  const { getData, setData, storageKeys } = StorageManager;
  const { language, updateCurrentUser, updateDirection } = useGlobalContext();
  const [loading, setLoading] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [buttonStatus, setButtonStatus] = useState<any>(null);
  const [loader, setLoader] = useState(false);

  const getButtonStatus = () => {
    ApiServices.getButtonsActiveStatus()
      .then((data) => setButtonStatus(data))
      .catch((error) => console.log('error', error));
  };

  useEffect(() => {
    getButtonStatus();
    saveDataLocal();
    getToken();
    if (Rtl) {
      i18next.changeLanguage('en').then(() => {
        updateDirection('ltr', 'en');
      });
    }
  }, []);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardOpen(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardOpen(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const onLanguagePress = () => {
    props.navigation.navigate('Languages');
  };

  const hideLoading = () => setLoader(false);

  const onContinuePress = (type: string) => {
    if (type === 'phone') {
      props.navigation.navigate('PhoneNumber');
    } else if (type === 'google') {
      try {
        console.log('[Google Login] Starting Google authentication...');
        setLoader(true);
        ApiServices.socialAuthenticate('google')
          .then(async (res: any) => {
            console.log('[Google Login] socialAuthenticate success:', {
              hasRes: !!res,
              hasUser: !!res?.user,
              userId: res?.user?.id,
              userEmail: res?.user?.email,
              responseKeys: res ? Object.keys(res) : [],
            });
            try {
              console.log('[Google Login] Fetching current user details...');
              const user = await ApiServices.getCurrentUserDetail();
              console.log('[Google Login] getCurrentUserDetail success:', {
                hasUser: !!user,
                userId: user?.id,
                userEmail: user?.email,
                userKeys: user ? Object.keys(user) : [],
              });
              console.log('[Google Login] Updating current user in context...');
              updateCurrentUser(user);
              console.log('[Google Login] Calling onVerified with user:', {
                userId: user?.id,
                hasLocation: !!(user?.latitude && user?.longitude),
                hasProfile: !!(
                  user?.first_name &&
                  user?.last_name &&
                  user?.gender &&
                  user?.date_of_birth
                ),
              });
              onVerified(user);
              setLoader(false);
              console.log('[Google Login] Google login completed successfully');
            } catch (userError: any) {
              console.error(
                '[Google Login] Error in getCurrentUserDetail or onVerified:',
                {
                  error: userError,
                  message: userError?.message,
                  stack: userError?.stack,
                  response: userError?.response?.data,
                }
              );
              setLoader(false);
            }
          })
          .catch((error: any) => {
            console.error('[Google Login] Error in socialAuthenticate:', {
              error,
              message: error?.message,
              stack: error?.stack,
              response: error?.response?.data,
              status: error?.response?.status,
              code: error?.code,
            });
            hideLoading();
          });
      } catch (error: any) {
        console.error('[Google Login] Error in try block:', {
          error,
          message: error?.message,
          stack: error?.stack,
        });
        setLoader(false);
      }
    } else if (type === 'apple') {
      try {
        console.log('[Apple Login] Starting Apple authentication...');
        setLoader(true);
        ApiServices.socialAppleAuthenticate('apple')
          .then(async (res: any) => {
            console.log('[Apple Login] socialAppleAuthenticate success:', {
              hasRes: !!res,
              hasUser: !!res?.user,
              userId: res?.user?.id,
              userEmail: res?.user?.email,
              responseKeys: res ? Object.keys(res) : [],
            });
            try {
              console.log('[Apple Login] Fetching current user details...');
              const user = await ApiServices.getCurrentUserDetail();
              console.log('[Apple Login] getCurrentUserDetail success:', {
                hasUser: !!user,
                userId: user?.id,
                userEmail: user?.email,
                userKeys: user ? Object.keys(user) : [],
              });
              console.log('[Apple Login] Updating current user in context...');
              updateCurrentUser(user);
              console.log('[Apple Login] Calling onVerified with user:', {
                userId: user?.id,
                hasLocation: !!(user?.latitude && user?.longitude),
                hasProfile: !!(
                  user?.first_name &&
                  user?.last_name &&
                  user?.gender &&
                  user?.date_of_birth
                ),
              });
              onVerified(user);
              setLoader(false);
              console.log('[Apple Login] Apple login completed successfully');
            } catch (userError: any) {
              console.error(
                '[Apple Login] Error in getCurrentUserDetail or onVerified:',
                {
                  error: userError,
                  message: userError?.message,
                  stack: userError?.stack,
                  response: userError?.response?.data,
                }
              );
              setLoader(false);
            }
          })
          .catch((error: any) => {
            console.error('[Apple Login] Error in socialAppleAuthenticate:', {
              error,
              message: error?.message,
              name: error?.name,
              stack: error?.stack,
              response: error?.response?.data,
              status: error?.response?.status,
              code: error?.code,
            });

            // Handle different error types
            if (error?.name === 'AppleSignInCanceled') {
              console.log('[Apple Login] User canceled Apple sign in');
              // Silently handle cancellation - no error message shown
            } else if (error?.name === 'AppleSignInNotSupported') {
              console.error(
                '[Apple Login] Apple Sign In not supported on this device'
              );
              // Error message already shown by flashErrorMessage in Services.tsx
            } else if (error?.name === 'AppleSignInConfigurationError') {
              console.error(
                '[Apple Login] Apple Sign In configuration error - check device settings or Xcode configuration'
              );
              // Error message already shown by flashErrorMessage in Services.tsx
            } else {
              // Other errors - error message already shown by flashErrorMessage in Services.tsx
              console.error(
                '[Apple Login] Apple sign in failed:',
                error?.message
              );
            }

            hideLoading();
          });
      } catch (error: any) {
        console.error('[Apple Login] Error in try block:', {
          error,
          message: error?.message,
          stack: error?.stack,
        });
        setLoader(false);
      }
    }

    const onVerified = async (user: any) => {
      console.log(
        '[Google Login - onVerified] Starting verification process:',
        {
          userId: user?.id,
          userEmail: user?.email,
        }
      );
      try {
        console.log(
          '[Google Login - onVerified] Setting RevenueCat with userId:',
          user?.id
        );
        await setRevenueCat(user?.id);
        console.log('[Google Login - onVerified] RevenueCat set successfully');

        console.log(
          '[Google Login - onVerified] Fetching membership status...'
        );
        ApiServices.getMembershipStatus()
          .then(async (res: any) => {
            console.log(
              '[Google Login - onVerified] getMembershipStatus response:',
              {
                hasRes: !!res,
                membershipExpiry: res?.membership_expiry,
                userMembershipStatus: user?.membership_status,
              }
            );

            if (res || user?.membership_status) {
              user.membership_expiry =
                res?.membership_expiry || user.membership_expiry;
              user.membership_status = 1;
              console.log(
                '[Google Login - onVerified] User has active membership'
              );
            } else {
              user.membership_expiry = null;
              user.membership_status = 0;
              console.log(
                '[Google Login - onVerified] User does not have active membership'
              );
            }

            console.log(
              '[Google Login - onVerified] Fetching updated user data...'
            );
            const userData = await ApiServices.getCurrentUserDetail();
            console.log('[Google Login - onVerified] User data retrieved:', {
              userId: userData?.id,
              hasUserData: !!userData,
            });

            console.log(
              '[Google Login - onVerified] Updating user in context and storage...'
            );
            updateCurrentUser({ ...userData, ...user });
            await setData(storageKeys.USER, { ...userData, ...user });
            console.log(
              '[Google Login - onVerified] User data saved successfully'
            );
          })
          .catch((error: any) => {
            console.error(
              '[Google Login - onVerified] Error in getMembershipStatus:',
              {
                error,
                message: error?.message,
                response: error?.response?.data,
              }
            );
          });

        setLoading(false);

        console.log(
          '[Google Login - onVerified] Determining navigation path...',
          {
            hasLocation: !!(user?.latitude && user?.longitude),
            hasFirstName: !!user?.first_name,
            hasLastName: !!user?.last_name,
            hasGender: !!user?.gender,
            hasDateOfBirth: !!user?.date_of_birth,
            hasMedia: !!user?.media,
            hasPrimaryImage: !!(
              user?.media?.primary_image &&
              user?.media?.primary_image?.length > 0
            ),
            membershipStatus: user?.membership_status,
          }
        );

        if (!user?.latitude || !user?.longitude) {
          console.log(
            '[Google Login - onVerified] Navigating to Location screen (no location)'
          );
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
            console.log(
              '[Google Login - onVerified] Navigating to ProfilePicture screen (no profile picture)'
            );
            props.navigation.navigate('ProfilePicture');
          } else if (
            user?.membership_status === null ||
            user?.membership_status === 0
          ) {
            console.log(
              '[Google Login - onVerified] Navigating to ProFeaturesPromotion screen (no membership)'
            );
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
            console.log(
              '[Google Login - onVerified] Navigating to BottomTab screen (all conditions met)'
            );
            props.navigation.navigate('BottomTab');
          }
        } else if (
          !user?.first_name ||
          !user?.last_name ||
          !user?.gender ||
          !user?.date_of_birth
        ) {
          console.log(
            '[Google Login - onVerified] Navigating to UserInput screen (incomplete profile)'
          );
          props.navigation.navigate('UserInput');
        } else {
          console.log(
            '[Google Login - onVerified] Navigating to BottomTab screen (fallback)'
          );
          props.navigation.navigate('BottomTab');
        }
      } catch (error: any) {
        console.error(
          '[Google Login - onVerified] Error in onVerified function:',
          {
            error,
            message: error?.message,
            stack: error?.stack,
          }
        );
        setLoading(false);
      }
    };
  };

  const saveDataLocal = async () => {
    await setData(storageKeys.PROFILE_DETAIL_LOCAL, Data);
  };

  const getToken = async () => {
    getData(storageKeys.FCM_TOKEN).then(async (res) => {
      if (!res) {
        const isEmulator = await DeviceInfo.isEmulator();
        if (isEmulator && isIOS) {
          await setData(storageKeys.FCM_TOKEN, 'FcmToken');
        } else {
          Firebase.getFcmToken().then(async (res) => {
            if (res) {
              await setData(storageKeys.FCM_TOKEN, res);
            } else {
              await setData(storageKeys.FCM_TOKEN, 'FcmToken');
            }
          });
        }
      }
    });
  };

  const onGuardianPress = () => {
    props?.navigation.navigate('GuardianEmailInput');
  };

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
          colors={[Colors.blackRGBA25, Colors.blackRGBA38]}
        />
      </View>
      <SafeAreaView edges={['top', 'bottom']} style={Styles.container}>
        {/* <View
          style={[
            Styles.headerCon,
            {
              flexDirection: Rtl ? 'row-reverse' : 'row',
            },
          ]}
        >
          <TouchableOpacity
            style={[
              Styles.languageBtnCon,
              { flexDirection: Rtl ? 'row-reverse' : 'row' },
            ]}
            activeOpacity={0.7}
            onPress={onLanguagePress}
          >
            <MaterialCommunityIcons
              name="web"
              color={Colors.color2}
              size={wp(8)}
            />
            <Text style={Styles.languageText}>
              {language === 'en'
                ? LanguageKeys.english
                : LanguageKeys.romanUrdu}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ marginBottom: hp(0.5) }}
            onPress={onGuardianPress}
          >
            <Text style={[Styles.languageText, { marginHorizontal: 0 }]}>
              {LanguageKeys.guardian}
            </Text>
          </TouchableOpacity>
        </View> */}

        <KeyboardAvoidingView
          behavior={'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={isIOS ? 80 : 10}
        >
          {!isKeyboardOpen && (
            <View style={Styles.purehalfLogoCon}>
              <Image
                source={Images.logoWhite}
                resizeMode="contain"
                style={Styles.logo}
              />
              <Text style={Styles.logoDescription}>logoDescription</Text>
            </View>
          )}
          <Animation style={Styles.phoneNumberSectionCon}>
            <Text style={Styles.getStarted}>getStarted</Text>

            {/* <View
              style={{
                ...Styles.phoneNumberCon,
                flexDirection: Rtl ? 'row-reverse' : 'row',
              }}>
              <Ripple
                style={{
                  ...Styles.flagBtnCon,
                  flexDirection: Rtl ? 'row-reverse' : 'row',
                }}
                onPress={onPressFlagBtn}>
                <Text style={Styles.flag}>{selectedCountry.flag}</Text>
                <Text style={Styles.countryPickerTxt}>
                  {selectedCountry.dial_code}
                </Text>
                <AntDesign
                  name="caretdown"
                  size={wp(3)}
                  color={Colors.color2}
                />
              </Ripple>
              <TextInput
                style={{
                  ...Styles.phoneNumberInput,
                  textAlign: Rtl ? 'right' : 'left',
                }}
                keyboardType="number-pad"
                value={phoneNumber}
                onChangeText={onChangePhoneNumber}
              />
            </View> */}
            {/* <View style={Styles.radioBtnCon}>
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
                    onPress={() => Linking.openURL("https://purehalf.com/terms-conditions/")}
                    style={{ paddingTop: 5 }}
                  >
                    <DefaultText style={Styles.underline}>{t('termsAndConditions')}</DefaultText>
                  </Ripple>
                  <DefaultText style={Styles.termsAndConditionText}>
                    {t('and')}
                  </DefaultText>
                </View>
                <Ripple
                  onPress={() => Linking.openURL("https://purehalf.com/privacy-policy/")}
                >
                  <DefaultText style={[Styles.underline, { marginLeft: 7 }]}>
                    {t('privacyPolicy')}</DefaultText>
                </Ripple>
              </View>
            </View> */}
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

            {/* <Button
              text="Test Input Screen"
              onPress={() => props.navigation.navigate('SignupStepInput')}
              buttonStyle={Styles.testButton}
              icon={
                <MaterialCommunityIcons
                  name={'text-box'}
                  size={wp(5)}
                  color={Colors.color2}
                />
              }
            />

            <Button
              text="Test Radio Screen"
              onPress={() => props.navigation.navigate('SignupStepRadio')}
              buttonStyle={Styles.testButton}
              icon={
                <MaterialCommunityIcons
                  name={'radiobox-marked'}
                  size={wp(5)}
                  color={Colors.color2}
                />
              }
            /> */}

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
        </KeyboardAvoidingView>
        {/* <ModalLoader visible={loader} /> */}
      </SafeAreaView>
    </SlideShowContainer>
  );
};

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
    position: 'absolute',
    height: hp(100),
    width: wp(100),
    // paddingVertical: hasNotch() && isIOS ? 20 : 0,
    zIndex: 1,
  },
  headerCon: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingTop: isIOS ? 0 : hp(5),
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
    marginTop: hp(15),
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
    lineHeight: wp(6),
    includeFontPadding: false,
    marginTop: hp(1),
  },
  phoneNumberSectionCon: {
    position: 'absolute',
    bottom: 0,
    width: wp(100),
    zIndex: 1,
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
    // marginBottom: hp(2),
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
  testButton: {
    backgroundColor: Colors.theme,
    marginTop: hp(2),
  },
  // phoneNumberCon: {
  //   flexDirection: 'row',
  //   borderBottomWidth: 1,
  //   borderColor: Colors.color2,
  //   height: wp(11),
  //   alignItems: 'center',
  //   marginVertical: hp(3),
  // },
  // flagBtnCon: {
  //   height: wp(11),
  //   minWidth: wp(18),
  //   flexDirection: 'row',
  //   justifyContent: 'space-between',
  //   alignItems: 'center',
  // },
  // flag: {
  //   fontSize: wp(8),
  //   includeFontPadding: false,
  //   alignSelf: 'center',
  //   paddingBottom: wp(!isIOS ? hp(0.2) : hp(0))
  // },
  // countryPickerTxt: {
  //   fontSize: Typography.medium,
  //   marginHorizontal: wp(0.5),
  //   paddingBottom: wp(!isIOS ? hp(0.2) : hp(0)),
  //   paddingRight: wp(!isIOS ? hp(0.2) : hp(0)),
  //   includeFontPadding: false,
  //   fontFamily: Fonts.APPFONT_R,
  //   color: Colors.color2,
  //   alignSelf: 'center',
  // },
  // phoneNumberInput: {
  //   color: Colors.color2,
  //   height: wp(11),
  //   width: wp(70),
  //   // marginTop: hp(0.6),
  //   paddingVertical: hp(1),
  //   fontSize: Typography.medium,
  //   fontFamily: Fonts.APPFONT_R,
  //   paddingHorizontal: wp(2),
  // },
  // radioBtnCon: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   marginTop: hp(2),
  //   alignSelf: 'flex-start',
  //   marginBottom: hp(2),
  // },
  // termsAndConditionText: {
  //   color: Colors.color2,
  //   fontFamily: Fonts.APPFONT_R,
  //   includeFontPadding: false,
  //   fontSize: Typography.small1,
  //   alignSelf: 'center',
  //   marginLeft: wp(1),
  // },
  // underline: {
  //   textDecorationLine: 'underline',
  //   color: Colors.color2,
  //   fontFamily: Fonts.APPFONT_R,
  //   fontSize: Typography.small1,
  // },
});
