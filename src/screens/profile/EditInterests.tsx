/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import Entypo from 'react-native-vector-icons/Entypo';

import { Button, Container, Header, Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import { CheckRtl, LanguageKeys } from '../../languages';
import { stripLeadingEmoji } from '../../lib/utils/profile-utils';
import { Colors, Fonts } from '../../res';
import {
  ApiServices,
  flashErrorMessage,
  flashSuccessMessage,
  StorageManager,
  useGlobalContext,
} from '../../services';
import { updateDetails } from './Funtions';
import {
  type FieldVisibilityLevel,
  type ProfilePrivacyResponse,
} from './profile-privacy';

type InterestItem = { id: string; value: string; selected?: boolean };

const PRIVACY_FIELD = 'interest_id';

const EditInterests = ({ navigation, route }: any) => {
  const { data = [] } = (route?.params ?? {}) as { data?: InterestItem[] };
  const { t } = useTranslation();
  const Rtl = CheckRtl();
  const { currentUser, updateCurrentUser } = useGlobalContext();
  const { setData, storageKeys } = StorageManager;
  const [ids, setIds] = useState<string[]>([]);
  const [updateLoader, setUpdateLoader] = useState(false);
  const [visibility, setVisibility] = useState<FieldVisibilityLevel>(
    currentUser?.detail?.profile_field_visibility?.[PRIVACY_FIELD] === 'private'
      ? 'private'
      : 'public'
  );
  const [privacyUpdating, setPrivacyUpdating] = useState(false);
  const isVisible = visibility !== 'private';

  useEffect(() => {
    setIds(data.filter((item) => item?.selected).map((item) => item?.id));
  }, [data]);

  const toggleId = useCallback((interestId: string) => {
    setIds((prev) => {
      const index = prev.indexOf(interestId);
      if (index !== -1) {
        return [...prev.slice(0, index), ...prev.slice(index + 1)];
      }
      if (prev.length >= 10) {
        flashErrorMessage(LanguageKeys.interestAndHobbiesLimit);
        return prev;
      }
      return [...prev, interestId];
    });
  }, []);

  const onPrivacyToggle = useCallback(() => {
    if (privacyUpdating) return;
    const previous = visibility;
    const next: FieldVisibilityLevel = isVisible ? 'private' : 'public';
    setVisibility(next);
    setPrivacyUpdating(true);

    ApiServices.updateProfilePrivacy({ visibility: { [PRIVACY_FIELD]: next } })
      .then(async (result: ProfilePrivacyResponse) => {
        const savedForField =
          result?.profile_field_visibility?.[PRIVACY_FIELD] ?? next;
        setVisibility(savedForField);
        // Merge the server's map over the existing one instead of replacing
        // it, and pin the field we just toggled. The privacy endpoint can
        // echo a map that omits interest_id; a blind replace would drop the
        // change we just made, so re-opening this screen would show the
        // field as visible again.
        const mergedVisibility = {
          ...(currentUser?.detail?.profile_field_visibility ?? {}),
          ...(result?.profile_field_visibility ?? {}),
          [PRIVACY_FIELD]: savedForField,
        };
        const updatedUser = {
          ...currentUser,
          detail: {
            ...(currentUser?.detail ?? {}),
            profile_field_visibility: mergedVisibility,
          },
        };
        updateCurrentUser(updatedUser);
        await setData(storageKeys.USER, updatedUser);
      })
      .catch(() => setVisibility(previous))
      .finally(() => setPrivacyUpdating(false));
  }, [
    currentUser,
    isVisible,
    privacyUpdating,
    setData,
    storageKeys.USER,
    updateCurrentUser,
    visibility,
  ]);

  const onSavePress = useCallback(async () => {
    setUpdateLoader(true);
    updateDetails({ interestAndHobbies: ids })
      .then(async (res: any) => {
        if (res && Object.keys(res).length !== 0) {
          const updatedUser = { ...currentUser, detail: res };
          await setData(storageKeys.USER, updatedUser);
          updateCurrentUser(updatedUser);
        }
        flashSuccessMessage();
        setUpdateLoader(false);
        navigation.goBack();
      })
      .catch(() => setUpdateLoader(false));
  }, [
    currentUser,
    ids,
    navigation,
    setData,
    storageKeys.USER,
    updateCurrentUser,
  ]);

  return (
    <Container style={Styles.screen}>
      <Header
        title={LanguageKeys.myInterestAndHobbies}
        navigation={navigation}
        titleVariant="display"
      />
      <View style={Styles.subHead}>
        <Text style={Styles.subtitle}>
          {`${t(LanguageKeys.interestAndHobbiesLimit)} · ${ids.length}/10`}
        </Text>
        <Ripple
          testID={`profile-privacy-toggle-${PRIVACY_FIELD}`}
          onPress={onPrivacyToggle}
          disabled={privacyUpdating}
          rippleColor={Colors.primary}
          style={[
            Styles.privacyToggle,
            Rtl && { flexDirection: 'row-reverse' },
          ]}
        >
          <Entypo
            name={isVisible ? 'eye' : 'eye-with-line'}
            size={wp(3.6)}
            color={Colors.primary}
          />
          <Text style={Styles.privacyToggleTxt}>
            {isVisible ? LanguageKeys.hideField : LanguageKeys.unhideField}
          </Text>
        </Ripple>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          Styles.pills,
          { flexDirection: Rtl ? 'row-reverse' : 'row' },
        ]}
      >
        {data?.map((item) => {
          const isSelected = ids.includes(item?.id);
          return (
            <Ripple
              key={item?.id}
              onPress={() => toggleId(item?.id)}
              style={[Styles.pill, isSelected && Styles.pillOn]}
            >
              <Text style={[Styles.pillTxt, isSelected && Styles.pillTxtOn]}>
                {stripLeadingEmoji(item?.value ?? '')}
              </Text>
            </Ripple>
          );
        })}
      </ScrollView>
      <View style={Styles.footer}>
        <Button
          text={LanguageKeys.update}
          onPress={updateLoader ? undefined : onSavePress}
          disabled={updateLoader}
          loading={updateLoader}
          loadingMessage={LanguageKeys.updating}
        />
      </View>
    </Container>
  );
};

export default EditInterests;

const Styles = StyleSheet.create({
  screen: {
    backgroundColor: Colors.appBg,
  },
  subHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: wp(3),
    paddingHorizontal: wp(4),
    paddingTop: hp(1),
    paddingBottom: hp(0.5),
  },
  subtitle: {
    flex: 1,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    color: Colors.muted,
  },
  privacyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
    paddingVertical: hp(0.7),
    paddingHorizontal: wp(3),
    borderRadius: 999,
    backgroundColor: Colors.lavender,
  },
  privacyToggleTxt: {
    alignSelf: 'center',
    color: Colors.primary,
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small2,
    includeFontPadding: false,
  },
  pills: {
    flexWrap: 'wrap',
    paddingHorizontal: wp(3),
    paddingTop: hp(1),
    paddingBottom: hp(3),
  },
  pill: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.1),
    margin: hp(0.6),
    borderRadius: 999,
    backgroundColor: Colors.lavender,
  },
  pillOn: {
    backgroundColor: Colors.primary,
  },
  pillTxt: {
    color: Colors.ink,
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small1,
  },
  pillTxtOn: {
    color: Colors.color2,
  },
  footer: {
    paddingHorizontal: wp(4),
    paddingTop: hp(1.5),
    paddingBottom: hp(2),
    backgroundColor: Colors.appBg,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
  },
});
