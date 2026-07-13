import React, { useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Button,
  CheckMembershipStatus,
  Container,
  DeletePicker,
  Header,
  IconInput,
  SlideShowContainer,
  Text,
} from '../../components';
import { hp, Typography, wp } from '../../global';
import { LanguageKeys } from '../../languages';
import { CommonActions } from '../../navigation';
import { Colors, Fonts, Images } from '../../res';
import {
  ApiServices,
  checkEmpty,
  emailValidation,
  flashErrorMessage,
  flashSuccessMessage,
  StorageManager,
  useGlobalContext,
} from '../../services';

const AddWali = ({ navigation, route }: any) => {
  const { setData, storageKeys } = StorageManager;
  const { currentUser, updateCurrentUser } = useGlobalContext();
  const guardian = currentUser?.guardian ? currentUser?.guardian : false;
  const [email, setEmail] = useState(currentUser?.guardian?.email ?? '');
  const [addWaliLoader, setAddWaliLoader] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState(false);
  const fromSettings = route?.params?.fromSettings;

  // Re-derive the field during render (not in an effect) whenever the
  // underlying guardian record itself changes -- e.g. after a successful
  // add/remove refreshes currentUser.guardian from the server. Per-keystroke
  // edits still flow through onChangeEmail/setEmail as normal.
  const [syncedGuardianEmail, setSyncedGuardianEmail] = useState(
    currentUser?.guardian?.email
  );
  if (currentUser?.guardian?.email !== syncedGuardianEmail) {
    setSyncedGuardianEmail(currentUser?.guardian?.email);
    setEmail(currentUser?.guardian?.email ?? '');
  }

  const onChangeEmail = (text: string) => setEmail(text);

  const onAddWaliPress = async () => {
    if (!emailValidation(email)) {
      flashErrorMessage(LanguageKeys.invalidEmailError);
      return;
    }

    setAddWaliLoader(true);
    const params = {
      email: email?.toLowerCase().trim(),
    };

    ApiServices.addWaliInformation(params)
      .then(async () => {
        ApiServices.getCurrentUserDetail()
          .then(async (res) => {
            updateCurrentUser(res);
            await setData(storageKeys.USER, currentUser);
          })
          .catch(async () => {
            const updatedUser = {
              ...currentUser,
              guardian: params,
            };
            updateCurrentUser(updatedUser);
            await setData(storageKeys.USER, updatedUser);
          });

        setAddWaliLoader(false);

        if (email === guardian?.email) {
          flashSuccessMessage(LanguageKeys.informationUpdated);
        } else if (fromSettings) {
          flashSuccessMessage(LanguageKeys.waliAdded);
          navigation.goBack();
        } else {
          flashSuccessMessage(LanguageKeys.waliAdded);
          navigation.reset({
            index: 0,
            routes: [{ name: 'WelcomeUser' }],
          });
        }
      })
      .catch(() => {
        setAddWaliLoader(false);
      });
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
        await ApiServices.getCurrentUserDetail()
          .then(async (res) => {
            updateCurrentUser(res);
            await setData(storageKeys.USER, res);
          })
          .catch(async () => {
            const updatedUser = {
              ...currentUser,
              guardian: null,
            };
            updateCurrentUser(updatedUser);
            await setData(storageKeys.USER, updatedUser);
          });

        setAddWaliLoader(false);
        hideDeleteAlert();

        flashSuccessMessage(LanguageKeys.informationUpdated);
      })
      .catch(() => {
        setAddWaliLoader(false);
      });
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
        <ScrollView
          contentContainerStyle={Styles.container}
          showsVerticalScrollIndicator={false}
          automaticallyAdjustContentInsets
          keyboardShouldPersistTaps="always"
        >
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
        </ScrollView>
      </View>

      <Button
        text={guardian ? LanguageKeys.updateWaliInfo : LanguageKeys.addWali}
        buttonStyle={{ marginHorizontal: wp(4), marginBottom: 10 }}
        onPress={onAddWaliPress}
        disabled={checkEmpty(email)}
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
          disabled={checkEmpty(email)}
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

      <SafeAreaView style={Styles.container2}>
        <CommonActions navigation={navigation} userId={currentUser?.id} />
        <CheckMembershipStatus />
        <View style={{ flex: 1 }}>
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
          </ScrollView>
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
            disabled={checkEmpty(email)}
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
  container2: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: Colors.color2,
  },
  heading: {
    fontSize: Typography.large2,
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_B,
    includeFontPadding: false,
    marginBottom: hp(3),
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
