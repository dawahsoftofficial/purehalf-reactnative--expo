import { CommonActions as CommonActionsNav } from '@react-navigation/native';
import React, { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { Animation } from '../../animations';
import { Button, Container, ModalLoader, Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import { LanguageKeys } from '../../languages';
import { Colors, Fonts } from '../../res';
import { ApiServices, cleanupSession, useGlobalContext } from '../../services';

const AccountSuspended = (props: any) => {
  const [loading, setLoading] = useState(false);
  const { updateCurrentUser, language } = useGlobalContext();

  const hideLoader = () => setLoading(false);

  const onHelpAndSupportPress = () => {
    Linking.openURL('https://purehalf.com/support');
  };

  const onLogoutPress = async () => {
    setLoading(true);
    try {
      await ApiServices.logout().catch(() => {});
      await cleanupSession({ language });
      updateCurrentUser(null);
      props.navigation.dispatch(
        CommonActionsNav.reset({
          index: 1,
          routes: [{ name: 'AuthWelcome' }],
        })
      );
    } catch (err) {
      console.log({ err });
      hideLoader();
    }
  };

  return (
    <Container style={Styles.container}>
      <ModalLoader visible={loading} />
      <View style={Styles.logoContainer}>
        <MaterialCommunityIcons
          name="cancel"
          size={wp(50)}
          color={Colors.color60}
        />
      </View>
      <View style={Styles.contentContainer}>
        <Animation>
          <Text style={Styles.heading}>{LanguageKeys.accountSuspended}</Text>
          <Text style={Styles.description}>
            {LanguageKeys.accountSuspendedDes}
          </Text>
          <View style={Styles.continueBtnCon}>
            <Button
              text={LanguageKeys.contactSupport}
              onPress={onHelpAndSupportPress}
            />
            <Button
              text={LanguageKeys.logOut}
              onPress={onLogoutPress}
              loading={loading}
            />
          </View>
        </Animation>
      </View>
    </Container>
  );
};

export default AccountSuspended;

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
    gap: 10,
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
