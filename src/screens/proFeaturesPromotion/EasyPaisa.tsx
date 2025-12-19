import React, { useEffect } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import AntDesign from 'react-native-vector-icons/AntDesign';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

import { Animation } from '../../animations';
import { Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import { CheckRtl } from '../../languages';
import { Colors, Fonts, Images } from '../../res';
import { Api, EndPoints, useGlobalContext } from '../../services';

const EasyPaisa = (props: any) => {
  const Rtl = CheckRtl();
  const { currentUser } = useGlobalContext();
  const {
    onClose = () => {},
    selectedPackage = {},
    onCloseAll = () => {},
  } = props;

  const price = selectedPackage?.product?.priceString?.includes('.')
    ? selectedPackage.product.priceString.split('.')[0]
    : selectedPackage?.product?.priceString;

  useEffect(() => {
    storeQuery();
  }, []);

  const storeQuery = () => {
    Api.post(EndPoints.storeQuerySupport, {
      description: 'payment realalted',
      type: 2,
      source: 'easypaisa-923330093158',
    }).catch((error) => {
      console.log('error =>', error);
    });
  };

  return (
    <Animation animation="fadeInRight" duration={500}>
      <View
        style={{
          ...Styles.headerCon,
          flexDirection: Rtl ? 'row-reverse' : 'row',
        }}
      >
        <TouchableOpacity activeOpacity={0.7} onPress={onClose}>
          <AntDesign
            name={Rtl ? 'arrowright' : 'arrowleft'}
            color={Colors.color1}
            size={wp(6)}
          />
        </TouchableOpacity>
        <Image
          source={Images.easyPaisa}
          resizeMode="contain"
          style={Styles.headerIcon}
        />
        <Text style={Styles.headerText}>payViaEasyPaisa</Text>
      </View>
      <View
        style={{ flexDirection: Rtl ? 'row-reverse' : 'row', flexWrap: 'wrap' }}
      >
        <Text style={Styles.description}>makePaymentOf</Text>
        <Text
          style={[
            Styles.description,
            { marginHorizontal: wp(1), fontFamily: Fonts.APPFONT_B },
          ]}
        >
          {price?.toUpperCase()}
        </Text>
        <Text style={Styles.description}>atFollowingNumber</Text>
      </View>
      <View style={Styles.numberSection}>
        <View
          style={[
            Styles.numberFieldCon,
            {
              marginVertical: hp(0.8),
              flexDirection: Rtl ? 'row-reverse' : 'row',
            },
          ]}
        >
          <FontAwesome5
            name={Rtl ? 'phone' : 'phone-alt'}
            color={Colors.color1}
            size={wp(4)}
            style={{ marginHorizontal: wp(1) }}
          />
          <Text style={Styles.number}>+923330093158</Text>
        </View>
        <View
          style={[
            Styles.numberFieldCon,
            Styles.numberFieldConBorder,
            { flexDirection: Rtl ? 'row-reverse' : 'row' },
          ]}
        >
          <Text style={[Styles.description, { alignSelf: 'center' }]}>
            mentionNumberDes
          </Text>
          <Text style={Styles.idNumber}>
            {JSON.stringify(currentUser?.id * 3146)}
          </Text>
        </View>
        <View
          style={[
            Styles.numberFieldCon,
            { flexDirection: Rtl ? 'row-reverse' : 'row' },
          ]}
        >
          <Text style={[Styles.description, { alignSelf: 'center' }]}>
            sendScreenshotDes
          </Text>
        </View>
      </View>
      <Text style={Styles.description}>paymentConfirmationGuidance</Text>
      <Ripple style={Styles.button} onPress={onCloseAll}>
        <Text style={Styles.buttonText}>close</Text>
      </Ripple>
    </Animation>
  );
};

export default EasyPaisa;

const Styles = StyleSheet.create({
  headerCon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(3),
  },
  headerIcon: {
    width: 60,
    height: 35,
  },
  headerText: {
    color: Colors.color1,
    alignSelf: 'center',
    fontSize: Typography.medium1,
    fontFamily: Fonts.APPFONT_R,
  },
  description: {
    fontSize: wp(2.8),
    color: Colors.color12,
    fontFamily: Fonts.APPFONT_M,
    includeFontPadding: false,
  },
  numberSection: {
    borderWidth: 1,
    borderColor: Colors.color42,
    backgroundColor: Colors.color43,
    borderRadius: 8,
    marginVertical: hp(2),
  },
  numberFieldCon: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(2),
  },
  numberFieldConBorder: {
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: Colors.color18,
  },
  number: {
    color: Colors.color1,
    alignSelf: 'center',
    fontFamily: Fonts.APPFONT_M,
    includeFontPadding: false,
    fontSize: Typography.small2,
  },
  idNumber: {
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.tiny2,
    includeFontPadding: false,
    alignSelf: 'center',
    marginHorizontal: wp(1),
  },
  button: {
    backgroundColor: Colors.color42,
    borderRadius: 8,
    height: wp(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(4),
    marginBottom: hp(1),
  },
  buttonText: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_B,
    textAlign: 'center',
    alignSelf: 'center',
    includeFontPadding: false,
    fontSize: Typography.small3,
  },
});
