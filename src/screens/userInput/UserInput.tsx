import { getApp } from '@react-native-firebase/app';
import { getAuth, signOut } from '@react-native-firebase/auth';
import { CommonActions as CommonActionsNav } from '@react-navigation/native';
import _ from 'lodash';
import moment from 'moment';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import {
  Button,
  CheckMembershipStatus,
  Container,
  DateTimePicker,
  GenderPicker,
  Header,
  Loader,
} from '../../components';
import { hp } from '../../global';
import { LanguageKeys } from '../../languages';
import { CommonActions } from '../../navigation';
import { Colors, Images } from '../../res';
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
import AccountActions from './components/account-actions';
import NameInputFields from './components/name-input-fields';
import UserInfoDisplay from './components/user-info-display';
import UserInputHeader from './components/user-input-header';

const firebaseApp = getApp();
const auth = getAuth(firebaseApp);

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
  const { getData, deleteAll, storageKeys } = StorageManager;
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
  // const showCountryPicker = () => setCountryPickerVisible(true)
  // const hideCountryPicker = () => setCountryPickerVisible(false)

  // const onCountrySelection = (data: any) => {
  //     setSelectedCountry(data?.name)
  //     setCountryPickerVisible(false)
  // }

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
            routes: [{ name: 'ProfilePicture' }],
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
      const verificationId = await getData(
        storageKeys.FIREBASE_VERIFICATION_ID
      );
      StorageManager.setString(storageKeys.IS_RECOMMENDED, 'false');
      await ApiServices.logout().catch(() => {});
      await signOut(auth).catch(() => {});
      await deleteAll();
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
    } catch (error) {
      console.error('Error during logout:', error);
      hideLoader();
    }
  }, [
    getData,
    storageKeys.FIREBASE_VERIFICATION_ID,
    language,
    deleteAll,
    updateCurrentUser,
    hideLoader,
    props.navigation,
  ]);

  const onDeleteAccountPress = useCallback(() => {
    props.navigation.navigate('AccountDeletion');
  }, [props.navigation]);

  const scrollViewContentStyle = useMemo(() => [Styles.container], []);

  const labelColor = useMemo(
    () => (fromSettings ? Colors.color1 : Colors.color1),
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

  const renderContent = () => {
    if (loader) {
      return <Loader />;
    }

    return (
      <KeyboardAwareScrollView
        enableOnAndroid
        // enableAutomaticScroll
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={isIOS ? 20 : 10}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={scrollViewContentStyle}
      >
        {!fromSettings && <UserInputHeader />}
        <View style={Styles.inputFieldCon}>
          <NameInputFields
            firstName={firstName}
            lastName={lastName}
            onFirstNameChange={onChangeFirstName}
            onLastNameChange={onChangeLastName}
            fromSettings={fromSettings}
          />
        </View>

        <UserInfoDisplay
          user={currentUser as User}
          fromSettings={fromSettings}
        />

        <View style={Styles.inputFieldCon}>
          <DateTimePicker
            label={LanguageKeys.dateOfBirth}
            date={dateOfBirth}
            icon={Images.calender}
            mode="date"
            selectedDate={onDateOfBirthSelection}
            outerLabelStyle={{ color: labelColor }}
            disabled={fromSettings}
          />
        </View>
        <View style={Styles.inputFieldCon}>
          <GenderPicker
            value={gender}
            onSelect={onGenderChange}
            outerLabelStyle={{ color: labelColor }}
            disabled={fromSettings}
          />
        </View>
      </KeyboardAwareScrollView>
    );
  };

  if (fromSettings) {
    return (
      <Container style={Styles.container}>
        <Header
          title={LanguageKeys.basicSettings}
          navigation={props.navigation}
        />
        <CommonActions
          navigation={props.navigation}
          userId={(currentUser as User)?.id}
        />
        <CheckMembershipStatus />
        {renderContent()}
        <View style={Styles.continueBtnCon}>
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
      <View style={Styles.continueBtnCon}>
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
    paddingHorizontal: 16,
    justifyContent: 'center',
    backgroundColor: Colors.color2,
  },
  inputFieldCon: {
    marginBottom: hp(3),
  },
  continueBtnCon: {
    paddingHorizontal: 16,
  },
});
