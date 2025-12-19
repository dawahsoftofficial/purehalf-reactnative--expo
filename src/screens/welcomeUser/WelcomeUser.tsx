import React, { useEffect } from 'react';
import { BackHandler, Image, StatusBar, StyleSheet, View } from 'react-native';

import { Button, Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import { LanguageKeys } from '../../languages';
import { Colors, Fonts, Images } from '../../res';
import { useGlobalContext } from '../../services';

const WelcomeUser = (props: any) => {
  const { currentUser } = useGlobalContext();

  const onGetStartedPress = () => {
    if (
      currentUser?.membership_status === null ||
      currentUser?.membership_status === 0
    ) {
      props.navigation.reset({
        index: 0,
        routes: [
          {
            name: 'ProFeaturesPromotion',
            params: {
              navigateTo: 'BottomTab',
              from: 'SignUp',
            },
          },
        ],
      });
    } else if (currentUser?.membership_status) {
      props.navigation.reset({
        index: 0,
        routes: [
          {
            name: 'GiftMembershipCongrats',
            params: {
              navigateTo: 'BottomTab',
              from: 'SignUp',
            },
          },
        ],
      });
    } else {
      props.navigation.reset({
        index: 0,
        routes: [
          {
            name: 'BottomTab',
          },
        ],
      });
    }
  };

  useEffect(() => {
    const backAction = () => {
      onGetStartedPress();
      return true;
    };
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );
    return () => backHandler.remove();
  }, []);

  return (
    <View style={Styles.container}>
      <StatusBar
        translucent
        backgroundColor={'transparent'}
        barStyle={'light-content'}
      />
      <View style={Styles.contentContainer}>
        <View>
          {/* <Text style={Styles.bismillahText}>
            k
          </Text> */}
          <Image
            source={Images.bismillah}
            resizeMode="contain"
            style={Styles.bismillahImage}
          />
          <Text style={Styles.welcomeHeading}>
            {LanguageKeys.welcome} {currentUser?.first_name}!
          </Text>
          <Text style={Styles.description}>
            {`PureHalf is a Halal platform rooted in Islamic values, dedicated to fostering meaningful connections. Please engage respectfully and adhere to Islamic principles.<br/><br/>"Tell the believing men to lower their gaze and guard their modesty; that is purer for them. And tell the believing women to lower their gaze and guard their modesty..." - Surah An-Nur, 24:30.
            <br/>Failure to adhere to these guidelines may result in your account being banned.<br/><br/>By using this platform, you consent to uphold these principles with Allah as your witness.            `
              .split('<br/>')
              .join('\n')}
          </Text>
          <Text style={Styles.descriptionBold}>
            I commit to honor these teachings {"insha'Allah"}.
          </Text>
          <View style={Styles.finalTextContainer}>
            <Text style={Styles.finalText}>
              {currentUser?.first_name} {currentUser?.last_name}
            </Text>
          </View>
        </View>
        <View>
          <Button
            text={LanguageKeys.diveInAndExplore}
            onPress={onGetStartedPress}
          />
        </View>
      </View>
    </View>
  );
};

export default WelcomeUser;

const Styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: Colors.color2,
    paddingHorizontal: wp(5),
    paddingVertical: hp(3),
    paddingTop: hp(10),
    justifyContent: 'space-between',
  },
  bismillahText: {
    fontFamily: Fonts.APPFONT_Bismillah,
    fontSize: wp(17),
    color: Colors.color12,
    alignSelf: 'flex-end',
  },
  bismillahImage: { width: '100%', height: 80 },
  welcomeHeading: {
    color: Colors.color12,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.large2,
    marginTop: 10,
  },
  description: {
    color: Colors.color12,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small,
    marginBottom: 20,
    marginTop: 5,
  },
  descriptionBold: {
    color: Colors.color12,
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.large,
  },
  finalTextContainer: {
    marginTop: hp(3),
    borderBottomWidth: 0.5,
    borderColor: Colors.color18,
  },
  finalText: {
    color: Colors.color12,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.large3,
  },
});
