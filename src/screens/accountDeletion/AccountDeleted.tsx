import { getApp } from '@react-native-firebase/app';
import { getAuth, signOut } from '@react-native-firebase/auth';
import { CommonActions } from '@react-navigation/native';
import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { Animation } from '../../animations';
import { Button, Container, ModalLoader, Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import { LanguageKeys } from '../../languages';
import { Colors, Fonts, Images } from '../../res';
import { StorageManager, useGlobalContext } from '../../services';

const firebaseApp = getApp();
const auth = getAuth(firebaseApp);

const AccountDeleted = (props: any) => {
  const { deleteAll, setData, storageKeys } = StorageManager;
  const [loading, setLoading] = useState(false);
  const { updateCurrentUser, language } = useGlobalContext();

  const hideLoader = () => setLoading(false);

  const onContinuePress = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      await deleteAll().then(async () => {
        updateCurrentUser(null);
        await setData(storageKeys.LANGUAGE, language);
        hideLoader();
        props.navigation.dispatch(
          CommonActions.reset({
            index: 1,
            routes: [{ name: 'AuthWelcome' }],
          })
        );
      });
    } catch {
      await deleteAll().then(async () => {
        updateCurrentUser(null);
        await setData(storageKeys.LANGUAGE, language);
        hideLoader();
        props.navigation.dispatch(
          CommonActions.reset({
            index: 1,
            routes: [{ name: 'AuthWelcome' }],
          })
        );
      });
    }
  };

  return (
    <Container style={Styles.container}>
      <ModalLoader visible={loading} />
      <View style={Styles.logoContainer}>
        <Image
          source={Images.logoColoured}
          resizeMode="contain"
          style={Styles.logo}
        />
      </View>
      <View style={Styles.contentContainer}>
        <Animation>
          <Text style={Styles.heading}>{LanguageKeys.accountDeleted}</Text>
          <Text style={Styles.description}>
            {LanguageKeys.accountDeletedDes}
          </Text>
          <View style={Styles.continueBtnCon}>
            <Button text={LanguageKeys.continue} onPress={onContinuePress} />
          </View>
        </Animation>
      </View>
    </Container>
  );
};

export default AccountDeleted;

const Styles = StyleSheet.create({
  container: {
    justifyContent: 'flex-end',
    paddingHorizontal: wp(4),
  },
  logoContainer: {
    height: '66%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: wp(60),
    height: hp(25),
  },
  contentContainer: {
    height: '34%',
    justifyContent: 'flex-end',
  },
  continueBtnCon: {
    marginBottom: hp(3),
  },
  description: {
    marginBottom: hp(3),
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    lineHeight: wp(5),
  },
  heading: {
    marginBottom: hp(1),
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.large1,
    lineHeight: wp(7),
  },
});
