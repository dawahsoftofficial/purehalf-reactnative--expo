import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import AntDesign from 'react-native-vector-icons/AntDesign';

import { hp, wp } from '../../global';
import { CheckRtl, LanguageKeys } from '../../languages';
import { Colors, Fonts, Images } from '../../res';
import { LinearGradient, Text } from '..';

const PremiumButton = (props: any) => {
  const {
    heading = LanguageKeys.goPremiumButtonHeading,
    description = LanguageKeys.goPremiumButtonDescription,
  } = props;
  const Rtl = CheckRtl();
  const navigation: any = useNavigation();

  const onPremiumPress = () => {
    navigation.navigate('ProFeaturesPromotion');
  };

  return (
    <Ripple onPress={onPremiumPress}>
      <LinearGradient
        style={[
          Styles.container,
          { flexDirection: Rtl ? 'row-reverse' : 'row' },
        ]}
        colors={[Colors.color47, Colors.color48]}
      >
        <View
          style={{
            flexDirection: Rtl ? 'row-reverse' : 'row',
            alignItems: 'center',
          }}
        >
          <Image
            source={Images.membershipWhite}
            resizeMode="contain"
            style={Styles.icon}
          />
          <View style={Styles.textCon}>
            <Text style={Styles.heading}>{heading}</Text>
            <Text style={Styles.description}>{description}</Text>
          </View>
        </View>
        <AntDesign
          name={Rtl ? 'arrowleft' : 'arrowright'}
          size={wp(5)}
          color={Colors.color2}
        />
      </LinearGradient>
    </Ripple>
  );
};

export default PremiumButton;

const Styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: hp(2),
    paddingVertical: hp(1.5),
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  icon: {
    height: 20,
    width: 20,
  },
  textCon: {
    paddingHorizontal: wp(3),
    width: wp(80),
  },
  heading: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_B,
    fontSize: wp(3.2),
    includeFontPadding: false,
  },
  description: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_M,
    fontSize: wp(2.7),
  },
});
