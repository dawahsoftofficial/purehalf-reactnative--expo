/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';

import { Button, Container, Header, Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import { CheckRtl, LanguageKeys } from '../../languages';
import { Colors, Fonts } from '../../res';
import {
  flashErrorMessage,
  flashSuccessMessage,
  StorageManager,
  useGlobalContext,
} from '../../services';
import { updateDetails } from './Funtions';

type InterestItem = { id: string; value: string; selected?: boolean };

const EditInterests = ({ navigation, route }: any) => {
  const { data = [] } = (route?.params ?? {}) as { data?: InterestItem[] };
  const Rtl = CheckRtl();
  const { currentUser, updateCurrentUser } = useGlobalContext();
  const { setData, storageKeys } = StorageManager;
  const [ids, setIds] = useState<string[]>([]);
  const [updateLoader, setUpdateLoader] = useState(false);

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
      <Text style={Styles.subtitle}>
        {`${LanguageKeys.interestAndHobbiesLimit}`}
      </Text>
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
                {item?.value}
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
  subtitle: {
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    color: Colors.muted,
    paddingHorizontal: wp(4),
    paddingTop: hp(1),
    paddingBottom: hp(0.5),
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
