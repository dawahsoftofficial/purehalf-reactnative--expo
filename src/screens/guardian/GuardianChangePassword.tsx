import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { Button, Container, Header, IconInput } from '../../components';
import { hp, wp } from '../../global';
import { LanguageKeys } from '../../languages';
import { Images } from '../../res';
import {
  ApiServices,
  checkEmpty,
  flashErrorMessage,
  flashSuccessMessage,
} from '../../services';

const GuardianChangePassword = ({ navigation }: any) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loader, setLoader] = useState(false);

  const onChangeOldPassword = (text: string) => setOldPassword(text);
  const onChangeNewPassword = (text: string) => setNewPassword(text);
  const onChangeConfirmNewPassword = (text: string) =>
    setConfirmNewPassword(text);

  const onChangePasswordPress = async () => {
    const oldPasswordTrimmed = oldPassword.trim();
    const newPasswordTrimmed = newPassword.trim();
    const confirmNewPasswordTrimmed = confirmNewPassword.trim();

    if (
      oldPasswordTrimmed.length < 8 ||
      newPasswordTrimmed.length < 8 ||
      confirmNewPasswordTrimmed.length < 8
    ) {
      flashErrorMessage(LanguageKeys.passwordLengthError);
    } else {
      setLoader(true);
      const params = {
        old_password: oldPassword,
        password: newPassword,
        confirm_password: confirmNewPassword,
      };
      try {
        await ApiServices.changeGuardianPassword(params);
        flashSuccessMessage(LanguageKeys.passwordChanged);
      } finally {
        setLoader(false);
      }
    }
  };

  return (
    <Container>
      <Header title={LanguageKeys.changePassword} navigation={navigation} />
      <KeyboardAvoidingView
        behavior={'height'}
        style={{ flexGrow: 1 }}
        keyboardVerticalOffset={hp(2)}
      >
        <View style={Styles.container}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={Styles.innerCon}>
              <View style={Styles.inputFieldCon}>
                <IconInput
                  label={LanguageKeys.oldPassword}
                  placeholder={LanguageKeys.enterOldPassword}
                  icon={Images.lock}
                  value={oldPassword}
                  onChangeText={onChangeOldPassword}
                />
              </View>
              <View style={Styles.inputFieldCon}>
                <IconInput
                  label={LanguageKeys.newPassword}
                  placeholder={LanguageKeys.enterNewPassword}
                  icon={Images.lock}
                  value={newPassword}
                  onChangeText={onChangeNewPassword}
                  secureTextEntry={true}
                />
              </View>
              <View style={Styles.inputFieldCon}>
                <IconInput
                  label={LanguageKeys.confirmNewPassword}
                  placeholder={LanguageKeys.confirmNewPassword}
                  icon={Images.lock}
                  value={confirmNewPassword}
                  onChangeText={onChangeConfirmNewPassword}
                  secureTextEntry={true}
                />
              </View>
            </View>
          </ScrollView>
          <Button
            text={LanguageKeys.changePassword}
            disabled={
              checkEmpty(oldPassword) ||
              checkEmpty(newPassword) ||
              checkEmpty(confirmNewPassword)
            }
            loading={loader}
            loadingMessage={LanguageKeys.changingPassword}
            onPress={onChangePasswordPress}
          />
        </View>
      </KeyboardAvoidingView>
    </Container>
  );
};

export default GuardianChangePassword;

const Styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: wp(4),
    justifyContent: 'space-between',
  },
  innerCon: {
    flex: 1,
  },
  inputFieldCon: {
    marginBottom: 25,
  },
});
