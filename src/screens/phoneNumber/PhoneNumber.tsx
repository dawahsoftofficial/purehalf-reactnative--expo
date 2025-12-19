import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
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
import DeviceInfo, { hasNotch } from 'react-native-device-info';
import Ripple from 'react-native-material-ripple';
import { SafeAreaView } from 'react-native-safe-area-context';
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

const PhoneNumber = (props: any) => {
  const Rtl = CheckRtl();
  const { getData, setData, storageKeys } = StorageManager;
  const { updateCurrentUser, updateDirection } = useGlobalContext();
  const [loading, setLoading] = useState(false);
  const [loadingMessage] = useState('Submitting...');
  const [phoneNumber, setPhoneNumber] = useState(__DEV__ ? '3048700192' : '');
  const [selectedCountry, setSelectedCountry] = useState({
    code: 'PK',
    dial_code: '+92',
    flag: '🇵🇰',
    name: 'Pakistan',
  });
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  const onPressFlagBtn = () => setCountryPickerVisible(true);
  const closeCountryPicker = () => setCountryPickerVisible(false);

  const onSelectCountry = (item: any) => {
    setSelectedCountry(item);
    setCountryPickerVisible(false);
  };
  const onChangePhoneNumber = (text: any) => {
    setPhoneNumber(text);
  };

  const onLanguagePress = () => {
    props.navigation.navigate('Languages');
  };
  const navigateTo = (route: any) => {
    props.navigation.reset({
      index: 0,
      routes: [{ name: route }],
    });
  };

  const onLoggedIn = async (currentUser: any) => {
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
  };

  const hideLoading = () => setLoading(false);
  const onContinuePress = () => {
    if (
      selectedCountry.dial_code === '+92' &&
      (phoneNumber.length < 10 || phoneNumber.length > 12)
    ) {
      return flashErrorMessage(LanguageKeys.invalidPhoneNumber);
    } else if (selectedCountry.dial_code !== '+92' && phoneNumber.length < 6) {
      return flashErrorMessage(LanguageKeys.invalidPhoneNumber);
    } else {
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
    }
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

  useEffect(() => {
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
        colors={[Colors.blackRGBA25, Colors.blackRGBA38]}
      />
      <SafeAreaView style={Styles.container}>
        <View
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
            <TouchableOpacity
              onPress={() => props?.navigation.goBack()}
              activeOpacity={1}
            >
              <AntDesign
                name={Rtl ? 'arrowright' : 'arrowleft'}
                color={Colors.color2}
                size={wp(6)}
              />
            </TouchableOpacity>
            {/* <MaterialCommunityIcons
              name="web"
              color={Colors.color2}
              size={wp(8)}
            />
            <Text style={Styles.languageText}>
              {language === 'en'
                ? LanguageKeys.english
                : LanguageKeys.romanUrdu}
            </Text> */}
          </TouchableOpacity>
          {/* <TouchableOpacity
            style={{ marginBottom: hp(0.5) }}
            onPress={onGuardianPress}
          >
            <Text style={[Styles.languageText, { marginHorizontal: 0 }]}>
              {LanguageKeys.guardian}
            </Text>
          </TouchableOpacity> */}
        </View>

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
              loadingMessage={loadingMessage}
              disabled={checkEmpty(phoneNumber) || loading}
              icon={
                <MaterialCommunityIcons
                  name={'logout-variant'}
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
};

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
    paddingTop: isIOS ? 0 : hp(2),
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
    // width: wp(50),
    marginTop: hp(1),
  },
  phoneNumberSectionCon: {
    position: 'absolute',
    bottom: 0,
    // paddingBottom: hp(4),
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
    // marginTop: hp(0.6),
    paddingVertical: hp(1),
    fontSize: Typography.medium,
    fontFamily: Fonts.APPFONT_R,
    paddingHorizontal: wp(2),
  },
  radioBtnCon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(2),
    alignSelf: 'flex-start',
    marginBottom: hp(2),
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
});
