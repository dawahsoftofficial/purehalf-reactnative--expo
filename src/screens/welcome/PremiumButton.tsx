import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';

import { LinearGradient, Text } from '../../components';
import { Typography, wp } from '../../global';
import { CheckRtl, LanguageKeys } from '../../languages';
import { Colors, Fonts, Images } from '../../res';

const PremiumButton = () => {
  const Rtl = CheckRtl();
  const navigation: any = useNavigation();

  const onPremiumPress = () => {
    navigation.navigate('ProFeaturesPromotion');
  };

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPremiumPress}>
      <LinearGradient
        style={[
          Styles.container,
          { flexDirection: Rtl ? 'row-reverse' : 'row' },
        ]}
        colors={[Colors.color47, Colors.color48]}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: wp(4),
          }}
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
              <Text style={Styles.heading}>
                {LanguageKeys.goPremiumButtonHeading}
              </Text>
              <Text style={Styles.description}>
                {LanguageKeys.goPremiumButtonDescription}
              </Text>
            </View>
          </View>
          <AntDesign
            name={Rtl ? 'arrowleft' : 'arrowright'}
            size={wp(5)}
            color={Colors.color2}
          />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default PremiumButton;

const Styles = StyleSheet.create({
  container: {
    height: 48,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  icon: {
    height: 20,
    width: 20,
  },
  textCon: {
    paddingHorizontal: wp(2),
  },
  heading: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.tiny,
    includeFontPadding: false,
  },
  description: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.tiny,
    includeFontPadding: false,
  },
});
