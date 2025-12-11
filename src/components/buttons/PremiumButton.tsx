import { View, StyleSheet, Image, StatusBar, SafeAreaView } from 'react-native';
import React from 'react';
import { LinearGradient, Text } from '..';
import { Colors, Fonts, Images } from '../../res';
import { wp } from '../../global';
import { CheckRtl, LanguageKeys } from '../../languages';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { useNavigation } from '@react-navigation/native';
import Ripple from 'react-native-material-ripple';
import DeviceInfo from 'react-native-device-info';

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
    <SafeAreaView>
      <Ripple onPress={onPremiumPress}>
        <StatusBar
          translucent={false}
          backgroundColor={Colors.color2}
          barStyle={'dark-content'}
        />
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
    </SafeAreaView>
  );
};

export default PremiumButton;

const hasNotch = DeviceInfo.hasNotch();

const Styles = StyleSheet.create({
  container: {
    height: 60,
    flexDirection: 'row',
    paddingHorizontal: wp(4),
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
