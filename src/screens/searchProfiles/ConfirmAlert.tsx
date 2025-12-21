import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AlertContainer, Button, Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import { LanguageKeys } from '../../languages';
import { Colors, Fonts } from '../../res';

const ConfirmAlert = (props: any) => {
  const { visible = false, onClose = () => null, onPress = () => null } = props;
  return (
    <AlertContainer visible={visible} onClose={onClose}>
      <Text style={Styles.heading}>{LanguageKeys.saveSearchSureAlert}</Text>
      <View style={Styles.btnsCon}>
        <Button
          text={LanguageKeys.cancel}
          buttonStyle={{ ...Styles.btn, backgroundColor: Colors.color8 }}
          onPress={onClose}
          textStyle={{ color: Colors.color1, fontFamily: Fonts.APPFONT_R }}
        />
        <Button
          text={LanguageKeys.yes}
          buttonStyle={Styles.btn}
          onPress={onPress}
        />
      </View>
    </AlertContainer>
  );
};

export default ConfirmAlert;

const Styles = StyleSheet.create({
  heading: {
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.medium,
    color: Colors.color1,
    includeFontPadding: false,
    alignSelf: 'center',
  },
  btn: {
    marginTop: hp(3),
    marginBottom: hp(2),
    width: wp(25),
  },
  btnsCon: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(15),
    paddingTop: hp(1),
  },
});
