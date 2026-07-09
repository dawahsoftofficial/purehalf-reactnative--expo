import { CommonActions as CommonActionsNav } from '@react-navigation/native';
import _ from 'lodash';
import moment from 'moment';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Ionicons from 'react-native-vector-icons/Ionicons';

import {
  Button,
  CheckMembershipStatus,
  Container,
  DateTimePicker,
  GenderPicker,
  Header,
  Loader,
  Text,
} from '../../components';
import { hp, Typography, wp } from '../../global';
import { LanguageKeys } from '../../languages';
import { CommonActions } from '../../navigation';
import { Colors, Fonts, Images } from '../../res';
import {
  ApiServices,
  checkEmpty,
  cleanupSession,
  flashErrorMessage,
  flashSuccessMessage,
  isIOS,
  StorageManager,
  useGlobalContext,
} from '../../services';
import AccountActions from './components/account-actions';
import NameInputFields from './components/name-input-fields';
import UserInputHeader from './components/user-input-header';

type Language = {
  id: number | string;
  short_code?: string;
  [key: string]: unknown;
};

type User = {
  id?: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  gender?: string;
  phone_number?: string;
  email?: string;
  primary_image_to_show?: string;
  [key: string]: unknown;
};

type UpdateUserInfoParams = {
  first_name: string;
  last_name: string;
  gender: string;
  date_of_birth: string;
  interface_language_id: number;
  in_app_notifications: number;
};

type UserInputProps = {
  navigation: {
    reset: (config: { index: number; routes: Array<{ name: string }> }) => void;
    navigate: (screen: string) => void;
    dispatch: (action: unknown) => void;
  };
  route?: {
    params?: {
      fromSettings?: boolean;
    };
  };
};

function UserInput(props: UserInputProps) {
  const fromSettings = props?.route?.params?.fromSettings ?? false;

  const { updateCurrentUser, currentUser, language } = useGlobalContext();
  const { getData, storageKeys } = StorageManager;
  const [languageId, setLanguageId] = useState<number | null>(null);
  const [submitLoader, setSubmitLoader] = useState(false);
  const [loaderMessage, setLoaderMessage] = useState('Submitting...');
  const [loader, setLoader] = useState(fromSettings);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | string>('');
  const [gender, setGender] = useState('');

  const onChangeFirstName = useCallback((text: string) => {
    setFirstName(text);
  }, []);

  const onChangeLastName = useCallback((text: string) => {
    setLastName(text);
  }, []);

  const onDateOfBirthSelection = useCallback((date: Date) => {
    setDateOfBirth(date);
  }, []);

  const onGenderChange = useCallback((value: string) => {
    setGender(value);
  }, []);

  const hideLoader = useCallback(() => {
    setSubmitLoader(false);
  }, []);

  const onContinuePress = useCallback(() => {
    if (!dateOfBirth || typeof dateOfBirth === 'string') {
      return;
    }

    const age = moment().diff(
      moment(dateOfBirth).format('YYYY-MM-DD'),
      'years'
    );
    if (age < 18) {
      flashErrorMessage(LanguageKeys.ageLimit);
      return;
    }

    const params: UpdateUserInfoParams = {
      first_name: firstName,
      last_name: lastName,
      gender: gender,
      date_of_birth: moment(dateOfBirth).format('YYYY-MM-DD'),
      interface_language_id: languageId ?? 1,
      in_app_notifications: 1,
    };

    if (fromSettings) {
      setLoaderMessage(LanguageKeys.updating);
    }
    setSubmitLoader(true);

    ApiServices.updateUserInfo(params)
      .then(async (res: unknown) => {
        if (fromSettings) {
          flashSuccessMessage();
        }
        if (res) {
          const userData: User = {
            ...(currentUser as User),
            ...(res as User),
          };
          updateCurrentUser(userData);
          const { setData } = StorageManager;
          await setData(storageKeys.USER, userData);
        }

        if (!fromSettings) {
          props.navigation.reset({
            index: 0,
            routes: [{ name: 'OnboardingProfile' }],
          });
        }
        setSubmitLoader(false);
      })
      .catch(() => {
        hideLoader();
      });
  }, [
    dateOfBirth,
    firstName,
    lastName,
    gender,
    languageId,
    fromSettings,
    currentUser,
    updateCurrentUser,
    storageKeys.USER,
    props.navigation,
    hideLoader,
  ]);

  const initializeUserData = useCallback(() => {
    if (currentUser) {
      const user = currentUser as User;
      const { first_name, last_name, date_of_birth, gender: userGender } = user;
      if (first_name) {
        setFirstName(first_name);
      }
      if (last_name) {
        setLastName(last_name);
      }
      if (date_of_birth) {
        setDateOfBirth(new Date(date_of_birth));
      }
      if (userGender) {
        setGender(
          userGender.toLowerCase() === 'male'
            ? LanguageKeys.male
            : LanguageKeys.female
        );
      }
    }
    setLoader(false);
  }, [currentUser]);

  const getLanguages = useCallback(async () => {
    try {
      const storedLanguage = await getData(storageKeys.LANGUAGE);
      if (!storedLanguage) {
        return;
      }

      const languages = (await ApiServices.getLanguages()) as Language[];
      if (languages?.length > 0) {
        const result = _.find(languages, (n: Language) => {
          return (
            n.short_code?.toLowerCase() ===
            (storedLanguage as string).toLowerCase()
          );
        });
        if (result?.id) {
          setLanguageId(result.id as number);
        }
      }
    } catch (error) {
      console.error('Error fetching languages:', error);
    }
  }, [getData, storageKeys]);

  useEffect(() => {
    const timer = setTimeout(() => {
      initializeUserData();
      getLanguages();
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, [initializeUserData, getLanguages]);

  const onLogoutPress = useCallback(async () => {
    try {
      await ApiServices.logout().catch(() => {});
      await cleanupSession({ language });
      updateCurrentUser(null);
      hideLoader();
      props.navigation.dispatch(
        CommonActionsNav.reset({
          index: 1,
          routes: [{ name: 'AuthWelcome' }],
        })
      );
    } catch (error) {
      console.error('Error during logout:', error);
      hideLoader();
    }
  }, [language, updateCurrentUser, hideLoader, props.navigation]);

  const onDeleteAccountPress = useCallback(() => {
    props.navigation.navigate('AccountDeletion');
  }, [props.navigation]);

  const scrollViewContentStyle = useMemo(
    () => ({
      flexGrow: 1,
      justifyContent: 'flex-start' as const,
      paddingHorizontal: fromSettings ? 0 : wp(4),
      paddingTop: fromSettings ? hp(2) : hp(3),
      paddingBottom: hp(2),
    }),
    [fromSettings]
  );

  const isButtonDisabled = useMemo(() => {
    const hasValidDate =
      dateOfBirth && typeof dateOfBirth !== 'string'
        ? !isNaN(Date.parse(dateOfBirth.toString()))
        : false;
    return (
      checkEmpty(firstName) ||
      checkEmpty(lastName) ||
      !hasValidDate ||
      checkEmpty(gender)
    );
  }, [firstName, lastName, dateOfBirth, gender]);

  const buttonText = useMemo(
    () => (fromSettings ? LanguageKeys.update : LanguageKeys.continue),
    [fromSettings]
  );

  const renderIdentity = () => {
    const u = currentUser as User;
    const fullName = `${u?.first_name ?? ''} ${u?.last_name ?? ''}`.trim();
    const contact = u?.phone_number || u?.email || '';
    if (!fullName && !contact) {
      return null;
    }
    return (
      <View style={Styles.identityCon}>
        {fullName ? (
          <Text variant="display" style={Styles.identityName}>
            {fullName}
          </Text>
        ) : null}
        {contact ? <Text style={Styles.identityContact}>{contact}</Text> : null}
      </View>
    );
  };

  const renderContent = () => {
    if (loader) {
      return <Loader />;
    }

    return (
      <KeyboardAwareScrollView
        enableOnAndroid
        enableAutomaticScroll
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={isIOS ? 100 : 80}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={scrollViewContentStyle}
        keyboardOpeningTime={0}
        style={Styles.scrollView}
      >
        {!fromSettings && <UserInputHeader />}
        {fromSettings && renderIdentity()}
        <View style={fromSettings ? Styles.formCard : Styles.formCardSignup}>
          <View style={Styles.inputFieldCon}>
            <NameInputFields
              firstName={firstName}
              lastName={lastName}
              onFirstNameChange={onChangeFirstName}
              onLastNameChange={onChangeLastName}
              fromSettings={fromSettings}
            />
          </View>

          <View style={Styles.inputFieldCon}>
            <DateTimePicker
              label={LanguageKeys.dateOfBirth}
              date={dateOfBirth}
              icon={Images.calender}
              mode="date"
              selectedDate={onDateOfBirthSelection}
              outerLabelStyle={{ color: Colors.ink }}
              disabled={fromSettings}
            />
          </View>
          <View style={Styles.lastFieldCon}>
            <GenderPicker
              value={gender}
              onSelect={onGenderChange}
              outerLabelStyle={{ color: Colors.ink }}
              disabled={fromSettings}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>
    );
  };

  if (fromSettings) {
    return (
      <Container
        style={[Styles.container, fromSettings && { paddingHorizontal: wp(4) }]}
      >
        <Header
          title={LanguageKeys.basicSettings}
          navigation={props.navigation}
          containerStyle={{ paddingHorizontal: 0 }}
          titleVariant="display"
        />
        <CommonActions
          navigation={props.navigation}
          userId={(currentUser as User)?.id}
        />
        <CheckMembershipStatus />
        {renderContent()}
        <View style={Styles.buttonContainer}>
          <Button
            text={buttonText}
            onPress={onContinuePress}
            disabled={isButtonDisabled}
            loading={submitLoader}
            loadingMessage={loaderMessage}
          />
        </View>
        <AccountActions
          onLogoutPress={onLogoutPress}
          onDeleteAccountPress={onDeleteAccountPress}
        />
      </Container>
    );
  }

  return (
    <Container>
      <CommonActions
        navigation={props.navigation}
        userId={(currentUser as User)?.id}
      />
      <CheckMembershipStatus />
      {renderContent()}
      <View style={Styles.buttonContainer}>
        <View style={Styles.privacyRow}>
          <Ionicons name="lock-closed" size={wp(3.6)} color={Colors.muted} />
          <Text style={Styles.privacyText}>{LanguageKeys.detailsPrivate}</Text>
        </View>
        <Button
          text={buttonText}
          onPress={onContinuePress}
          disabled={isButtonDisabled}
          loading={submitLoader}
          loadingMessage={loaderMessage}
        />
      </View>
    </Container>
  );
}

export default UserInput;

const Styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBg,
  },
  scrollView: {
    flex: 1,
  },
  identityCon: {
    alignItems: 'center',
    marginBottom: hp(3),
  },
  identityName: {
    color: Colors.ink,
    fontSize: Typography.large1,
    textAlign: 'center',
  },
  identityContact: {
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    marginTop: hp(0.3),
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.hairline,
    paddingHorizontal: wp(4),
    paddingTop: hp(3),
    paddingBottom: hp(1),
  },
  formCardSignup: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.hairline,
    paddingHorizontal: wp(4.5),
    paddingTop: hp(3),
    paddingBottom: hp(1.5),
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(1.5),
  },
  privacyText: {
    marginLeft: wp(1.5),
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small,
    includeFontPadding: false,
  },
  inputFieldCon: {
    marginBottom: hp(3),
  },
  lastFieldCon: {
    marginBottom: hp(0.5),
  },
  buttonContainer: {
    paddingHorizontal: wp(4),
    paddingTop: hp(1.5),
    paddingBottom: hp(1.5),
    backgroundColor: Colors.appBg,
  },
});
