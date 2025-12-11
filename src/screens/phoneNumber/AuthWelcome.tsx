import {
  Image,
  Text as DefaultText,
  View,
  TouchableOpacity,
  Keyboard,
  KeyboardAvoidingView,
  StatusBar,
  Linking,
  SafeAreaView,
  StyleSheet
} from 'react-native';
import React, { useEffect, useState } from 'react';
import Ripple from 'react-native-material-ripple';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DeviceInfo, { hasNotch } from 'react-native-device-info';

import {
  LinearGradient,
  ModalLoader,
  SlideShowContainer,
  Text
} from '../../components';
import { LanguageKeys, CheckRtl } from '../../languages';
import { Button } from '../../components';
import { Animation } from '../../animations';
import { hp, wp, Typography } from '../../global';
import { Colors, Fonts, Images } from '../../res';
import { ApiServices } from '../../services/api';
import { Firebase, isIOS, setRevenueCat } from '../../services';
import { useGlobalContext, StorageManager } from '../../services';
import Data from '../profile/Data';
import CheckBox from '@react-native-community/checkbox';


const AuthWelcome = (props: any) => {
  const { t } = useTranslation()
  const [checkBox, setCheckbox] = useState(false);
  const Rtl = CheckRtl();
  const { getData, setData, storageKeys } = StorageManager;
  const { language, updateCurrentUser, updateDirection } = useGlobalContext();
  const [loading, setLoading] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [buttonStatus, setButtonStatus] = useState(null);
  const [loader, setLoader] = useState(false);


  const getButtonStatus = () => {
    ApiServices.getButtonsActiveStatus()
      .then((data) => setButtonStatus(data))
      .catch(error => console.log("error", error))
  }

  useEffect(() => {
    getButtonStatus()
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
      props.navigation.navigate('PhoneNumber')
    } else if (type === 'google') {
      try {
        setLoader(true)
        ApiServices.socialAuthenticate('google')
          .then(async (res: any) => {
            const user = await ApiServices.getCurrentUserDetail()
            updateCurrentUser(user);
            onVerified(user)
            setLoader(false);
          })
          .catch(hideLoading);
      } catch (error) {
        console.log({ error });
      }
    } else if (type === 'apple') {
      try {
        setLoader(true)
        ApiServices.socialAppleAuthenticate('apple')
          .then(async (res: any) => {
            const user = await ApiServices.getCurrentUserDetail()
            updateCurrentUser(user);
            onVerified(user)
            setLoader(false);
          })
          .catch(hideLoading);
      } catch (error) {
        console.log("error", error)
        setLoader(false);
      }
    }


    const onVerified = async (user: any) => {
      await setRevenueCat(user?.id)
      ApiServices.getMembershipStatus().then(async (res: any) => {
        if (res || user?.membership_status) {
          user.membership_expiry = res?.membership_expiry || user.membership_expiry
          user.membership_status = 1
        }
        else {
          user.membership_expiry = null
          user.membership_status = 0
        }
        const userData = await ApiServices.getCurrentUserDetail()
        updateCurrentUser({ ...userData, ...user })
        await setData(storageKeys.USER, { ...userData, ...user })
      })

      setLoading(false)

      if (!user?.latitude || !user?.longitude) {
        props.navigation.navigate('Location')
      }
      else if (user?.first_name && user?.last_name && user?.gender && user?.date_of_birth) {
        if (
          !user?.media || !user?.media?.primary_image ||
          user?.media?.primary_image?.length === 0
        ) {
          props.navigation.navigate('ProfilePicture')
        }
        else if (user?.membership_status === null || user?.membership_status === 0) {
          props.navigation.reset({
            index: 0,
            routes: [{
              name: 'ProFeaturesPromotion',
              params: {
                navigateTo: 'BottomTab',
                from: 'SignUp'
              }
            }],
          });
        }
        else {
          props.navigation.navigate('BottomTab')
        }
      } else if (!user?.first_name || !user?.last_name || !user?.gender || !user?.date_of_birth) {
        props.navigation.navigate('UserInput')
      } else {
        props.navigation.navigate('BottomTab')
      }
    }
  };

  const saveDataLocal = async () => {
    await setData(storageKeys.PROFILE_DETAIL_LOCAL, Data);
  };

  const getToken = async () => {
    getData(storageKeys.FCM_TOKEN).then(async res => {
      if (!res) {
        const isEmulator = await DeviceInfo.isEmulator();
        if (isEmulator && isIOS) {
          await setData(storageKeys.FCM_TOKEN, 'FcmToken');
        } else {
          Firebase.getFcmToken().then(async res => {
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
      <SafeAreaView style={Styles.container}>
        <View
          style={[
            Styles.headerCon,
            {
              flexDirection: Rtl ? 'row-reverse' : 'row',
            },
          ]}>
          <TouchableOpacity
            style={[
              Styles.languageBtnCon,
              { flexDirection: Rtl ? 'row-reverse' : 'row' },
            ]}
            activeOpacity={0.7}
            onPress={onLanguagePress}>
            <MaterialCommunityIcons
              name="web"
              color={Colors.color2}
              size={wp(8)}
            />
            <Text style={Styles.languageText}>{language === "en" ? LanguageKeys.english : LanguageKeys.romanUrdu}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ marginBottom: hp(0.5) }}
            onPress={onGuardianPress}>
            <Text style={[Styles.languageText, { marginHorizontal: 0 }]}>
              {LanguageKeys.guardian}
            </Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView behavior={'height'} style={{ flex: 1 }} keyboardVerticalOffset={isIOS ? 80 : 10}>
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
                    onPress={() => Linking.openURL("https://purehalf.com/terms-conditions/")}
                    style={{ paddingTop: isIOS ? 0 : 5 }}
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
            </View>

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
            {
              isIOS && buttonStatus?.is_apple_active === 1 &&
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
            }
            {
              buttonStatus?.is_phone_active === 1 &&
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
            }
            {
              buttonStatus?.is_google_active === 1 &&
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
            }
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
    paddingVertical: hasNotch() && isIOS ? 20 : 0,
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
    alignSelf: 'flex-start'
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
  }
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
