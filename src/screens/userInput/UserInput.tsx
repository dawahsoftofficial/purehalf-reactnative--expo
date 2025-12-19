import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp } from '@react-native-firebase/app';
import { getAuth, signOut } from '@react-native-firebase/auth';
import { CommonActions as CommonActionsNav } from '@react-navigation/native';
import _ from 'lodash';
import moment from 'moment';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { hasNotch } from 'react-native-device-info';
import Ripple from 'react-native-material-ripple';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Button,
  CheckMembershipStatus,
  Container,
  DateTimePicker,
  GenderPicker,
  Header,
  IconInput,
  Loader,
  Text,
} from '../../components';
import { hp, Typography, wp } from '../../global';
import { LanguageKeys } from '../../languages';
import { CommonActions } from '../../navigation';
import { Images } from '../../res';
import { Colors, Fonts } from '../../res';
import {
  ApiServices,
  checkEmpty,
  flashErrorMessage,
  flashSuccessMessage,
  isIOS,
  stopConversationsListener,
  StorageManager,
  useGlobalContext,
} from '../../services';

const firebaseApp = getApp();
const auth = getAuth(firebaseApp);

const UserInput = (props: any) => {
  const fromSettings = props?.route?.params?.fromSettings;
  // const [countryPickerVisible, setCountryPickerVisible] = useState(false)
  // const [selectedCountry, setSelectedCountry] = useState('')
  const { updateCurrentUser, currentUser, language } = useGlobalContext();
  const { getData, deleteAll, storageKeys } = StorageManager;
  const [languageId, setLanguageId] = useState(null);
  const [submitLoader, setSubmitLoader] = useState(false);
  const [loaderMessage, setLoaderMessage] = useState('Submitting...');
  const [loader, setLoader] = useState(fromSettings ? true : false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<any>('');
  const [gender, setGender] = useState('');

  const onChangeFirstName = (text: any) => setFirstName(text);
  const onChangeLastName = (text: any) => setLastName(text);
  const onDateOfBirthSelection = (date: any) => {
    console.log('date', date);
    setDateOfBirth(date);
  };
  const onGenderChange = (value: any) => setGender(value);
  const hideLoader = () => setSubmitLoader(false);
  // const showCountryPicker = () => setCountryPickerVisible(true)
  // const hideCountryPicker = () => setCountryPickerVisible(false)

  // const onCountrySelection = (data: any) => {
  //     setSelectedCountry(data?.name)
  //     setCountryPickerVisible(false)
  // }

  const onContinuePress = () => {
    const age = moment().diff(
      moment(dateOfBirth).format('YYYY-MM-DD'),
      'years'
    );
    if (age < 18) {
      return flashErrorMessage(LanguageKeys.ageLimit, 2);
    }
    const params = {
      first_name: firstName,
      last_name: lastName,
      gender: gender,
      date_of_birth: moment(dateOfBirth).format('YYYY-MM-DD'),
      interface_language_id: languageId ? languageId : 1,
      // country: selectedCountry,
      in_app_notifications: 1,
    };
    if (fromSettings) {
      setLoaderMessage(LanguageKeys.updating);
    }
    setSubmitLoader(true);
    ApiServices.updateUserInfo(params)
      .then(async (res) => {
        if (fromSettings) {
          flashSuccessMessage();
        }
        if (res) {
          const userData: any = {
            ...currentUser,
            ...res,
          };
          updateCurrentUser(userData);
          const { setData } = StorageManager;
          await setData(storageKeys.USER, userData);
        }

        if (!fromSettings) {
          props.navigation.reset({
            index: 0,
            routes: [
              {
                name: 'ProfilePicture',
              },
            ],
          });
          // if(currentUser?.membership_status === null || currentUser?.membership_status === 0) {
          //     props.navigation.reset({
          //         index: 0,
          //         routes: [{
          //             name: 'ProFeaturesPromotion',
          //             params: {
          //                 navigateTo: 'BottomTab',
          //                 from: 'SignUp'
          //             }
          //         }],
          //     });
          // }
          // else {
          //     navigateTo('BottomTab')
          // }
        }
        setSubmitLoader(false);
      })
      .catch(hideLoader);
  };

  const setData = useCallback(() => {
    if (currentUser) {
      const { first_name, last_name, date_of_birth, gender } = currentUser;
      if (first_name) {
        setFirstName(first_name);
      }
      if (last_name) {
        setLastName(last_name);
      }
      if (date_of_birth) {
        setDateOfBirth(new Date(date_of_birth));
      }
      if (gender) {
        setGender(
          gender?.toLowerCase() === 'male'
            ? LanguageKeys.male
            : LanguageKeys.female
        );
      }
      // country && setSelectedCountry(country)
      setLoader(false);
    } else {
      setLoader(false);
    }
  }, [currentUser]);

  const getLanguages = useCallback(async () => {
    getData(storageKeys.LANGUAGE).then((language: any) => {
      ApiServices.getLanguages().then((data: any) => {
        if (data?.length !== 0) {
          const result = _.find(data, function (n) {
            if (n.short_code?.toLowerCase() === language.toLowerCase()) {
              return n;
            }
          });
          if (result) {
            setLanguageId(result?.id);
          }
        }
      });
    });
  }, [getData, storageKeys]);

  useEffect(() => {
    // Defer state updates to avoid cascading renders
    Promise.resolve().then(() => {
      setData();
    });
    getLanguages();
  }, [setData, getLanguages]);

  const onLogoutPress = async () => {
    const verificationId = await getData(storageKeys.FIREBASE_VERIFICATION_ID);
    await AsyncStorage.setItem('isRecommended', 'false');
    await ApiServices.logout().catch(hideLoader);
    await signOut(auth).catch(hideLoader);
    await deleteAll()
      .then(async () => {
        updateCurrentUser(null);
        const { setData } = StorageManager;
        await setData(storageKeys.LANGUAGE, language);
        await setData(storageKeys.FIREBASE_VERIFICATION_ID, verificationId);
        await stopConversationsListener();
        hideLoader();
        props.navigation.dispatch(
          CommonActionsNav.reset({
            index: 1,
            routes: [{ name: 'AuthWelcome' }],
          })
        );
      })
      .catch(hideLoader);
  };

  const RenderContent = () => {
    return (
      <View style={{ flex: 1 }}>
        {loader ? (
          <Loader />
        ) : (
          <ScrollView
            contentContainerStyle={[
              Styles.container,
              { paddingBottom: fromSettings ? hp(18) : 0 },
            ]}
            showsVerticalScrollIndicator={false}
            automaticallyAdjustContentInsets
            keyboardShouldPersistTaps="always"
          >
            {!fromSettings && (
              <Text style={Styles.heading}>{LanguageKeys.signupDes}</Text>
            )}
            <View style={Styles.firstNameLastNameCon}>
              <View style={Styles.inputFieldCon}>
                <IconInput
                  label={LanguageKeys.firstName}
                  placeholder={LanguageKeys.enterFirstName}
                  icon={Images.user}
                  value={firstName}
                  onChangeText={onChangeFirstName}
                  inputStyle={{ width: wp(35) }}
                  outerLabelStyle={{
                    color: fromSettings ? Colors.color1 : Colors.color1,
                  }}
                />
              </View>
              <View style={Styles.inputFieldCon}>
                <IconInput
                  label={LanguageKeys.lastName}
                  placeholder={LanguageKeys.enterLastName}
                  icon={Images.user}
                  value={lastName}
                  onChangeText={onChangeLastName}
                  inputStyle={{ width: wp(35) }}
                  outerLabelStyle={{
                    color: fromSettings ? Colors.color1 : Colors.color1,
                  }}
                />
              </View>
            </View>
            {fromSettings && (
              <View style={Styles.inputFieldCon}>
                <IconInput
                  label={
                    currentUser?.phone_number
                      ? LanguageKeys.phoneNumber
                      : LanguageKeys.email
                  }
                  placeholder={LanguageKeys.enterEmail}
                  icon={Images.user}
                  value={currentUser?.phone_number || currentUser?.email}
                  outerLabelStyle={{ color: Colors.color1 }}
                  disabled={fromSettings}
                />
              </View>
            )}
            <View style={Styles.inputFieldCon}>
              <DateTimePicker
                label={LanguageKeys.dateOfBirth}
                date={dateOfBirth}
                icon={Images.calender}
                mode="date"
                // maxDate={moment().subtract(18, 'years').toDate()}
                selectedDate={onDateOfBirthSelection}
                outerLabelStyle={{
                  color: fromSettings ? Colors.color1 : Colors.color1,
                }}
                disabled={fromSettings}
              />
            </View>
            <View style={Styles.inputFieldCon}>
              <GenderPicker
                value={gender}
                onSelect={onGenderChange}
                outerLabelStyle={{
                  color: fromSettings ? Colors.color1 : Colors.color1,
                }}
                disabled={fromSettings}
              />
            </View>
            {/* <View style={Styles.inputFieldCon}>
                            <Text style={{ ...Styles.inputLabel, color: fromSettings ? Colors.color1 : Colors.color1 }}>
                                {LanguageKeys.country}
                            </Text>
                            <Ripple
                                style={{ ...Styles.selectLocationBtn, flexDirection: Rtl ? 'row-reverse' : 'row' }}
                                onPress={showCountryPicker}
                            >
                                <View style={{ ...Styles.selectLocationBtnInner, flexDirection: Rtl ? 'row-reverse' : 'row' }}>
                                    <Image
                                        source={Images.globe}
                                        resizeMode='contain'
                                        style={Styles.globeIcon}
                                    />
                                    {
                                        selectedCountry.length === 0 ?
                                            <Text style={{ ...Styles.selectLocationBtnLabel, color: Colors.color18 }}>
                                                {LanguageKeys.selectCountry}
                                            </Text>
                                            :
                                            <Text style={Styles.selectLocationBtnLabel}>
                                                {selectedCountry}
                                            </Text>
                                    }
                                </View>
                                <AntDesign name='down' size={wp(3.5)} color={Colors.color4} />
                            </Ripple>
                        </View>
                        <CountryPicker
                            visible={countryPickerVisible}
                            onClose={hideCountryPicker}
                            onPress={onCountrySelection}
                        /> */}
          </ScrollView>
        )}
      </View>
    );
  };

  return fromSettings ? (
    <Container>
      <Header
        title={LanguageKeys.basicSettings}
        navigation={props.navigation}
      />
      <SafeAreaView style={Styles.container}>
        <CommonActions navigation={props.navigation} userId={currentUser?.id} />
        <CheckMembershipStatus />
        {RenderContent()}
        <View style={Styles.continueBtnCon}>
          <Button
            text={fromSettings ? LanguageKeys.update : LanguageKeys.continue}
            onPress={onContinuePress}
            disabled={
              (checkEmpty(firstName) &&
                checkEmpty(lastName) &&
                isNaN(Date.parse(dateOfBirth))) ||
              checkEmpty(gender) ||
              checkEmpty(firstName) ||
              checkEmpty(lastName) ||
              isNaN(Date.parse(dateOfBirth))
            }
            loading={submitLoader}
            loadingMessage={loaderMessage}
          />
        </View>
        <Ripple onPress={onLogoutPress}>
          <Text style={Styles.deleteAccountText}>logOut</Text>
        </Ripple>
        <Ripple onPress={() => props.navigation.navigate('AccountDeletion')}>
          <Text style={Styles.deleteAccountText}>deleteAccount</Text>
        </Ripple>
      </SafeAreaView>
    </Container>
  ) : (
    <Container disabled>
      <SafeAreaView style={Styles.container2}>
        <CommonActions navigation={props.navigation} userId={currentUser?.id} />
        <CheckMembershipStatus />
        {RenderContent()}
        <View style={Styles.continueBtnCon}>
          <Button
            text={fromSettings ? LanguageKeys.update : LanguageKeys.continue}
            onPress={onContinuePress}
            disabled={
              (checkEmpty(firstName) &&
                checkEmpty(lastName) &&
                isNaN(Date.parse(dateOfBirth))) ||
              checkEmpty(gender) ||
              checkEmpty(firstName) ||
              checkEmpty(lastName) ||
              isNaN(Date.parse(dateOfBirth))
            }
            loading={submitLoader}
            loadingMessage={loaderMessage}
          />
        </View>
      </SafeAreaView>
    </Container>
  );
};

export default UserInput;

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
    height: hp(isIOS ? 90 : 95),
    // width: wp(100),
    paddingHorizontal: wp(2),
    justifyContent: 'center',
    // paddingVertical: hasNotch() && isIOS ? 20 : 0,
    zIndex: 1,
  },
  container2: {
    position: 'absolute',
    bottom: 0,
    // height: hp(100),
    width: wp(100),
    paddingHorizontal: wp(2),
    justifyContent: 'center',
    paddingVertical: hasNotch() && isIOS ? 20 : 0,
    zIndex: 1,
  },
  heading: {
    fontSize: Typography.large2,
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_B,
    includeFontPadding: false,
    marginBottom: hp(3),
  },
  firstNameLastNameCon: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputFieldCon: {
    marginBottom: hp(3),
  },
  continueBtnCon: {
    marginBottom: hp(2),
  },
  selectLocationBtn: {
    backgroundColor: Colors.color3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: hp(6.3),
    paddingHorizontal: wp(2),
    borderBottomWidth: 0.7,
    borderColor: Colors.color1,
    marginTop: hp(0.8),
  },
  selectLocationBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    height: hp(6),
  },
  globeIcon: {
    width: wp(4.5),
    height: hp(4),
  },
  selectLocationBtnLabel: {
    fontFamily: Fonts.APPFONT_R,
    color: Colors.color1,
    fontSize: Typography.small3,
    marginTop: !isIOS ? hp(0.35) : 0,
    alignSelf: 'center',
    marginHorizontal: wp(3),
  },
  inputLabel: {
    fontSize: Typography.medium,
    fontFamily: Fonts.APPFONT_R,
    includeFontPadding: false,
    color: Colors.color1,
  },
  deleteAccountText: {
    fontSize: Typography.medium,
    fontFamily: Fonts.APPFONT_R,
    color: Colors.theme,
    textDecorationLine: 'underline',
    alignSelf: 'center',
    marginTop: 10,
  },
});
