import i18next from 'i18next';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import Ripple from 'react-native-material-ripple';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { Animation } from '../../animations';
import {
  CountryPicker,
  LinearGradient,
  SlideShowContainer,
  Text,
} from '../../components';
import { Button } from '../../components';
import { hp, Typography, wp } from '../../global';
import { CheckRtl, LanguageKeys } from '../../languages';
import { Colors, Fonts, Images } from '../../res';
import {
  checkEmpty,
  Firebase,
  flashErrorMessage,
  isIOS,
  setRevenueCat,
} from '../../services';
import { StorageManager, useGlobalContext } from '../../services';
import { ApiServices } from '../../services/api';
import Data from '../profile/Data';

type PhoneNumberProps = {
  navigation: any;
};

type Country = {
  code: string;
  dial_code: string;
  flag: string;
  name: string;
};

function PhoneNumber(props: PhoneNumberProps) {
  const { top, bottom } = useSafeAreaInsets();
  const Rtl = CheckRtl();
  const { getData, setData, storageKeys } = StorageManager;
  const { updateCurrentUser, updateDirection } = useGlobalContext();
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(__DEV__ ? '3048700192' : '');
  const [selectedCountry, setSelectedCountry] = useState<Country>({
    code: 'PK',
    dial_code: '+92',
    flag: '🇵🇰',
    name: 'Pakistan',
  });
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  const onPressFlagBtn = useCallback(() => {
    setCountryPickerVisible(true);
  }, []);

  const closeCountryPicker = useCallback(() => {
    setCountryPickerVisible(false);
  }, []);

  const onSelectCountry = useCallback((item: Country) => {
    setSelectedCountry(item);
    setCountryPickerVisible(false);
  }, []);

  const onChangePhoneNumber = useCallback((text: string) => {
    setPhoneNumber(text);
  }, []);

  const onLanguagePress = useCallback(() => {
    props.navigation.navigate('Languages');
  }, [props.navigation]);

  const navigateTo = useCallback(
    (route: string) => {
      props.navigation.reset({
        index: 0,
        routes: [{ name: route }],
      });
    },
    [props.navigation]
  );

  const onLoggedIn = useCallback(
    async (currentUser: any) => {
      await setRevenueCat(currentUser?.id);
      const user = await ApiServices.getCurrentUserDetail();
      const obj = {
        ...(currentUser as Record<string, unknown>),
        ...(user as Record<string, unknown>),
      };
      updateCurrentUser(obj);
      if (currentUser?.results?.first_name) {
        if (
          !currentUser?.results?.media ||
          !currentUser?.results?.media?.primary_image ||
          currentUser?.results?.media?.primary_image?.length === 0
        ) {
          navigateTo('ProfilePicture');
        } else if (
          currentUser?.results?.membership_status === null ||
          currentUser?.results?.membership_status === 0
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
          navigateTo('BottomTab');
        }
      } else {
        navigateTo('Location');
      }
    },
    [navigateTo, props.navigation, updateCurrentUser]
  );

  const hideLoading = useCallback(() => setLoading(false), []);

  const validatePhoneNumber = useCallback(() => {
    if (
      selectedCountry.dial_code === '+92' &&
      (phoneNumber.length < 10 || phoneNumber.length > 12)
    ) {
      return false;
    }
    if (selectedCountry.dial_code !== '+92' && phoneNumber.length < 6) {
      return false;
    }
    return true;
  }, [selectedCountry.dial_code, phoneNumber.length]);

  const onContinuePress = useCallback(() => {
    if (!validatePhoneNumber()) {
      return flashErrorMessage(LanguageKeys.invalidPhoneNumber);
    }

    setLoading(true);
    const phoneNumberWithCode =
      selectedCountry.dial_code +
      (phoneNumber[0] === '0' ? phoneNumber.slice(1) : phoneNumber);

    ApiServices.authenticateUser(
      phoneNumberWithCode,
      (currentUser: any) => onLoggedIn(currentUser),
      false
    )
      .then((res: any) => {
        const { user, verificationRes } = res;
        updateCurrentUser(user);
        setLoading(false);
        props.navigation.navigate('Otp', {
          phoneNumber: phoneNumberWithCode,
          phoneNumberFirebaseRes: verificationRes,
        });
      })
      .catch(hideLoading);
  }, [
    validatePhoneNumber,
    selectedCountry.dial_code,
    phoneNumber,
    onLoggedIn,
    hideLoading,
    props.navigation,
    updateCurrentUser,
  ]);

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
    saveDataLocal();
    getToken();
    if (Rtl) {
      i18next.changeLanguage('en').then(() => {
        updateDirection('ltr', 'en');
      });
    }
  }, [Rtl, saveDataLocal, getToken, updateDirection]);

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

  const handleGoBack = useCallback(() => {
    props?.navigation.goBack();
  }, [props.navigation]);

  const headerStyle = useMemo(
    () => ({
      top: top,
      left: Rtl ? 0 : wp(4),
      right: Rtl ? wp(4) : 0,
      flexDirection: (Rtl ? 'row-reverse' : 'row') as 'row' | 'row-reverse',
    }),
    [top, Rtl]
  );

  const keyboardAvoidingStyle = useMemo(
    () => ({
      flex: 1,
      justifyContent: 'center' as const,
      paddingBottom: bottom,
    }),
    [bottom]
  );

  const isButtonDisabled = useMemo(
    () => checkEmpty(phoneNumber) || loading,
    [phoneNumber, loading]
  );

  return (
    <SlideShowContainer disabled>
      <StatusBar
        translucent
        backgroundColor={'transparent'}
        barStyle="light-content"
      />
      <ImageBackground
        resizeMode="cover"
        style={Styles.image}
        source={Images.slide1}
      />
      <LinearGradient
        style={Styles.imageOuterView}
        colors={[Colors.blackRGBA70, Colors.blackRGBA38]}
        start={{ x: 0, y: 1 }}
        end={{ x: 0, y: 0 }}
      />
      <SafeAreaView edges={['top', 'bottom']} style={Styles.container}>
        <View style={[Styles.headerCon, headerStyle]}>
          <TouchableOpacity
            style={[
              Styles.languageBtnCon,
              { flexDirection: Rtl ? 'row-reverse' : 'row' },
            ]}
            activeOpacity={0.7}
            onPress={onLanguagePress}
          >
            <TouchableOpacity onPress={handleGoBack} activeOpacity={1}>
              <AntDesign
                name={Rtl ? 'arrowright' : 'arrowleft'}
                color={Colors.color2}
                size={wp(6)}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior="height"
          style={keyboardAvoidingStyle}
          keyboardVerticalOffset={isIOS ? 80 : 10}
        >
          {!isKeyboardOpen && (
            <View style={Styles.purehalfLogoCon}>
              <Image
                source={Images.logoWhite}
                resizeMode="contain"
                style={Styles.logo}
              />
              <Text style={Styles.logoDescription}>
                {LanguageKeys.logoDescription}
              </Text>
            </View>
          )}
          <Animation style={Styles.phoneNumberSectionCon}>
            <Text style={Styles.getStarted}>getStarted</Text>
            <View
              style={{
                ...Styles.phoneNumberCon,
                flexDirection: Rtl ? 'row-reverse' : 'row',
              }}
            >
              <Ripple
                style={{
                  ...Styles.flagBtnCon,
                  flexDirection: Rtl ? 'row-reverse' : 'row',
                }}
                onPress={onPressFlagBtn}
              >
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
            </View>
            <Button
              text={LanguageKeys.continue}
              onPress={onContinuePress}
              loading={loading}
              loadingMessage="Submitting..."
              disabled={isButtonDisabled}
              icon={
                <MaterialCommunityIcons
                  name="logout-variant"
                  size={wp(5)}
                  color={Colors.color2}
                />
              }
            />
          </Animation>
        </KeyboardAvoidingView>

        <CountryPicker
          visible={countryPickerVisible}
          onClose={closeCountryPicker}
          onPress={onSelectCountry}
        />
      </SafeAreaView>
    </SlideShowContainer>
  );
}

export default PhoneNumber;

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
  headerCon: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    position: 'absolute',
    justifyContent: 'space-between',
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
  phoneNumberCon: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: Colors.color2,
    height: wp(11),
    alignItems: 'center',
    marginVertical: hp(3),
  },
  flagBtnCon: {
    height: wp(11),
    minWidth: wp(18),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flag: {
    fontSize: wp(8),
    includeFontPadding: false,
    alignSelf: 'center',
    paddingBottom: wp(!isIOS ? hp(0.2) : hp(0)),
  },
  countryPickerTxt: {
    fontSize: Typography.medium,
    marginHorizontal: wp(0.5),
    paddingBottom: wp(!isIOS ? hp(0.2) : hp(0)),
    paddingRight: wp(!isIOS ? hp(0.2) : hp(0)),
    includeFontPadding: false,
    fontFamily: Fonts.APPFONT_R,
    color: Colors.color2,
    alignSelf: 'center',
  },
  phoneNumberInput: {
    color: Colors.color2,
    height: wp(11),
    width: wp(70),
    paddingVertical: hp(1),
    fontSize: Typography.medium,
    fontFamily: Fonts.APPFONT_R,
    paddingHorizontal: wp(2),
  },
});
