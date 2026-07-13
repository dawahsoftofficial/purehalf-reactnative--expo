/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';

import { Container, Header } from '../../components';
import { LanguageKeys } from '../../languages';
import { Colors } from '../../res';
import {
  ApiServices,
  flashSuccessMessage,
  StorageManager,
  useGlobalContext,
} from '../../services';
import ProfileQuestionWizard from './components/profile-question-wizard';
import { updateDetails } from './Funtions';
import {
  type FieldVisibilityLevel,
  normalizeProfilePrivacyKey,
  type ProfileFieldVisibility,
  type ProfilePrivacyResponse,
} from './profile-privacy';

const EditProfileGroup = ({ navigation, route }: any) => {
  const { title = '', data: initialData = [] } = route?.params ?? {};
  const { currentUser, updateCurrentUser } = useGlobalContext();
  const { setData, storageKeys } = StorageManager;
  const [saving, setSaving] = useState(false);
  const [privacyUpdatingField, setPrivacyUpdatingField] = useState('');
  const [profileFieldVisibility, setProfileFieldVisibility] =
    useState<ProfileFieldVisibility>(
      currentUser?.detail?.profile_field_visibility ?? {}
    );

  const onPrivacyChange = useCallback(
    (apiKey: string, next: FieldVisibilityLevel) => {
      const field = normalizeProfilePrivacyKey(apiKey);
      if (!field || privacyUpdatingField) return;

      const previous = profileFieldVisibility[field] ?? 'public';
      const optimistic = { ...profileFieldVisibility, [field]: next };
      setProfileFieldVisibility(optimistic);
      setPrivacyUpdatingField(field);

      ApiServices.updateProfilePrivacy({ visibility: { [field]: next } })
        .then(async (result: ProfilePrivacyResponse) => {
          const savedVisibility =
            result?.profile_field_visibility ?? optimistic;
          const updatedUser = {
            ...currentUser,
            detail: {
              ...(currentUser?.detail ?? {}),
              profile_field_visibility: savedVisibility,
            },
          };

          setProfileFieldVisibility(savedVisibility);
          updateCurrentUser(updatedUser);
          await setData(storageKeys.USER, updatedUser);
          flashSuccessMessage(LanguageKeys.updated);
        })
        .catch(() => {
          setProfileFieldVisibility({
            ...profileFieldVisibility,
            [field]: previous,
          });
        })
        .finally(() => setPrivacyUpdatingField(''));
    },
    [
      currentUser,
      privacyUpdatingField,
      profileFieldVisibility,
      setData,
      storageKeys.USER,
      updateCurrentUser,
    ]
  );

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
        profileFieldVisibility={profileFieldVisibility}
        privacyUpdatingField={privacyUpdatingField}
        onPrivacyChange={onPrivacyChange}
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
