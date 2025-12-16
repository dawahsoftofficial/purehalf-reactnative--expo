import { getApp } from '@react-native-firebase/app';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import React, { useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Text as ReactText,
  TouchableOpacity,
  View,
} from 'react-native';
import { StyleSheet } from 'react-native';
import {
  CodeField,
  Cursor,
  useBlurOnFulfill,
  useClearByFocusCell,
} from 'react-native-confirmation-code-field';
import AntDesign from 'react-native-vector-icons/AntDesign';

import { Animation } from '../../animations';
import { SlideShowContainer, Text } from '../../components';
import { Button } from '../../components/buttons';
import { hp, Typography, wp } from '../../global';
import Constants from '../../global/Constants';
import { CheckRtl, LanguageKeys } from '../../languages';
import {} from '../../res';
import { Colors, Fonts } from '../../res';
import {
  ApiServices,
  Firebase,
  flashErrorMessage,
  flashSuccessMessage,
  isIOS,
  setRevenueCat,
  StorageManager,
  useGlobalContext,
} from '../../services';
import FirebaseServices from '../../services/firebase/Firebase';

const firebaseApp = getApp();
const auth = getAuth(firebaseApp);

const Otp = (props: any) => {
  const Rtl = CheckRtl();
  const { showLogo = true, from = '', purposeOfLeaving = '' } = props;
  const { storageKeys, setData } = StorageManager;
  const imagesContainerDisabled =
    props?.from && props.from === 'AccountDeletion' ? true : false;
  const textColor =
    props?.from && props.from === 'AccountDeletion'
      ? Colors.color1
      : Colors.color2;

  const phoneNumber = props?.route?.params?.phoneNumber;
  const [phoneNumberFirebaseRes, setPhoneNumberFirebaseRes] = useState(
    props?.route?.params?.phoneNumberFirebaseRes
  );
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const { currentUser, updateCurrentUser } = useGlobalContext();
  const [continueLoader, setContinueLoader] = useState(false);
  const [continueLoaderMessage, setContinueLoaderMessage] =
    useState('Verifying...');

  const CELL_COUNT = 6;
  const [value, setValue] = useState('');
  const ref = useBlurOnFulfill({ value, cellCount: CELL_COUNT });
  const [propsCell, getCellOnLayoutHandler] = useClearByFocusCell({
    value,
    setValue,
  });
  const [seconds, setSeconds] = useState(30);
  const [timerActive, setTimerActive] = useState(true);

  function onAuthStateChangedFirebase(user: any) {
    if (user && from !== 'AccountDeletion') {
      FirebaseServices.handleIsLoggedIn(true);
      flashSuccessMessage(LanguageKeys.loggedInSuccessfully);
      ApiServices.authenticateUser(phoneNumber, () => onOTPVerified(), true);
    }
  }

  useEffect(() => {
    if (value.length === 6) {
      onContinuePress();
    }
  }, [value]);

  useEffect(() => {
    const subscriber = onAuthStateChanged(auth, onAuthStateChangedFirebase);
    return subscriber;
  }, []);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setIsKeyboardOpen(true);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setIsKeyboardOpen(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    let interval: any = null;
    if (timerActive) {
      interval = setInterval(() => {
        if (seconds > 0) {
          setSeconds((seconds) => seconds - 1);
        } else if (seconds === 0) {
          setTimerActive(false);
        }
      }, 1000);
    } else if (!timerActive && seconds === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerActive, seconds]);

  const navigateTo = (route: any) => {
    props.navigation.reset({
      index: 0,
      routes: [{ name: route }],
    });
  };

  const onLoggedIn = async (userObj: any) => {
    console.log('user', userObj);
    await setRevenueCat(userObj?.results.id);
    if (!currentUser) {
      updateCurrentUser(userObj?.results);
    }
    if (userObj?.results?.first_name) {
      if (
        !userObj?.results?.media ||
        !userObj?.results?.media?.primary_image ||
        userObj?.results?.media?.primary_image?.length === 0
      ) {
        navigateTo('ProfilePicture');
      } else if (
        userObj?.results?.membership_status === null ||
        userObj?.results?.membership_status === 0
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

  const onOTPVerified = async () => {
    if (!currentUser) {
      ApiServices.loginUser(phoneNumber, (currentUser) =>
        onLoggedIn(currentUser)
      );
    } else {
      await setRevenueCat(currentUser?.id);
      ApiServices.getMembershipStatus().then(async (res: any) => {
        if (res || currentUser.membership_status) {
          currentUser.membership_expiry =
            res?.membership_expiry || currentUser.membership_expiry;
          currentUser.membership_status = 1;
        } else {
          currentUser.membership_expiry = null;
          currentUser.membership_status = 0;
        }
        updateCurrentUser(currentUser);
        await setData(storageKeys.USER, currentUser);
      });

      setContinueLoader(false);

      if (currentUser?.first_name) {
        if (
          !currentUser?.media ||
          !currentUser?.media?.primary_image ||
          currentUser?.media?.primary_image?.length === 0
        ) {
          navigateTo('ProfilePicture');
        } else if (
          currentUser?.membership_status === null ||
          currentUser?.membership_status === 0
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
    }
  };

  const hideContinueLoader = () => {
    setContinueLoader(false);
  };

  const onContinuePress = async () => {
    const code = value;
    if (from === 'AccountDeletion') {
      if (!purposeOfLeaving) {
        flashErrorMessage('Please select purpose of leaving');
      } else {
        setContinueLoaderMessage('Verifying...');
        setContinueLoader(true);
        if (props?.type === 'email') {
          ApiServices.verifyOTP({ otp: code })
            .then((res) => {
              ApiServices.deleteAccount(purposeOfLeaving?.id)
                .then(() => {
                  setContinueLoader(false);
                  setContinueLoaderMessage('');
                  props.navigation.navigate('AccountDeleted');
                })
                .catch(() => {
                  setContinueLoader(false);
                  setContinueLoaderMessage('');
                });
            })
            .catch(() => {
              setContinueLoader(false);
              setContinueLoaderMessage('');
            });
        } else {
          Firebase.matchOTP(phoneNumberFirebaseRes, code)
            .then(() => {
              setContinueLoaderMessage('Deleting Account...');
              ApiServices.deleteAccount(purposeOfLeaving?.id)
                .then(() => {
                  setContinueLoader(false);
                  setContinueLoaderMessage('');
                  props.navigation.navigate('AccountDeleted');
                })
                .catch(() => {
                  setContinueLoader(false);
                  setContinueLoaderMessage('');
                });
            })
            .catch(hideContinueLoader);
        }
      }
    } else {
      setContinueLoaderMessage('Verifying...');
      setContinueLoader(true);
      Firebase.matchLoginVerificationCode(phoneNumberFirebaseRes, code)
        .then(() => {
          // setContinueLoader(false)
        })
        .catch(hideContinueLoader);
    }
  };

  const onResendPress = () => {
    if (props?.type === 'email') {
      ApiServices.sendOTPForAccountDelete({})
        .then(() => {
          setSeconds(30);
          setTimerActive(true);
          flashSuccessMessage(LanguageKeys.codeResent);
        })
        .catch((err) => console.log(err));
    } else {
      Firebase.sendVerificationCode(phoneNumber, true).then((res) => {
        setPhoneNumberFirebaseRes(res);
        flashSuccessMessage(LanguageKeys.codeResent);
      });
      setSeconds(30);
      setTimerActive(true);
    }
  };

  return (
    <SlideShowContainer disabled={imagesContainerDisabled}>
      {/* <CheckMembershipStatus /> */}
      <KeyboardAvoidingView
        behavior={'position'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={hp(2)}
      >
        <View
          style={[
            Styles.container,
            { height: imagesContainerDisabled ? 'auto' : hp(100) },
          ]}
        >
          <Animation>
            <View style={Styles.headingCon}>
              <Text style={[Styles.description, { color: textColor }]}>
                {props?.type === 'email'
                  ? LanguageKeys.emailSent
                  : LanguageKeys.smsSent}
              </Text>
            </View>
            <View style={Styles.headingCon}>
              <Text style={[Styles.heading, { color: textColor }]}>
                {phoneNumber}
              </Text>
            </View>
            <View style={Styles.descriptionCon}>
              <Text style={[Styles.description, { color: textColor }]}>
                {LanguageKeys.enterVerification}
              </Text>
            </View>
            <View style={Styles.otpInputCon}>
              <CodeField
                ref={ref}
                {...propsCell}
                caretHidden={false}
                value={value}
                onChangeText={setValue}
                cellCount={CELL_COUNT}
                rootStyle={Styles.codeFieldRoot}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                renderCell={({ index, symbol, isFocused }) => (
                  <ReactText
                    key={index}
                    style={[
                      Styles.cell,
                      isFocused && Styles.focusCell,
                      { borderColor: textColor, color: textColor },
                    ]}
                    onLayout={getCellOnLayoutHandler(index)}
                  >
                    {symbol || (isFocused ? <Cursor /> : null)}
                  </ReactText>
                )}
              />
            </View>
            {seconds > 0 && (
              <View
                style={{
                  ...Styles.tryAgainCon,
                  alignSelf: Rtl ? 'flex-end' : 'flex-start',
                  flexDirection: Rtl ? 'row' : 'row-reverse',
                }}
              >
                <Text style={[Styles.tryAgainTxt, { color: textColor }]}>
                  {' '}
                  {LanguageKeys.resendOtp} {seconds} {LanguageKeys.seconds}
                  ...
                </Text>
                <AntDesign name="clockcircleo" color={textColor} size={wp(5)} />
              </View>
            )}
            {seconds === 0 && (
              <TouchableOpacity
                onPress={onResendPress}
                activeOpacity={Constants.btnActiveOpacity}
              >
                <Text style={[Styles.resendCode, { color: textColor }]}>
                  {LanguageKeys.resendCode}
                </Text>
              </TouchableOpacity>
            )}
            <View
              style={{
                ...Styles.continueBtnCon,
                marginBottom: !isIOS && isKeyboardOpen ? hp(-11) : hp(3),
              }}
            >
              <Button
                loading={continueLoader}
                loadingMessage={continueLoaderMessage}
                text={LanguageKeys.continue}
                onPress={onContinuePress}
                disabled={value.length < 6}
              />
            </View>
          </Animation>
        </View>
      </KeyboardAvoidingView>
    </SlideShowContainer>
  );
};

export default Otp;

const Styles = StyleSheet.create({
  container: {
    justifyContent: 'flex-end',
    paddingHorizontal: wp(4),
  },
  contentContainer: {
    height: '34%',
    justifyContent: 'flex-end',
  },
  continueBtnCon: {
    marginBottom: hp(3),
  },
  tryAgainCon: {
    marginBottom: hp(3),
    alignItems: 'center',
    flexDirection: 'row',
  },
  tryAgainTxt: {
    fontSize: Typography.small1,
    marginBottom: Constants.fontFamilyMarginBottom,
    fontFamily: Fonts.APPFONT_R,
    color: Colors.color2,
  },
  otpInputCon: {
    marginBottom: hp(3),
  },
  codeFieldRoot: {},
  cell: {
    width: wp(13),
    height: hp(6.5),
    lineHeight: wp(13),
    fontSize: Typography.large,
    borderBottomWidth: 1,
    borderColor: Colors.color2,
    borderWidth: !isIOS ? 0 : 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: Colors.color2,
    includeFontPadding: false,
  },
  focusCell: {
    color: Colors.color2,
  },
  descriptionCon: {
    marginBottom: hp(3),
  },
  description: {
    fontSize: Typography.small2,
    includeFontPadding: false,
    fontFamily: Fonts.APPFONT_R,
    color: Colors.color2,
  },
  headingCon: {
    marginBottom: hp(1),
  },
  heading: {
    fontSize: Typography.medium2,
    includeFontPadding: false,
    fontFamily: Fonts.APPFONT_B,
    color: Colors.color2,
  },
  resendCode: {
    alignSelf: 'center',
    marginBottom: hp(2),
    fontSize: Typography.medium,
    color: Colors.color10,
    fontFamily: Fonts.APPFONT_B,
  },
});
