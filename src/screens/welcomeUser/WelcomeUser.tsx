import React from 'react';
import { Image, StyleSheet, Text as RNText, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import { LanguageKeys } from '../../languages';
import { postSignupMembershipRoute } from '../../navigation/resolve-post-signup-route';
import { Colors, Fonts, Images } from '../../res';
import { useGlobalContext } from '../../services';
import { useSettingsStore } from '../../stores';

const WelcomeUser = (props: any) => {
  const { currentUser } = useGlobalContext();
  const skipPaywall = useSettingsStore().getSkipSignupMembershipPaywall();

  const onGetStartedPress = () => {
    const route = postSignupMembershipRoute({
      membershipStatus: currentUser?.membership_status,
      skipPaywall,
      hasMembershipGift: !!currentUser?.membership_status,
    });
    props.navigation.reset({ index: 0, routes: [route] });
  };

  return (
    <SafeAreaView style={Styles.container}>
      <View style={Styles.contentContainer}>
        <Image
          resizeMode="contain"
          source={Images.bismillah}
          style={Styles.bismillahImage}
        />
        <View>
          <Text style={Styles.welcomeHeading}>
            {LanguageKeys.welcome} {currentUser?.first_name}!
          </Text>
          <Text style={Styles.description}>
            {`PureHalf is a Halal platform rooted in Islamic values, dedicated to fostering meaningful connections. Please engage respectfully and adhere to Islamic principles.<br/><br/>"Tell the believing men to lower their gaze and guard their modesty; that is purer for them. And tell the believing women to lower their gaze and guard their modesty..." - Surah An-Nur, 24:30.
            <br/>Failure to adhere to these guidelines may result in your account being banned.<br/><br/>By using this platform, you consent to uphold these principles with Allah as your witness.            `
              .split('<br/>')
              .join('\n')}
          </Text>
          <RNText style={Styles.descriptionBold}>
            I,{' '}
            <RNText
              style={{ textDecorationLine: 'underline', color: Colors.theme }}
            >
              {currentUser?.first_name} {currentUser?.last_name}
            </RNText>
            , commit to honor these teachings {"insha'Allah"}.
          </RNText>
        </View>
        <View>
          <Button
            text={LanguageKeys.diveInAndExplore}
            onPress={onGetStartedPress}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default WelcomeUser;

const Styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.color2,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: Colors.color2,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
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
