import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { LinearGradient, Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import { CheckRtl, LanguageKeys } from '../../languages';
import { Colors, Fonts } from '../../res';

const PremiumButton = () => {
  const Rtl = CheckRtl();
  const navigation: any = useNavigation();

  const onPremiumPress = () => {
    navigation.navigate('ProFeaturesPromotion');
  };

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPremiumPress}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryMid]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          Styles.container,
          { flexDirection: Rtl ? 'row-reverse' : 'row' },
        ]}
      >
        <View style={Styles.iconCircle}>
          <Ionicons name="diamond" size={wp(5)} color={Colors.surface} />
        </View>
        <View style={Styles.textCon}>
          <Text style={Styles.heading} numberOfLines={1}>
            {LanguageKeys.goPremiumButtonHeading}
          </Text>
          <Text style={Styles.description} numberOfLines={1}>
            {LanguageKeys.goPremiumButtonDescription}
          </Text>
        </View>
        <View style={Styles.arrowCircle}>
          <Ionicons
            name={Rtl ? 'chevron-back' : 'chevron-forward'}
            size={wp(4.5)}
            color={Colors.surface}
          />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default PremiumButton;

const Styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: 18,
    paddingVertical: hp(1.6),
    paddingHorizontal: wp(4),
    marginTop: hp(1.6),
  },
  iconCircle: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    backgroundColor: Colors.whiteRGBA18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textCon: {
    flex: 1,
    paddingHorizontal: wp(3),
  },
  heading: {
    color: Colors.surface,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.small2,
    includeFontPadding: false,
  },
  description: {
    color: Colors.whiteRGBA90,
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small,
    includeFontPadding: false,
    marginTop: hp(0.3),
  },
  arrowCircle: {
    width: wp(7.5),
    height: wp(7.5),
    borderRadius: wp(3.75),
    backgroundColor: Colors.whiteRGBA18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
