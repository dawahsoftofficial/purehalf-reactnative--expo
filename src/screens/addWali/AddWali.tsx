import {
  View,
  ScrollView,
  StyleSheet,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import { hasNotch } from 'react-native-device-info';
import {
  Button,
  CheckMembershipStatus,
  Container,
  CountryPicker,
  DeletePicker,
  Header,
  IconInput,
  Loader,
  SlideShowContainer,
  Text,
} from '../../components';
import RelationPicker from '../../components/pickers/RelationPicker';
import { CheckRtl, LanguageKeys } from '../../languages';
import { Typography, hp, wp } from '../../global';
import { Colors, Fonts, Images } from '../../res';
import {
  ApiServices,
  StorageManager,
  checkEmpty,
  emailValidation,
  flashErrorMessage,
  flashSuccessMessage,
  isIOS,
  useGlobalContext,
} from '../../services';
import { CommonActions } from '../../navigation';

const AddWali = ({ navigation, route }: any) => {
  const { getData, setData, storageKeys } = StorageManager;
  const { currentUser, updateCurrentUser } = useGlobalContext();
  const guardian = currentUser?.guardian ? currentUser?.guardian : false;
  const { t }: any = useTranslation();
  const Rtl = CheckRtl();
  const [loader, setLoader] = useState(false);
  const [relations, setRelations] = useState([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [relation, setRelation] = useState<any>();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState({
    code: 'PK',
    dial_code: '+92',
    flag: '🇵🇰',
    name: 'Pakistan',
  });
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [addWaliLoader, setAddWaliLoader] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState(false);
  const fromSettings = route?.params?.fromSettings;

  useEffect(() => {
    getData(storageKeys.ATTRIBUTE).then((attributeRes: any) => {
      if (attributeRes) {
        if (attributeRes.hasOwnProperty('wali-0')) {
          const allRelations = attributeRes['wali-0']['relation-0'];
          setRelations(
            allRelations?.map((rel: any) => {
              return {
                id: rel?.id,
                label: rel?.value,
                value: rel?.value,
                selected: relation?.id === rel?.id ? true : false,
              };
            })
          );
        }
      } else {
        ApiServices.getAttribute().then((data: any) => {
          setData(storageKeys.ATTRIBUTE, data);
          if (data?.hasOwnProperty('wali-0')) {
            const allRelations = data['wali-0']['relation-0'];
            setRelations(
              allRelations?.map((rel: any) => {
                return {
                  id: rel?.id,
                  label: rel?.value,
                  value: rel?.value,
                  selected: relation?.id === rel?.id ? true : false,
                };
              })
            );
          }
        });
      }
    });
  }, [currentUser?.guardian]);

  useEffect(() => {
    setLoader(true);
    const guardian = currentUser?.guardian;
    if (guardian) {
      const { first_name, last_name, email, relationship_id } = guardian;
      setFirstName(first_name);
      setLastName(last_name);
      setEmail(email);
      let userRelation = relations?.find((rel) => rel?.id === relationship_id);
      setRelation({
        id: userRelation?.id,
        label: userRelation?.value,
        value: userRelation?.value,
        selected: true,
      });
    } else {
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhoneNumber('');
      setRelation(null);
    }
    setLoader(false);
  }, [currentUser?.guardian, relations.length]);

  const onChangeFirstName = (text: string) => setFirstName(text);
  const onChangeLastName = (text: string) => setLastName(text);
  const onChangeEmail = (text: string) => setEmail(text);
  const onChangePhoneNumber = (text: any) => setPhoneNumber(text);

  const onPressFlagBtn = () => setCountryPickerVisible(true);
  const closeCountryPicker = () => setCountryPickerVisible(false);
  const onRelationChange = (value: any) => setRelation(value);

  const onSelectCountry = (item: any) => {
    setSelectedCountry(item);
    setCountryPickerVisible(false);
  };

  const onAddWaliPress = async () => {
    if (!emailValidation(email)) {
      flashErrorMessage(LanguageKeys.invalidEmailError);
    }
    // else if (selectedCountry.dial_code === '+92' &&
    //     (phoneNumber[0] === '0' && (phoneNumber.length <= 10 || phoneNumber.length > 12))
    //     || (phoneNumber[0] !== '0' && (phoneNumber.length < 10 || phoneNumber.length > 12))
    // ) {
    //     flashErrorMessage(LanguageKeys.invalidPhoneNumber)
    // }
    // else if (selectedCountry.dial_code !== '+92' && phoneNumber.length < 6) {
    //     flashErrorMessage(LanguageKeys.invalidPhoneNumber)
    // }
    else {
      // let phoneNumberWithCode = selectedCountry.dial_code +
      //     (phoneNumber[0] === '0' ? phoneNumber.slice(1) : phoneNumber)
      setAddWaliLoader(true);
      const params = {
        relationship_id: relation?.id,
        first_name: firstName,
        last_name: lastName,
        email: email?.toLowerCase().trim(),
        // phone: phoneNumberWithCode
      };
      console.log({ params });

      ApiServices.addWaliInformation(params)
        .then(async () => {
          ApiServices.getCurrentUserDetail()
            .then(async (res) => {
              updateCurrentUser(res);
              await setData(storageKeys.USER, currentUser);
              const startTime = new Date().getTime();
              await setData(
                storageKeys.VERIFICATION_CODE_TIMER,
                startTime.toString()
              );
            })
            .catch(async () => {
              currentUser.guardian = params;
              updateCurrentUser(currentUser);
              await setData(storageKeys.USER, currentUser);
            });

          setAddWaliLoader(false);

          if (email === guardian?.email) {
            flashSuccessMessage(LanguageKeys.informationUpdated);
          } else {
            if (fromSettings) {
              flashSuccessMessage(LanguageKeys.codeSentToWali);
              navigation.navigate('VerifyWaliCode');
            } else {
              flashSuccessMessage(LanguageKeys.waliAdded);
              navigation.reset({
                index: 0,
                routes: [{ name: 'WelcomeUser' }],
              });
            }
          }
        })
        .catch(() => {
          setAddWaliLoader(false);
        });
    }
  };

  const onSkipPress = async () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'WelcomeUser' }],
    });
  };

  const onRemoveWaliPress = async () => {
    setAddWaliLoader(true);
    ApiServices.removeWali()
      .then(async () => {
        ApiServices.getCurrentUserDetail()
          .then(async (res) => {
            updateCurrentUser(res);
            await setData(storageKeys.USER, res);
            const startTime = new Date().getTime();
            await setData(
              storageKeys.VERIFICATION_CODE_TIMER,
              startTime.toString()
            );
          })
          .catch(async () => {
            currentUser.guardian = null;
            updateCurrentUser(currentUser);
            await setData(storageKeys.USER, currentUser);
            setRelation(null);
          });

        setAddWaliLoader(false);
        hideDeleteAlert();

        flashSuccessMessage(LanguageKeys.informationUpdated);
      })
      .catch(() => {
        setAddWaliLoader(false);
      });
  };

  const onVerifyCode = () => {
    navigation.navigate('VerifyWaliCode');
  };

  const showDeleteChatAlert = () => {
    setDeleteAlert(true);
  };

  const hideDeleteAlert = () => {
    setDeleteAlert(false);
  };

  return fromSettings ? (
    <Container>
      <Header navigation={navigation} title={LanguageKeys.addWali} />
      <View style={{ flex: 1 }}>
        {loader ? (
          <Loader />
        ) : (
          <ScrollView
            contentContainerStyle={Styles.container}
            showsVerticalScrollIndicator={false}
            automaticallyAdjustContentInsets
            keyboardShouldPersistTaps="always"
          >
            <View style={Styles.firstNameLastNameCon}>
              <View style={Styles.inputFieldCon}>
                <IconInput
                  label={LanguageKeys.firstName}
                  placeholder={LanguageKeys.enterFirstName}
                  icon={Images.user}
                  value={firstName}
                  onChangeText={onChangeFirstName}
                  inputStyle={{ width: wp(35) }}
                  outerLabelStyle={{ color: Colors.color1 }}
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
                  outerLabelStyle={{ color: Colors.color1 }}
                />
              </View>
            </View>
            <View style={Styles.inputFieldCon}>
              <IconInput
                label={LanguageKeys.email}
                placeholder={LanguageKeys.email}
                icon={Images.email}
                value={email}
                onChangeText={onChangeEmail}
                outerLabelStyle={{ color: Colors.color1 }}
              />
            </View>
            <View style={Styles.inputFieldCon}>
              <RelationPicker
                value={relation}
                onSelect={onRelationChange}
                outerLabelStyle={{ color: Colors.color1 }}
                relations={relations}
                setRelations={setRelations}
                // disabled={fromSettings}
              />
            </View>
            {/* <View style={Styles.inputFieldCon}>
                                    <IconInput
                                        label={LanguageKeys.firstName}
                                        placeholder={LanguageKeys.enterFirstName}
                                        icon={Images.user}
                                        value={firstName}
                                        onChangeText={onChangeFirstName}
                                    />
                                </View>
                                <View style={Styles.inputFieldCon}>
                                    <IconInput
                                        label={LanguageKeys.lastName}
                                        placeholder={LanguageKeys.enterLastName}
                                        icon={Images.user}
                                        value={lastName}
                                        onChangeText={onChangeLastName}
                                    />
                                </View>
                                <View style={Styles.inputFieldCon}>
                                    <IconInput
                                        label={LanguageKeys.email}
                                        placeholder={LanguageKeys.enterYourEmail}
                                        icon={Images.email}
                                        value={email}
                                        onChangeText={onChangeEmail}
                                    />
                                </View>
                                <View style={Styles.inputFieldCon}>
                                    <RelationPicker
                                        value={relation}
                                        onSelect={onRelationChange}
                                        outerLabelStyle={{ color: Colors.color2 }}
                                    // disabled={fromSettings} 
                                    />
                                </View>
                                <Text style={Styles.inputLabel}>
                                    {LanguageKeys.phoneNumber}
                                </Text>
                                <View style={{ ...Styles.phoneNumberCon, flexDirection: Rtl ? 'row-reverse' : 'row' }}>
                                    <Ripple
                                        style={{ ...Styles.flagBtnCon, flexDirection: Rtl ? 'row-reverse' : 'row' }}
                                        onPress={onPressFlagBtn}
                                    >
                                        <Text style={Styles.flag}>{selectedCountry.flag}</Text>
                                        <Text style={Styles.countryPickerTxt}>{selectedCountry.dial_code}</Text>
                                        <AntDesign name='caretdown' size={wp(3)} color={Colors.color1} />
                                    </Ripple>
                                    <TextInput
                                        style={{ ...Styles.phoneNumberInput, textAlign: Rtl ? 'right' : 'left' }}
                                        keyboardType='number-pad'
                                        placeholder={t(LanguageKeys.phoneNumber)}
                                        placeholderTextColor={Colors.color28}
                                        value={phoneNumber}
                                        onChangeText={onChangePhoneNumber}
                                    />
                                </View> */}
          </ScrollView>
        )}
        <CountryPicker
          visible={countryPickerVisible}
          onClose={closeCountryPicker}
          onPress={onSelectCountry}
        />
      </View>

      {guardian && !guardian?.otp_verified_at && (
        <Button
          text={LanguageKeys.verifyCode}
          buttonStyle={{
            marginHorizontal: wp(4),
            marginBottom: 10,
            marginTop: 20,
          }}
          onPress={onVerifyCode}
        />
      )}
      <Button
        text={guardian ? LanguageKeys.updateWaliInfo : LanguageKeys.addWali}
        buttonStyle={{ marginHorizontal: wp(4), marginBottom: 10 }}
        onPress={onAddWaliPress}
        disabled={
          checkEmpty(firstName) ||
          checkEmpty(lastName) ||
          checkEmpty(email) ||
          checkEmpty(relation)
        }
        loading={addWaliLoader}
        loadingMessage={guardian ? LanguageKeys.updating : LanguageKeys.adding}
      />
      {guardian ? (
        <Button
          text={LanguageKeys.removeWaliInfo}
          buttonStyle={{
            marginHorizontal: wp(4),
            marginBottom: 15,
            backgroundColor: Colors.color12,
          }}
          onPress={showDeleteChatAlert}
          disabled={
            checkEmpty(firstName) ||
            checkEmpty(lastName) ||
            checkEmpty(email) ||
            checkEmpty(relation)
          }
          loadingMessage={
            guardian ? LanguageKeys.updating : LanguageKeys.adding
          }
        />
      ) : null}
      <DeletePicker
        visible={deleteAlert}
        actionButtonLabel={LanguageKeys.confirm}
        headerTitle={LanguageKeys.areYouSure}
        onClose={hideDeleteAlert}
        onDeletePress={onRemoveWaliPress}
        onCancelPress={hideDeleteAlert}
        useCustomModal={true}
      />
    </Container>
  ) : (
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
      <SafeAreaView style={Styles.container2}>
        <CommonActions navigation={navigation} userId={currentUser?.id} />
        <CheckMembershipStatus />
        <View style={{ flex: 1 }}>
          {loader ? (
            <Loader />
          ) : (
            <ScrollView
              contentContainerStyle={[
                Styles.container,
                { justifyContent: 'center', paddingBottom: hp(8) },
              ]}
              showsVerticalScrollIndicator={false}
              automaticallyAdjustContentInsets
              keyboardShouldPersistTaps="always"
            >
              <Text style={Styles.heading}>{LanguageKeys.guardianInfo}</Text>
              <View style={Styles.firstNameLastNameCon}>
                <View style={Styles.inputFieldCon}>
                  <IconInput
                    label={LanguageKeys.firstName}
                    placeholder={LanguageKeys.enterFirstName}
                    icon={Images.user}
                    value={firstName}
                    onChangeText={onChangeFirstName}
                    inputStyle={{ width: wp(35) }}
                    outerLabelStyle={{ color: Colors.color2 }}
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
                    outerLabelStyle={{ color: Colors.color2 }}
                  />
                </View>
              </View>
              <View style={Styles.inputFieldCon}>
                <IconInput
                  label={LanguageKeys.email}
                  placeholder={LanguageKeys.email}
                  icon={Images.email}
                  value={email}
                  onChangeText={onChangeEmail}
                  outerLabelStyle={{ color: Colors.color2 }}
                />
              </View>
              <View style={Styles.inputFieldCon}>
                <RelationPicker
                  value={relation}
                  onSelect={onRelationChange}
                  outerLabelStyle={{ color: Colors.color2 }}
                  relations={relations}
                  setRelations={setRelations}
                />
              </View>
            </ScrollView>
          )}
        </View>
        <View style={Styles.continueBtnCon}>
          <Button
            text={LanguageKeys.skipForNow}
            onPress={onSkipPress}
            buttonStyle={Styles.skipBtn}
          />
          <Button
            text={LanguageKeys.continue}
            onPress={onAddWaliPress}
            disabled={
              checkEmpty(firstName) ||
              checkEmpty(lastName) ||
              checkEmpty(email) ||
              checkEmpty(relation)
            }
            loading={addWaliLoader}
            loadingMessage={
              guardian ? LanguageKeys.updating : LanguageKeys.adding
            }
          />
        </View>
      </SafeAreaView>
    </SlideShowContainer>
  );
};

export default AddWali;

const Styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: wp(4),
    paddingTop: 40,
  },
  inputFieldCon: {
    marginBottom: hp(3),
  },
  phoneNumberCon: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: Colors.color2,
    height: wp(11),
    alignItems: 'center',
    marginTop: hp(0.8),
  },
  flagBtnCon: {
    height: wp(11),
    minWidth: wp(18),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.color3,
    borderBottomWidth: 1,
    paddingLeft: wp(2),
  },
  flag: {
    fontSize: wp(8),
    includeFontPadding: false,
    alignSelf: 'center',
  },
  countryPickerTxt: {
    fontSize: Typography.small2,
    marginHorizontal: wp(0.5),
    includeFontPadding: false,
    fontFamily: Fonts.APPFONT_R,
    color: Colors.color1,
    alignSelf: 'center',
  },
  phoneNumberInput: {
    color: Colors.color1,
    height: wp(11),
    width: wp(70),
    paddingVertical: hp(1),
    fontSize: Typography.medium,
    fontFamily: Fonts.APPFONT_R,
    paddingHorizontal: wp(2),
    backgroundColor: Colors.color3,
    borderBottomWidth: 1,
  },
  inputLabel: {
    fontSize: Typography.medium,
    fontFamily: Fonts.APPFONT_M,
    color: Colors.color1,
    lineHeight: wp(5),
  },
  image: {
    width: wp(100),
    height: '100%',
  },
  container2: {
    position: 'absolute',
    height: '100%',
    width: wp(100),
    // paddingHorizontal: wp(2),
    // justifyContent: 'center',
    paddingVertical: hasNotch() && isIOS ? 20 : 0,
    zIndex: 1,
  },
  imageOuterView: {
    height: '100%',
    width: wp(100),
    position: 'absolute',
    zIndex: 1,
  },
  heading: {
    fontSize: Typography.large2,
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_B,
    includeFontPadding: false,
    marginBottom: hp(3),
  },
  firstNameLastNameCon: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  continueBtnCon: {
    marginBottom: hp(2),
    marginHorizontal: wp(2),
    gap: 10,
  },
  skipBtn: {
    backgroundColor: Colors.color1,
  },
});
