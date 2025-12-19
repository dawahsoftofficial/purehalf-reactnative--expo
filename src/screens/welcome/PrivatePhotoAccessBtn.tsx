import React from 'react';
import { StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import AntDesign from 'react-native-vector-icons/AntDesign';

import { Text } from '../../components';
import { Typography, wp } from '../../global';
import Constants from '../../global/Constants';
import { CheckRtl, LanguageKeys } from '../../languages';
import { Colors, Fonts } from '../../res';

const PrivatePhotoAccessBtn = (props: any) => {
  const { navigation = {}, photoRequests = null } = props;
  const Rtl = CheckRtl();

  const onPress = () => {
    navigation.navigate('PrivatePhotoRequest');
  };
  return (
    <Ripple
      style={[
        Styles.privatePhotoAccessBtn,
        { flexDirection: Rtl ? 'row-reverse' : 'row' },
      ]}
      onPress={onPress}
    >
      <View
        style={{
          flexDirection: Rtl ? 'row-reverse' : 'row',
          alignItems: 'center',
        }}
      >
        <Text
          style={[Styles.privatePhotoAccessTxt, { maxWidth: wp(20) }]}
          numberOfLines={1}
        >
          {photoRequests}
        </Text>
        <Text
          style={[Styles.privatePhotoAccessTxt, { marginHorizontal: 5 }]}
          numberOfLines={1}
        >
          {LanguageKeys.privatePhotoBtnDes}
        </Text>
      </View>

      <AntDesign
        name={Rtl ? 'arrowleft' : 'arrowright'}
        color={Colors.color1}
        size={wp(5)}
      />
    </Ripple>
  );
};

export default PrivatePhotoAccessBtn;

const Styles = StyleSheet.create({
  privatePhotoAccessBtn: {
    height: 40,
    borderRadius: 30,
    flexDirection: 'row',
    paddingHorizontal: wp(4),
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.theme,
    backgroundColor: Colors.themeRGBA20,
    marginTop: 10,
  },
  privatePhotoAccessTxt: {
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small1,
    marginBottom: Constants.fontFamilyMarginBottom,
    alignSelf: 'center',
  },
});
