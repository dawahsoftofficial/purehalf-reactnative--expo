/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';

import { Container, Header } from '../../components';
import { LanguageKeys } from '../../languages';
import { Colors } from '../../res';
import {
  flashSuccessMessage,
  StorageManager,
  useGlobalContext,
} from '../../services';
import ProfileQuestionWizard from './components/profile-question-wizard';
import { updateDetails } from './Funtions';

const EditProfileGroup = ({ navigation, route }: any) => {
  const { title = '', data: initialData = [] } = route?.params ?? {};
  const { currentUser, updateCurrentUser } = useGlobalContext();
  const { setData, storageKeys } = StorageManager;
  const [saving, setSaving] = useState(false);

  const onComplete = useCallback(
    (formData: any[]) => {
      setSaving(true);
      updateDetails(formData)
        .then(async (res: any) => {
          if (res && Object.keys(res).length !== 0) {
            const updatedUser = { ...currentUser, detail: res };
            await setData(storageKeys.USER, updatedUser);
            updateCurrentUser(updatedUser);
          }
          flashSuccessMessage();
          setSaving(false);
          navigation.goBack();
        })
        .catch(() => setSaving(false));
    },
    [currentUser, navigation, setData, storageKeys.USER, updateCurrentUser]
  );

  return (
    <Container style={Styles.screen}>
      <Header title={title} navigation={navigation} titleVariant="display" />
      <ProfileQuestionWizard
        fields={initialData}
        gender={currentUser?.gender}
        saving={saving}
        finalLabel={LanguageKeys.update}
        onComplete={onComplete}
      />
    </Container>
  );
};

export default EditProfileGroup;

const Styles = StyleSheet.create({
  screen: {
    backgroundColor: Colors.appBg,
  },
});
