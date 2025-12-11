import {
  View,
  Image,
  ImageBackground,
  StatusBar,
  BackHandler,
  StyleSheet,
} from 'react-native';
import React, { useEffect } from 'react';

import { Button, Text } from '../../components';
import { Images, Colors, Fonts } from '../../res';
import { Animation } from '../../animations';
import { LanguageKeys } from '../../languages';
import { hp, wp, Typography } from '../../global';

const GiftMembershipCongrats = (props: any) => {
  const onGetStartedPress = () => {
    props.navigation.reset({
      index: 0,
      routes: [{ name: 'BottomTab' }],
    });
  };

  useEffect(() => {
    const backAction = () => {
      onGetStartedPress();
      return true;
    };
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );
    return () => backHandler.remove();
  }, []);

  return (
    <ImageBackground source={Images.slide4} style={Styles.container}>
      <StatusBar
        translucent
        backgroundColor={'transparent'}
        barStyle={'light-content'}
      />
      <View style={Styles.contentContainer}>
        <View style={Styles.iconContainer}>
          <Animation animation="zoomIn">
            <Image
              source={Images.congrats}
              resizeMode="contain"
              style={Styles.icon}
            />
          </Animation>
          <Text style={Styles.giftHeading}>
            {LanguageKeys.giftProUserSuccessHeading}
          </Text>
        </View>
        <Animation style={Styles.buttonDescriptionSecion}>
          <Text style={Styles.heading}>
            {LanguageKeys.proUserSuccessHeading}
          </Text>
          <Text style={Styles.description}>
            {LanguageKeys.membershipUpgradeMsg}
          </Text>
          <Button
            text={LanguageKeys.diveInAndExplore}
            onPress={onGetStartedPress}
          />
        </Animation>
      </View>
    </ImageBackground>
  );
};

export default GiftMembershipCongrats;

const Styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: Colors.blackRGBA70,
    paddingHorizontal: wp(4),
  },
  iconContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 180,
    height: 180,
  },
  giftHeading: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_B,
    includeFontPadding: false,
    fontSize: Typography.large,
    alignSelf: 'center',
    textAlign: 'center',
    paddingTop: hp(5),
    width: wp(80),
  },
  buttonDescriptionSecion: {
    paddingBottom: hp(3),
  },
  heading: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_B,
    includeFontPadding: false,
    fontSize: Typography.large,
    alignSelf: 'center',
    textAlign: 'center',
  },
  description: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_R,
    includeFontPadding: false,
    fontSize: Typography.small2,
    alignSelf: 'center',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
});
