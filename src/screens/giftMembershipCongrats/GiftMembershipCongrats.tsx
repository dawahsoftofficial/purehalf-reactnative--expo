import React, { useEffect } from 'react';
import { BackHandler, Image, StatusBar, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Animation } from '../../animations';
import { Button, Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import { LanguageKeys } from '../../languages';
import { Colors, Fonts, Images } from '../../res';

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
      backAction
    );
    return () => backHandler.remove();
  }, []);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={Styles.container}>
      <StatusBar
        translucent
        backgroundColor={'transparent'}
        barStyle={'dark-content'}
      />
      <View style={Styles.content}>
        <View style={Styles.centerGroup}>
          <Animation
            animation="zoomIn"
            duration={520}
            style={Styles.medallionWrap}
          >
            <View style={[Styles.halo, Styles.haloOuter]} />
            <View style={[Styles.halo, Styles.haloInner]} />
            <Ionicons
              name="sparkles"
              size={wp(4.6)}
              color={Colors.primaryLite}
              style={Styles.sparkleTopRight}
            />
            <Ionicons
              name="sparkles"
              size={wp(3.2)}
              color={Colors.primaryLite}
              style={Styles.sparkleBottomLeft}
            />
            <View style={Styles.medallionUnit}>
              <LinearGradient
                colors={[Colors.primary, Colors.primaryMid]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={Styles.medallion}
              >
                <Image
                  source={Images.membership}
                  resizeMode="contain"
                  style={Styles.crown}
                />
              </LinearGradient>
              <View style={Styles.seal}>
                <Ionicons
                  name="checkmark"
                  size={wp(4.8)}
                  color={Colors.color2}
                />
              </View>
            </View>
          </Animation>

          <Animation animation="fadeInUp" duration={520} style={Styles.body}>
            <View style={Styles.giftPill}>
              <Ionicons name="gift" size={wp(4.2)} color={Colors.primary} />
              <Text style={Styles.giftPillTxt}>
                {LanguageKeys.oneMonthFree}
              </Text>
            </View>

            <Text variant="display" style={Styles.headline}>
              {LanguageKeys.proUserSuccessHeading}
            </Text>
            <Text style={Styles.subtitle}>
              {LanguageKeys.giftProUserSuccessHeading}
            </Text>

            <View style={Styles.footerNote}>
              <Ionicons
                name="sparkles"
                size={wp(3.6)}
                color={Colors.primaryMid}
              />
              <Text style={Styles.footerNoteTxt}>
                {LanguageKeys.membershipUpgradeMsg}
              </Text>
            </View>
          </Animation>
        </View>

        <Button
          buttonStyle={Styles.cta}
          text={LanguageKeys.diveInAndExplore}
          onPress={onGetStartedPress}
        />
      </View>
    </SafeAreaView>
  );
};

export default GiftMembershipCongrats;

const Styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBg,
  },
  content: {
    flex: 1,
    paddingHorizontal: wp(6),
    paddingBottom: hp(1),
  },
  centerGroup: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medallionWrap: {
    width: wp(50),
    height: wp(50),
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    borderRadius: wp(25),
  },
  haloOuter: {
    width: wp(50),
    height: wp(50),
    backgroundColor: 'rgba(75, 46, 131, 0.05)',
  },
  haloInner: {
    width: wp(40),
    height: wp(40),
    backgroundColor: Colors.primaryRGBA12,
  },
  sparkleTopRight: {
    position: 'absolute',
    top: wp(4),
    right: wp(7),
  },
  sparkleBottomLeft: {
    position: 'absolute',
    bottom: wp(7),
    left: wp(5),
  },
  medallionUnit: {
    width: wp(27),
    height: wp(27),
    alignItems: 'center',
    justifyContent: 'center',
  },
  medallion: {
    width: wp(27),
    height: wp(27),
    borderRadius: wp(13.5),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  crown: {
    width: wp(13),
    height: wp(13),
    tintColor: Colors.color2,
  },
  seal: {
    position: 'absolute',
    bottom: -wp(0.5),
    right: -wp(0.5),
    width: wp(9),
    height: wp(9),
    borderRadius: wp(4.5),
    backgroundColor: Colors.verified,
    borderWidth: 3,
    borderColor: Colors.appBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    width: '100%',
    alignItems: 'center',
    marginTop: hp(2.5),
  },
  giftPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: wp(1.5),
    backgroundColor: Colors.lavender,
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(0.7),
    borderRadius: 22,
  },
  giftPillTxt: {
    color: Colors.primary,
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small2,
    includeFontPadding: false,
    alignSelf: 'center',
    textAlign: 'center',
  },
  headline: {
    color: Colors.ink,
    fontSize: wp(8),
    lineHeight: wp(9.5),
    includeFontPadding: false,
    alignSelf: 'center',
    textAlign: 'center',
    marginTop: hp(1.8),
  },
  subtitle: {
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small3,
    includeFontPadding: false,
    alignSelf: 'center',
    textAlign: 'center',
    marginTop: hp(0.8),
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(1.5),
    marginTop: hp(2.2),
  },
  footerNoteTxt: {
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    includeFontPadding: false,
    alignSelf: 'center',
    textAlign: 'center',
  },
  cta: {
    marginTop: hp(1.5),
    marginBottom: hp(1),
  },
});
